import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BirthdayCardConfig {
  heading: string
  name: string
  age: string
  bgColor: string
  textColor: string
  accentColor: string
  secondaryColor: string
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

function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

// Deterministic pseudo-random
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function SceneBirthdayCardComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<BirthdayCardConfig>) {
  const { heading, name, age, bgColor, textColor, accentColor, secondaryColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0
  const holdProgress =
    progress >= enterEnd && progress < holdEnd
      ? (progress - enterEnd) / (holdEnd - enterEnd)
      : progress >= holdEnd
        ? 1
        : 0

  // "HAPPY BIRTHDAY!" bounces in
  const headingBounce = easeOutBack(Math.min(1, enterProgress / 0.4))
  const headingScale = enterProgress < 1
    ? headingBounce
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress) * 0.5
      : 1
  const headingOpacity = enterProgress < 1
    ? easeOutCubic(Math.min(1, enterProgress / 0.3))
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Age number — elastic scale in
  const ageElastic = elasticOut(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.5)))
  const ageScale = enterProgress < 1
    ? ageElastic
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress) * 0.3
      : 1
  const ageOpacity = enterProgress < 1
    ? easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.3)))
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Name fades up
  const nameOpacity = enterProgress < 1
    ? easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.35)))
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1
  const nameY = enterProgress < 1
    ? 20 * (1 - easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.35))))
    : exitProgress > 0
      ? 20 * easeInCubic(exitProgress)
      : 0

  // Confetti particles
  const confettiColors = [accentColor, secondaryColor, '#FFD700', '#FF69B4', '#00CED1']
  const confetti = Array.from({ length: 30 }).map((_, i) => {
    const seed = i * 13 + 7
    const startX = seededRandom(seed) * 100
    const startY = -10 - seededRandom(seed + 1) * 20
    const endY = 100 + seededRandom(seed + 2) * 20
    const rotation = seededRandom(seed + 3) * 720
    const delay = seededRandom(seed + 4) * 0.4
    const size = 4 + seededRandom(seed + 5) * 6
    const color = confettiColors[i % confettiColors.length]
    const isCircle = seededRandom(seed + 6) > 0.5
    const driftX = (seededRandom(seed + 7) - 0.5) * 30

    const fallProgress = Math.max(0, Math.min(1, (enterProgress - delay) / (1 - delay)))
    const currentY = startY + (endY - startY) * easeOutCubic(fallProgress)
    const currentX = startX + driftX * fallProgress
    const currentRotation = rotation * fallProgress
    const opacity = enterProgress < 1
      ? easeOutCubic(Math.max(0, Math.min(1, (enterProgress - delay) / 0.2))) * 0.8
      : exitProgress > 0
        ? 0.8 * (1 - easeInCubic(exitProgress))
        : 0.8

    return { x: currentX, y: currentY, rotation: currentRotation, size, color, isCircle, opacity }
  })

  // Hold: subtle bounce on age
  const holdBounce = 1 + Math.sin(holdProgress * Math.PI * 6) * 0.02

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8%',
      }}
    >
      {/* Confetti */}
      {confetti.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${c.x}%`,
            top: `${c.y}%`,
            width: c.size,
            height: c.isCircle ? c.size : c.size * 0.5,
            background: c.color,
            borderRadius: c.isCircle ? '50%' : '1px',
            transform: `rotate(${c.rotation}deg)`,
            opacity: c.opacity,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Heading */}
      <div
        style={{
          fontSize: 'clamp(18px, 4.5vw, 36px)',
          fontWeight: 900,
          color: accentColor,
          opacity: headingOpacity,
          transform: `scale(${headingScale})`,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 'clamp(12px, 2vh, 24px)',
        }}
      >
        {heading}
      </div>

      {/* Age number — large */}
      <div
        style={{
          fontSize: 'clamp(60px, 18vw, 140px)',
          fontWeight: 900,
          color: textColor,
          opacity: ageOpacity,
          transform: `scale(${ageScale * holdBounce})`,
          lineHeight: 1,
          marginBottom: 'clamp(8px, 1.5vh, 16px)',
          textShadow: `0 4px 20px ${accentColor}30`,
        }}
      >
        {age}
      </div>

      {/* Name */}
      <div
        style={{
          fontSize: 'clamp(16px, 3.5vw, 28px)',
          fontWeight: 600,
          color: `${textColor}DD`,
          opacity: nameOpacity,
          transform: `translateY(${nameY}px)`,
          letterSpacing: '0.04em',
        }}
      >
        {name}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-birthday-card',
  title: 'Birthday Card',
  description:
    'Birthday celebration with bouncing heading, elastic age number, confetti scatter, and fun party energy',
  tags: ['scene', 'birthday', 'party', 'celebration', 'fun', 'event'],
  category: 'scene-layout',
  component: SceneBirthdayCardComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'heading', label: 'Heading', type: 'text', defaultValue: 'Happy Birthday!', group: 'Content' },
    { key: 'name', label: 'Name', type: 'text', defaultValue: 'Sarah', group: 'Content' },
    { key: 'age', label: 'Age', type: 'text', defaultValue: '25', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF8E7', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2D2D2D', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FF6B6B', group: 'Style' },
    { key: 'secondaryColor', label: 'Secondary Color', type: 'color', defaultValue: '#4ECDC4', group: 'Style' },
  ],
  defaultConfig: {
    heading: 'Happy Birthday!',
    name: 'Sarah',
    age: '25',
    bgColor: '#FFF8E7',
    textColor: '#2D2D2D',
    accentColor: '#FF6B6B',
    secondaryColor: '#4ECDC4',
  },
})
