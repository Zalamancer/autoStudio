import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneRedFlagConfig {
  flag1: string
  flag2: string
  flag3: string
  flag4: string
  bgColor: string
  textColor: string
  flagColor: string
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function SceneRedFlagComponent({ config, progress, frame, fps }: MotionGraphicProps<SceneRedFlagConfig>) {
  const { flag1, flag2, flag3, flag4, bgColor, textColor, flagColor } = config

  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const flags = [flag1, flag2, flag3, flag4].filter(f => f.trim() !== '')

  // Header enters first
  const headerEnter = enterProgress < 0.3
    ? easeOutBack(enterProgress / 0.3)
    : 1
  const headerOpacity = enterProgress < 0.3
    ? enterProgress / 0.3
    : exitProgress > 0 ? 1 - easeOutCubic(exitProgress) : 1
  const headerScale = 0.5 + headerEnter * 0.5

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor }}>
      {/* Header */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          left: '50%',
          transform: `translate(-50%, 0) scale(${headerScale})`,
          opacity: headerOpacity,
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          fontSize: 'clamp(24px, 6vw, 56px)',
          fontWeight: 900,
          color: flagColor,
          textAlign: 'center',
          whiteSpace: 'nowrap',
          textShadow: `0 2px 10px ${flagColor}40`,
        }}
      >
        &#x1F6A9; RED FLAG &#x1F6A9;
      </div>

      {/* Flag items that "plant" one by one */}
      <div
        style={{
          position: 'absolute',
          top: '22%',
          left: '8%',
          right: '8%',
          bottom: '8%',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(6px, 1.5vw, 16px)',
          justifyContent: 'flex-start',
        }}
      >
        {flags.map((flagText, i) => {
          // Each flag plants with staggered timing
          const flagDelay = 0.25 + i * 0.15
          const flagEnterRaw = enterProgress < 1
            ? Math.max(0, Math.min(1, (enterProgress - flagDelay) / 0.2))
            : 1
          const flagEnter = easeOutBack(flagEnterRaw)
          const flagOpacity = flagEnterRaw * (exitProgress > 0 ? 1 - easeOutCubic(exitProgress) : 1)

          // Impact shake on plant
          const shakeAmount = flagEnterRaw > 0.7 && flagEnterRaw < 0.95
            ? Math.sin((flagEnterRaw - 0.7) / 0.25 * Math.PI * 6) * 3 * (1 - (flagEnterRaw - 0.7) / 0.25)
            : 0

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(6px, 2vw, 16px)',
                padding: 'clamp(8px, 2vw, 16px) clamp(10px, 2.5vw, 20px)',
                background: `${flagColor}15`,
                borderLeft: `4px solid ${flagColor}`,
                borderRadius: '0 8px 8px 0',
                opacity: flagOpacity,
                transform: `translateX(${shakeAmount}px) scale(${0.6 + flagEnter * 0.4})`,
                transformOrigin: 'left center',
              }}
            >
              <span style={{ fontSize: 'clamp(16px, 4vw, 32px)', flexShrink: 0 }}>
                &#x1F6A9;
              </span>
              <span
                style={{
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  fontSize: 'clamp(13px, 3vw, 26px)',
                  fontWeight: 600,
                  color: textColor,
                  lineHeight: 1.3,
                }}
              >
                {flagText}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-red-flag',
  title: 'Red Flag',
  description: 'Red flag meme format with flags planting one by one with impact, viral dating/social humor',
  tags: ['scene', 'meme', 'red-flag', 'viral', 'dating', 'social', 'list'],
  category: 'scene-layout',
  component: SceneRedFlagComponent as any,
  defaultConfig: {
    flag1: 'Says "I\'m not like other people"',
    flag2: 'Still uses var in JavaScript',
    flag3: 'Puts milk before cereal',
    flag4: 'Never commits their code',
    bgColor: '#1a0a0a',
    textColor: '#ffffff',
    flagColor: '#FF3333',
  },
  configSchema: [
    { key: 'flag1', label: 'Flag 1', type: 'text', defaultValue: 'Says "I\'m not like other people"', group: 'Content' },
    { key: 'flag2', label: 'Flag 2', type: 'text', defaultValue: 'Still uses var in JavaScript', group: 'Content' },
    { key: 'flag3', label: 'Flag 3', type: 'text', defaultValue: 'Puts milk before cereal', group: 'Content' },
    { key: 'flag4', label: 'Flag 4', type: 'text', defaultValue: 'Never commits their code', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0a0a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'flagColor', label: 'Flag Color', type: 'color', defaultValue: '#FF3333', group: 'Style' },
  ],
})
