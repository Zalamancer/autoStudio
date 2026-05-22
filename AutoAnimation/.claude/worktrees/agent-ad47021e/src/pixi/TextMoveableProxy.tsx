import { memo, useRef, useCallback } from 'react'
import { useTextOverlayStore, type TextOverlay } from '@/stores/useTextOverlayStore'
import { useEditorStore, useCanvasStore } from '@/stores'
import { useLiveTransformStore } from '@/stores/useLiveTransformStore'
import { SelectionTransformBox, type LiveTransformValues } from '@/components/canvas/SelectionTransformBox'
import { useKeyframeRecorder } from '@/hooks/useKeyframeRecorder'
import { useFrameVisibility } from '@/hooks/useFrameVisibility'

/**
 * TextMoveableProxy renders invisible DOM divs positioned over PixiJS-rendered
 * text overlays. These divs act as handles for Moveable.js to provide
 * drag/resize/rotate interactivity.
 *
 * Same pattern as MoveableProxy.tsx (media) and ShapeMoveableProxy.tsx (shapes).
 */

interface TextProxyProps {
  overlay: TextOverlay
  isSelected: boolean
  canvasWidth: number
  canvasHeight: number
  logicalWidth: number
}

const TextProxy = memo(function TextProxy({
  overlay,
  isSelected,
  canvasWidth,
  canvasHeight,
  logicalWidth,
}: TextProxyProps) {
  const targetRef = useRef<HTMLDivElement>(null)
  const updateOverlay = useTextOverlayStore((s) => s.updateOverlay)
  const setSelectedId = useTextOverlayStore((s) => s.setSelectedId)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const setLiveTransform = useLiveTransformStore((s) => s.setLiveTransform)
  const clearLiveTransform = useLiveTransformStore((s) => s.clearLiveTransform)
  const { recordIfEnabled } = useKeyframeRecorder()

  // Frame-range visibility (RAF + CSS display toggle)
  useFrameVisibility(targetRef, overlay.startFrame ?? 0, overlay.endFrame ?? Infinity)

  // Approximate text dimensions for the proxy div
  // Scale factor: display px per logical px
  const scaleFactor = canvasWidth / logicalWidth
  const scaledFontSize = overlay.fontSize * scaleFactor
  // Rough estimate of text size — enough for the proxy to cover the PixiJS text
  const estimatedWidth = Math.max(80, overlay.content.length * scaledFontSize * 0.55)
  const estimatedHeight = Math.max(30, scaledFontSize * overlay.lineHeight * (overlay.content.split('\n').length))

  // Position styles
  const proxyStyles: React.CSSProperties = {
    position: 'absolute',
    zIndex: overlay.zIndex,
    width: estimatedWidth,
    height: estimatedHeight,
    cursor: 'pointer',
    // Make transparent but still clickable
    background: 'transparent',
    pointerEvents: 'auto',
  }

  switch (overlay.position) {
    case 'top':
      proxyStyles.top = `${canvasHeight * 0.08}px`
      if (overlay.align === 'center') {
        proxyStyles.left = `${(canvasWidth - estimatedWidth) / 2}px`
      } else if (overlay.align === 'right') {
        proxyStyles.left = `${canvasWidth * 0.95 - estimatedWidth}px`
      } else {
        proxyStyles.left = `${canvasWidth * 0.05}px`
      }
      break
    case 'center':
      proxyStyles.top = `${(canvasHeight - estimatedHeight) / 2}px`
      if (overlay.align === 'center') {
        proxyStyles.left = `${(canvasWidth - estimatedWidth) / 2}px`
      } else if (overlay.align === 'right') {
        proxyStyles.left = `${canvasWidth * 0.95 - estimatedWidth}px`
      } else {
        proxyStyles.left = `${canvasWidth * 0.05}px`
      }
      break
    case 'bottom':
      proxyStyles.top = `${canvasHeight * 0.92 - estimatedHeight}px`
      if (overlay.align === 'center') {
        proxyStyles.left = `${(canvasWidth - estimatedWidth) / 2}px`
      } else if (overlay.align === 'right') {
        proxyStyles.left = `${canvasWidth * 0.95 - estimatedWidth}px`
      } else {
        proxyStyles.left = `${canvasWidth * 0.05}px`
      }
      break
    case 'free': {
      const centerX = (overlay.freeX / 100) * canvasWidth
      const centerY = (overlay.freeY / 100) * canvasHeight
      proxyStyles.left = centerX - estimatedWidth / 2
      proxyStyles.top = centerY - estimatedHeight / 2
      if (overlay.rotation !== 0) {
        proxyStyles.transform = `rotate(${overlay.rotation}deg)`
      }
      break
    }
  }

  const handleSelect = useCallback(() => {
    setSelectedId(overlay.id)
    setRightPanelTab('text-properties')
  }, [setSelectedId, setRightPanelTab, overlay.id])

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
        scale: 1,
      })
    },
    [canvasWidth, canvasHeight, overlay.id, setLiveTransform]
  )

  const handleTransformEnd = useCallback(
    (state: { translate: [number, number]; width: number; height: number; rotate: number }) => {
      const el = targetRef.current
      if (!el) return

      clearLiveTransform()

      const finalLeft = parseFloat(el.style.left) || 0
      const finalTop = parseFloat(el.style.top) || 0
      const finalW = el.offsetWidth
      const finalH = el.offsetHeight

      const centerX = ((finalLeft + finalW / 2) / canvasWidth) * 100
      const centerY = ((finalTop + finalH / 2) / canvasHeight) * 100

      updateOverlay(overlay.id, {
        position: 'free' as const,
        freeX: centerX,
        freeY: centerY,
        rotation: Math.round(state.rotate),
      })

      recordIfEnabled(
        { objectType: 'text', objectId: overlay.id },
        { freeX: centerX, freeY: centerY, rotation: Math.round(state.rotate) },
        { freeX: overlay.freeX, freeY: overlay.freeY, rotation: overlay.rotation }
      )
    },
    [canvasWidth, canvasHeight, updateOverlay, clearLiveTransform, overlay.id, overlay.freeX, overlay.freeY, overlay.rotation, recordIfEnabled]
  )

  const handleScaleEnd = useCallback(
    (scale: number) => {
      const newFontSize = Math.max(8, Math.min(400, Math.round(overlay.fontSize * scale)))
      updateOverlay(overlay.id, { fontSize: newFontSize })

      recordIfEnabled(
        { objectType: 'text', objectId: overlay.id },
        { fontSize: newFontSize },
        { fontSize: overlay.fontSize }
      )
    },
    [updateOverlay, overlay.id, overlay.fontSize, recordIfEnabled]
  )

  return (
    <>
      <div
        ref={targetRef}
        style={proxyStyles}
        onClick={(e) => {
          e.stopPropagation()
          handleSelect()
        }}
      />
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

/**
 * Container component that renders TextProxy divs for all visible text overlays.
 * Used when PixiJS renderer is active — text is rendered on the GPU canvas,
 * but these invisible proxies provide Moveable.js transform handles.
 */
export const TextMoveableProxies = memo(function TextMoveableProxies() {
  const overlays = useTextOverlayStore((s) => s.overlays)
  const selectedId = useTextOverlayStore((s) => s.selectedId)
  const canvasWidth = useCanvasStore((s) => s.canvasWidth)
  const canvasHeight = useCanvasStore((s) => s.canvasHeight)

  const visibleOverlays = overlays.filter((o) => o.visible)
  if (visibleOverlays.length === 0) return null

  return (
    <>
      {visibleOverlays.map((overlay) => (
        <TextProxy
          key={overlay.id}
          overlay={overlay}
          isSelected={selectedId === overlay.id}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          logicalWidth={canvasWidth}
        />
      ))}
    </>
  )
})
