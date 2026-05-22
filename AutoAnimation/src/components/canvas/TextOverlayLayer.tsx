import { useRef, useCallback, useLayoutEffect, useState, memo } from 'react'
import { hexToRgbObj } from '@/utils/color'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useEditorStore, useTimelineStore } from '@/stores'
import { useLiveTransformStore } from '@/stores/useLiveTransformStore'
import type { TextOverlay, FontWeight, TextCase } from '@/stores/useTextOverlayStore'
import { SelectionTransformBox, type LiveTransformValues } from './SelectionTransformBox'
import { useKeyframeRecorder } from '@/hooks/useKeyframeRecorder'
import { useFrameVisibility } from '@/hooks/useFrameVisibility'
import { computeTextAnimation } from '@/services/textAnimationCompute'

const fontWeightMap: Record<FontWeight, number> = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  black: 900,
}

const textTransformMap: Record<TextCase, React.CSSProperties['textTransform']> = {
  none: 'none',
  uppercase: 'uppercase',
  lowercase: 'lowercase',
}

interface TextOverlayLayerProps {
  canvasWidth: number
  canvasHeight: number
  logicalWidth: number
}

export function TextOverlayLayer({ canvasWidth, canvasHeight, logicalWidth }: TextOverlayLayerProps) {
  const overlays = useTextOverlayStore((s) => s.overlays)
  const selectedId = useTextOverlayStore((s) => s.selectedId)
  const setSelectedId = useTextOverlayStore((s) => s.setSelectedId)
  const updateOverlay = useTextOverlayStore((s) => s.updateOverlay)
  // REMOVED: currentFrame subscription — visibility is now handled per-child via useFrameVisibility
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const rightPanelTab = useEditorStore((s) => s.rightPanelTab)

  // Filter only by static `visible` flag — frame-range visibility handled per-child via RAF
  const visibleOverlays = overlays.filter((o) => o.visible)

  if (visibleOverlays.length === 0) return null

  // Preserve current text sub-tab if already on one; default to properties
  const textTab =
    rightPanelTab === 'text-properties' || rightPanelTab === 'text-styles' || rightPanelTab === 'text-animations'
      ? rightPanelTab
      : 'text-properties'

  return (
    <>
      {visibleOverlays.map((overlay) => (
        <TextOverlayElement
          key={overlay.id}
          overlay={overlay}
          isSelected={selectedId === overlay.id}
          onSelect={() => {
            setSelectedId(overlay.id)
            setRightPanelTab(textTab)
          }}
          onUpdate={(updates) => updateOverlay(overlay.id, updates)}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          logicalWidth={logicalWidth}
        />
      ))}
    </>
  )
}

interface TextOverlayElementProps {
  overlay: TextOverlay
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<TextOverlay>) => void
  canvasWidth: number
  canvasHeight: number
  logicalWidth: number
}

