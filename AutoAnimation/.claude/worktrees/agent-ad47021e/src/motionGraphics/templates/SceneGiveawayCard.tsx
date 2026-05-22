import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GiveawayCardConfig {
  prize: string
  rules: string[]
  endDate: string
  bgColor: string
  accentColor: string
  cardColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function SceneGiveawayCardComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<GiveawayCardConfig>) {
  const { prize, rules, endDate, bgColor, accentColor, cardColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.25
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Card scales in
  const cardScale = easeOutBack(Math.min(1, enterProgress / 0.4))

  // Gift icon bounces
  const giftBounce = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.3)))

  // Prize text reveals
  const prizeReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.3)))

  // Rules appear one by one
  const getRuleProgress = (idx: number): number => {
    const delay = 0.45 + idx * 0.1
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - delay) / 0.25)))
  }

  // End date reveals
  const dateReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.8) / 0.2)))

  // Hold: shimmer effect
  const shimmerX = holdProgress * 200 - 50

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitY = exitEased * 60

  // Floating gift particles
  const particles = Array.from({ length: 8 }).map((_, i) => {
    const x = seededRand(i * 37 + 5) * 100
    const speed = 0.3 + seededRand(i * 53) * 0.7
    const baseY = ((frame * speed + seededRand(i * 67) * 200) % 120) - 10
    const emoji = ['🎁', '✨', '🎉', '💫'][i % 4]
    return { x, y: baseY, emoji, opacity: 0.3 + seededRand(i * 19) * 0.3, size: 12 + seededRand(i * 29) * 8 }
  })

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: '5%',
      }}
    >
      {/* Background particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: p.size,
            opacity: p.opacity * exitOpacity,
          }}
        >
          {p.emoji}
        </div>
      ))}

      {/* Card */}
      <div
        style={{
          position: 'relative',
          background: cardColor,
          borderRadius: 'clamp(16px, 2.5vw, 24px)',
          padding: 'clamp(20px, 4%, 36px)',
          maxWidth: 400,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(12px, 2vh, 20px)',
          transform: `scale(${cardScale}) translateY(${exitY}px)`,
          opacity: exitOpacity,
          border: `2px solid ${accentColor}30`,
          boxShadow: `0 20px 60px rgba(0,0,0,0.3), 0 0 40px ${accentColor}10`,
          overflow: 'hidden',
        }}
      >
        {/* Shimmer overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(105deg, transparent ${shimmerX - 30}%, ${accentColor}10 ${shimmerX}%, transparent ${shimmerX + 30}%)`,
            pointerEvents: 'none',
          }}
        />

        {/* GIVEAWAY badge */}
        <div
          style={{
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
            borderRadius: 20,
            padding: 'clamp(4px, 0.8vh, 8px) clamp(14px, 2.5vw, 22px)',
            fontSize: 'clamp(10px, 1.6vw, 13px)',
            fontWeight: 900,
            color: '#FFFFFF',
            letterSpacing: 3,
            transform: `scale(${giftBounce})`,
          }}
        >
          {'🎁'} GIVEAWAY
        </div>

        {/* Prize name */}
        <div
          style={{
            fontSize: 'clamp(20px, 4.5vw, 34px)',
            fontWeight: 900,
            color: textColor,
            textAlign: 'center',
            opacity: prizeReveal,
            transform: `translateY(${(1 - prizeReveal) * 15}px)`,
            lineHeight: 1.2,
          }}
        >
          {prize}
        </div>

        {/* Divider */}
        <div
          style={{
            width: '60%',
            height: 1,
            background: `${textColor}15`,
            opacity: prizeReveal,
          }}
        />

        {/* Rules */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(6px, 1vh, 10px)',
            width: '100%',
          }}
        >
          <div
            style={{
              fontSize: 'clamp(10px, 1.5vw, 12px)',
              fontWeight: 700,
              color: `${textColor}60`,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            HOW TO ENTER
          </div>
          {rules.map((rule, i) => {
            const rp = getRuleProgress(i)
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(8px, 1.5vw, 12px)',
                  opacity: rp,
                  transform: `translateX(${(1 - rp) * 20}px)`,
                }}
              >
                <div
                  style={{
                    width: 'clamp(20px, 3.5vw, 26px)',
                    height: 'clamp(20px, 3.5vw, 26px)',
                    borderRadius: '50%',
                    background: `${accentColor}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'clamp(9px, 1.3vw, 11px)',
                    fontWeight: 800,
                    color: accentColor,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <span
                  style={{
                    fontSize: 'clamp(11px, 1.8vw, 14px)',
                    fontWeight: 600,
                    color: `${textColor}CC`,
                  }}
                >
                  {rule}
                </span>
              </div>
            )
          })}
        </div>

        {/* End date */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            opacity: dateReveal,
            background: `${accentColor}10`,
            borderRadius: 10,
            padding: 'clamp(6px, 1vh, 10px) clamp(12px, 2vw, 18px)',
          }}
        >
          <span style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', fontWeight: 500, color: `${textColor}60` }}>
            Ends
          </span>
          <span style={{ fontSize: 'clamp(11px, 1.8vw, 14px)', fontWeight: 800, color: accentColor }}>
            {endDate}
          </span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-giveaway-card',
  title: 'Scene Giveaway Card',
  description:
    'Social media giveaway card with prize reveal, numbered rules, shimmer effect, floating particles, and end date countdown.',
  tags: ['scene', 'social-media', 'giveaway', 'contest', 'prize', 'creator', 'engagement'],
  category: 'scene-layout',
  component: SceneGiveawayCardComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'prize', label: 'Prize', type: 'text', defaultValue: 'iPhone 15 Pro', group: 'Content' },
    { key: 'rules', label: 'Rules', type: 'text-array', defaultValue: ['Follow this account', 'Like this post', 'Tag 2 friends'], group: 'Content' },
    { key: 'endDate', label: 'End Date', type: 'text', defaultValue: 'March 31st', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#F59E0B', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A14', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
  defaultConfig: {
    prize: 'iPhone 15 Pro',
    rules: ['Follow this account', 'Like this post', 'Tag 2 friends'],
    endDate: 'March 31st',
    accentColor: '#F59E0B',
    cardColor: '#1A1A2E',
    bgColor: '#0A0A14',
    textColor: '#FFFFFF',
  },
})
