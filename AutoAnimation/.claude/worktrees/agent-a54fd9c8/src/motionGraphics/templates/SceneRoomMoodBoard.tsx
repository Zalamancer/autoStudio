import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RoomMoodBoardConfig {
  title: string
  style: string
  palette: string[]
  materials: string[]
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
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

function SceneRoomMoodBoardComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<RoomMoodBoardConfig>) {
  const { title, style, palette, materials, bgColor, cardColor, accentColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Staggered card animations
  const getCardProgress = (idx: number) => {
    const delay = idx * 0.12
    return easeOutBack(Math.max(0, Math.min(1, (enterProgress - delay) / 0.4)))
  }

  // Title slide
  const titleProgress = easeOutCubic(Math.min(1, enterProgress / 0.3))
  // Palette reveal
  const paletteProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3)))
  // Materials
  const materialsProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.25)))

  // Hold shimmer
  const shimmer = holdProgress * 100

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.08

  // Mood board image placeholders with different aspect ratios
  const moodTiles = [
    { emoji: '🛋️', label: 'Furniture', w: '48%', h: '55%' },
    { emoji: '🪟', label: 'Windows', w: '48%', h: '30%' },
    { emoji: '🪴', label: 'Plants', w: '48%', h: '22%' },
    { emoji: '💡', label: 'Lighting', w: '48%', h: '40%' },
  ]

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
          gap: 'clamp(10px, 2vh, 18px)',
          width: '100%',
          maxWidth: 420,
          transform: `scale(${exitScale})`,
          opacity: exitOpacity,
        }}
      >
        {/* Header */}
        <div style={{ opacity: titleProgress, transform: `translateY(${(1 - titleProgress) * 15}px)` }}>
          <div style={{ fontSize: 'clamp(9px, 1.4vw, 11px)', fontWeight: 700, color: accentColor, letterSpacing: 3, textTransform: 'uppercase' }}>
            {style}
          </div>
          <div style={{ fontSize: 'clamp(20px, 4.5vw, 34px)', fontWeight: 800, color: textColor, lineHeight: 1.1, marginTop: 4 }}>
            {title}
          </div>
        </div>

        {/* Mood board grid */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'clamp(6px, 1vw, 10px)',
            position: 'relative',
          }}
        >
          {moodTiles.map((tile, i) => {
            const cardP = getCardProgress(i)
            return (
              <div
                key={i}
                style={{
                  width: tile.w,
                  height: tile.h,
                  minHeight: 'clamp(50px, 10vh, 80px)',
                  flexGrow: 1,
                  background: cardColor,
                  borderRadius: 'clamp(8px, 1.2vw, 12px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  transform: `scale(${cardP})`,
                  opacity: cardP,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <span style={{ fontSize: 'clamp(20px, 4vw, 32px)' }}>{tile.emoji}</span>
                <span style={{ fontSize: 'clamp(8px, 1.3vw, 11px)', fontWeight: 600, color: `${textColor}80` }}>
                  {tile.label}
                </span>
                {/* Shimmer overlay */}
                {holdProgress > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: `${shimmer - 30}%`,
                      width: '30%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Color palette */}
        <div style={{ opacity: paletteProgress, transform: `translateY(${(1 - paletteProgress) * 10}px)` }}>
          <div style={{ fontSize: 'clamp(8px, 1.2vw, 10px)', fontWeight: 700, color: `${textColor}60`, letterSpacing: 2, marginBottom: 6 }}>
            COLOR PALETTE
          </div>
          <div style={{ display: 'flex', gap: 'clamp(4px, 0.8vw, 8px)' }}>
            {palette.map((c, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div
                  style={{
                    width: 'clamp(28px, 6vw, 44px)',
                    height: 'clamp(28px, 6vw, 44px)',
                    borderRadius: 'clamp(6px, 1vw, 10px)',
                    background: c,
                    boxShadow: `0 2px 8px ${c}40`,
                  }}
                />
                <span style={{ fontSize: 6, fontFamily: "'Courier New', monospace", color: `${textColor}50` }}>
                  {c}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Materials */}
        <div style={{ opacity: materialsProgress, transform: `translateY(${(1 - materialsProgress) * 10}px)` }}>
          <div style={{ fontSize: 'clamp(8px, 1.2vw, 10px)', fontWeight: 700, color: `${textColor}60`, letterSpacing: 2, marginBottom: 6 }}>
            KEY MATERIALS
          </div>
          <div style={{ display: 'flex', gap: 'clamp(6px, 1.2vw, 12px)', flexWrap: 'wrap' }}>
            {materials.map((m, i) => (
              <div
                key={i}
                style={{
                  padding: 'clamp(4px, 0.8vh, 8px) clamp(10px, 2vw, 16px)',
                  borderRadius: 20,
                  background: `${accentColor}15`,
                  fontSize: 'clamp(9px, 1.4vw, 12px)',
                  fontWeight: 600,
                  color: accentColor,
                }}
              >
                {m}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-room-mood-board',
  title: 'Scene Room Mood Board',
  description: 'Interior design mood board collage with staggered tile entrance, color palette, material tags, and shimmer effects',
  tags: ['scene', 'interior', 'mood-board', 'design', 'decor', 'palette', 'architecture'],
  category: 'scene-layout',
  component: SceneRoomMoodBoardComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Living Room Refresh', group: 'Content' },
    { key: 'style', label: 'Design Style', type: 'text', defaultValue: 'Mid-Century Modern', group: 'Content' },
    { key: 'palette', label: 'Palette Colors', type: 'text-array', defaultValue: ['#C4A882', '#5E7A6B', '#E8DDD3', '#2C3E50', '#D4956A'], group: 'Content' },
    { key: 'materials', label: 'Materials', type: 'text-array', defaultValue: ['Walnut Wood', 'Linen', 'Brass', 'Terrazzo'], group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#5E7A6B', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5F0EB', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2C3E50', group: 'Style' },
  ],
  defaultConfig: {
    title: 'Living Room Refresh',
    style: 'Mid-Century Modern',
    palette: ['#C4A882', '#5E7A6B', '#E8DDD3', '#2C3E50', '#D4956A'],
    materials: ['Walnut Wood', 'Linen', 'Brass', 'Terrazzo'],
    accentColor: '#5E7A6B',
    cardColor: '#FFFFFF',
    bgColor: '#F5F0EB',
    textColor: '#2C3E50',
  },
})
