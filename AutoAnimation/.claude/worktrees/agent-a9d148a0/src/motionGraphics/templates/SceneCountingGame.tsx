import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneCountingGameConfig {
  targetNumber: number
  emoji: string
  label: string
  bgColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function SceneCountingGameComponent({ config, progress }: MotionGraphicProps<SceneCountingGameConfig>) {
  const { targetNumber, emoji, label, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.15 ? progress / 0.15 : 1
  const holdProgress = progress >= 0.15 && progress < 0.85 ? (progress - 0.15) / 0.7 : progress >= 0.85 ? 1 : 0
  const exitProgress = progress >= 0.85 ? (progress - 0.85) / 0.15 : 0

  const globalOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : easeOutCubic(enterProgress)
  const globalScale = exitProgress > 0 ? 1 - easeInCubic(exitProgress) * 0.15 : easeOutBack(Math.min(1, enterProgress * 1.3))

  // Count up animation during hold
  const currentCount = Math.min(targetNumber, Math.floor(holdProgress * (targetNumber + 1)))

  // Number display pulse
  const numberPulse = currentCount === targetNumber && holdProgress > 0.5
    ? 1 + Math.sin((holdProgress - 0.5) * 20) * 0.05
    : 1

  // Grid layout for emoji items
  const cols = targetNumber <= 4 ? 2 : targetNumber <= 9 ? 3 : 4
  const maxDisplay = Math.min(targetNumber, 20)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
        opacity: globalOpacity,
        transform: `scale(${globalScale})`,
      }}
    >
      {/* Confetti dots background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle, ${accentColor}10 2px, transparent 2px)`,
          backgroundSize: '28px 28px',
        }}
      />

      {/* Header */}
      <div
        style={{
          fontSize: 'clamp(14px, 3vw, 22px)',
          fontWeight: 700,
          color: accentColor,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: 'clamp(8px, 2vw, 16px)',
          opacity: easeOutCubic(Math.min(1, enterProgress * 2)),
        }}
      >
        {'\u{1F3AF}'} Let's Count!
      </div>

      {/* Big number display */}
      <div
        style={{
          fontSize: 'clamp(48px, 14vw, 120px)',
          fontWeight: 900,
          color: accentColor,
          lineHeight: 1,
          transform: `scale(${numberPulse})`,
          textShadow: `3px 3px 0 ${accentColor}20`,
          marginBottom: 'clamp(4px, 1vw, 8px)',
        }}
      >
        {currentCount}
      </div>

      {/* Label */}
      <div
        style={{
          fontSize: 'clamp(16px, 3.5vw, 28px)',
          fontWeight: 600,
          color: textColor,
          marginBottom: 'clamp(16px, 4vw, 32px)',
          opacity: holdProgress > 0 ? 1 : easeOutCubic(enterProgress),
        }}
      >
        {label}
      </div>

      {/* Emoji grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 'clamp(6px, 1.5vw, 14px)',
          padding: '0 10%',
          maxWidth: '400px',
        }}
      >
        {Array.from({ length: maxDisplay }).map((_, i) => {
          const isVisible = i < currentCount
          const justAppeared = i === currentCount - 1
          const itemScale = justAppeared ? 1.3 : isVisible ? 1 : 0.4
          const itemOpacity = isVisible ? 1 : 0.15

          // Random slight position offset for playfulness
          const offsetX = seededRandom(i * 7 + 1) * 4 - 2
          const offsetY = seededRandom(i * 7 + 2) * 4 - 2
          const itemRotate = (seededRandom(i * 7 + 3) - 0.5) * 10

          return (
            <div
              key={i}
              style={{
                width: 'clamp(32px, 7vw, 56px)',
                height: 'clamp(32px, 7vw, 56px)',
                borderRadius: 'clamp(8px, 1.5vw, 14px)',
                background: isVisible ? `${accentColor}15` : `${textColor}05`,
                border: `2px solid ${isVisible ? accentColor + '40' : textColor + '10'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(18px, 4vw, 32px)',
                transform: `scale(${itemScale}) translate(${offsetX}px, ${offsetY}px) rotate(${isVisible ? itemRotate : 0}deg)`,
                opacity: itemOpacity,
                boxShadow: isVisible ? `0 3px 8px ${accentColor}20` : 'none',
              }}
            >
              {emoji}
            </div>
          )
        })}
      </div>

      {/* Celebration when complete */}
      {currentCount === targetNumber && holdProgress > 0.6 && (
        <div
          style={{
            marginTop: 'clamp(12px, 3vw, 24px)',
            fontSize: 'clamp(14px, 2.5vw, 20px)',
            fontWeight: 700,
            color: accentColor,
            opacity: easeOutCubic(Math.min(1, (holdProgress - 0.6) / 0.2)),
            transform: `scale(${easeOutBack(Math.min(1, (holdProgress - 0.6) / 0.2))})`,
          }}
        >
          {'\u{1F389}'} Great job! {targetNumber} {label}! {'\u2B50'}
        </div>
      )}
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-counting-game',
  title: 'Counting Game',
  description: 'Number counting visualization with emoji items appearing one by one in a grid. Big number counter, celebration on completion.',
  tags: ['scene', 'kids', 'education', 'counting', 'numbers', 'math', 'cartoon', 'game'],
  category: 'scene-layout',
  component: SceneCountingGameComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    targetNumber: 5,
    emoji: '\u{1F34E}',
    label: 'Apples',
    bgColor: '#FFF5F5',
    accentColor: '#FF6B6B',
    textColor: '#2D3436',
  },
  configSchema: [
    { key: 'targetNumber', label: 'Target Number', type: 'number', defaultValue: 5, min: 1, max: 20, group: 'Content' },
    { key: 'emoji', label: 'Emoji', type: 'text', defaultValue: '\u{1F34E}', group: 'Content' },
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Apples', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF5F5', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FF6B6B', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2D3436', group: 'Style' },
  ],
})
