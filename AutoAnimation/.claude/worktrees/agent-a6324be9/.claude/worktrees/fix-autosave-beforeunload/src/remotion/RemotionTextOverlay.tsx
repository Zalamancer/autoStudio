import { useFrame } from '@/engine'
import type { TextOverlayData, KeyframeExportData } from './types'
import { useRemotionKeyframeValues } from './useRemotionKeyframes'
import { computeTextAnimation } from '@/services/textAnimationPresets'

const textTransformMap: Record<string, React.CSSProperties['textTransform']> = {
  none: 'none',
  uppercase: 'uppercase',
  lowercase: 'lowercase',
}

interface RemotionTextOverlayProps {
  textOverlays: TextOverlayData[]
  keyframeData?: KeyframeExportData
}

export const RemotionTextOverlay = ({ textOverlays, keyframeData }: RemotionTextOverlayProps) => {
  const frame = useFrame()
  const visibleOverlays = textOverlays.filter(o =>
    frame >= o.startFrame && frame < o.endFrame
  )
  if (visibleOverlays.length === 0) return null

  return (
    <>
      {visibleOverlays.map(overlay => (
        <TextOverlayElement key={overlay.id} overlay={overlay} keyframeData={keyframeData} />
      ))}
    </>
  )
}

function TextOverlayElement({ overlay, keyframeData }: { overlay: TextOverlayData; keyframeData?: KeyframeExportData }) {
  const frame = useFrame()
  const kfValues = useRemotionKeyframeValues(keyframeData, 'text', overlay.id)

  // Animation preset
  const animStyle = overlay.animationPreset
    ? computeTextAnimation(overlay.animationPreset, frame, overlay.startFrame, overlay.endFrame, 30)
    : undefined

  const {
    content,
    fontFamily,
    fontWeight,
    color,
    align,
    verticalAlign,
    position,
    textCase,
    shadow,
    background,
    width: overlayWidth,
    height: overlayHeight,
    textShadow: customTextShadow,
    webkitTextStroke: customWebkitTextStroke,
  } = overlay

  // Apply keyframe overrides for all keyframable text properties
  const freeX = kfValues.freeX ?? overlay.freeX
  const freeY = kfValues.freeY ?? overlay.freeY
  const fontSize = kfValues.fontSize ?? overlay.fontSize
  const effectiveOpacity = kfValues.opacity ?? overlay.opacity
  const effectiveRotation = kfValues.rotation ?? overlay.rotation
  const effectiveZIndex = kfValues.zIndex != null ? Math.round(kfValues.zIndex) : overlay.zIndex
  const effectiveLetterSpacing = kfValues.letterSpacing ?? overlay.letterSpacing
  const effectiveLineHeight = kfValues.lineHeight ?? overlay.lineHeight
  const effectiveBgOpacity = kfValues.backgroundOpacity ?? overlay.backgroundOpacity

  // ── Position styles (mirrors TextOverlayLayer.tsx logic) ──
  const positionStyles: React.CSSProperties = {
    position: 'absolute',
    zIndex: effectiveZIndex,
    opacity: effectiveOpacity,
    borderRadius: '4px',
  }

  switch (position) {
    case 'top':
      positionStyles.top = '8%'
      positionStyles.left = '5%'
      positionStyles.right = '5%'
      break
    case 'center':
      positionStyles.top = '50%'
      positionStyles.left = '5%'
      positionStyles.right = '5%'
      positionStyles.transform = 'translateY(-50%)'
      break
    case 'bottom':
      positionStyles.bottom = '8%'
      positionStyles.left = '5%'
      positionStyles.right = '5%'
      break
    case 'free':
      positionStyles.left = `${freeX}%`
      positionStyles.top = `${freeY}%`
      positionStyles.transform = `translate(-50%, -50%) rotate(${effectiveRotation}deg)`
      if (overlayWidth !== null && overlayWidth > 0) positionStyles.width = overlayWidth
      if (overlayHeight !== null && overlayHeight > 0) positionStyles.height = overlayHeight
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

  // ── Text styles ──
  const textStyles: React.CSSProperties = {
    fontFamily: `"${fontFamily}", sans-serif`,
    fontSize: `${fontSize}px`,
    fontWeight,
    color,
    textAlign: align as React.CSSProperties['textAlign'],
    textShadow: customTextShadow || (shadow ? '0 2px 8px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.6)' : 'none'),
    lineHeight: effectiveLineHeight,
    letterSpacing: `${effectiveLetterSpacing}px`,
    textTransform: textTransformMap[textCase] ?? 'none',
    wordBreak: 'break-word' as const,
    whiteSpace: 'pre-wrap' as const,
    ...(customWebkitTextStroke && { WebkitTextStroke: customWebkitTextStroke }),
  }

  // ── Background wrapper ──
  const bgColor = overlay.backgroundColor || '#000000'
  const hexToRgb = (hex: string) => {
    const h = hex.replace('#', '')
    return {
      r: parseInt(h.substring(0, 2), 16) || 0,
      g: parseInt(h.substring(2, 4), 16) || 0,
      b: parseInt(h.substring(4, 6), 16) || 0,
    }
  }
  const bgRgb = hexToRgb(bgColor)
  const paddingY = overlay.backgroundPaddingY != null
    ? `${Math.max(1, fontSize * overlay.backgroundPaddingY)}px`
    : `${Math.max(4, fontSize / 30)}px`
  const paddingX = overlay.backgroundPaddingX != null
    ? `${Math.max(1, fontSize * overlay.backgroundPaddingX)}px`
    : `${Math.max(8, fontSize / 15)}px`
  const bgBorderRadius = overlay.backgroundBorderRadius != null
    ? `${overlay.backgroundBorderRadius}px`
    : '6px'

  const bgStyles: React.CSSProperties | undefined = background
    ? {
        backgroundColor: bgColor.startsWith('rgba')
          ? bgColor
          : `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, ${effectiveBgOpacity})`,
        padding: `${paddingY} ${paddingX}`,
        borderRadius: bgBorderRadius,
        display: 'inline-block',
        width: position === 'free' ? 'auto' : '100%',
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
  const animWrapperStyles: React.CSSProperties | undefined = animStyle ? {
    ...(animStyle.opacity !== undefined && { opacity: animStyle.opacity }),
    ...(animStyle.transform && { transform: animStyle.transform }),
    ...(animStyle.filter && { filter: animStyle.filter }),
    ...(animStyle.clipPath && { clipPath: animStyle.clipPath }),
    ...(animStyle.letterSpacing && { letterSpacing: animStyle.letterSpacing }),
    ...(animStyle.textShadow && { textShadow: animStyle.textShadow }),
  } : undefined

  return (
    <div style={positionStyles}>
      {animWrapperStyles ? (
        <div style={animWrapperStyles}>{innerContent}</div>
      ) : (
        innerContent
      )}
    </div>
  )
}
