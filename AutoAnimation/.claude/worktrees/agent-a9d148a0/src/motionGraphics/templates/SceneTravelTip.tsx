import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TravelTipConfig {
  tipText: string
  context: string
  bgColor: string
  textColor: string
  accentColor: string
  badgeColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneTravelTipComponent({ config, progress }: MotionGraphicProps<TravelTipConfig>) {
  const { tipText, context, bgColor, textColor, accentColor, badgeColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Badge pops in
  const badgeEnter = elasticOut(Math.max(0, Math.min(1, enterProgress / 0.35)))

  // Tip text reveals line by line
  const tipEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.25) / 0.4)))

  // Context fades in
  const contextEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.3)))

  // Decorative line grows
  const lineEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.3)))

  // Hold: lightbulb glow pulse
  const glowPulse = progress >= 0.25 && progress < 0.8
    ? 0.6 + Math.sin(holdProgress * Math.PI * 5) * 0.3
    : 0

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      {/* Accent glow top-left */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '60%',
          height: '60%',
          background: `radial-gradient(circle, ${accentColor}10, transparent 70%)`,
          opacity: enterProgress,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '8% 10%',
          gap: 'clamp(12px, 2.5vh, 24px)',
          opacity: exitOpacity,
          transform: `translateY(${exitEased * 25}px)`,
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1.2vw, 12px)',
            opacity: badgeEnter,
            transform: `scale(${badgeEnter})`,
            transformOrigin: 'left center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(4px, 0.8vw, 8px)',
              background: `${badgeColor}20`,
              border: `2px solid ${badgeColor}40`,
              padding: 'clamp(5px, 1vh, 10px) clamp(12px, 2vw, 20px)',
              borderRadius: 'clamp(6px, 1vw, 10px)',
            }}
          >
            <span
              style={{
                fontSize: 'clamp(16px, 3vw, 24px)',
                filter: `drop-shadow(0 0 ${glowPulse * 8}px ${badgeColor})`,
              }}
            >
              💡
            </span>
            <div
              style={{
                fontSize: 'clamp(11px, 1.8vw, 15px)',
                fontWeight: 800,
                color: badgeColor,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              TRAVEL TIP
            </div>
          </div>
        </div>

        {/* Decorative left line */}
        <div
          style={{
            position: 'absolute',
            left: 'clamp(24px, 5vw, 40px)',
            top: '50%',
            transform: `translateY(-50%) scaleY(${lineEnter})`,
            width: 3,
            height: 'clamp(40px, 10vh, 80px)',
            background: `linear-gradient(to bottom, ${accentColor}, transparent)`,
            borderRadius: 2,
          }}
        />

        {/* Tip text */}
        <div
          style={{
            fontSize: 'clamp(18px, 3.5vw, 30px)',
            fontWeight: 600,
            color: textColor,
            lineHeight: 1.5,
            opacity: tipEnter,
            transform: `translateX(${(1 - tipEnter) * 20}px)`,
            maxWidth: '90%',
          }}
        >
          {tipText}
        </div>

        {/* Context / destination */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1vw, 10px)',
            opacity: contextEnter,
            transform: `translateY(${(1 - contextEnter) * 10}px)`,
          }}
        >
          <div
            style={{
              width: 'clamp(20px, 4vw, 32px)',
              height: 2,
              background: accentColor,
              borderRadius: 2,
            }}
          />
          <div
            style={{
              fontSize: 'clamp(12px, 2vw, 17px)',
              fontWeight: 500,
              color: `${textColor}70`,
              fontStyle: 'italic',
            }}
          >
            {context}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-travel-tip',
  title: 'Travel Tip',
  description: 'Travel pro tip with popping badge, revealing text, and informative blue-accent layout',
  tags: ['scene', 'travel', 'tip', 'advice', 'helpful', 'adventure'],
  category: 'scene-layout',
  component: SceneTravelTipComponent as any,
  defaultConfig: {
    tipText: 'Always carry a photocopy of your passport separately from the original — it saves you if it gets lost or stolen.',
    context: 'International Travel',
    bgColor: '#0c1220',
    textColor: '#e8ecf4',
    accentColor: '#3b82f6',
    badgeColor: '#3b82f6',
  },
  configSchema: [
    { key: 'tipText', label: 'Tip Text', type: 'text', defaultValue: 'Always carry a photocopy of your passport separately from the original — it saves you if it gets lost or stolen.', group: 'Content' },
    { key: 'context', label: 'Context / Destination', type: 'text', defaultValue: 'International Travel', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c1220', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e8ecf4', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#3b82f6', group: 'Style' },
    { key: 'badgeColor', label: 'Badge Color', type: 'color', defaultValue: '#3b82f6', group: 'Style' },
  ],
})
