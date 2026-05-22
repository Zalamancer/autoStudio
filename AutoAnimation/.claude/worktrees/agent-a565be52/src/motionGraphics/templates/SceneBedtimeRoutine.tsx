import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneBedtimeRoutineConfig {
  childName: string
  routineItems: string[]
  routineEmojis: string[]
  bedtime: string
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

function SceneBedtimeRoutineComponent({ config, progress }: MotionGraphicProps<SceneBedtimeRoutineConfig>) {
  const { childName, routineItems, routineEmojis, bedtime, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.15 ? progress / 0.15 : 1
  const holdProgress = progress >= 0.15 && progress < 0.85 ? (progress - 0.15) / 0.7 : progress >= 0.85 ? 1 : 0
  const exitProgress = progress >= 0.85 ? (progress - 0.85) / 0.15 : 0

  const globalScale = enterProgress < 1
    ? easeOutBack(enterProgress)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress) * 0.2
      : 1
  const globalOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : easeOutCubic(enterProgress)

  // Items check off one by one during hold
  const checkedCount = Math.min(routineItems.length, Math.floor(holdProgress * (routineItems.length + 1)))

  // Moon sway
  const moonY = Math.sin(holdProgress * Math.PI * 4) * 5
  const moonRotate = Math.sin(holdProgress * Math.PI * 2) * 8

  // Stars twinkle
  const starTwinkle1 = (Math.sin(holdProgress * 30) + 1) / 2
  const starTwinkle2 = (Math.sin(holdProgress * 30 + 2) + 1) / 2
  const starTwinkle3 = (Math.sin(holdProgress * 30 + 4) + 1) / 2

  // All done - zzz animation
  const allDone = checkedCount >= routineItems.length
  const zzzOpacity = allDone && holdProgress > 0.8 ? easeOutCubic(Math.min(1, (holdProgress - 0.8) / 0.15)) : 0

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, ${bgColor} 0%, #1a1040 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
        opacity: globalOpacity,
        transform: `scale(${globalScale})`,
      }}
    >
      {/* Stars background */}
      {Array.from({ length: 20 }).map((_, i) => {
        const twinkle = [starTwinkle1, starTwinkle2, starTwinkle3][i % 3]
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${(i * 17 + 5) % 95}%`,
              top: `${(i * 13 + 3) % 60}%`,
              width: `${2 + (i % 3) * 2}px`,
              height: `${2 + (i % 3) * 2}px`,
              borderRadius: '50%',
              background: '#FFFFFF',
              opacity: 0.1 + twinkle * 0.2 * ((i % 4 === 0) ? 1 : 0.3),
            }}
          />
        )
      })}

      {/* Moon */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          right: '12%',
          fontSize: 'clamp(28px, 6vw, 48px)',
          transform: `translateY(${moonY}px) rotate(${moonRotate}deg)`,
          filter: 'drop-shadow(0 0 12px rgba(255,200,50,0.4))',
        }}
      >
        {'\u{1F319}'}
      </div>

      <div style={{ width: '88%', maxWidth: '480px' }}>
        <div
          style={{
            background: `${cardColor}F0`,
            borderRadius: 'clamp(16px, 3vw, 28px)',
            padding: 'clamp(18px, 4vw, 36px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            border: `2px solid ${accentColor}30`,
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'clamp(14px, 3vw, 24px)',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 'clamp(10px, 2vw, 14px)',
                  fontWeight: 700,
                  color: accentColor,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '4px',
                }}
              >
                {'\u{1F31F}'} Bedtime Routine
              </div>
              <div
                style={{
                  fontSize: 'clamp(22px, 5.5vw, 38px)',
                  fontWeight: 700,
                  color: textColor,
                  lineHeight: 1.1,
                }}
              >
                {childName}'s Bedtime
              </div>
            </div>
            {/* Clock */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <div style={{ fontSize: 'clamp(18px, 4vw, 30px)' }}>{'\u{1F570}\uFE0F'}</div>
              <div
                style={{
                  fontSize: 'clamp(11px, 2vw, 16px)',
                  fontWeight: 700,
                  color: accentColor,
                }}
              >
                {bedtime}
              </div>
            </div>
          </div>

          {/* Routine items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 1.5vw, 12px)' }}>
            {routineItems.map((item, i) => {
              const isChecked = i < checkedCount
              const justChecked = i === checkedCount - 1
              const itemEmoji = routineEmojis[i] || '\u2705'
              const itemScale = justChecked ? 1.05 : 1

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(8px, 1.5vw, 14px)',
                    padding: 'clamp(8px, 1.5vw, 14px) clamp(10px, 2vw, 18px)',
                    borderRadius: 'clamp(10px, 2vw, 16px)',
                    background: isChecked ? `${accentColor}12` : `${textColor}05`,
                    border: `2px solid ${isChecked ? accentColor + '35' : textColor + '10'}`,
                    transform: `scale(${itemScale})`,
                  }}
                >
                  {/* Emoji */}
                  <div
                    style={{
                      fontSize: 'clamp(18px, 4vw, 28px)',
                      opacity: isChecked ? 1 : 0.4,
                      transform: `scale(${isChecked ? 1.1 : 0.9})`,
                      flexShrink: 0,
                    }}
                  >
                    {itemEmoji}
                  </div>
                  {/* Text */}
                  <div
                    style={{
                      flex: 1,
                      fontSize: 'clamp(13px, 2.5vw, 19px)',
                      fontWeight: 500,
                      color: textColor,
                      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                      textDecoration: isChecked ? 'line-through' : 'none',
                      opacity: isChecked ? 0.6 : 1,
                    }}
                  >
                    {item}
                  </div>
                  {/* Checkmark */}
                  <div
                    style={{
                      width: 'clamp(22px, 4vw, 30px)',
                      height: 'clamp(22px, 4vw, 30px)',
                      borderRadius: '50%',
                      background: isChecked ? accentColor : 'transparent',
                      border: `2px solid ${isChecked ? accentColor : textColor + '25'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'clamp(10px, 2vw, 15px)',
                      color: '#FFFFFF',
                      flexShrink: 0,
                    }}
                  >
                    {isChecked ? '\u2713' : ''}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ZZZ goodnight message */}
          {zzzOpacity > 0 && (
            <div
              style={{
                textAlign: 'center',
                marginTop: 'clamp(12px, 3vw, 20px)',
                opacity: zzzOpacity,
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(16px, 3.5vw, 26px)',
                  fontWeight: 700,
                  color: accentColor,
                }}
              >
                {'\u{1F634}'} Sweet dreams, {childName}! {'\u{1F48E}'}
              </div>
              <div
                style={{
                  fontSize: 'clamp(20px, 5vw, 36px)',
                  marginTop: '4px',
                  letterSpacing: '8px',
                  color: `${accentColor}88`,
                }}
              >
                Z z z
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-bedtime-routine',
  title: 'Bedtime Routine',
  description: 'Bedtime routine checklist with starry night background, moon animation, and items that check off one by one. Zzz message when complete.',
  tags: ['scene', 'kids', 'bedtime', 'routine', 'sleep', 'night', 'cartoon', 'checklist'],
  category: 'scene-layout',
  component: SceneBedtimeRoutineComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    childName: 'Lily',
    routineItems: ['Take a bath', 'Brush teeth', 'Put on pajamas', 'Read a story', 'Lights out'],
    routineEmojis: ['\u{1F6C1}', '\u{1FAA5}', '\u{1F455}', '\u{1F4D6}', '\u{1F4A4}'],
    bedtime: '8:00 PM',
    bgColor: '#1E1145',
    cardColor: '#FFFFFF',
    accentColor: '#9B7DFF',
    textColor: '#2D3436',
  },
  configSchema: [
    { key: 'childName', label: 'Child Name', type: 'text', defaultValue: 'Lily', group: 'Content' },
    { key: 'routineItems', label: 'Routine Items', type: 'text-array', defaultValue: ['Take a bath', 'Brush teeth', 'Put on pajamas', 'Read a story', 'Lights out'], group: 'Content' },
    { key: 'routineEmojis', label: 'Item Emojis', type: 'text-array', defaultValue: ['\u{1F6C1}', '\u{1FAA5}', '\u{1F455}', '\u{1F4D6}', '\u{1F4A4}'], group: 'Content' },
    { key: 'bedtime', label: 'Bedtime', type: 'text', defaultValue: '8:00 PM', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1E1145', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#9B7DFF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2D3436', group: 'Style' },
  ],
})
