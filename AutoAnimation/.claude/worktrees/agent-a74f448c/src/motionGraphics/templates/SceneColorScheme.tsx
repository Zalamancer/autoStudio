import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ColorSchemeConfig {
  roomName: string
  colors: string[]
  colorNames: string[]
  style: string
  bgColor: string
  textColor: string
  cardColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneColorSchemeComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<ColorSchemeConfig>) {
  const { roomName, colors, colorNames, style, bgColor, textColor, cardColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.28
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Room preview fades in
  const roomPreviewProgress = easeOutCubic(Math.min(1, enterProgress / 0.4))
  // Title
  const titleProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.3)))
  // Color swatches cascade
  const getSwatchProgress = (idx: number) => {
    const delay = 0.35 + idx * 0.1
    return easeOutBack(Math.max(0, Math.min(1, (enterProgress - delay) / 0.3)))
  }

  // Hold: selected color highlight moves
  const highlightIdx = Math.floor(holdProgress * colors.length) % colors.length

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Room wall colors for preview
  const primaryColor = colors[0] || '#E8DDD3'
  const secondaryColor = colors[1] || '#C4A882'
  const accentColorPreview = colors[2] || '#5E7A6B'

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: '5%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(12px, 2.5vh, 22px)',
          width: '100%',
          maxWidth: 400,
          opacity: exitOpacity,
        }}
      >
        {/* Style badge */}
        <div
          style={{
            fontSize: 'clamp(9px, 1.4vw, 11px)',
            fontWeight: 700,
            color: accentColorPreview,
            letterSpacing: 3,
            textTransform: 'uppercase',
            opacity: titleProgress,
          }}
        >
          {style}
        </div>

        {/* Room name */}
        <div
          style={{
            fontSize: 'clamp(20px, 4.5vw, 34px)',
            fontWeight: 800,
            color: textColor,
            textAlign: 'center',
            opacity: titleProgress,
            transform: `translateY(${(1 - titleProgress) * 12}px)`,
          }}
        >
          {roomName}
        </div>

        {/* Room preview */}
        <div
          style={{
            width: '100%',
            aspectRatio: '16/9',
            borderRadius: 'clamp(10px, 1.5vw, 16px)',
            overflow: 'hidden',
            position: 'relative',
            opacity: roomPreviewProgress,
            transform: `scale(${0.9 + roomPreviewProgress * 0.1})`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }}
        >
          {/* Wall */}
          <div style={{ position: 'absolute', inset: 0, background: primaryColor }} />
          {/* Accent wall */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: '35%', height: '100%', background: secondaryColor }} />
          {/* Floor */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '25%', background: `${textColor}15` }} />
          {/* Furniture silhouettes */}
          <div style={{ position: 'absolute', bottom: '25%', left: '15%', width: '30%', height: '20%', background: `${textColor}12`, borderRadius: '4px 4px 0 0' }} />
          <div style={{ position: 'absolute', bottom: '25%', right: '20%', width: '12%', height: '35%', background: accentColorPreview, opacity: 0.3, borderRadius: 4 }} />
          {/* Window */}
          <div style={{ position: 'absolute', top: '10%', left: '40%', width: '20%', height: '35%', border: `2px solid ${textColor}20`, borderRadius: 3 }} />
        </div>

        {/* Color palette swatches */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(8px, 1.5vw, 14px)',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {colors.map((c, i) => {
            const p = getSwatchProgress(i)
            const isHighlighted = holdProgress > 0 && i === highlightIdx
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'clamp(4px, 0.6vh, 6px)',
                  transform: `scale(${p * (isHighlighted ? 1.1 : 1)})`,
                  opacity: p,
                }}
              >
                <div
                  style={{
                    width: 'clamp(36px, 7vw, 56px)',
                    height: 'clamp(36px, 7vw, 56px)',
                    borderRadius: 'clamp(8px, 1.2vw, 12px)',
                    background: c,
                    boxShadow: isHighlighted
                      ? `0 4px 16px ${c}60, 0 0 0 2px ${cardColor}, 0 0 0 4px ${c}`
                      : `0 2px 8px ${c}30`,
                  }}
                />
                <div style={{ fontSize: 'clamp(7px, 1.1vw, 9px)', fontWeight: 600, color: `${textColor}70`, textAlign: 'center' }}>
                  {colorNames[i] || c}
                </div>
                <div style={{ fontSize: 6, fontFamily: "'Courier New', monospace", color: `${textColor}40` }}>
                  {c}
                </div>
              </div>
            )
          })}
        </div>

        {/* Usage guide */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(12px, 2.5vw, 24px)',
            opacity: getSwatchProgress(colors.length - 1),
          }}
        >
          {['Walls', 'Accent', 'Trim'].map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: colors[i] || '#ccc',
                }}
              />
              <span style={{ fontSize: 'clamp(8px, 1.2vw, 10px)', fontWeight: 600, color: `${textColor}50` }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-color-scheme',
  title: 'Scene Color Scheme',
  description: 'Interior color palette with room preview visualization, cascading swatch animation, highlight cycling, and usage guide',
  tags: ['scene', 'interior', 'color', 'palette', 'design', 'decor', 'architecture', 'scheme'],
  category: 'scene-layout',
  component: SceneColorSchemeComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'roomName', label: 'Room Name', type: 'text', defaultValue: 'Master Bedroom', group: 'Content' },
    { key: 'style', label: 'Design Style', type: 'text', defaultValue: 'Scandinavian Minimal', group: 'Content' },
    { key: 'colors', label: 'Palette Colors', type: 'text-array', defaultValue: ['#E8DDD3', '#C4A882', '#5E7A6B', '#F5F0EB', '#2C3E50'], group: 'Content' },
    { key: 'colorNames', label: 'Color Names', type: 'text-array', defaultValue: ['Warm Linen', 'Desert Sand', 'Sage Leaf', 'Cloud White', 'Midnight'], group: 'Content' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FAFAF8', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2C3E50', group: 'Style' },
  ],
  defaultConfig: {
    roomName: 'Master Bedroom',
    style: 'Scandinavian Minimal',
    colors: ['#E8DDD3', '#C4A882', '#5E7A6B', '#F5F0EB', '#2C3E50'],
    colorNames: ['Warm Linen', 'Desert Sand', 'Sage Leaf', 'Cloud White', 'Midnight'],
    cardColor: '#FFFFFF',
    bgColor: '#FAFAF8',
    textColor: '#2C3E50',
  },
})
