import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneAchievementUnlockConfig {
  title: string
  description: string
  gamerscore: number
  icon: string
  bgColor: string
  cardColor: string
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

function SceneAchievementUnlockComponent({ config, progress }: MotionGraphicProps<SceneAchievementUnlockConfig>) {
  const { title, description, gamerscore, icon, bgColor, cardColor, accentColor, textColor } = config

  // Phases: enter 0-0.25, hold 0.25-0.8, exit 0.8-1
  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Card slides in from bottom
  const slideIn = easeOutBack(Math.min(1, enterProgress / 0.6))
  const slideY = (1 - slideIn) * 200

  // Exit: slide down
  const exitEased = easeInCubic(exitProgress)
  const exitSlideY = exitEased * 200
  const exitOpacity = 1 - exitEased

  // Shine sweep across card during hold
  const shineX = holdProgress * 200 - 50

  // Icon scale pop
  const iconScale = enterProgress < 0.5
    ? 0
    : easeOutBack(Math.min(1, (enterProgress - 0.5) / 0.5))

  // Gamerscore counter
  const scoreReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.4)))
  const displayScore = Math.round(gamerscore * scoreReveal)

  // Subtle float during hold
  const isHolding = progress >= 0.25 && progress < 0.8
  const floatY = isHolding ? Math.sin(holdProgress * Math.PI * 3) * 3 : 0

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Achievement card */}
      <div
        style={{
          position: 'absolute',
          bottom: '12%',
          left: '50%',
          transform: `translate(-50%, ${slideY + exitSlideY + floatY}px)`,
          opacity: exitOpacity * slideIn,
          width: '85%',
          maxWidth: 500,
        }}
      >
        {/* Card body */}
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(10px, 2vw, 18px)',
            padding: 'clamp(14px, 2.5vw, 24px)',
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(12px, 2vw, 20px)',
            boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${accentColor}30`,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Shine sweep */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: `${shineX}%`,
              width: '30%',
              height: '100%',
              background: `linear-gradient(90deg, transparent, ${accentColor}15, transparent)`,
              pointerEvents: 'none',
            }}
          />

          {/* Icon circle */}
          <div
            style={{
              width: 'clamp(48px, 10vw, 72px)',
              height: 'clamp(48px, 10vw, 72px)',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}AA)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(22px, 5vw, 36px)',
              flexShrink: 0,
              transform: `scale(${iconScale})`,
              boxShadow: `0 0 20px ${accentColor}40`,
            }}
          >
            {icon}
          </div>

          {/* Text content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Achievement unlocked label */}
            <div
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(8px, 1.3vw, 11px)',
                fontWeight: 700,
                color: accentColor,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                marginBottom: 'clamp(2px, 0.5vw, 4px)',
                opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.3))),
              }}
            >
              Achievement Unlocked
            </div>

            {/* Title */}
            <div
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(14px, 2.8vw, 22px)',
                fontWeight: 800,
                color: textColor,
                lineHeight: 1.2,
                opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.3))),
              }}
            >
              {title}
            </div>

            {/* Description */}
            <div
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(9px, 1.6vw, 13px)',
                fontWeight: 400,
                color: `${textColor}99`,
                marginTop: 'clamp(2px, 0.3vw, 4px)',
                opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3))),
              }}
            >
              {description}
            </div>
          </div>

          {/* Gamerscore */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flexShrink: 0,
              opacity: scoreReveal,
            }}
          >
            <div
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(18px, 4vw, 32px)',
                fontWeight: 900,
                color: accentColor,
                lineHeight: 1,
              }}
            >
              {displayScore}
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(7px, 1vw, 9px)',
                fontWeight: 600,
                color: `${textColor}70`,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              GS
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-achievement-unlock',
  title: 'Achievement Unlock',
  description: 'Xbox/PlayStation-style achievement popup with icon, title, gamerscore, slide-in from bottom with shine sweep',
  tags: ['scene', 'gaming', 'achievement', 'unlock', 'popup', 'xbox', 'playstation'],
  category: 'scene-layout',
  component: SceneAchievementUnlockComponent as any,
  defaultConfig: {
    title: 'First Blood',
    description: 'Defeat your first enemy in battle',
    gamerscore: 50,
    icon: '\u{1F3C6}',
    bgColor: '#0a0a12',
    cardColor: '#1a1a2e',
    accentColor: '#10b981',
    textColor: '#e2e8f0',
  },
  configSchema: [
    { key: 'title', label: 'Achievement Title', type: 'text', defaultValue: 'First Blood', group: 'Content' },
    { key: 'description', label: 'Description', type: 'text', defaultValue: 'Defeat your first enemy in battle', group: 'Content' },
    { key: 'gamerscore', label: 'Gamerscore', type: 'number', defaultValue: 50, min: 0, max: 9999, group: 'Content' },
    { key: 'icon', label: 'Icon Emoji', type: 'text', defaultValue: '\u{1F3C6}', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a12', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#10b981', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
})