const TextOverlayElement = memo(function TextOverlayElement({
  overlay,
  isSelected,
  onSelect,
  onUpdate,
  canvasWidth,
  canvasHeight,
  logicalWidth,
}: TextOverlayElementProps) {
  const {
    content,
    fontFamily,
    fontSize,
    fontWeight,
    color,
    align,
    verticalAlign,
    position,
    freeX,
    freeY,
    lineHeight,
    letterSpacing,
    textCase,
    shadow,
    background,
    backgroundOpacity,
    opacity,
    zIndex,
    rotation,
    textShadow: customTextShadow,
    webkitTextStroke: customWebkitTextStroke,
  } = overlay

  const targetRef = useRef<HTMLDivElement>(null)
  const { recordIfEnabled } = useKeyframeRecorder()

  // Animation preset — use timelineStore (the one actually updated during playback)
  const currentFrame = useTimelineStore((s) => s.currentFrame)
  const fps = useTimelineStore((s) => s.fps)
  const animStyle = overlay.animationPreset
    ? computeTextAnimation(
        overlay.animationPreset,
        currentFrame,
        overlay.startFrame ?? 0,
        overlay.endFrame ?? Infinity,
        fps,
      )
    : undefined

  // Zero-re-render frame-range visibility (RAF + CSS display toggle)
  useFrameVisibility(targetRef, overlay.startFrame ?? 0, overlay.endFrame ?? Infinity)

  // Convert freeX/freeY (% based, centered) to absolute left/top px for Moveable
  // freeX/freeY represent the CENTER of the element as % of canvas
  const [measuredSize, setMeasuredSize] = useState({ w: 0, h: 0 })

  useLayoutEffect(() => {
    if (targetRef.current && position === 'free') {
      const el = targetRef.current
      setMeasuredSize({ w: el.offsetWidth, h: el.offsetHeight })
    }
  }, [content, fontSize, fontFamily, fontWeight, position])

  // For free-positioned text, calculate left/top in px from center-based %
  const freeLeftPx = (freeX / 100) * canvasWidth - measuredSize.w / 2
  const freeTopPx = (freeY / 100) * canvasHeight - measuredSize.h / 2

  const setLiveTransform = useLiveTransformStore((s) => s.setLiveTransform)
  const clearLiveTransform = useLiveTransformStore((s) => s.clearLiveTransform)

  // ── Live: push real-time values to lightweight store during manipulation ──
  const handleLiveTransform = useCallback(
    (values: LiveTransformValues) => {
      const centerX = ((values.left + values.width / 2) / canvasWidth) * 100
      const centerY = ((values.top + values.height / 2) / canvasHeight) * 100
      setLiveTransform({
        type: 'text',
        id: overlay.id,
        x: centerX,
        y: centerY,
        rotation: Math.round(values.rotation),
        scale: 1, // Text doesn't have scale in the same way
      })
    },
    [canvasWidth, canvasHeight, overlay.id, setLiveTransform],
  )

  // ── Commit drag/rotate end: compute new freeX/freeY from position ──
  const handleTransformEnd = useCallback(
    (state: { translate: [number, number]; width: number; height: number; rotate: number }) => {
      const el = targetRef.current
      if (!el) return

      // Clear live transform — the main store will now have the final values
      clearLiveTransform()

      const finalLeft = parseFloat(el.style.left) || 0
      const finalTop = parseFloat(el.style.top) || 0
      const finalW = el.offsetWidth
      const finalH = el.offsetHeight

      const centerX = ((finalLeft + finalW / 2) / canvasWidth) * 100
      const centerY = ((finalTop + finalH / 2) / canvasHeight) * 100

      onUpdate({
        position: 'free' as const,
        freeX: centerX,
        freeY: centerY,
        rotation: Math.round(state.rotate),
      })

      // Record keyframes if in record mode
      recordIfEnabled(
        { objectType: 'text', objectId: overlay.id },
        { freeX: centerX, freeY: centerY, rotation: Math.round(state.rotate) },
        { freeX: overlay.freeX, freeY: overlay.freeY, rotation: overlay.rotation },
      )
    },
    [
      canvasWidth,
      canvasHeight,
      onUpdate,
      clearLiveTransform,
      overlay.id,
      overlay.freeX,
      overlay.freeY,
      overlay.rotation,
      recordIfEnabled,
    ],
  )

  // ── Scale end: bake CSS scale into fontSize, keep center position ──
  const handleScaleEnd = useCallback(
    (scale: number) => {
      const newFontSize = Math.max(8, Math.min(400, Math.round(fontSize * scale)))
      onUpdate({ fontSize: newFontSize })

      recordIfEnabled(
        { objectType: 'text', objectId: overlay.id },
        { fontSize: newFontSize },
        { fontSize: overlay.fontSize },
      )
    },
    [fontSize, onUpdate, overlay.id, overlay.fontSize, recordIfEnabled],
  )

  // ── Position styles ──
  const positionStyles: React.CSSProperties = {
    position: 'absolute',
    zIndex,
    opacity,
    cursor: 'pointer',
    borderRadius: '4px',
  }

  switch (position) {
    case 'top':
      positionStyles.top = '8%'
      positionStyles.width = 'fit-content'
      positionStyles.maxWidth = '90%'
      if (align === 'center') {
        positionStyles.left = '50%'
        positionStyles.transform = 'translateX(-50%)'
      } else if (align === 'right') {
        positionStyles.right = '5%'
      } else {
        positionStyles.left = '5%'
      }
      break
    case 'center':
      positionStyles.top = '50%'
      positionStyles.width = 'fit-content'
      positionStyles.maxWidth = '90%'
      if (align === 'center') {
        positionStyles.left = '50%'
        positionStyles.transform = 'translate(-50%, -50%)'
      } else if (align === 'right') {
        positionStyles.right = '5%'
        positionStyles.transform = 'translateY(-50%)'
      } else {
        positionStyles.left = '5%'
        positionStyles.transform = 'translateY(-50%)'
      }
      break
    case 'bottom':
      positionStyles.bottom = '8%'
      positionStyles.width = 'fit-content'
      positionStyles.maxWidth = '90%'
      if (align === 'center') {
        positionStyles.left = '50%'
        positionStyles.transform = 'translateX(-50%)'
      } else if (align === 'right') {
        positionStyles.right = '5%'
      } else {
        positionStyles.left = '5%'
      }
      break
    case 'free':
      // Use pixel-based left/top (no translate centering) so Moveable can work properly
      positionStyles.left = freeLeftPx
      positionStyles.top = freeTopPx
      positionStyles.width = 'max-content'
      if (rotation !== 0) {
        positionStyles.transform = `rotate(${rotation}deg)`
      }
      break
  }

  // Apply vertical alignment for non-free positions
  if (position !== 'free') {
    positionStyles.display = 'flex'
    positionStyles.flexDirection = 'column'
    switch (verticalAlign) {
      case 'top':
        positionStyles.justifyContent = 'flex-start'
        break
      case 'middle':
        positionStyles.justifyContent = 'center'
        break
      case 'bottom':
        positionStyles.justifyContent = 'flex-end'
        break
    }
  }

  // Font sizes are logical pixels (relative to e.g. 1920-wide canvas), scale to display size
  const scaleFactor = canvasWidth / logicalWidth
  const scaledFontSize = fontSize * scaleFactor
  const textStyles: React.CSSProperties = {
    fontFamily: `"${fontFamily}", sans-serif`,
    fontSize: `${scaledFontSize}px`,
    fontWeight: fontWeightMap[fontWeight],
    color,
    textAlign: align,
    textShadow: customTextShadow || (shadow ? '0 2px 8px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.6)' : 'none'),
    lineHeight,
    letterSpacing: `${letterSpacing * scaleFactor}px`,
    textTransform: textTransformMap[textCase],
    wordBreak: 'break-word' as const,
    whiteSpace: 'pre-wrap' as const,
    ...(customWebkitTextStroke && { WebkitTextStroke: customWebkitTextStroke }),
  }

  // Background wrapper styles
  const bgColor = overlay.backgroundColor || '#000000'
  const bgRgb = hexToRgbObj(bgColor) ?? { r: 0, g: 0, b: 0 }
  const paddingY =
    overlay.backgroundPaddingY != null
      ? `${Math.max(1, scaledFontSize * overlay.backgroundPaddingY)}px`
      : `${Math.max(2, scaledFontSize * 0.15)}px`
  const paddingX =
    overlay.backgroundPaddingX != null
      ? `${Math.max(1, scaledFontSize * overlay.backgroundPaddingX)}px`
      : `${Math.max(4, scaledFontSize * 0.3)}px`
  const bgBorderRadius = overlay.backgroundBorderRadius != null ? `${overlay.backgroundBorderRadius}px` : '6px'

  const bgStyles: React.CSSProperties | undefined = background
    ? {
        backgroundColor: bgColor.startsWith('rgba')
          ? bgColor
          : `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, ${backgroundOpacity})`,
        padding: `${paddingY} ${paddingX}`,
        borderRadius: bgBorderRadius,
        display: 'inline-block',
        width: 'fit-content',
        ...(overlay.backgroundBorder ? { border: overlay.backgroundBorder } : {}),
      }
    : undefined

  const textContent = (
    <>
      {content.split('\n').map((line, i) => (
        <div key={i}>{line || '\u00A0'}</div>
      ))}
    </>
  )

  const innerContent = background ? (
    <div style={bgStyles}>
      <div style={textStyles}>{textContent}</div>
    </div>
  ) : (
    <div style={textStyles}>{textContent}</div>
  )

  // Merge animation preset styles
  const animWrapperStyles: React.CSSProperties | undefined = animStyle
    ? {
        ...(animStyle.opacity !== undefined && { opacity: animStyle.opacity }),
        ...(animStyle.transform && { transform: animStyle.transform }),
        ...(animStyle.filter && { filter: animStyle.filter }),
        ...(animStyle.clipPath && { clipPath: animStyle.clipPath }),
        ...(animStyle.letterSpacing && { letterSpacing: animStyle.letterSpacing }),
        ...(animStyle.textShadow && { textShadow: animStyle.textShadow }),
      }
    : undefined

  return (
    <>
      <div
        ref={targetRef}
        data-canvas-element="text"
        style={positionStyles}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
      >
        {animWrapperStyles ? <div style={animWrapperStyles}>{innerContent}</div> : innerContent}
      </div>

      {/* Moveable control box — only shown when selected */}
      {isSelected && (
        <SelectionTransformBox
          targetRef={targetRef}
          onTransformEnd={handleTransformEnd}
          onLiveTransform={handleLiveTransform}
          onScaleEnd={handleScaleEnd}
          resizable={false}
          scalable={true}
          keepRatio={true}
          color="#4a7eff"
        />
      )}
    </>
  )
})
