import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneTicketStubConfig {
  eventName: string
  artistName: string
  venue: string
  date: string
  time: string
  section: string
  seat: string
  price: string
  bgColor: string
  ticketColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneTicketStubComponent({ config, progress, frame, fps }: MotionGraphicProps<SceneTicketStubConfig>) {
  const { eventName, artistName, venue, date, time: eventTime, section, seat, price, bgColor, ticketColor, accentColor, textColor } = config
  const time = frame / fps

  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Ticket slides in from right with rotation
  const ticketSlide = easeOutBack(Math.min(1, enterProgress / 0.6))
  const ticketX = (1 - ticketSlide) * 150
  const ticketRotation = (1 - ticketSlide) * 12 - 2
  const ticketOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Event name
  const nameOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.3)))

  // Details stagger
  const detailsOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.3)))
  const seatOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.3)))

  // Holographic shimmer on hold
  const shimmerAngle = holdProgress * 360
  const shimmerOpacity = 0.05 + 0.03 * Math.sin(time * 3)

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitRotation = exitEased * -8
  const exitY = exitEased * 80

  // Perforated edge dots
  const perfCount = 18

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Ambient spotlight */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 60% 40%, ${accentColor}08 0%, transparent 50%)` }} />

      {/* Ticket container */}
      <div style={{
        display: 'flex',
        transform: `translateX(${ticketX}px) translateY(${exitY}px) rotate(${ticketRotation + exitRotation}deg)`,
        opacity: ticketOpacity * exitOpacity,
      }}>
        {/* Main ticket */}
        <div style={{
          width: 'clamp(240px, 55vw, 380px)',
          background: ticketColor,
          borderRadius: '12px 0 0 12px',
          padding: 'clamp(20px, 4vw, 34px)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
        }}>
          {/* Holographic shimmer */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(${shimmerAngle}deg, transparent 30%, rgba(255,255,255,${shimmerOpacity}) 50%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          {/* Top accent stripe */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 'clamp(3px, 0.6vw, 5px)', background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80)` }} />

          {/* Event label */}
          <div style={{
            fontSize: 'clamp(9px, 1.5vw, 12px)', fontWeight: 600, color: accentColor,
            textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 'clamp(6px, 1.2vw, 10px)',
            opacity: ticketOpacity,
          }}>
            {eventName}
          </div>

          {/* Artist name */}
          <div style={{
            fontSize: 'clamp(22px, 5vw, 38px)', fontWeight: 900, color: textColor,
            textTransform: 'uppercase', lineHeight: 1, letterSpacing: '-0.02em',
            marginBottom: 'clamp(12px, 2.5vw, 20px)', opacity: nameOp,
          }}>
            {artistName}
          </div>

          {/* Venue */}
          <div style={{
            fontSize: 'clamp(11px, 2vw, 15px)', fontWeight: 600, color: `${textColor}CC`,
            marginBottom: 'clamp(4px, 0.8vw, 6px)', opacity: detailsOp,
          }}>
            {venue}
          </div>

          {/* Date + Time row */}
          <div style={{
            display: 'flex', gap: 'clamp(12px, 2.5vw, 20px)',
            marginBottom: 'clamp(14px, 3vw, 22px)', opacity: detailsOp,
          }}>
            <div>
              <div style={{ fontSize: 'clamp(8px, 1.3vw, 10px)', fontWeight: 500, color: `${textColor}60`, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                DATE
              </div>
              <div style={{ fontSize: 'clamp(13px, 2.4vw, 18px)', fontWeight: 700, color: textColor }}>
                {date}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'clamp(8px, 1.3vw, 10px)', fontWeight: 500, color: `${textColor}60`, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                DOORS
              </div>
              <div style={{ fontSize: 'clamp(13px, 2.4vw, 18px)', fontWeight: 700, color: textColor }}>
                {eventTime}
              </div>
            </div>
          </div>

          {/* Section + Seat */}
          <div style={{
            display: 'flex', gap: 'clamp(8px, 1.5vw, 14px)', opacity: seatOp,
          }}>
            <div style={{
              background: `${accentColor}15`, borderRadius: 8,
              padding: 'clamp(6px, 1.2vw, 10px) clamp(10px, 2vw, 16px)',
              flex: 1,
            }}>
              <div style={{ fontSize: 'clamp(8px, 1.3vw, 10px)', fontWeight: 500, color: `${textColor}60`, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Section
              </div>
              <div style={{ fontSize: 'clamp(14px, 2.8vw, 20px)', fontWeight: 800, color: accentColor }}>
                {section}
              </div>
            </div>
            <div style={{
              background: `${accentColor}15`, borderRadius: 8,
              padding: 'clamp(6px, 1.2vw, 10px) clamp(10px, 2vw, 16px)',
              flex: 1,
            }}>
              <div style={{ fontSize: 'clamp(8px, 1.3vw, 10px)', fontWeight: 500, color: `${textColor}60`, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Seat
              </div>
              <div style={{ fontSize: 'clamp(14px, 2.8vw, 20px)', fontWeight: 800, color: accentColor }}>
                {seat}
              </div>
            </div>
          </div>
        </div>

        {/* Perforated edge */}
        <div style={{
          width: 'clamp(2px, 0.4vw, 3px)', position: 'relative',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '4px 0',
        }}>
          {Array.from({ length: perfCount }).map((_, i) => (
            <div key={i} style={{
              width: 'clamp(4px, 0.8vw, 6px)', height: 'clamp(4px, 0.8vw, 6px)',
              borderRadius: '50%', background: bgColor,
              marginLeft: 'clamp(-2px, -0.4vw, -3px)',
            }} />
          ))}
        </div>

        {/* Stub section */}
        <div style={{
          width: 'clamp(80px, 18vw, 120px)',
          background: ticketColor,
          borderRadius: '0 12px 12px 0',
          padding: 'clamp(16px, 3vw, 24px) clamp(10px, 2vw, 16px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
        }}>
          {/* Holographic shimmer on stub */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(${shimmerAngle + 45}deg, transparent 30%, rgba(255,255,255,${shimmerOpacity}) 50%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          <div style={{
            fontSize: 'clamp(8px, 1.3vw, 10px)', fontWeight: 600, color: `${textColor}50`,
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'clamp(6px, 1.2vw, 10px)',
            writingMode: 'vertical-rl', textOrientation: 'mixed',
            opacity: seatOp,
          }}>
            ADMIT ONE
          </div>

          <div style={{
            fontSize: 'clamp(16px, 3.5vw, 24px)', fontWeight: 900, color: accentColor,
            marginBottom: 'clamp(4px, 0.8vw, 6px)', opacity: seatOp,
          }}>
            {price}
          </div>

          {/* Barcode simulation */}
          <div style={{
            display: 'flex', gap: 1, alignItems: 'flex-end', height: 'clamp(24px, 5vw, 36px)',
            opacity: seatOp * 0.5,
          }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{
                width: i % 3 === 0 ? 2 : 1,
                height: `${50 + (i * 17 + 23) % 50}%`,
                background: textColor,
                borderRadius: 0.5,
              }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-ticket-stub',
  title: 'Scene Ticket Stub',
  description: 'Concert ticket stub design with perforated edge, event details, seat info, price, barcode, and holographic shimmer. Event ticketing aesthetic.',
  tags: ['scene', 'music', 'ticket', 'stub', 'concert', 'event', 'admission', 'festival'],
  category: 'scene-layout',
  component: SceneTicketStubComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    eventName: 'SUMMER FEST 2026',
    artistName: 'THE MIDNIGHT',
    venue: 'Madison Square Garden',
    date: 'JUL 15',
    time: '7:00 PM',
    section: 'A12',
    seat: '24',
    price: '$85',
    bgColor: '#0A0A10',
    ticketColor: '#1C1C2E',
    accentColor: '#FF6B35',
    textColor: '#F0F0F5',
  },
  configSchema: [
    { key: 'eventName', label: 'Event Name', type: 'text', defaultValue: 'SUMMER FEST 2026', group: 'Content' },
    { key: 'artistName', label: 'Artist', type: 'text', defaultValue: 'THE MIDNIGHT', group: 'Content' },
    { key: 'venue', label: 'Venue', type: 'text', defaultValue: 'Madison Square Garden', group: 'Content' },
    { key: 'date', label: 'Date', type: 'text', defaultValue: 'JUL 15', group: 'Content' },
    { key: 'time', label: 'Time', type: 'text', defaultValue: '7:00 PM', group: 'Content' },
    { key: 'section', label: 'Section', type: 'text', defaultValue: 'A12', group: 'Content' },
    { key: 'seat', label: 'Seat', type: 'text', defaultValue: '24', group: 'Content' },
    { key: 'price', label: 'Price', type: 'text', defaultValue: '$85', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A10', group: 'Style' },
    { key: 'ticketColor', label: 'Ticket Color', type: 'color', defaultValue: '#1C1C2E', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#FF6B35', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#F0F0F5', group: 'Style' },
  ],
})
