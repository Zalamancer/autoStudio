import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ProConListConfig {
  pros: string[]
  cons: string[]
  proColor: string
  conColor: string
  bgColor: string
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

function SceneProConListComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<ProConListConfig>) {
  const { pros, cons, proColor, conColor, bgColor, textColor } = config
  const progress = frame / durationInFrames

  // Columns slide in from their sides (0-0.2)
  const colProgress = easeOutCubic(Math.min(1, progress / 0.2))
  const proSlideX = (1 - colProgress) * -100
  const conSlideX = (1 - colProgress) * 100

  // Items stagger in (0.15-0.6)
  const maxItems = Math.max(pros.length, cons.length)
  const getItemProgress = (index: number): number => {
    const start = 0.15 + index * (0.4 / Math.max(maxItems, 1))
    const end = start + 0.12
    return easeOutBack(Math.max(0, Math.min(1, (progress - start) / (end - start))))
  }

  // Hold: alternating glow between sides (0.55-0.8)
  const holdProgress = progress >= 0.55 && progress < 0.8 ? (progress - 0.55) / 0.25 : 0
  const glowSide = holdProgress > 0 ? Math.sin(holdProgress * Math.PI * 3) : 0
  const proGlow = Math.max(0, glowSide) * 0.3
  const conGlow = Math.max(0, -glowSide) * 0.3

  // Exit: columns slide back out (0.82-1.0)
  const exitProgress = progress >= 0.82 ? easeOutCubic((progress - 0.82) / 0.18) : 0
  const exitProX = exitProgress * -100
  const exitConX = exitProgress * 100
  const exitOpacity = 1 - exitProgress

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        display: 'flex',
        opacity: exitOpacity,
      }}
    >
      {/* PROS column */}
      <div
        style={{
          flex: 1,
          padding: '5% 4%',
          display: 'flex',
          flexDirection: 'column',
          transform: `translateX(${proSlideX + exitProX}%)`,
          background: `${proColor}08`,
        }}
      >
        {/* PROS header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1.5vw, 12px)',
            marginBottom: '6%',
            paddingBottom: '4%',
            borderBottom: `2px solid ${proColor}30`,
            opacity: colProgress,
          }}
        >
          <div
            style={{
              width: 'clamp(28px, 5vw, 40px)',
              height: 'clamp(28px, 5vw, 40px)',
              borderRadius: '50%',
              background: `${proColor}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(14px, 2.5vw, 22px)',
              color: proColor,
              fontWeight: 700,
            }}
          >
            {'\u2713'}
          </div>
          <div
            style={{
              fontSize: 'clamp(18px, 3.5vw, 32px)',
              fontWeight: 800,
              color: proColor,
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            Pros
          </div>
        </div>

        {/* Pro items */}
        {pros.map((item, i) => {
          const itemProg = getItemProgress(i)
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'clamp(8px, 1.5vw, 14px)',
                marginBottom: 'clamp(8px, 2vw, 16px)',
                padding: 'clamp(8px, 2vw, 14px) clamp(10px, 2vw, 16px)',
                background: `${proColor}${Math.round(0.06 * 255 + proGlow * 255).toString(16).padStart(2, '0')}`,
                borderRadius: 8,
                borderLeft: `3px solid ${proColor}`,
                opacity: itemProg,
                transform: `translateY(${(1 - itemProg) * 15}px)`,
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(14px, 2.2vw, 20px)',
                  color: proColor,
                  fontWeight: 700,
                  flexShrink: 0,
                  lineHeight: 1.4,
                }}
              >
                {'\u2713'}
              </span>
              <span
                style={{
                  fontSize: 'clamp(13px, 2.2vw, 20px)',
                  color: textColor,
                  fontWeight: 500,
                  lineHeight: 1.4,
                }}
              >
                {item}
              </span>
            </div>
          )
        })}
      </div>

      {/* Center divider */}
      <div
        style={{
          width: 2,
          background: `linear-gradient(180deg, transparent, ${textColor}20, transparent)`,
          opacity: colProgress,
        }}
      />

      {/* CONS column */}
      <div
        style={{
          flex: 1,
          padding: '5% 4%',
          display: 'flex',
          flexDirection: 'column',
          transform: `translateX(${conSlideX + exitConX}%)`,
          background: `${conColor}08`,
        }}
      >
        {/* CONS header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1.5vw, 12px)',
            marginBottom: '6%',
            paddingBottom: '4%',
            borderBottom: `2px solid ${conColor}30`,
            opacity: colProgress,
          }}
        >
          <div
            style={{
              width: 'clamp(28px, 5vw, 40px)',
              height: 'clamp(28px, 5vw, 40px)',
              borderRadius: '50%',
              background: `${conColor}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(14px, 2.5vw, 22px)',
              color: conColor,
              fontWeight: 700,
            }}
          >
            {'\u2717'}
          </div>
          <div
            style={{
              fontSize: 'clamp(18px, 3.5vw, 32px)',
              fontWeight: 800,
              color: conColor,
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            Cons
          </div>
        </div>

        {/* Con items */}
        {cons.map((item, i) => {
          const itemProg = getItemProgress(i)
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'clamp(8px, 1.5vw, 14px)',
                marginBottom: 'clamp(8px, 2vw, 16px)',
                padding: 'clamp(8px, 2vw, 14px) clamp(10px, 2vw, 16px)',
                background: `${conColor}${Math.round(0.06 * 255 + conGlow * 255).toString(16).padStart(2, '0')}`,
                borderRadius: 8,
                borderLeft: `3px solid ${conColor}`,
                opacity: itemProg,
                transform: `translateY(${(1 - itemProg) * 15}px)`,
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(14px, 2.2vw, 20px)',
                  color: conColor,
                  fontWeight: 700,
                  flexShrink: 0,
                  lineHeight: 1.4,
                }}
              >
                {'\u2717'}
              </span>
              <span
                style={{
                  fontSize: 'clamp(13px, 2.2vw, 20px)',
                  color: textColor,
                  fontWeight: 500,
                  lineHeight: 1.4,
                }}
              >
                {item}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-pro-con-list',
  title: 'Pros vs Cons',
  description:
    'Two-column pros and cons layout with checkmarks and X marks, staggered reveals, and alternating glow',
  tags: ['scene', 'educational', 'pros-cons', 'comparison', 'list'],
  category: 'scene-layout',
  component: SceneProConListComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'pros', label: 'Pros', type: 'text-array', defaultValue: ['Easy to use', 'Great support', 'Affordable pricing', 'Fast performance'], group: 'Content' },
    { key: 'cons', label: 'Cons', type: 'text-array', defaultValue: ['Limited features', 'No mobile app', 'Steep learning curve', 'No free tier'], group: 'Content' },
    { key: 'proColor', label: 'Pro Color', type: 'color', defaultValue: '#27AE60', group: 'Style' },
    { key: 'conColor', label: 'Con Color', type: 'color', defaultValue: '#E74C3C', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F0F1A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8E8E8', group: 'Style' },
  ],
  defaultConfig: {
    pros: ['Easy to use', 'Great support', 'Affordable pricing', 'Fast performance'],
    cons: ['Limited features', 'No mobile app', 'Steep learning curve', 'No free tier'],
    proColor: '#27AE60',
    conColor: '#E74C3C',
    bgColor: '#0F0F1A',
    textColor: '#E8E8E8',
  },
})
