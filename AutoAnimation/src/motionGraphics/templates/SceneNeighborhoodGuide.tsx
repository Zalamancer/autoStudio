import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NeighborhoodGuideConfig {
  neighborhoodName: string
  walkScore: number
  amenity1: string
  amenity1Distance: string
  amenity2: string
  amenity2Distance: string
  amenity3: string
  amenity3Distance: string
  bgColor: string
  textColor: string
  accentColor: string
  pinColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneNeighborhoodGuideComponent({ config, progress }: MotionGraphicProps<NeighborhoodGuideConfig>) {
  const {
    neighborhoodName, walkScore,
    amenity1, amenity1Distance,
    amenity2, amenity2Distance,
    amenity3, amenity3Distance,
    bgColor, textColor, accentColor, pinColor,
  } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Pin drops in from top with bounce
  const pinDrop = enterProgress < 0.4
    ? easeOutBack(enterProgress / 0.4)
    : 1
  const pinY = (1 - pinDrop) * -80

  // Ripple circles radiate out from pin
  const rippleProgress = enterProgress > 0.3 ? Math.min(1, (enterProgress - 0.3) / 0.5) : 0

  // Name reveals
  const nameReveal = enterProgress > 0.2
    ? easeOutCubic(Math.min(1, (enterProgress - 0.2) / 0.3))
    : 0

  // Walk score counter
  const scoreReveal = enterProgress > 0.35
    ? easeOutCubic(Math.min(1, (enterProgress - 0.35) / 0.3))
    : 0
  const displayScore = Math.round(walkScore * scoreReveal)

  // Amenities stagger
  const amenities = [
    { name: amenity1, distance: amenity1Distance, icon: '\uD83C\uDFEB' },
    { name: amenity2, distance: amenity2Distance, icon: '\uD83C\uDFDE\uFE0F' },
    { name: amenity3, distance: amenity3Distance, icon: '\uD83D\uDE8C' },
  ]

  const getAmenityProgress = (idx: number): number => {
    const start = 0.45 + idx * 0.12
    return enterProgress > start ? easeOutCubic(Math.min(1, (enterProgress - start) / 0.25)) : 0
  }

  // Pin pulse during hold
  const pinPulse = holdProgress > 0 ? 1 + Math.sin(holdProgress * Math.PI * 4) * 0.05 : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      {/* Subtle map-like grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(${textColor}04 1px, transparent 1px),
          linear-gradient(90deg, ${textColor}04 1px, transparent 1px)
        `,
        backgroundSize: 'clamp(20px, 4vw, 40px) clamp(20px, 4vw, 40px)',
      }} />

      {/* Subtle radial roads from center */}
      <div style={{
        position: 'absolute',
        top: '25%',
        left: '50%',
        width: 1,
        height: `${rippleProgress * 40}%`,
        background: `${textColor}10`,
        transform: 'translateX(-50%)',
      }} />
      <div style={{
        position: 'absolute',
        top: '35%',
        left: '50%',
        width: `${rippleProgress * 60}%`,
        height: 1,
        background: `${textColor}10`,
        transform: 'translateX(-50%)',
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8%',
        opacity: exitOpacity,
        transform: `scale(${1 - exitEased * 0.05})`,
      }}>
        {/* Location pin */}
        <div style={{
          position: 'relative',
          marginBottom: 'clamp(6px, 1.2vw, 12px)',
          transform: `translateY(${pinY}px) scale(${pinPulse})`,
        }}>
          {/* Pin SVG shape */}
          <svg width="clamp(36px, 7vw, 56px)" height="clamp(48px, 9vw, 72px)" viewBox="0 0 40 52" fill="none">
            <path d="M20 0C8.95 0 0 8.95 0 20C0 35 20 52 20 52C20 52 40 35 40 20C40 8.95 31.05 0 20 0Z" fill={pinColor} />
            <circle cx="20" cy="20" r="8" fill={bgColor} />
          </svg>

          {/* Ripple rings */}
          {[0, 1, 2].map((i) => {
            const ringProgress = rippleProgress > i * 0.2
              ? Math.min(1, (rippleProgress - i * 0.2) / 0.4)
              : 0
            return (
              <div key={i} style={{
                position: 'absolute',
                top: '40%',
                left: '50%',
                width: `${60 + ringProgress * (80 + i * 40)}px`,
                height: `${60 + ringProgress * (80 + i * 40)}px`,
                borderRadius: '50%',
                border: `1.5px solid ${pinColor}`,
                transform: 'translate(-50%, -50%)',
                opacity: (1 - ringProgress) * 0.4,
                pointerEvents: 'none',
              }} />
            )
          })}
        </div>

        {/* Neighborhood name */}
        <div style={{
          fontSize: 'clamp(22px, 5vw, 42px)',
          fontWeight: 900,
          color: textColor,
          letterSpacing: 1,
          opacity: nameReveal,
          transform: `translateY(${(1 - nameReveal) * 15}px)`,
          marginBottom: 'clamp(8px, 1.5vw, 14px)',
          textAlign: 'center',
        }}>
          {neighborhoodName}
        </div>

        {/* Walk score */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(8px, 1.5vw, 14px)',
          marginBottom: 'clamp(20px, 4vw, 36px)',
          opacity: scoreReveal,
          transform: `translateY(${(1 - scoreReveal) * 10}px)`,
        }}>
          <div style={{
            width: 'clamp(40px, 8vw, 60px)',
            height: 'clamp(40px, 8vw, 60px)',
            borderRadius: '50%',
            border: `3px solid ${accentColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(16px, 3vw, 24px)',
            fontWeight: 900,
            color: accentColor,
          }}>
            {displayScore}
          </div>
          <div style={{
            fontSize: 'clamp(11px, 1.8vw, 15px)',
            fontWeight: 600,
            color: `${textColor}99`,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            Walk Score
          </div>
        </div>

        {/* Amenities list */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(8px, 1.5vw, 14px)',
          width: '100%',
          maxWidth: 'clamp(250px, 55vw, 400px)',
        }}>
          {amenities.map((amenity, i) => {
            const ap = getAmenityProgress(i)
            return (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: `${textColor}08`,
                padding: 'clamp(8px, 1.5vw, 14px) clamp(12px, 2vw, 18px)',
                borderRadius: 10,
                opacity: ap,
                transform: `translateX(${(1 - ap) * 30}px)`,
                borderLeft: `3px solid ${accentColor}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 12px)' }}>
                  <span style={{ fontSize: 'clamp(16px, 2.5vw, 22px)' }}>{amenity.icon}</span>
                  <span style={{
                    fontSize: 'clamp(12px, 2vw, 16px)',
                    fontWeight: 600,
                    color: textColor,
                  }}>
                    {amenity.name}
                  </span>
                </div>
                <span style={{
                  fontSize: 'clamp(11px, 1.6vw, 14px)',
                  fontWeight: 500,
                  color: accentColor,
                }}>
                  {amenity.distance}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-neighborhood-guide',
  title: 'Neighborhood Guide',
  description: 'Neighborhood highlight with location pin drop, radiating ripples, walk score counter, and amenity list with distances.',
  tags: ['scene', 'real-estate', 'neighborhood', 'location', 'map', 'amenities'],
  category: 'scene-layout',
  component: SceneNeighborhoodGuideComponent as any,
  defaultConfig: {
    neighborhoodName: 'Silver Lake',
    walkScore: 87,
    amenity1: 'Elementary School',
    amenity1Distance: '0.3 mi',
    amenity2: 'Echo Park',
    amenity2Distance: '0.5 mi',
    amenity3: 'Metro Station',
    amenity3Distance: '0.2 mi',
    bgColor: '#0D1520',
    textColor: '#D8E4EF',
    accentColor: '#4299E1',
    pinColor: '#E53E3E',
  },
  configSchema: [
    { key: 'neighborhoodName', label: 'Neighborhood Name', type: 'text', defaultValue: 'Silver Lake', group: 'Content' },
    { key: 'walkScore', label: 'Walk Score', type: 'number', defaultValue: 87, min: 0, max: 100, group: 'Content' },
    { key: 'amenity1', label: 'Amenity 1 Name', type: 'text', defaultValue: 'Elementary School', group: 'Content' },
    { key: 'amenity1Distance', label: 'Amenity 1 Distance', type: 'text', defaultValue: '0.3 mi', group: 'Content' },
    { key: 'amenity2', label: 'Amenity 2 Name', type: 'text', defaultValue: 'Echo Park', group: 'Content' },
    { key: 'amenity2Distance', label: 'Amenity 2 Distance', type: 'text', defaultValue: '0.5 mi', group: 'Content' },
    { key: 'amenity3', label: 'Amenity 3 Name', type: 'text', defaultValue: 'Metro Station', group: 'Content' },
    { key: 'amenity3Distance', label: 'Amenity 3 Distance', type: 'text', defaultValue: '0.2 mi', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D1520', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#D8E4EF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#4299E1', group: 'Style' },
    { key: 'pinColor', label: 'Pin Color', type: 'color', defaultValue: '#E53E3E', group: 'Style' },
  ],
})
