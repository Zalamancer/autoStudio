import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScenePlaydateConfig {
  childName: string
  hostName: string
  date: string
  time: string
  location: string
  activities: string[]
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

function ScenePlaydateComponent({ config, frame, durationInFrames }: MotionGraphicProps<ScenePlaydateConfig>) {
  const { childName, hostName, date, time, location, activities, bgColor, cardColor, accentColor, textColor } = config
  const progress = frame / durationInFrames
  const fps = 30
  const timeS = frame / fps

  const enterProgress = Math.min(1, progress / 0.22)
  const holdProgress = progress >= 0.22 && progress < 0.8 ? (progress - 0.22) / 0.58 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Card bounces in
  const cardBounce = easeOutBack(Math.min(1, enterProgress / 0.5))
  const cardScale = 0.3 + cardBounce * 0.7

  // Confetti during enter
  const confettiPieces = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * Math.PI * 2
    const speed = 0.8 + (i % 4) * 0.3
    const enterPhase = Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.5))
    const dist = enterPhase * 120 * speed
    const x = 50 + Math.cos(angle) * dist * 0.5
    const y = 50 + Math.sin(angle) * dist - enterPhase * 40
    const rotation = enterPhase * 360 * ((i % 2) * 2 - 1)
    const alpha = Math.max(0, 1 - enterPhase * 0.8) * 0.7
    const colors = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#C084FC', '#FB923C']
    return { x, y, rotation, alpha, color: colors[i % colors.length], size: 5 + (i % 3) * 3 }
  })

  const titleReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.3)))
  const detailsReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.3)))
  const locationReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.45) / 0.3)))

  const getActivityProgress = (idx: number) =>
    easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.55 - idx * 0.06) / 0.25)))

  // Gentle bounce during hold
  const bounceY = holdProgress > 0 ? Math.sin(holdProgress * Math.PI * 8) * 3 : 0

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
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Confetti */}
      {confettiPieces.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${c.x}%`,
            top: `${c.y}%`,
            width: c.size,
            height: c.size * 0.6,
            background: c.color,
            borderRadius: 1,
            transform: `rotate(${c.rotation}deg)`,
            opacity: c.alpha * exitOpacity,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Balloon decorations */}
      {['#FF6B6B', '#4ECDC4', '#FFE66D'].map((color, i) => {
        const float = Math.sin(timeS * 1.5 + i * 2) * 5
        const bEnter = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.1 - i * 0.1) / 0.3)))
        return (
          <div
            key={`b-${i}`}
            style={{
              position: 'absolute',
              top: `${12 + i * 8 + float}%`,
              left: `${10 + i * 35}%`,
              width: 'clamp(18px, 4vw, 30px)',
              height: 'clamp(22px, 5vw, 36px)',
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              background: `radial-gradient(circle at 35% 30%, ${color}ee, ${color}88)`,
              transform: `scale(${bEnter}) translateY(${float}px)`,
              opacity: bEnter * exitOpacity * 0.7,
            }}
          />
        )
      })}

      <div
        style={{
          width: '85%',
          maxWidth: 400,
          background: cardColor,
          borderRadius: 'clamp(18px, 3.5vw, 30px)',
          padding: 'clamp(20px, 4.5vw, 40px)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
          border: `2px dashed ${accentColor}40`,
          transform: `scale(${cardScale * (1 - exitEased * 0.15)}) translateY(${bounceY}px)`,
          opacity: cardBounce * exitOpacity,
          textAlign: 'center',
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.6vw, 13px)',
            fontWeight: 800,
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            opacity: titleReveal,
            marginBottom: 'clamp(4px, 0.8vw, 6px)',
          }}
        >
          You're Invited!
        </div>
        <div
          style={{
            fontSize: 'clamp(22px, 5.5vw, 38px)',
            fontWeight: 900,
            color: textColor,
            opacity: titleReveal,
            transform: `translateY(${(1 - titleReveal) * 15}px)`,
            marginBottom: 'clamp(2px, 0.5vw, 4px)',
          }}
        >
          Playdate
        </div>
        <div
          style={{
            fontSize: 'clamp(13px, 2.2vw, 18px)',
            fontWeight: 600,
            color: `${textColor}aa`,
            opacity: titleReveal,
            marginBottom: 'clamp(12px, 2.5vw, 20px)',
          }}
        >
          {childName} & {hostName}
        </div>

        {/* Date & Time */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'clamp(12px, 2.5vw, 20px)',
            marginBottom: 'clamp(6px, 1.2vw, 10px)',
            opacity: detailsReveal,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(3px, 0.6vw, 6px)' }}>
            <span style={{ fontSize: 'clamp(12px, 2vw, 16px)' }}>{'📅'}</span>
            <span style={{ fontSize: 'clamp(11px, 1.8vw, 15px)', fontWeight: 600, color: textColor }}>{date}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(3px, 0.6vw, 6px)' }}>
            <span style={{ fontSize: 'clamp(12px, 2vw, 16px)' }}>{'🕐'}</span>
            <span style={{ fontSize: 'clamp(11px, 1.8vw, 15px)', fontWeight: 600, color: textColor }}>{time}</span>
          </div>
        </div>

        {/* Location */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(3px, 0.6vw, 6px)',
            marginBottom: 'clamp(14px, 3vw, 22px)',
            opacity: locationReveal,
          }}
        >
          <span style={{ fontSize: 'clamp(12px, 2vw, 16px)' }}>{'📍'}</span>
          <span style={{ fontSize: 'clamp(10px, 1.6vw, 14px)', fontWeight: 500, color: `${textColor}88` }}>{location}</span>
        </div>

        {/* Activities */}
        <div
          style={{
            background: `${accentColor}08`,
            borderRadius: 'clamp(10px, 2vw, 14px)',
            padding: 'clamp(8px, 1.5vw, 14px)',
            border: `1px solid ${accentColor}15`,
          }}
        >
          <div style={{ fontSize: 'clamp(8px, 1.2vw, 10px)', fontWeight: 800, color: `${textColor}55`, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 'clamp(6px, 1vw, 10px)' }}>
            Activities
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(4px, 0.7vw, 6px)', justifyContent: 'center' }}>
            {activities.map((act, i) => {
              const ap = getActivityProgress(i)
              return (
                <div
                  key={i}
                  style={{
                    fontSize: 'clamp(10px, 1.5vw, 13px)',
                    fontWeight: 600,
                    color: textColor,
                    background: `${accentColor}15`,
                    padding: 'clamp(3px, 0.5vw, 5px) clamp(8px, 1.2vw, 12px)',
                    borderRadius: 100,
                    transform: `scale(${ap})`,
                    opacity: ap,
                  }}
                >
                  {act}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-playdate',
  title: 'Playdate Invitation',
  description: 'Kids playdate invitation card with confetti burst, balloon decorations, date/time/location, and activity tags',
  tags: ['scene', 'playdate', 'kids', 'invitation', 'party', 'children', 'fun'],
  category: 'scene-layout',
  component: ScenePlaydateComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    childName: 'Emma',
    hostName: 'Liam',
    date: 'Saturday, Mar 22',
    time: '2:00 PM',
    location: 'Sunshine Park',
    activities: ['Arts & Crafts', 'Treasure Hunt', 'Snack Time', 'Games'],
    bgColor: '#FFF5F5',
    cardColor: '#FFFFFF',
    accentColor: '#EC4899',
    textColor: '#1F2937',
  },
  configSchema: [
    { key: 'childName', label: 'Child Name', type: 'text', defaultValue: 'Emma', group: 'Content' },
    { key: 'hostName', label: 'Host Name', type: 'text', defaultValue: 'Liam', group: 'Content' },
    { key: 'date', label: 'Date', type: 'text', defaultValue: 'Saturday, Mar 22', group: 'Content' },
    { key: 'time', label: 'Time', type: 'text', defaultValue: '2:00 PM', group: 'Content' },
    { key: 'location', label: 'Location', type: 'text', defaultValue: 'Sunshine Park', group: 'Content' },
    { key: 'activities', label: 'Activities', type: 'text-array', defaultValue: ['Arts & Crafts', 'Treasure Hunt', 'Snack Time', 'Games'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF5F5', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#EC4899', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1F2937', group: 'Style' },
  ],
})
