import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SocialProofConfig {
  stats: string[]
  bgColor: string
  textColor: string
  accentColor: string
}

function SceneSocialProofComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<SocialProofConfig>) {
  const { stats, bgColor, textColor, accentColor } = config
  const progress = frame / durationInFrames

  const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)
  const easeOutBack = (t: number): number => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  }

  const parsedStats = stats.map((s) => {
    const parts = s.split('|')
    return {
      icon: parts[0] || '\u2764\uFE0F',
      value: parts[1] || '0',
      label: parts[2] || 'Label',
    }
  })

  // Parse numeric value for counting animation
  const parseValue = (val: string): { prefix: string; number: number; suffix: string } => {
    const match = val.match(/^([^\d]*)([\d.]+)(.*)$/)
    if (!match) return { prefix: '', number: 0, suffix: val }
    return {
      prefix: match[1],
      number: parseFloat(match[2]),
      suffix: match[3],
    }
  }

  // Stagger entrance for each stat
  const getStatProgress = (index: number): number => {
    const staggerDelay = 0.12
    const statStart = 0.1 + index * staggerDelay
    const statDur = 0.25
    return Math.max(0, Math.min(1, (progress - statStart) / statDur))
  }

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
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: '5%',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 'clamp(20px, 5vw, 60px)',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        {parsedStats.map((stat, i) => {
          const sp = getStatProgress(i)
          const iconScale = easeOutBack(Math.min(1, sp * 2))
          const valueProgress = easeOutCubic(Math.max(0, Math.min(1, (sp - 0.2) / 0.6)))
          const labelOpacity = easeOutCubic(Math.max(0, Math.min(1, (sp - 0.5) / 0.5)))

          const parsed = parseValue(stat.value)
          const countedNum = parsed.number % 1 === 0
            ? Math.round(valueProgress * parsed.number)
            : (valueProgress * parsed.number).toFixed(1)

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                minWidth: 'clamp(80px, 15vw, 140px)',
                opacity: sp > 0 ? 1 : 0,
                transform: `translateY(${(1 - easeOutCubic(Math.min(1, sp * 1.5))) * 30}px)`,
              }}
            >
              {/* Icon */}
              <div
                style={{
                  fontSize: 'clamp(28px, 5vw, 48px)',
                  transform: `scale(${iconScale})`,
                  lineHeight: 1,
                }}
              >
                {stat.icon}
              </div>

              {/* Value */}
              <div
                style={{
                  fontSize: 'clamp(24px, 5vw, 48px)',
                  fontWeight: 900,
                  color: accentColor,
                  lineHeight: 1,
                  opacity: valueProgress,
                }}
              >
                {parsed.prefix}
                {countedNum}
                {parsed.suffix}
              </div>

              {/* Label */}
              <div
                style={{
                  fontSize: 'clamp(11px, 2vw, 16px)',
                  fontWeight: 600,
                  color: textColor,
                  opacity: labelOpacity,
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                }}
              >
                {stat.label}
              </div>

              {/* Divider line */}
              <div
                style={{
                  width: '60%',
                  height: 2,
                  background: `${accentColor}30`,
                  borderRadius: 1,
                  transform: `scaleX(${easeOutCubic(Math.min(1, sp * 2))})`,
                }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-social-proof',
  title: 'Scene Social Proof',
  description:
    'Social proof stats display with icon pop-in, counting numbers, and staggered entrance animations',
  tags: ['scene', 'social', 'stats', 'metrics', 'proof'],
  category: 'scene-layout',
  component: SceneSocialProofComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    {
      key: 'stats',
      label: 'Stats (icon|value|label)',
      type: 'text-array',
      defaultValue: ['\u2764\uFE0F|2.5M|Likes', '\uD83D\uDC41\uFE0F|10M|Views', '\uD83D\uDCAC|500K|Comments', '\u2B50|4.9|Rating'],
      group: 'Content',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D0D1A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFFCC', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#F43F5E', group: 'Style' },
  ],
  defaultConfig: {
    stats: ['\u2764\uFE0F|2.5M|Likes', '\uD83D\uDC41\uFE0F|10M|Views', '\uD83D\uDCAC|500K|Comments', '\u2B50|4.9|Rating'],
    bgColor: '#0D0D1A',
    textColor: '#FFFFFFCC',
    accentColor: '#F43F5E',
  },
})
