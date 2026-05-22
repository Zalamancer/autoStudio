import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneRoomTourConfig {
  roomName: string
  features: string[]
  style: string
  sqft: number
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158; const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneRoomTourComponent({ config, frame, durationInFrames }: MotionGraphicProps<SceneRoomTourConfig>) {
  const { roomName, features, style: roomStyle, sqft, bgColor, cardColor, accentColor, textColor } = config
  const progress = frame / durationInFrames

  const enterProgress = Math.min(1, progress / 0.22)
  const holdProgress = progress >= 0.22 && progress < 0.8 ? (progress - 0.22) / 0.58 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Card slides in from left
  const cardSlide = easeOutBack(Math.min(1, enterProgress / 0.6))
  const cardX = (1 - cardSlide) * -120

  // Title wipe reveal
  const titleReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.4)))

  // Style tag
  const tagReveal = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.3)))

  // Sqft counter
  const sqftProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.4)))
  const displaySqft = Math.round(sqftProgress * sqft)

  // Feature items stagger
  const getFeatureReveal = (idx: number) =>
    easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.45 - idx * 0.06) / 0.3)))

  // Scanning line during hold
  const scanY = holdProgress > 0 ? (holdProgress * 150) % 100 : 0

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Architectural grid lines */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.04 }}>
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={`h-${i}`}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${(i + 1) * 14}%`,
              height: 1,
              background: textColor,
            }}
          />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={`v-${i}`}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${(i + 1) * 14}%`,
              width: 1,
              background: textColor,
            }}
          />
        ))}
      </div>

      {/* Scan line during hold */}
      {holdProgress > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${scanY}%`,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)`,
            opacity: exitOpacity,
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          inset: '6%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          opacity: exitOpacity,
          transform: `translateX(${cardX + exitEased * 80}px)`,
        }}
      >
        {/* Room image placeholder */}
        <div
          style={{
            width: '100%',
            aspectRatio: '16/9',
            background: `${accentColor}10`,
            borderRadius: 'clamp(10px, 2vw, 16px)',
            border: `1px solid ${accentColor}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(28px, 6vw, 48px)',
            marginBottom: 'clamp(12px, 2.5vw, 20px)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {'🏠'}
          {/* Style tag overlay */}
          <div
            style={{
              position: 'absolute',
              top: 'clamp(6px, 1.2vw, 12px)',
              left: 'clamp(6px, 1.2vw, 12px)',
              background: accentColor,
              color: bgColor,
              fontSize: 'clamp(8px, 1.4vw, 12px)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: 'clamp(2px, 0.4vw, 4px) clamp(6px, 1vw, 10px)',
              borderRadius: 100,
              transform: `scale(${tagReveal})`,
              opacity: tagReveal,
            }}
          >
            {roomStyle}
          </div>
        </div>

        {/* Room name */}
        <div
          style={{
            fontSize: 'clamp(22px, 5.5vw, 40px)',
            fontWeight: 900,
            color: textColor,
            lineHeight: 1.1,
            marginBottom: 'clamp(4px, 0.8vw, 8px)',
            opacity: titleReveal,
            transform: `translateY(${(1 - titleReveal) * 15}px)`,
          }}
        >
          {roomName}
        </div>

        {/* Sqft */}
        <div
          style={{
            fontSize: 'clamp(14px, 2.5vw, 20px)',
            fontWeight: 700,
            color: accentColor,
            marginBottom: 'clamp(10px, 2vw, 18px)',
            opacity: sqftProgress,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {displaySqft} sq ft
        </div>

        {/* Features list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(4px, 0.8vw, 8px)' }}>
          {features.map((feat, i) => {
            const fp = getFeatureReveal(i)
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(6px, 1vw, 10px)',
                  opacity: fp,
                  transform: `translateX(${(1 - fp) * 20}px)`,
                }}
              >
                <div
                  style={{
                    width: 'clamp(4px, 0.7vw, 6px)',
                    height: 'clamp(4px, 0.7vw, 6px)',
                    borderRadius: '50%',
                    background: accentColor,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 'clamp(11px, 1.8vw, 15px)',
                    fontWeight: 500,
                    color: `${textColor}cc`,
                  }}
                >
                  {feat}
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
  id: 'tpl-scene-room-tour',
  title: 'Room Tour Highlight',
  description: 'Room tour highlight card with architectural grid, room image, style tag, sqft counter, and feature list',
  tags: ['scene', 'room', 'tour', 'interior', 'home', 'design', 'real-estate'],
  category: 'scene-layout',
  component: SceneRoomTourComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    roomName: 'Modern Living Room',
    features: ['Floor-to-ceiling windows', 'Hardwood floors', 'Built-in shelving', 'Fireplace'],
    style: 'Modern',
    sqft: 450,
    bgColor: '#0D1117',
    cardColor: '#161B22',
    accentColor: '#58A6FF',
    textColor: '#F0F6FC',
  },
  configSchema: [
    { key: 'roomName', label: 'Room Name', type: 'text', defaultValue: 'Modern Living Room', group: 'Content' },
    { key: 'features', label: 'Features', type: 'text-array', defaultValue: ['Floor-to-ceiling windows', 'Hardwood floors', 'Built-in shelving', 'Fireplace'], group: 'Content' },
    { key: 'style', label: 'Style', type: 'text', defaultValue: 'Modern', group: 'Content' },
    { key: 'sqft', label: 'Square Feet', type: 'number', defaultValue: 450, min: 1, max: 10000, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D1117', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#161B22', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#58A6FF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#F0F6FC', group: 'Style' },
  ],
})
