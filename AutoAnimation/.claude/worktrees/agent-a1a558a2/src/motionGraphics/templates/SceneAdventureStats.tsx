import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AdventureStatsConfig {
  stats: string[]
  title: string
  bgColor: string
  textColor: string
  accentColor: string
  counterColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function parseStat(s: string): { icon: string; value: number; label: string } {
  const parts = s.split(':')
  return {
    icon: (parts[0] || '🌍').trim(),
    value: parseInt(parts[1] || '0', 10),
    label: (parts[2] || '').trim(),
  }
}

function SceneAdventureStatsComponent({ config, progress }: MotionGraphicProps<AdventureStatsConfig>) {
  const { stats, title, bgColor, textColor, accentColor, counterColor } = config

  const parsed = stats.map(parseStat)

  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Title enters
  const titleEnter = easeOutCubic(Math.max(0, Math.min(1, enterProgress / 0.3)))

  // Stats appear staggered, counters count up
  const getStatProgress = (idx: number): number => {
    const start = 0.2 + idx * 0.15
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.4)))
  }

  // Icon pop
  const getIconProgress = (idx: number): number => {
    const start = 0.15 + idx * 0.15
    return elasticOut(Math.max(0, Math.min(1, (enterProgress - start) / 0.3)))
  }

  // Hold: celebration sparkle
  const celebrationOpacity = progress >= 0.3 && progress < 0.8
    ? 0.3 + Math.sin(holdProgress * Math.PI * 6) * 0.2
    : 0

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      {/* Celebration radial */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, ${accentColor}12, transparent 65%)`,
          opacity: enterProgress,
        }}
      />

      {/* Confetti / sparkle dots */}
      {[...Array(8)].map((_, i) => {
        const x = 15 + (i * 11) % 70
        const y = 10 + (i * 17) % 80
        const size = 3 + (i % 3) * 2
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              borderRadius: '50%',
              background: i % 2 === 0 ? accentColor : counterColor,
              opacity: celebrationOpacity,
              transform: `scale(${celebrationOpacity * 2})`,
            }}
          />
        )
      })}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6% 8%',
          gap: 'clamp(16px, 3.5vh, 32px)',
          opacity: exitOpacity,
          transform: `scale(${1 - exitEased * 0.1})`,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: 'clamp(14px, 2.5vw, 20px)',
            fontWeight: 700,
            color: accentColor,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            opacity: titleEnter,
            transform: `translateY(${(1 - titleEnter) * -15}px)`,
          }}
        >
          {title}
        </div>

        {/* Stats grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(parsed.length, 2)}, 1fr)`,
            gap: 'clamp(16px, 3vw, 32px)',
            width: '100%',
            maxWidth: 400,
          }}
        >
          {parsed.map((stat, i) => {
            const statProg = getStatProgress(i)
            const iconProg = getIconProgress(i)
            const displayValue = Math.round(stat.value * statProg)

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'clamp(4px, 0.8vh, 8px)',
                  opacity: statProg,
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    fontSize: 'clamp(24px, 5vw, 40px)',
                    transform: `scale(${iconProg})`,
                  }}
                >
                  {stat.icon}
                </div>

                {/* Counter */}
                <div
                  style={{
                    fontSize: 'clamp(30px, 7vw, 52px)',
                    fontWeight: 900,
                    color: counterColor,
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {displayValue.toLocaleString()}
                </div>

                {/* Label */}
                <div
                  style={{
                    fontSize: 'clamp(10px, 1.8vw, 14px)',
                    fontWeight: 600,
                    color: `${textColor}80`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    textAlign: 'center',
                  }}
                >
                  {stat.label}
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
  id: 'tpl-scene-adventure-stats',
  title: 'Adventure Stats',
  description: 'Trip stats recap with animated counters, icon pops, and celebration sparkle energy',
  tags: ['scene', 'travel', 'stats', 'adventure', 'recap', 'celebration'],
  category: 'scene-layout',
  component: SceneAdventureStatsComponent as any,
  defaultConfig: {
    title: 'TRIP RECAP',
    stats: ['🌍:12:Countries', '✈️:28400:Miles', '📸:847:Photos', '🍜:64:Foods Tried'],
    bgColor: '#0f0f1a',
    textColor: '#e8e4f0',
    accentColor: '#a78bfa',
    counterColor: '#fbbf24',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'TRIP RECAP', group: 'Content' },
    { key: 'stats', label: 'Stats (Icon:Value:Label)', type: 'text-array', defaultValue: ['🌍:12:Countries', '✈️:28400:Miles', '📸:847:Photos', '🍜:64:Foods Tried'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0f1a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e8e4f0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#a78bfa', group: 'Style' },
    { key: 'counterColor', label: 'Counter Color', type: 'color', defaultValue: '#fbbf24', group: 'Style' },
  ],
})
