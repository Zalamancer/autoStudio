import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TravelDestinationConfig {
  placeName: string
  country: string
  description: string
  bgColor: string
  accentColor: string
  textColor: string
  stampColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneTravelDestinationComponent({ config, progress }: MotionGraphicProps<TravelDestinationConfig>) {
  const { placeName, country, description, bgColor, accentColor, textColor, stampColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Passport stamp slam effect
  const stampEnter = Math.min(1, enterProgress / 0.3)
  const stampScale = stampEnter < 1 ? 3 - 2 * easeOutBack(stampEnter) : 1
  const stampOpacity = stampEnter < 0.1 ? stampEnter / 0.1 : 1
  const stampRotation = -12

  // Location pin drops in
  const pinDrop = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.3)))

  // Place name slides in
  const nameEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.3)))

  // Country fades in
  const countryEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.25)))

  // Description reveals word by word
  const descWords = description.split(/\s+/)
  const descStart = 0.6
  const descReveal = Math.max(0, Math.min(1, (enterProgress - descStart) / (1 - descStart)))
  const visibleWords = Math.ceil(easeOutCubic(descReveal) * descWords.length)

  // Subtle float during hold
  const floatY = Math.sin(holdProgress * Math.PI * 4) * 2

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      {/* Subtle grid pattern (passport page) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `repeating-linear-gradient(0deg, ${textColor}06 0px, ${textColor}06 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, ${textColor}06 0px, ${textColor}06 1px, transparent 1px, transparent 40px)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8%',
          opacity: exitOpacity,
          transform: `translateY(${exitEased * 50 + floatY}px)`,
        }}
      >
        {/* Passport stamp circle */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            right: '8%',
            width: 'clamp(80px, 18vw, 160px)',
            height: 'clamp(80px, 18vw, 160px)',
            border: `3px solid ${stampColor}`,
            borderRadius: '50%',
            transform: `rotate(${stampRotation}deg) scale(${stampScale})`,
            opacity: stampOpacity * 0.4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              border: `2px dashed ${stampColor}`,
              borderRadius: '50%',
              width: '80%',
              height: '80%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(8px, 1.5vw, 14px)',
              fontWeight: 800,
              color: stampColor,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              textAlign: 'center',
              padding: '10%',
            }}
          >
            APPROVED
          </div>
        </div>

        {/* Location pin SVG */}
        <svg
          viewBox="0 0 24 24"
          style={{
            width: 'clamp(32px, 6vw, 56px)',
            height: 'clamp(32px, 6vw, 56px)',
            transform: `translateY(${(1 - pinDrop) * -40}px) scale(${pinDrop})`,
            opacity: pinDrop,
            marginBottom: 'clamp(8px, 1.5vh, 16px)',
          }}
        >
          <path
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
            fill={accentColor}
          />
          <circle cx="12" cy="9" r="2.5" fill={bgColor} />
        </svg>

        {/* Place name */}
        <div
          style={{
            fontSize: 'clamp(24px, 7vw, 64px)',
            fontWeight: 900,
            color: textColor,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            opacity: nameEnter,
            transform: `translateY(${(1 - nameEnter) * 20}px)`,
            textAlign: 'center',
            lineHeight: 1.1,
          }}
        >
          {placeName}
        </div>

        {/* Country with line accents */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 16px)',
            marginTop: 'clamp(6px, 1vh, 12px)',
            opacity: countryEnter,
          }}
        >
          <div style={{ width: 'clamp(20px, 4vw, 40px)', height: 2, background: accentColor, transform: `scaleX(${countryEnter})`, transformOrigin: 'right' }} />
          <div
            style={{
              fontSize: 'clamp(12px, 2.5vw, 22px)',
              fontWeight: 600,
              color: accentColor,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
            }}
          >
            {country}
          </div>
          <div style={{ width: 'clamp(20px, 4vw, 40px)', height: 2, background: accentColor, transform: `scaleX(${countryEnter})`, transformOrigin: 'left' }} />
        </div>

        {/* Description */}
        <div
          style={{
            marginTop: 'clamp(16px, 3vh, 32px)',
            fontSize: 'clamp(12px, 2.2vw, 20px)',
            fontWeight: 400,
            color: `${textColor}cc`,
            lineHeight: 1.6,
            textAlign: 'center',
            maxWidth: '80%',
          }}
        >
          {descWords.map((word, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: i < visibleWords ? 1 : 0,
                transform: i < visibleWords ? 'translateY(0)' : 'translateY(6px)',
                marginRight: '0.3em',
              }}
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-travel-destination',
  title: 'Travel Destination',
  description: 'Destination card with location pin, place name, and description with passport-stamp aesthetic',
  tags: ['scene', 'travel', 'destination', 'lifestyle', 'location', 'personal'],
  category: 'scene-layout',
  component: SceneTravelDestinationComponent as any,
  defaultConfig: {
    placeName: 'Santorini',
    country: 'Greece',
    description: 'Crystal blue waters, whitewashed buildings, and the most stunning sunsets you will ever see.',
    bgColor: '#1a1a2e',
    accentColor: '#e94560',
    textColor: '#eaeaea',
    stampColor: '#e94560',
  },
  configSchema: [
    { key: 'placeName', label: 'Place Name', type: 'text', defaultValue: 'Santorini', group: 'Content' },
    { key: 'country', label: 'Country', type: 'text', defaultValue: 'Greece', group: 'Content' },
    { key: 'description', label: 'Description', type: 'text', defaultValue: 'Crystal blue waters, whitewashed buildings, and the most stunning sunsets you will ever see.', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#e94560', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#eaeaea', group: 'Style' },
    { key: 'stampColor', label: 'Stamp Color', type: 'color', defaultValue: '#e94560', group: 'Style' },
  ],
})
