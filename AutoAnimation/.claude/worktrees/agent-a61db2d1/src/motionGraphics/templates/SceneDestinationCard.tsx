import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DestinationCardConfig {
  cityName: string
  country: string
  temperature: string
  bestSeason: string
  bgColor: string
  textColor: string
  accentColor: string
  pinColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneDestinationCardComponent({ config, progress }: MotionGraphicProps<DestinationCardConfig>) {
  const { cityName, country, temperature, bestSeason, bgColor, textColor, accentColor, pinColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Pin drops from top
  const pinEnter = elasticOut(Math.max(0, Math.min(1, enterProgress / 0.3)))
  const pinY = (1 - pinEnter) * -60

  // City name slides in elastic
  const cityEnter = elasticOut(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.4)))
  const cityX = (1 - cityEnter) * 80

  // Country fades
  const countryEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.3)))

  // Temperature enters
  const tempEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.25)))

  // Season tag enters
  const seasonEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.65) / 0.3)))

  // Hold: subtle warmth pulse
  const warmPulse = Math.sin(holdProgress * Math.PI * 3) * 0.03

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      {/* Warm radial glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 60%, ${accentColor}15, transparent 70%)`,
          opacity: enterProgress,
        }}
      />

      {/* Postcard border */}
      <div
        style={{
          position: 'absolute',
          inset: 'clamp(8px, 1.5vw, 16px)',
          border: `2px dashed ${textColor}20`,
          borderRadius: 'clamp(8px, 1.5vw, 16px)',
          opacity: countryEnter,
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
          gap: 'clamp(8px, 1.5vh, 16px)',
          opacity: exitOpacity,
          transform: `scale(${1 - exitEased * 0.1 + warmPulse})`,
        }}
      >
        {/* Pin icon */}
        <div
          style={{
            fontSize: 'clamp(28px, 6vw, 48px)',
            transform: `translateY(${pinY}px)`,
            opacity: pinEnter,
            filter: `drop-shadow(0 4px 8px ${pinColor}40)`,
          }}
        >
          📍
        </div>

        {/* City name - large */}
        <div
          style={{
            fontSize: 'clamp(32px, 8vw, 64px)',
            fontWeight: 900,
            color: textColor,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            textAlign: 'center',
            transform: `translateX(${cityX}px)`,
            opacity: cityEnter,
            textShadow: `0 2px 20px ${bgColor}80`,
          }}
        >
          {cityName}
        </div>

        {/* Country */}
        <div
          style={{
            fontSize: 'clamp(14px, 2.5vw, 22px)',
            fontWeight: 500,
            color: `${textColor}88`,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            opacity: countryEnter,
            transform: `translateY(${(1 - countryEnter) * 10}px)`,
          }}
        >
          {country}
        </div>

        {/* Divider */}
        <div
          style={{
            width: 'clamp(40px, 8vw, 60px)',
            height: 2,
            background: accentColor,
            opacity: tempEnter,
            transform: `scaleX(${tempEnter})`,
          }}
        />

        {/* Temperature and season row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(12px, 2.5vw, 24px)',
            marginTop: 'clamp(4px, 1vh, 8px)',
          }}
        >
          {/* Temperature */}
          <div
            style={{
              fontSize: 'clamp(18px, 3.5vw, 30px)',
              fontWeight: 700,
              color: accentColor,
              opacity: tempEnter,
              transform: `translateY(${(1 - tempEnter) * 15}px)`,
            }}
          >
            {temperature}
          </div>

          {/* Season tag */}
          <div
            style={{
              fontSize: 'clamp(10px, 1.8vw, 15px)',
              fontWeight: 600,
              color: textColor,
              background: `${accentColor}25`,
              padding: 'clamp(4px, 0.8vh, 8px) clamp(10px, 2vw, 18px)',
              borderRadius: 'clamp(12px, 2vw, 20px)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              opacity: seasonEnter,
              transform: `scale(${seasonEnter})`,
            }}
          >
            {bestSeason}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-destination-card',
  title: 'Destination Card',
  description: 'Destination highlight with pin drop, elastic city name, temperature, and season tag in postcard aesthetic',
  tags: ['scene', 'travel', 'destination', 'city', 'adventure', 'postcard'],
  category: 'scene-layout',
  component: SceneDestinationCardComponent as any,
  defaultConfig: {
    cityName: 'Santorini',
    country: 'Greece',
    temperature: '28°C',
    bestSeason: 'Jun — Sep',
    bgColor: '#1a1512',
    textColor: '#faf5ef',
    accentColor: '#e8976c',
    pinColor: '#e8976c',
  },
  configSchema: [
    { key: 'cityName', label: 'City Name', type: 'text', defaultValue: 'Santorini', group: 'Content' },
    { key: 'country', label: 'Country', type: 'text', defaultValue: 'Greece', group: 'Content' },
    { key: 'temperature', label: 'Temperature', type: 'text', defaultValue: '28°C', group: 'Content' },
    { key: 'bestSeason', label: 'Best Season', type: 'text', defaultValue: 'Jun — Sep', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1512', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#faf5ef', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#e8976c', group: 'Style' },
    { key: 'pinColor', label: 'Pin Color', type: 'color', defaultValue: '#e8976c', group: 'Style' },
  ],
})
