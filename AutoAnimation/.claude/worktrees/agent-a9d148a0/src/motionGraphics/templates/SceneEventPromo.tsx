import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EventPromoConfig {
  eventName: string
  dateTime: string
  venue: string
  ctaText: string
  accentColor: string
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

function easeInCubic(t: number): number {
  return t * t * t
}

// Deterministic pseudo-random
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function SceneEventPromoComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<EventPromoConfig>) {
  const { eventName, dateTime, venue, ctaText, accentColor, bgColor, textColor } = config
  const progress = frame / durationInFrames

  // Phase breakdown
  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Event name slides in
  const nameOpacity = easeOutCubic(Math.min(1, enterProgress / 0.35))
  const nameX = (1 - easeOutCubic(Math.min(1, enterProgress / 0.35))) * -40

  // Date/location stagger in
  const dateOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.3)))
  const dateY = (1 - dateOpacity) * 20

  const venueOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.45) / 0.3)))
  const venueY = (1 - venueOpacity) * 20

  // CTA button bounces in last
  const ctaScale = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.65) / 0.3)))
  const ctaOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.65) / 0.2)))

  // Background geometric pattern (static lines)
  const geoLines = Array.from({ length: 8 }).map((_, i) => {
    const seed = i * 11 + 5
    const x1 = seededRandom(seed) * 100
    const y1 = seededRandom(seed + 1) * 100
    const angle = seededRandom(seed + 2) * 180
    const len = 30 + seededRandom(seed + 3) * 40
    return { x: x1, y: y1, angle, len, opacity: 0.04 + seededRandom(seed + 4) * 0.04 }
  })

  // Hold: CTA button pulses
  const ctaPulse = 1 + Math.sin(holdProgress * Math.PI * 5) * 0.03

  // Exit: card flips away (3D rotateY)
  const exitEased = easeInCubic(exitProgress)
  const exitRotateY = exitEased * 90
  const exitOpacity = 1 - exitEased

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6%',
        perspective: '1200px',
      }}
    >
      {/* Geometric background pattern */}
      {geoLines.map((line, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${line.x}%`,
            top: `${line.y}%`,
            width: `${line.len}px`,
            height: 1,
            background: accentColor,
            opacity: line.opacity * nameOpacity,
            transform: `rotate(${line.angle}deg)`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Gradient accent at top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: `linear-gradient(180deg, ${accentColor}15 0%, transparent 100%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Card content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(14px, 2.5vh, 28px)',
          maxWidth: 520,
          width: '100%',
          transform: `rotateY(${exitRotateY}deg)`,
          opacity: exitOpacity,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Event name */}
        <div
          style={{
            fontSize: 'clamp(26px, 5.5vw, 52px)',
            fontWeight: 900,
            color: textColor,
            opacity: nameOpacity,
            transform: `translateX(${nameX}px)`,
            textAlign: 'center',
            lineHeight: 1.1,
            letterSpacing: 1,
          }}
        >
          {eventName}
        </div>

        {/* Accent line */}
        <div
          style={{
            width: `${easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.25) / 0.2))) * 60}px`,
            height: 3,
            background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80)`,
            borderRadius: 2,
          }}
        />

        {/* Date/Time */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 14px)',
            opacity: dateOpacity,
            transform: `translateY(${dateY}px)`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(16px, 2.8vw, 22px)',
              color: accentColor,
              lineHeight: 1,
            }}
          >
            {'\uD83D\uDCC5'}
          </div>
          <div
            style={{
              fontSize: 'clamp(13px, 2.2vw, 18px)',
              fontWeight: 600,
              color: `${textColor}DD`,
            }}
          >
            {dateTime}
          </div>
        </div>

        {/* Venue */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 14px)',
            opacity: venueOpacity,
            transform: `translateY(${venueY}px)`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(16px, 2.8vw, 22px)',
              color: accentColor,
              lineHeight: 1,
            }}
          >
            {'\uD83D\uDCCD'}
          </div>
          <div
            style={{
              fontSize: 'clamp(13px, 2.2vw, 18px)',
              fontWeight: 600,
              color: `${textColor}DD`,
            }}
          >
            {venue}
          </div>
        </div>

        {/* CTA button */}
        <div
          style={{
            marginTop: 'clamp(8px, 1.5vh, 16px)',
            padding: 'clamp(10px, 2vh, 18px) clamp(24px, 5vw, 48px)',
            background: accentColor,
            borderRadius: 'clamp(8px, 1.5vw, 14px)',
            transform: `scale(${ctaScale * ctaPulse})`,
            opacity: ctaOpacity,
            boxShadow: `0 4px 20px ${accentColor}40`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(12px, 2vw, 16px)',
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            {ctaText}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-event-promo',
  title: 'Scene Event Promo',
  description:
    'Event promotion with sliding name, staggered date/venue, pulsing CTA button, geometric background, and 3D flip exit',
  tags: ['scene', 'brand', 'event', 'promo', 'conference', 'business'],
  category: 'scene-layout',
  component: SceneEventPromoComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'eventName', label: 'Event Name', type: 'text', defaultValue: 'Tech Summit 2024', group: 'Content' },
    { key: 'dateTime', label: 'Date & Time', type: 'text', defaultValue: 'March 15, 2024 \u2022 9:00 AM', group: 'Content' },
    { key: 'venue', label: 'Venue', type: 'text', defaultValue: 'San Francisco Convention Center', group: 'Content' },
    { key: 'ctaText', label: 'CTA Text', type: 'text', defaultValue: 'Register Now', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#8B5CF6', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A14', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
  defaultConfig: {
    eventName: 'Tech Summit 2024',
    dateTime: 'March 15, 2024 \u2022 9:00 AM',
    venue: 'San Francisco Convention Center',
    ctaText: 'Register Now',
    accentColor: '#8B5CF6',
    bgColor: '#0A0A14',
    textColor: '#FFFFFF',
  },
})
