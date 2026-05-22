import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneLevelUpConfig {
  newLevel: number
  xpCurrent: number
  xpMax: number
  bgColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneLevelUpComponent({ config, progress, frame, fps }: MotionGraphicProps<SceneLevelUpConfig>) {
  const { newLevel, xpCurrent, xpMax, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // "LEVEL UP!" text slam
  const slamProgress = Math.max(0, Math.min(1, enterProgress / 0.4))
  const slamScale = easeOutElastic(slamProgress)
  const slamOpacity = easeOutCubic(Math.min(1, slamProgress * 2))

  // XP bar fill
  const barFill = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.5)))
  const xpPercent = (xpCurrent / xpMax) * barFill * 100

  // Level number
  const levelReveal = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.4)))

  // Gold particles during hold
  const isHolding = progress >= 0.3 && progress < 0.8
  const particleCount = 12
  const particles = Array.from({ length: particleCount }, (_, i) => {
    const angle = (i / particleCount) * Math.PI * 2
    const time = holdProgress * 3 + i * 0.3
    const radius = 80 + Math.sin(time * 2) * 30
    const x = Math.cos(angle + time * 0.5) * radius
    const y = Math.sin(angle + time * 0.5) * radius
    const size = 3 + Math.sin(time * 3 + i) * 2
    const alpha = isHolding ? 0.3 + Math.sin(time * 2 + i) * 0.3 : 0
    return { x, y, size, alpha }
  })

  // Flash on slam
  const flashAlpha = slamProgress > 0.8 && slamProgress < 1 ? (1 - (slamProgress - 0.8) / 0.2) * 0.4 : 0

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.2

  // Glow pulse during hold
  const glowPulse = isHolding ? 0.5 + Math.sin(holdProgress * Math.PI * 6) * 0.5 : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Flash overlay */}
      {flashAlpha > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: accentColor,
            opacity: flashAlpha,
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Gold particles */}
        {particles.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: accentColor,
              boxShadow: `0 0 6px ${accentColor}`,
              transform: `translate(${p.x}px, ${p.y}px)`,
              opacity: p.alpha,
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* "LEVEL UP!" text */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(36px, 10vw, 80px)',
            fontWeight: 900,
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            transform: `scale(${slamScale})`,
            opacity: slamOpacity,
            textShadow: `0 0 ${20 * glowPulse}px ${accentColor}80, 0 0 ${40 * glowPulse}px ${accentColor}40`,
            lineHeight: 1,
          }}
        >
          LEVEL UP!
        </div>

        {/* Level number */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(60px, 16vw, 130px)',
            fontWeight: 900,
            color: textColor,
            lineHeight: 1,
            marginTop: 'clamp(4px, 1vw, 12px)',
            transform: `scale(${levelReveal})`,
            opacity: levelReveal,
            textShadow: `0 0 30px ${accentColor}30`,
          }}
        >
          {newLevel}
        </div>

        {/* XP bar */}
        <div
          style={{
            width: '70%',
            maxWidth: 400,
            marginTop: 'clamp(12px, 3vw, 28px)',
            opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.3))),
          }}
        >
          {/* XP label */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(9px, 1.4vw, 12px)',
              fontWeight: 600,
              color: `${textColor}80`,
              marginBottom: 'clamp(4px, 0.8vw, 8px)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            <span>XP</span>
            <span>{Math.round(xpCurrent * barFill)} / {xpMax}</span>
          </div>

          {/* Bar track */}
          <div
            style={{
              width: '100%',
              height: 'clamp(8px, 1.5vw, 14px)',
              borderRadius: 999,
              background: `${textColor}15`,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Fill */}
            <div
              style={{
                height: '100%',
                width: `${xpPercent}%`,
                background: `linear-gradient(90deg, ${accentColor}CC, ${accentColor})`,
                borderRadius: 999,
                boxShadow: `0 0 12px ${accentColor}50`,
                position: 'relative',
              }}
            >
              {/* Shimmer */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '50%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.3), transparent)',
                  borderRadius: '999px 999px 0 0',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-level-up',
  title: 'Level Up',
  description: 'RPG level up with text slam, XP bar fill, new level number with gold particle burst',
  tags: ['scene', 'gaming', 'rpg', 'level', 'xp', 'level-up', 'particles'],
  category: 'scene-layout',
  component: SceneLevelUpComponent as any,
  defaultConfig: {
    newLevel: 42,
    xpCurrent: 8500,
    xpMax: 10000,
    bgColor: '#0a0a14',
    accentColor: '#fbbf24',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'newLevel', label: 'New Level', type: 'number', defaultValue: 42, min: 1, max: 9999, group: 'Content' },
    { key: 'xpCurrent', label: 'Current XP', type: 'number', defaultValue: 8500, min: 0, max: 99999, group: 'Content' },
    { key: 'xpMax', label: 'Max XP', type: 'number', defaultValue: 10000, min: 1, max: 99999, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'accentColor', label: 'Accent / Gold', type: 'color', defaultValue: '#fbbf24', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
