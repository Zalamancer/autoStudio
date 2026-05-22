import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TableReservationConfig {
  restaurantName: string
  guestName: string
  date: string
  time: string
  partySize: string
  specialRequests: string
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneTableReservationComponent({ config, progress }: MotionGraphicProps<TableReservationConfig>) {
  const { restaurantName, guestName, date, time, partySize, specialRequests, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.22 ? progress / 0.22 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Card fades and scales
  const cardEnter = easeOutCubic(Math.min(1, enterProgress / 0.35))
  const cardScale = 0.9 + cardEnter * 0.1

  // Gold seal stamp
  const sealEnter = elasticOut(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3)))

  // Detail rows staggered
  const getDetailProgress = (i: number): number => {
    const start = 0.25 + i * 0.08
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.2)))
  }

  // Decorative line
  const lineEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.2)))

  const details = [
    { label: 'Guest', value: guestName, icon: '\uD83D\uDC64' },
    { label: 'Date', value: date, icon: '\uD83D\uDCC5' },
    { label: 'Time', value: time, icon: '\u23F0' },
    { label: 'Party Size', value: partySize, icon: '\uD83D\uDC65' },
  ]

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Georgia', 'Palatino', serif",
      }}
    >
      {/* Subtle pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 20% 80%, ${accentColor}06 0%, transparent 40%), radial-gradient(circle at 80% 20%, ${accentColor}06 0%, transparent 40%)`,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6%',
          opacity: exitOpacity,
          transform: `scale(${1 - exitEased * 0.05})`,
        }}
      >
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(14px, 2vw, 22px)',
            padding: 'clamp(28px, 5%, 44px)',
            maxWidth: 420,
            width: '100%',
            boxShadow: '0 10px 36px rgba(0,0,0,0.08)',
            transform: `scale(${cardScale})`,
            opacity: cardEnter,
            position: 'relative',
            border: `1px solid ${accentColor}20`,
          }}
        >
          {/* Top ornamental border */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
              borderRadius: '22px 22px 0 0',
              transform: `scaleX(${lineEnter})`,
              transformOrigin: 'center',
            }}
          />

          {/* Restaurant name */}
          <div
            style={{
              fontSize: 'clamp(10px, 1.5vw, 12px)',
              fontWeight: 600,
              color: accentColor,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              textAlign: 'center',
              marginBottom: 'clamp(4px, 0.6vh, 8px)',
              opacity: cardEnter,
            }}
          >
            {restaurantName}
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 'clamp(22px, 5vw, 34px)',
              fontWeight: 700,
              color: textColor,
              textAlign: 'center',
              marginBottom: 'clamp(4px, 0.8vh, 8px)',
              opacity: cardEnter,
            }}
          >
            Reservation
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 'clamp(10px, 1.6vw, 13px)',
              color: `${textColor}60`,
              textAlign: 'center',
              fontStyle: 'italic',
              marginBottom: 'clamp(14px, 2.5vh, 22px)',
              opacity: getDetailProgress(0),
            }}
          >
            Your table awaits
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: `${accentColor}20`,
              marginBottom: 'clamp(14px, 2.2vh, 20px)',
              transform: `scaleX(${lineEnter})`,
              transformOrigin: 'center',
            }}
          />

          {/* Details */}
          {details.map((d, i) => {
            const dp = getDetailProgress(i)
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(10px, 2vw, 16px)',
                  padding: 'clamp(8px, 1.2vh, 12px) 0',
                  borderBottom: i < details.length - 1 ? `1px solid ${textColor}08` : 'none',
                  opacity: dp,
                  transform: `translateY(${(1 - dp) * 10}px)`,
                }}
              >
                <div style={{ fontSize: 'clamp(18px, 3vw, 24px)', width: 30, textAlign: 'center' }}>
                  {d.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 'clamp(9px, 1.3vw, 11px)',
                      fontWeight: 600,
                      color: `${textColor}60`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {d.label}
                  </div>
                  <div
                    style={{
                      fontSize: 'clamp(14px, 2.4vw, 18px)',
                      fontWeight: 700,
                      color: textColor,
                    }}
                  >
                    {d.value}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Special requests */}
          {specialRequests && (
            <div
              style={{
                marginTop: 'clamp(10px, 1.8vh, 16px)',
                padding: 'clamp(8px, 1.5vh, 14px)',
                background: `${accentColor}06`,
                borderRadius: 8,
                opacity: getDetailProgress(4),
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(9px, 1.3vw, 10px)',
                  fontWeight: 700,
                  color: accentColor,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: 3,
                }}
              >
                Special Requests
              </div>
              <div
                style={{
                  fontSize: 'clamp(11px, 1.7vw, 13px)',
                  color: `${textColor}BB`,
                  fontStyle: 'italic',
                }}
              >
                {specialRequests}
              </div>
            </div>
          )}

          {/* Confirmed seal */}
          <div
            style={{
              position: 'absolute',
              top: 'clamp(14px, 2.5vh, 22px)',
              right: 'clamp(14px, 2.5vw, 22px)',
              transform: `scale(${sealEnter}) rotate(-12deg)`,
              opacity: sealEnter,
            }}
          >
            <div
              style={{
                border: `2px solid ${accentColor}`,
                borderRadius: '50%',
                width: 'clamp(40px, 7vw, 55px)',
                height: 'clamp(40px, 7vw, 55px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(7px, 1.1vw, 9px)',
                fontWeight: 900,
                color: accentColor,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Confirmed
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-table-reservation',
  title: 'Table Reservation',
  description: 'Elegant restaurant reservation card with guest details, date/time icons, confirmed seal stamp, and warm gold accents',
  tags: ['scene', 'food', 'restaurant', 'reservation', 'booking', 'dining', 'table'],
  category: 'scene-layout',
  component: SceneTableReservationComponent as any,
  defaultConfig: {
    restaurantName: 'The Golden Fork',
    guestName: 'John & Sarah',
    date: 'Saturday, March 22',
    time: '7:30 PM',
    partySize: '4 guests',
    specialRequests: 'Window table preferred, anniversary dinner',
    bgColor: '#FAF6F0',
    cardColor: '#FFFFFF',
    accentColor: '#B8860B',
    textColor: '#2C1810',
  },
  configSchema: [
    { key: 'restaurantName', label: 'Restaurant', type: 'text', defaultValue: 'The Golden Fork', group: 'Content' },
    { key: 'guestName', label: 'Guest Name', type: 'text', defaultValue: 'John & Sarah', group: 'Content' },
    { key: 'date', label: 'Date', type: 'text', defaultValue: 'Saturday, March 22', group: 'Content' },
    { key: 'time', label: 'Time', type: 'text', defaultValue: '7:30 PM', group: 'Content' },
    { key: 'partySize', label: 'Party Size', type: 'text', defaultValue: '4 guests', group: 'Content' },
    { key: 'specialRequests', label: 'Special Requests', type: 'text', defaultValue: 'Window table preferred, anniversary dinner', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FAF6F0', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#B8860B', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2C1810', group: 'Style' },
  ],
})
