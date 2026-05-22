import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CountdownToTripConfig {
  daysLeft: number
  destination: string
  emoji: string
  bgColor: string
  textColor: string
  accentColor: string
  numberColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneCountdownToTripComponent({ config, progress }: MotionGraphicProps<CountdownToTripConfig>) {
  const { daysLeft, destination, emoji, bgColor, textColor, accentColor, numberColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Number drops with bounce
  const numberEnter = elasticOut(Math.max(0, Math.min(1, enterProgress / 0.4)))
  const numberY = (1 - numberEnter) * -80
  const numberScale = numberEnter

  // "Days Until..." text slides
  const labelEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.3)))

  // Destination slides up
  const destEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.3)))

  // Emoji pops
  const emojiEnter = elasticOut(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.35)))

  // Hold: number pulses with excitement
  const pulse = progress >= 0.2 && progress < 0.8
    ? 1 + Math.sin(holdProgress * Math.PI * 6) * 0.04
    : 1

  // Hold: emoji bounces
  const emojiBounce = progress >= 0.2 && progress < 0.8
    ? Math.sin(holdProgress * Math.PI * 4) * 6
    : 0

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      {/* Radial excitement glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 45%, ${accentColor}18, transparent 65%)`,
          opacity: enterProgress,
        }}
      />

      {/* Sparkle particles */}
      {[...Array(6)].map((_, i) => {
        const angle = (i / 6) * Math.PI * 2 + holdProgress * Math.PI
        const radius = 30 + i * 5
        const x = 50 + Math.cos(angle) * radius
        const y = 40 + Math.sin(angle) * radius
        const sparkleOpacity = progress >= 0.2 && progress < 0.8
          ? 0.3 + Math.sin(holdProgress * Math.PI * 8 + i) * 0.3
          : 0
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: 'clamp(3px, 0.6vw, 5px)',
              height: 'clamp(3px, 0.6vw, 5px)',
              borderRadius: '50%',
              background: accentColor,
              opacity: sparkleOpacity,
              boxShadow: `0 0 6px ${accentColor}`,
            }}
          />
        )
      })}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8%',
          gap: 'clamp(4px, 1vh, 10px)',
          opacity: exitOpacity,
          transform: `scale(${1 - exitEased * 0.15})`,
        }}
      >
        {/* Emoji */}
        <div
          style={{
            fontSize: 'clamp(30px, 7vw, 56px)',
            opacity: emojiEnter,
            transform: `scale(${emojiEnter}) translateY(${emojiBounce}px)`,
          }}
        >
          {emoji}
        </div>

        {/* Big number */}
        <div
          style={{
            fontSize: 'clamp(64px, 18vw, 140px)',
            fontWeight: 900,
            color: numberColor,
            lineHeight: 1,
            transform: `translateY(${numberY}px) scale(${numberScale * pulse})`,
            opacity: numberEnter,
            textShadow: `0 4px 30px ${numberColor}30`,
            letterSpacing: '-0.03em',
          }}
        >
          {daysLeft}
        </div>

        {/* "Days Until..." */}
        <div
          style={{
            fontSize: 'clamp(14px, 2.5vw, 22px)',
            fontWeight: 600,
            color: `${textColor}90`,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            opacity: labelEnter,
            transform: `translateY(${(1 - labelEnter) * 15}px)`,
          }}
        >
          DAYS UNTIL
        </div>

        {/* Destination */}
        <div
          style={{
            fontSize: 'clamp(24px, 5.5vw, 44px)',
            fontWeight: 800,
            color: accentColor,
            textAlign: 'center',
            lineHeight: 1.2,
            opacity: destEnter,
            transform: `translateY(${(1 - destEnter) * 20}px)`,
          }}
        >
          {destination}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-countdown-to-trip',
  title: 'Countdown to Trip',
  description: 'Trip countdown with bouncing number, pulsing hold animation, and excited sparkle energy',
  tags: ['scene', 'travel', 'countdown', 'trip', 'adventure', 'excitement'],
  category: 'scene-layout',
  component: SceneCountdownToTripComponent as any,
  defaultConfig: {
    daysLeft: 14,
    destination: 'Bali, Indonesia',
    emoji: '🏖️',
    bgColor: '#0f0f1a',
    textColor: '#e8e4f0',
    accentColor: '#f472b6',
    numberColor: '#fbbf24',
  },
  configSchema: [
    { key: 'daysLeft', label: 'Days Left', type: 'number', defaultValue: 14, min: 0, max: 999, group: 'Content' },
    { key: 'destination', label: 'Destination', type: 'text', defaultValue: 'Bali, Indonesia', group: 'Content' },
    { key: 'emoji', label: 'Emoji', type: 'text', defaultValue: '🏖️', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0f1a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e8e4f0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#f472b6', group: 'Style' },
    { key: 'numberColor', label: 'Number Color', type: 'color', defaultValue: '#fbbf24', group: 'Style' },
  ],
})
