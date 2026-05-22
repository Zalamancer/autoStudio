import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneCreepyCountdownConfig {
  countFrom: number
  title: string
  subtitle: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function SceneCreepyCountdownComponent({ config, progress, frame }: MotionGraphicProps<SceneCreepyCountdownConfig>) {
  const { countFrom, title, subtitle, bgColor, textColor, accentColor } = config
  const f = frame ?? 0

  const enterProgress = progress < 0.15 ? progress / 0.15 : 1
  const holdProgress = progress >= 0.15 && progress < 0.85 ? (progress - 0.15) / 0.7 : progress >= 0.85 ? 1 : 0
  const exitProgress = progress >= 0.85 ? (progress - 0.85) / 0.15 : 0

  // Current countdown number
  const currentNumber = Math.max(1, Math.ceil(countFrom * (1 - holdProgress)))
  const numberProgress = (holdProgress * countFrom) % 1

  // Flicker effect
  const flickerSeed = f * 7 + currentNumber * 31
  const flickerValue = rand(Math.floor(flickerSeed / 4))
  const isFlicker = flickerValue > 0.88

  // Screen shake on number change
  const shakeX = numberProgress < 0.15 ? (rand(f * 3) - 0.5) * 6 : 0
  const shakeY = numberProgress < 0.15 ? (rand(f * 5) - 0.5) * 4 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Blood drip lines
  const drips = Array.from({ length: 6 }, (_, i) => {
    const dripX = 10 + i * 16 + rand(i * 41) * 8
    const dripLen = 20 + rand(i * 29) * 40
    const dripDelay = rand(i * 17) * 0.5
    const dripProgress = Math.max(0, Math.min(1, (holdProgress - dripDelay) / 0.5))

    return (
      <div
        key={`drip-${i}`}
        style={{
          position: 'absolute',
          left: `${dripX}%`,
          top: 0,
          width: 2,
          height: `${dripLen * dripProgress}%`,
          background: `linear-gradient(to bottom, ${accentColor}44, ${accentColor}11)`,
        }}
      />
    )
  })

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse, transparent 20%, rgba(0,0,0,0.7) 100%)' }} />
      {/* Blood drips */}
      {drips}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: exitOpacity,
          transform: `translate(${shakeX}px, ${shakeY}px)`,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: 'clamp(12px, 3vw, 22px)',
            fontWeight: 600,
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
            marginBottom: 'clamp(10px, 3vw, 24px)',
            opacity: easeOutCubic(enterProgress),
            transform: `translateY(${(1 - easeOutCubic(enterProgress)) * 20}px)`,
          }}
        >
          {title}
        </div>

        {/* Countdown number */}
        <div
          style={{
            fontFamily: "Impact, 'Arial Black', sans-serif",
            fontSize: 'clamp(80px, 25vw, 220px)',
            fontWeight: 900,
            color: isFlicker ? 'transparent' : textColor,
            textShadow: isFlicker
              ? 'none'
              : `0 0 30px ${accentColor}66, 0 0 60px ${accentColor}33, 0 4px 8px rgba(0,0,0,0.9)`,
            lineHeight: 1,
            opacity: easeOutCubic(enterProgress),
            transform: `scale(${numberProgress < 0.1 ? 1.1 - numberProgress : 1})`,
          }}
        >
          {currentNumber}
        </div>

        {/* Creepy divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            margin: 'clamp(10px, 3vw, 24px) 0',
            opacity: easeOutCubic(enterProgress) * 0.6,
          }}
        >
          <div style={{ width: 'clamp(30px, 8vw, 60px)', height: 1, background: accentColor }} />
          <div style={{ fontSize: 10, color: accentColor }}>&#x2620;</div>
          <div style={{ width: 'clamp(30px, 8vw, 60px)', height: 1, background: accentColor }} />
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: 'clamp(10px, 2.5vw, 18px)',
            color: `${textColor}88`,
            textAlign: 'center',
            maxWidth: '70%',
            opacity: easeOutCubic(Math.max(0, enterProgress - 0.3) / 0.7),
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-creepy-countdown',
  title: 'Creepy Countdown',
  description: 'Horror countdown with flickering numbers, blood drips, screen shake, and dark vignette',
  tags: ['scene', 'horror', 'countdown', 'creepy', 'dark', 'blood', 'timer'],
  category: 'scene-layout',
  component: SceneCreepyCountdownComponent as any,
  defaultConfig: {
    countFrom: 10,
    title: 'Your Time Is Up',
    subtitle: 'There is no escape from what comes next...',
    bgColor: '#0a0000',
    textColor: '#e8e0e0',
    accentColor: '#8B0000',
  },
  configSchema: [
    { key: 'countFrom', label: 'Count From', type: 'number', defaultValue: 10, min: 3, max: 30, group: 'Content' },
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Your Time Is Up', group: 'Content' },
    { key: 'subtitle', label: 'Subtitle', type: 'text', defaultValue: 'There is no escape from what comes next...', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0000', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e8e0e0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#8B0000', group: 'Style' },
  ],
})
