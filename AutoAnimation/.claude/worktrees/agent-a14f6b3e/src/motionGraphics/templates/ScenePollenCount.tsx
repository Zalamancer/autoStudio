import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScenePollenCountConfig {
  title: string
  treePollen: number
  grassPollen: number
  weedPollen: number
  moldSpores: number
  overallLevel: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function getPollenColor(value: number): string {
  if (value <= 3) return '#4ade80'
  if (value <= 6) return '#facc15'
  if (value <= 8) return '#fb923c'
  return '#ef4444'
}

function getPollenLabel(value: number): string {
  if (value <= 3) return 'Low'
  if (value <= 6) return 'Moderate'
  if (value <= 8) return 'High'
  return 'Very High'
}

function ScenePollenCountComponent({ config, progress }: MotionGraphicProps<ScenePollenCountConfig>) {
  const { title, treePollen, grassPollen, weedPollen, moldSpores, overallLevel, bgColor, textColor, accentColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const titleEnter = easeOutCubic(Math.min(1, enterProgress / 0.3))

  const allergens = [
    { label: 'Tree', value: treePollen, icon: '\u{1F333}' },
    { label: 'Grass', value: grassPollen, icon: '\u{1F33F}' },
    { label: 'Weed', value: weedPollen, icon: '\u{1F33E}' },
    { label: 'Mold', value: moldSpores, icon: '\u{1F344}' },
  ]

  const getBarProgress = (index: number): number => {
    const start = 0.2 + index * 0.1
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.55)))
  }

  // Floating pollen particles
  const particles = Array.from({ length: 15 }, (_, i) => {
    const seed = i * 67 + 23
    const x = (seed * 31) % 100
    const speed = 0.15 + ((seed * 13) % 10) / 30
    const y = ((progress * 200 * speed + seed * 43) % 120) - 10
    const size = 2 + (i % 4)
    const opacity = 0.08 + (i % 5) / 40
    const drift = Math.sin(progress * 6.28 * 2 + i * 0.8) * 15

    return { x: x + drift / 5, y, size, opacity }
  })

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Floating pollen particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: `rgba(200,220,100,${p.opacity})`,
          }}
        />
      ))}

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '6% 6%',
        opacity: exitOpacity,
      }}>
        {/* Title */}
        <div style={{
          fontSize: 'clamp(18px, 4.5vw, 36px)',
          fontWeight: 800,
          color: textColor,
          opacity: titleEnter,
          transform: `translateY(${(1 - titleEnter) * -15}px)`,
          marginBottom: 'clamp(2px, 0.5vh, 6px)',
          letterSpacing: '-0.02em',
        }}>
          {title}
        </div>

        {/* Overall level badge */}
        <div style={{
          fontSize: 'clamp(11px, 2vw, 16px)',
          fontWeight: 700,
          color: accentColor,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          padding: 'clamp(3px, 0.5vh, 6px) clamp(10px, 2vw, 18px)',
          borderRadius: 20,
          border: `1px solid ${accentColor}40`,
          background: `${accentColor}15`,
          opacity: titleEnter,
          marginBottom: 'clamp(16px, 3vh, 32px)',
        }}>
          {overallLevel}
        </div>

        {/* Allergen bars */}
        <div style={{
          width: '85%',
          maxWidth: 'clamp(240px, 65vw, 420px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(10px, 2vh, 18px)',
        }}>
          {allergens.map((allergen, i) => {
            const barProg = getBarProgress(i)
            const barColor = getPollenColor(allergen.value)
            const barLabel = getPollenLabel(allergen.value)
            const fillWidth = (allergen.value / 10) * barProg * 100
            const displayVal = Math.round(allergen.value * barProg)

            // Pulse high values during hold
            const isHigh = allergen.value >= 7
            const pulse = isHigh && progress >= 0.25 && progress < 0.8
              ? 1 + Math.sin(holdProgress * Math.PI * 4 + i) * 0.03
              : 1

            return (
              <div
                key={i}
                style={{
                  opacity: barProg,
                  transform: `translateX(${(1 - barProg) * 30}px) scale(${pulse})`,
                }}
              >
                {/* Label row */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'clamp(3px, 0.5vh, 6px)',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(4px, 0.8vw, 8px)',
                  }}>
                    <span style={{ fontSize: 'clamp(14px, 2.5vw, 20px)' }}>{allergen.icon}</span>
                    <span style={{
                      fontSize: 'clamp(11px, 2vw, 16px)',
                      fontWeight: 600,
                      color: textColor,
                    }}>
                      {allergen.label}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(4px, 0.8vw, 8px)',
                  }}>
                    <span style={{
                      fontSize: 'clamp(9px, 1.5vw, 12px)',
                      fontWeight: 600,
                      color: barColor,
                      textTransform: 'uppercase',
                    }}>
                      {barLabel}
                    </span>
                    <span style={{
                      fontSize: 'clamp(13px, 2.5vw, 20px)',
                      fontWeight: 800,
                      color: barColor,
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {displayVal}/10
                    </span>
                  </div>
                </div>

                {/* Bar */}
                <div style={{
                  width: '100%',
                  height: 'clamp(6px, 1.2vw, 10px)',
                  borderRadius: 5,
                  background: `${textColor}10`,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${fillWidth}%`,
                    height: '100%',
                    borderRadius: 5,
                    background: `linear-gradient(90deg, ${barColor}CC, ${barColor})`,
                    boxShadow: `0 0 8px ${barColor}40`,
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-pollen-count',
  title: 'Pollen Count',
  description: 'Pollen and allergy forecast with animated bars for tree, grass, weed, and mold levels',
  tags: ['scene', 'weather', 'pollen', 'allergy', 'health', 'forecast', 'data'],
  category: 'scene-layout',
  component: ScenePollenCountComponent as any,
  defaultConfig: {
    title: 'Pollen Forecast',
    treePollen: 7,
    grassPollen: 4,
    weedPollen: 9,
    moldSpores: 3,
    overallLevel: 'High',
    bgColor: '#0a150a',
    textColor: '#e2e8f0',
    accentColor: '#86efac',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Pollen Forecast', group: 'Content' },
    { key: 'treePollen', label: 'Tree Pollen (0-10)', type: 'number', defaultValue: 7, min: 0, max: 10, group: 'Content' },
    { key: 'grassPollen', label: 'Grass Pollen (0-10)', type: 'number', defaultValue: 4, min: 0, max: 10, group: 'Content' },
    { key: 'weedPollen', label: 'Weed Pollen (0-10)', type: 'number', defaultValue: 9, min: 0, max: 10, group: 'Content' },
    { key: 'moldSpores', label: 'Mold Spores (0-10)', type: 'number', defaultValue: 3, min: 0, max: 10, group: 'Content' },
    { key: 'overallLevel', label: 'Overall Level', type: 'text', defaultValue: 'High', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a150a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#86efac', group: 'Style' },
  ],
})
