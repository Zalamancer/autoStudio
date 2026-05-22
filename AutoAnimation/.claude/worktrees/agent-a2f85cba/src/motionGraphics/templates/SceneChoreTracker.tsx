import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneChoreTrackerConfig {
  childName: string
  chores: string[]
  choreEmojis: string[]
  stickers: string[]
  completedCount: number
  bgColor: string
  cardColor: string
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

function SceneChoreTrackerComponent({ config, progress }: MotionGraphicProps<SceneChoreTrackerConfig>) {
  const { childName, chores, choreEmojis, stickers, completedCount, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.15 ? progress / 0.15 : 1
  const holdProgress = progress >= 0.15 && progress < 0.85 ? (progress - 0.15) / 0.7 : progress >= 0.85 ? 1 : 0
  const exitProgress = progress >= 0.85 ? (progress - 0.85) / 0.15 : 0

  const cardScale = enterProgress < 1
    ? easeOutBack(enterProgress)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress) * 0.2
      : 1
  const cardOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : easeOutCubic(enterProgress)

  // Stickers appear with animation during hold
  const stickersShown = Math.min(completedCount, Math.floor(holdProgress * (completedCount + 1)))

  // Progress bar
  const progressBarWidth = holdProgress * (completedCount / chores.length) * 100

  // Celebration when all done
  const allDone = completedCount >= chores.length && stickersShown >= chores.length
  const celebrationOpacity = allDone && holdProgress > 0.8 ? easeOutCubic((holdProgress - 0.8) / 0.15) : 0

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
      }}
    >
      {/* Playful confetti background */}
      {Array.from({ length: 15 }).map((_, i) => {
        const colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF69B4', '#C77DFF']
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${seededRandom(i * 7 + 1) * 100}%`,
              top: `${seededRandom(i * 7 + 2) * 100}%`,
              width: `${4 + seededRandom(i * 7 + 3) * 8}px`,
              height: `${4 + seededRandom(i * 7 + 3) * 8}px`,
              borderRadius: seededRandom(i * 7 + 4) > 0.5 ? '50%' : '2px',
              background: colors[i % colors.length],
              opacity: 0.06,
              transform: `rotate(${seededRandom(i * 7 + 5) * 360}deg)`,
            }}
          />
        )
      })}

      <div
        style={{
          transform: `scale(${cardScale})`,
          opacity: cardOpacity,
          width: '90%',
          maxWidth: '500px',
        }}
      >
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(16px, 3vw, 28px)',
            padding: 'clamp(18px, 4vw, 36px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
            border: `3px solid ${accentColor}25`,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'clamp(10px, 2.5vw, 18px)',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-block',
                  background: `${accentColor}15`,
                  color: accentColor,
                  fontSize: 'clamp(9px, 1.6vw, 13px)',
                  fontWeight: 700,
                  padding: '2px clamp(8px, 1.5vw, 14px)',
                  borderRadius: '100px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                {'\u{1F3C5}'} Chore Tracker
              </div>
              <div
                style={{
                  fontSize: 'clamp(20px, 5vw, 34px)',
                  fontWeight: 700,
                  color: textColor,
                  lineHeight: 1.1,
                }}
              >
                {childName}'s Chores
              </div>
            </div>
            {/* Score */}
            <div
              style={{
                background: `${accentColor}10`,
                borderRadius: 'clamp(10px, 2vw, 16px)',
                padding: 'clamp(6px, 1.2vw, 10px) clamp(10px, 2vw, 16px)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 'clamp(20px, 5vw, 32px)', fontWeight: 900, color: accentColor }}>
                {stickersShown}
              </div>
              <div style={{ fontSize: 'clamp(8px, 1.5vw, 12px)', color: `${textColor}66`, fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
                of {chores.length}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: 'clamp(8px, 1.5vw, 12px)',
              borderRadius: '100px',
              background: `${textColor}08`,
              marginBottom: 'clamp(14px, 3vw, 24px)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressBarWidth}%`,
                height: '100%',
                borderRadius: '100px',
                background: `linear-gradient(90deg, ${accentColor}, ${accentColor}DD)`,
                boxShadow: `0 0 8px ${accentColor}40`,
              }}
            />
          </div>

          {/* Chore list with stickers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(5px, 1.2vw, 10px)' }}>
            {chores.map((chore, i) => {
              const isDone = i < stickersShown
              const justDone = i === stickersShown - 1
              const choreEmoji = choreEmojis[i] || '\u{1F9F9}'
              const sticker = stickers[i] || '\u2B50'

              // Sticker pop animation
              const stickerScale = justDone ? 1.4 : isDone ? 1 : 0
              const stickerRotate = isDone ? (seededRandom(i * 10) - 0.5) * 20 : 0

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(6px, 1.2vw, 10px)',
                    padding: 'clamp(6px, 1.2vw, 10px) clamp(8px, 1.5vw, 14px)',
                    borderRadius: 'clamp(8px, 1.5vw, 14px)',
                    background: isDone ? `${accentColor}08` : `${textColor}03`,
                    border: `2px solid ${isDone ? accentColor + '25' : textColor + '08'}`,
                  }}
                >
                  {/* Chore emoji */}
                  <div
                    style={{
                      fontSize: 'clamp(16px, 3.5vw, 26px)',
                      flexShrink: 0,
                      opacity: isDone ? 0.5 : 1,
                    }}
                  >
                    {choreEmoji}
                  </div>
                  {/* Chore text */}
                  <div
                    style={{
                      flex: 1,
                      fontSize: 'clamp(12px, 2.5vw, 18px)',
                      fontWeight: 500,
                      color: textColor,
                      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                      textDecoration: isDone ? 'line-through' : 'none',
                      opacity: isDone ? 0.5 : 1,
                    }}
                  >
                    {chore}
                  </div>
                  {/* Sticker reward */}
                  <div
                    style={{
                      fontSize: 'clamp(20px, 4vw, 32px)',
                      transform: `scale(${stickerScale}) rotate(${stickerRotate}deg)`,
                      opacity: isDone ? 1 : 0.15,
                      filter: isDone ? `drop-shadow(0 2px 4px ${accentColor}40)` : 'none',
                      flexShrink: 0,
                    }}
                  >
                    {sticker}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Celebration */}
          {celebrationOpacity > 0 && (
            <div
              style={{
                textAlign: 'center',
                marginTop: 'clamp(10px, 2.5vw, 18px)',
                opacity: celebrationOpacity,
                transform: `scale(${easeOutBack(celebrationOpacity)})`,
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(14px, 3vw, 22px)',
                  fontWeight: 700,
                  color: accentColor,
                }}
              >
                {'\u{1F389}'} All chores done! You're a superstar! {'\u{1F31F}'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-chore-tracker',
  title: 'Chore Tracker',
  description: 'Chore tracking chart with emoji stickers that pop in as rewards. Progress bar, score counter, and celebration when all chores are done.',
  tags: ['scene', 'kids', 'chore', 'tracker', 'sticker', 'reward', 'cartoon', 'motivation'],
  category: 'scene-layout',
  component: SceneChoreTrackerComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    childName: 'Max',
    chores: ['Make the bed', 'Feed the pet', 'Pick up toys', 'Set the table', 'Water plants'],
    choreEmojis: ['\u{1F6CF}\uFE0F', '\u{1F436}', '\u{1F9F8}', '\u{1F37D}\uFE0F', '\u{1FAB4}'],
    stickers: ['\u2B50', '\u{1F31F}', '\u{1F308}', '\u{1F984}', '\u{1F3C6}'],
    completedCount: 4,
    bgColor: '#F0FFF4',
    cardColor: '#FFFFFF',
    accentColor: '#10B981',
    textColor: '#2D3436',
  },
  configSchema: [
    { key: 'childName', label: 'Child Name', type: 'text', defaultValue: 'Max', group: 'Content' },
    { key: 'chores', label: 'Chores', type: 'text-array', defaultValue: ['Make the bed', 'Feed the pet', 'Pick up toys', 'Set the table', 'Water plants'], group: 'Content' },
    { key: 'choreEmojis', label: 'Chore Emojis', type: 'text-array', defaultValue: ['\u{1F6CF}\uFE0F', '\u{1F436}', '\u{1F9F8}', '\u{1F37D}\uFE0F', '\u{1FAB4}'], group: 'Content' },
    { key: 'stickers', label: 'Sticker Rewards', type: 'text-array', defaultValue: ['\u2B50', '\u{1F31F}', '\u{1F308}', '\u{1F984}', '\u{1F3C6}'], group: 'Content' },
    { key: 'completedCount', label: 'Completed Chores', type: 'number', defaultValue: 4, min: 0, max: 10, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F0FFF4', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#10B981', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2D3436', group: 'Style' },
  ],
})
