import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SaveTheDateConfig {
  heading: string
  date: string
  name1: string
  name2: string
  city: string
  bgColor: string
  textColor: string
  accentColor: string
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

// Deterministic pseudo-random for floral dots
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function SceneSaveTheDateComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<SaveTheDateConfig>) {
  const { heading, date, name1, name2, city, bgColor, textColor, accentColor } = config
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

  // "SAVE THE DATE" heading fades in
  const headingOpacity = enterProgress < 1
    ? easeOutCubic(Math.min(1, enterProgress / 0.3))
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1
  const headingY = enterProgress < 1
    ? -20 * (1 - easeOutCubic(Math.min(1, enterProgress / 0.3)))
    : exitProgress > 0
      ? -20 * easeInCubic(exitProgress)
      : 0

  // Date flips in (scale Y)
  const dateFlipRaw = Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.4))
  const dateFlip = easeOutBack(dateFlipRaw)
  const dateScaleY = enterProgress < 1
    ? dateFlip
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1
  const dateOpacity = enterProgress < 1
    ? easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.3)))
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Names fade elegantly
  const namesOpacity = enterProgress < 1
    ? easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.45) / 0.35)))
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1
  const namesY = enterProgress < 1
    ? 15 * (1 - easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.45) / 0.35))))
    : exitProgress > 0
      ? 15 * easeInCubic(exitProgress)
      : 0

  // City fades in
  const cityOpacity = enterProgress < 1
    ? easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.65) / 0.3)))
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Floral-inspired border dots
  const dots = Array.from({ length: 40 }).map((_, i) => {
    const seed = i * 7 + 3
    const side = i % 4 // 0=top, 1=right, 2=bottom, 3=left
    let x: number, y: number
    const offset = seededRandom(seed) * 90 + 5
    const size = 3 + seededRandom(seed + 1) * 5
    const delay = seededRandom(seed + 2) * 0.5

    if (side === 0) { x = offset; y = 2 + seededRandom(seed + 3) * 6 }
    else if (side === 1) { x = 94 + seededRandom(seed + 3) * 4; y = offset }
    else if (side === 2) { x = offset; y = 92 + seededRandom(seed + 3) * 6 }
    else { x = 1 + seededRandom(seed + 3) * 4; y = offset }

    const dotOpacity = enterProgress < 1
      ? easeOutCubic(Math.max(0, Math.min(1, (enterProgress - delay) / 0.4)))
      : exitProgress > 0
        ? 1 - easeInCubic(exitProgress)
        : 1

    return { x, y, size, opacity: dotOpacity * (0.3 + seededRandom(seed + 4) * 0.4) }
  })

  // Subtle hold breathing
  const breathe = 1 + Math.sin(holdProgress * Math.PI * 3) * 0.008

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Georgia', 'Times New Roman', serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10%',
        transform: `scale(${breathe})`,
      }}
    >
      {/* Floral border dots */}
      {dots.map((dot, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: dot.size,
            height: dot.size,
            borderRadius: '50%',
            background: accentColor,
            opacity: dot.opacity,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Heading */}
      <div
        style={{
          fontSize: 'clamp(10px, 2vw, 14px)',
          fontWeight: 400,
          color: accentColor,
          opacity: headingOpacity,
          transform: `translateY(${headingY}px)`,
          letterSpacing: '0.35em',
          textTransform: 'uppercase',
          marginBottom: 'clamp(12px, 2.5vh, 24px)',
        }}
      >
        {heading}
      </div>

      {/* Date - large, flips in */}
      <div
        style={{
          fontSize: 'clamp(36px, 9vw, 80px)',
          fontWeight: 300,
          color: textColor,
          opacity: dateOpacity,
          transform: `scaleY(${dateScaleY})`,
          letterSpacing: '0.05em',
          lineHeight: 1,
          marginBottom: 'clamp(16px, 3vh, 32px)',
        }}
      >
        {date}
      </div>

      {/* Decorative line */}
      <div
        style={{
          width: 'clamp(40px, 10vw, 80px)',
          height: 1,
          background: accentColor,
          opacity: namesOpacity * 0.5,
          marginBottom: 'clamp(16px, 3vh, 32px)',
        }}
      />

      {/* Names */}
      <div
        style={{
          fontSize: 'clamp(18px, 4vw, 36px)',
          fontWeight: 400,
          fontStyle: 'italic',
          color: textColor,
          opacity: namesOpacity,
          transform: `translateY(${namesY}px)`,
          textAlign: 'center',
          lineHeight: 1.4,
          marginBottom: 'clamp(8px, 1.5vh, 16px)',
        }}
      >
        {name1} &amp; {name2}
      </div>

      {/* City */}
      <div
        style={{
          fontSize: 'clamp(11px, 2.2vw, 16px)',
          fontWeight: 400,
          color: `${textColor}99`,
          opacity: cityOpacity,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}
      >
        {city}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-save-the-date',
  title: 'Save The Date',
  description:
    'Save the date with large flipping date, elegant names, floral-inspired border dots, and soft pastel palette',
  tags: ['scene', 'wedding', 'save-the-date', 'romantic', 'elegant', 'event'],
  category: 'scene-layout',
  component: SceneSaveTheDateComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'heading', label: 'Heading', type: 'text', defaultValue: 'Save The Date', group: 'Content' },
    { key: 'date', label: 'Date', type: 'text', defaultValue: 'June 15', group: 'Content' },
    { key: 'name1', label: 'First Name', type: 'text', defaultValue: 'Emma', group: 'Content' },
    { key: 'name2', label: 'Second Name', type: 'text', defaultValue: 'James', group: 'Content' },
    { key: 'city', label: 'City', type: 'text', defaultValue: 'Paris, France', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF5F5', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#3D2B2B', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#D4A0A0', group: 'Style' },
  ],
  defaultConfig: {
    heading: 'Save The Date',
    date: 'June 15',
    name1: 'Emma',
    name2: 'James',
    city: 'Paris, France',
    bgColor: '#FFF5F5',
    textColor: '#3D2B2B',
    accentColor: '#D4A0A0',
  },
})
