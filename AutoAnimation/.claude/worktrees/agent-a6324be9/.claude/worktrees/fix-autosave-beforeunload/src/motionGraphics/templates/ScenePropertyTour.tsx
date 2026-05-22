import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PropertyTourConfig {
  propertyName: string
  rooms: string[]
  roomSizes: string[]
  roomEmojis: string[]
  currentRoom: number
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function ScenePropertyTourComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<PropertyTourConfig>) {
  const { propertyName, rooms, roomSizes, roomEmojis, currentRoom, bgColor, cardColor, accentColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.25
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Header slides in
  const headerProgress = easeOutCubic(Math.min(1, enterProgress / 0.35))
  // Room card appears
  const cardProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.4)))
  // Navigation dots
  const dotsProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3)))
  // Room details
  const detailsProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.3)))

  // Hold: room transitions (cycles through rooms)
  const activeRoom = Math.min(rooms.length - 1, Math.floor(holdProgress * rooms.length))
  const roomTransition = (holdProgress * rooms.length) % 1

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.08

  const displayRoom = holdProgress > 0 ? activeRoom : currentRoom
  const emoji = roomEmojis[displayRoom] || '🏠'
  const roomName = rooms[displayRoom] || 'Room'
  const roomSize = roomSizes[displayRoom] || 'N/A'

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
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: '5%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(12px, 2.5vh, 22px)',
          width: '100%',
          maxWidth: 400,
          transform: `scale(${exitScale})`,
          opacity: exitOpacity,
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            opacity: headerProgress,
            transform: `translateY(${(1 - headerProgress) * 12}px)`,
          }}
        >
          <div style={{ fontSize: 'clamp(9px, 1.3vw, 11px)', fontWeight: 700, color: accentColor, letterSpacing: 3, textTransform: 'uppercase' }}>
            PROPERTY TOUR
          </div>
          <div style={{ fontSize: 'clamp(20px, 4.5vw, 34px)', fontWeight: 800, color: textColor, marginTop: 4, lineHeight: 1.1 }}>
            {propertyName}
          </div>
        </div>

        {/* Room card */}
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(16px, 2.5vw, 24px)',
            padding: 'clamp(24px, 5%, 40px)',
            width: '100%',
            textAlign: 'center',
            opacity: cardProgress,
            transform: `scale(${0.9 + cardProgress * 0.1})`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Room number badge */}
          <div
            style={{
              position: 'absolute',
              top: 'clamp(10px, 2vh, 16px)',
              right: 'clamp(10px, 2vw, 16px)',
              width: 'clamp(28px, 5vw, 40px)',
              height: 'clamp(28px, 5vw, 40px)',
              borderRadius: '50%',
              background: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(11px, 1.8vw, 15px)',
              fontWeight: 800,
              color: '#FFFFFF',
            }}
          >
            {displayRoom + 1}
          </div>

          {/* Room emoji */}
          <div style={{ fontSize: 'clamp(48px, 10vw, 80px)', marginBottom: 'clamp(8px, 1.5vh, 14px)' }}>
            {emoji}
          </div>

          {/* Room name */}
          <div style={{ fontSize: 'clamp(20px, 4vw, 30px)', fontWeight: 800, color: textColor, marginBottom: 4 }}>
            {roomName}
          </div>

          {/* Room size */}
          <div
            style={{
              fontSize: 'clamp(12px, 2vw, 16px)',
              fontWeight: 600,
              color: `${textColor}60`,
              opacity: detailsProgress,
            }}
          >
            {roomSize}
          </div>

          {/* Features list */}
          <div
            style={{
              display: 'flex',
              gap: 'clamp(8px, 1.5vw, 14px)',
              justifyContent: 'center',
              marginTop: 'clamp(10px, 2vh, 18px)',
              opacity: detailsProgress,
              transform: `translateY(${(1 - detailsProgress) * 10}px)`,
            }}
          >
            {['Natural Light', 'Hardwood', 'High Ceiling'].map((feat, i) => (
              <div
                key={i}
                style={{
                  padding: 'clamp(3px, 0.5vh, 6px) clamp(8px, 1.5vw, 12px)',
                  borderRadius: 16,
                  background: `${accentColor}10`,
                  fontSize: 'clamp(8px, 1.2vw, 10px)',
                  fontWeight: 600,
                  color: accentColor,
                }}
              >
                {feat}
              </div>
            ))}
          </div>
        </div>

        {/* Room navigation dots */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(6px, 1.2vw, 10px)',
            alignItems: 'center',
            opacity: dotsProgress,
          }}
        >
          {rooms.map((_, i) => {
            const isActive = i === displayRoom
            return (
              <div
                key={i}
                style={{
                  width: isActive ? 'clamp(20px, 4vw, 32px)' : 'clamp(8px, 1.5vw, 12px)',
                  height: 'clamp(8px, 1.5vw, 12px)',
                  borderRadius: 20,
                  background: isActive ? accentColor : `${textColor}20`,
                }}
              />
            )
          })}
        </div>

        {/* Room count */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.5vw, 13px)',
            fontWeight: 600,
            color: `${textColor}50`,
            opacity: dotsProgress,
          }}
        >
          Room {displayRoom + 1} of {rooms.length}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-property-tour',
  title: 'Scene Property Tour',
  description: 'Room-by-room property tour card with room emoji, navigation dots, feature tags, and auto-cycling room display',
  tags: ['scene', 'property', 'tour', 'real-estate', 'room', 'interior', 'architecture', 'walkthrough'],
  category: 'scene-layout',
  component: ScenePropertyTourComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'propertyName', label: 'Property Name', type: 'text', defaultValue: 'Sunset Vista Apartment', group: 'Content' },
    { key: 'rooms', label: 'Room Names', type: 'text-array', defaultValue: ['Living Room', 'Kitchen', 'Master Bedroom', 'Bathroom', 'Balcony'], group: 'Content' },
    { key: 'roomSizes', label: 'Room Sizes', type: 'text-array', defaultValue: ['5.2 x 4.1m', '3.8 x 3.2m', '4.5 x 3.8m', '2.4 x 2.0m', '3.0 x 1.5m'], group: 'Content' },
    { key: 'roomEmojis', label: 'Room Icons', type: 'text-array', defaultValue: ['🛋️', '🍳', '🛏️', '🚿', '🌅'], group: 'Content' },
    { key: 'currentRoom', label: 'Start Room', type: 'number', defaultValue: 0, min: 0, max: 10, group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#2563EB', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F0F4F8', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1E293B', group: 'Style' },
  ],
  defaultConfig: {
    propertyName: 'Sunset Vista Apartment',
    rooms: ['Living Room', 'Kitchen', 'Master Bedroom', 'Bathroom', 'Balcony'],
    roomSizes: ['5.2 x 4.1m', '3.8 x 3.2m', '4.5 x 3.8m', '2.4 x 2.0m', '3.0 x 1.5m'],
    roomEmojis: ['🛋️', '🍳', '🛏️', '🚿', '🌅'],
    currentRoom: 0,
    accentColor: '#2563EB',
    cardColor: '#FFFFFF',
    bgColor: '#F0F4F8',
    textColor: '#1E293B',
  },
})
