import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MaterialSwatchConfig {
  title: string
  materials: string[]
  materialColors: string[]
  finishes: string[]
  recommended: number
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

function SceneMaterialSwatchComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<MaterialSwatchConfig>) {
  const { title, materials, materialColors, finishes, recommended, bgColor, cardColor, accentColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.28
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Title
  const titleProgress = easeOutCubic(Math.min(1, enterProgress / 0.3))
  // Swatches cascade from left
  const getSwatchProgress = (idx: number) => {
    const delay = 0.2 + idx * 0.12
    return easeOutBack(Math.max(0, Math.min(1, (enterProgress - delay) / 0.35)))
  }
  // Recommended badge
  const badgeProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.25)))

  // Hold: highlight cycles through materials
  const highlightIdx = Math.floor(holdProgress * materials.length) % materials.length

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

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
          gap: 'clamp(12px, 2.5vh, 22px)',
          width: '100%',
          maxWidth: 420,
          opacity: exitOpacity,
        }}
      >
        {/* Header */}
        <div style={{ opacity: titleProgress, transform: `translateY(${(1 - titleProgress) * 10}px)` }}>
          <div style={{ fontSize: 'clamp(9px, 1.3vw, 11px)', fontWeight: 700, color: accentColor, letterSpacing: 3, textTransform: 'uppercase' }}>
            MATERIAL COMPARISON
          </div>
          <div style={{ fontSize: 'clamp(20px, 4.5vw, 32px)', fontWeight: 800, color: textColor, marginTop: 4, lineHeight: 1.1 }}>
            {title}
          </div>
        </div>

        {/* Material swatches */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1.5vh, 14px)' }}>
          {materials.map((mat, i) => {
            const p = getSwatchProgress(i)
            const isHighlighted = holdProgress > 0 && i === highlightIdx
            const isRecommended = i === recommended
            const color = materialColors[i] || '#A0A0A0'
            const finish = finishes[i] || 'Standard'

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(10px, 2vw, 16px)',
                  background: cardColor,
                  borderRadius: 'clamp(12px, 1.8vw, 16px)',
                  padding: 'clamp(10px, 2vh, 16px)',
                  opacity: p,
                  transform: `translateX(${(1 - p) * -30}px) scale(${isHighlighted ? 1.02 : 1})`,
                  boxShadow: isHighlighted
                    ? `0 4px 20px rgba(0,0,0,0.1), 0 0 0 2px ${accentColor}30`
                    : '0 2px 10px rgba(0,0,0,0.04)',
                  position: 'relative',
                }}
              >
                {/* Swatch color block */}
                <div
                  style={{
                    width: 'clamp(44px, 9vw, 64px)',
                    height: 'clamp(44px, 9vw, 64px)',
                    borderRadius: 'clamp(8px, 1.2vw, 12px)',
                    background: color,
                    flexShrink: 0,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Texture overlay -- diagonal grain */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: `repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(255,255,255,0.08) 3px, rgba(255,255,255,0.08) 4px)`,
                      pointerEvents: 'none',
                    }}
                  />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 'clamp(13px, 2vw, 17px)', fontWeight: 700, color: textColor }}>
                      {mat}
                    </span>
                    {isRecommended && badgeProgress > 0 && (
                      <span
                        style={{
                          fontSize: 'clamp(7px, 1vw, 9px)',
                          fontWeight: 800,
                          color: '#FFFFFF',
                          background: accentColor,
                          padding: '2px 6px',
                          borderRadius: 10,
                          textTransform: 'uppercase',
                          letterSpacing: 1,
                          opacity: badgeProgress,
                        }}
                      >
                        BEST
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 'clamp(9px, 1.4vw, 12px)', fontWeight: 500, color: `${textColor}50`, marginTop: 2 }}>
                    Finish: {finish}
                  </div>
                </div>

                {/* Color hex */}
                <div
                  style={{
                    fontSize: 'clamp(8px, 1.1vw, 10px)',
                    fontFamily: "'Courier New', monospace",
                    color: `${textColor}40`,
                    flexShrink: 0,
                  }}
                >
                  {color}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'clamp(12px, 2.5vw, 24px)',
            opacity: badgeProgress,
          }}
        >
          {['Durability', 'Cost', 'Eco-Friendly'].map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: ['#10B981', '#3B82F6', '#8B5CF6'][i] }} />
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
  id: 'tpl-scene-material-swatch',
  title: 'Scene Material Swatch',
  description: 'Building material swatch comparison with textured color blocks, finish labels, recommended badge, and highlight cycling',
  tags: ['scene', 'material', 'swatch', 'architecture', 'interior', 'comparison', 'construction', 'texture'],
  category: 'scene-layout',
  component: SceneMaterialSwatchComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Countertop Materials', group: 'Content' },
    { key: 'materials', label: 'Materials', type: 'text-array', defaultValue: ['Marble', 'Granite', 'Quartz', 'Butcher Block'], group: 'Content' },
    { key: 'materialColors', label: 'Swatch Colors', type: 'text-array', defaultValue: ['#E8DDD3', '#6B7280', '#D4C5B0', '#B5885A'], group: 'Content' },
    { key: 'finishes', label: 'Finishes', type: 'text-array', defaultValue: ['Polished', 'Honed', 'Matte', 'Oiled'], group: 'Content' },
    { key: 'recommended', label: 'Recommended (index)', type: 'number', defaultValue: 2, min: 0, max: 10, group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#1E3A5F', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5F0EB', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1E293B', group: 'Style' },
  ],
  defaultConfig: {
    title: 'Countertop Materials',
    materials: ['Marble', 'Granite', 'Quartz', 'Butcher Block'],
    materialColors: ['#E8DDD3', '#6B7280', '#D4C5B0', '#B5885A'],
    finishes: ['Polished', 'Honed', 'Matte', 'Oiled'],
    recommended: 2,
    accentColor: '#1E3A5F',
    cardColor: '#FFFFFF',
    bgColor: '#F5F0EB',
    textColor: '#1E293B',
  },
})
