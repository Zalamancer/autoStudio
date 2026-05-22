import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneVenueMapConfig {
  venueName: string
  eventName: string
  section1: string
  section2: string
  section3: string
  yourSection: string
  yourSeat: string
  bgColor: string
  cardColor: string
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

function SceneVenueMapComponent({ config, progress, frame, fps }: MotionGraphicProps<SceneVenueMapConfig>) {
  const { venueName, eventName, section1, section2, section3, yourSection, yourSeat, bgColor, cardColor, accentColor, textColor } = config
  const time = frame / fps

  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const cardScale = easeOutBack(Math.min(1, enterProgress / 0.5))
  const cardOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Map sections reveal
  const mapOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.4)))

  // Your seat pulses
  const seatPulse = 0.7 + 0.3 * Math.sin(time * 4)

  // Info stagger
  const infoOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.35)))

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.12

  // Section colors
  const sectionColors = ['#8B5CF6', '#3B82F6', '#10B981']

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 40%, ${accentColor}08 0%, transparent 50%)` }} />

      <div style={{
        width: 'clamp(280px, 72vw, 460px)',
        background: cardColor,
        borderRadius: 'clamp(14px, 3vw, 22px)',
        padding: 'clamp(20px, 4vw, 34px)',
        transform: `scale(${cardScale * exitScale})`,
        opacity: cardOpacity * exitOpacity,
        boxShadow: `0 16px 50px rgba(0,0,0,0.4)`,
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(14px, 3vw, 24px)' }}>
          <div style={{ fontSize: 'clamp(10px, 1.6vw, 13px)', fontWeight: 600, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 4, opacity: cardOpacity }}>
            VENUE MAP
          </div>
          <div style={{ fontSize: 'clamp(18px, 3.5vw, 26px)', fontWeight: 800, color: textColor, marginBottom: 2, opacity: easeOutCubic(Math.max(0, Math.min(1, enterProgress / 0.4))) }}>
            {venueName}
          </div>
          <div style={{ fontSize: 'clamp(11px, 2vw, 15px)', fontWeight: 500, color: `${textColor}60`, opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.3))) }}>
            {eventName}
          </div>
        </div>

        {/* Venue map visualization */}
        <div style={{ position: 'relative', width: '100%', paddingBottom: '60%', marginBottom: 'clamp(14px, 3vw, 22px)', opacity: mapOp }}>
          {/* Stage */}
          <div style={{
            position: 'absolute', top: '5%', left: '20%', width: '60%', height: '12%',
            background: `linear-gradient(180deg, ${accentColor}40, ${accentColor}20)`,
            borderRadius: '8px 8px 4px 4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${accentColor}50`,
          }}>
            <div style={{ fontSize: 'clamp(8px, 1.4vw, 11px)', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              STAGE
            </div>
          </div>

          {/* Section 1 - center front (curved) */}
          <div style={{
            position: 'absolute', top: '25%', left: '15%', width: '70%', height: '22%',
            background: `${sectionColors[0]}15`, borderRadius: '50% 50% 8px 8px',
            border: `1px solid ${sectionColors[0]}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 'clamp(9px, 1.5vw, 12px)', fontWeight: 600, color: sectionColors[0] }}>
              {section1}
            </div>
          </div>

          {/* Section 2 - left */}
          <div style={{
            position: 'absolute', top: '52%', left: '5%', width: '40%', height: '22%',
            background: `${sectionColors[1]}15`, borderRadius: 8,
            border: `1px solid ${sectionColors[1]}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 'clamp(9px, 1.5vw, 12px)', fontWeight: 600, color: sectionColors[1] }}>
              {section2}
            </div>
          </div>

          {/* Section 3 - right */}
          <div style={{
            position: 'absolute', top: '52%', right: '5%', width: '40%', height: '22%',
            background: `${sectionColors[2]}15`, borderRadius: 8,
            border: `1px solid ${sectionColors[2]}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 'clamp(9px, 1.5vw, 12px)', fontWeight: 600, color: sectionColors[2] }}>
              {section3}
            </div>
          </div>

          {/* Your seat marker (pulsing) */}
          <div style={{
            position: 'absolute', top: '55%', left: '25%',
            width: 'clamp(14px, 2.5vw, 20px)', height: 'clamp(14px, 2.5vw, 20px)',
            borderRadius: '50%', background: accentColor,
            transform: `translate(-50%, -50%) scale(${seatPulse})`,
            boxShadow: `0 0 12px ${accentColor}60, 0 0 24px ${accentColor}30`,
          }} />
          {/* Pulse ring */}
          <div style={{
            position: 'absolute', top: '55%', left: '25%',
            width: 'clamp(30px, 5vw, 42px)', height: 'clamp(30px, 5vw, 42px)',
            borderRadius: '50%', border: `2px solid ${accentColor}`,
            transform: 'translate(-50%, -50%)',
            opacity: (1 - seatPulse) * 2,
          }} />

          {/* Back section */}
          <div style={{
            position: 'absolute', bottom: '2%', left: '10%', width: '80%', height: '16%',
            background: `${textColor}05`, borderRadius: 8,
            border: `1px solid ${textColor}10`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 'clamp(8px, 1.3vw, 10px)', fontWeight: 500, color: `${textColor}30` }}>
              General Admission
            </div>
          </div>
        </div>

        {/* Your seat info */}
        <div style={{
          background: `${accentColor}10`, borderRadius: 12, padding: 'clamp(10px, 2vw, 16px)',
          display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2vw, 16px)',
          opacity: infoOp, border: `1px solid ${accentColor}20`,
        }}>
          {/* Seat icon */}
          <div style={{
            width: 'clamp(36px, 7vw, 48px)', height: 'clamp(36px, 7vw, 48px)',
            borderRadius: 10, background: accentColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'clamp(16px, 3vw, 22px)', color: '#fff', fontWeight: 900, flexShrink: 0,
          }}>
            {'\u2302'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'clamp(9px, 1.4vw, 11px)', fontWeight: 500, color: `${textColor}60`, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              YOUR SEAT
            </div>
            <div style={{ fontSize: 'clamp(14px, 2.8vw, 20px)', fontWeight: 700, color: textColor }}>
              {yourSection} - {yourSeat}
            </div>
          </div>
          <div style={{
            background: `${accentColor}20`, borderRadius: 8,
            padding: 'clamp(4px, 0.8vw, 6px) clamp(8px, 1.5vw, 12px)',
            fontSize: 'clamp(9px, 1.6vw, 12px)', fontWeight: 700, color: accentColor,
          }}>
            CONFIRMED
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-venue-map',
  title: 'Scene Venue Map',
  description: 'Concert venue seating map with stage, sections, pulsing seat marker, and your-seat info card. Event ticketing aesthetic.',
  tags: ['scene', 'music', 'venue', 'map', 'seating', 'concert', 'ticket', 'event', 'festival'],
  category: 'scene-layout',
  component: SceneVenueMapComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    venueName: 'Madison Square Garden',
    eventName: 'Summer Music Festival 2026',
    section1: 'Floor',
    section2: 'Section A',
    section3: 'Section B',
    yourSection: 'Section A',
    yourSeat: 'Row 12, Seat 8',
    bgColor: '#08080C',
    cardColor: '#14142A',
    accentColor: '#F97316',
    textColor: '#F0F0F5',
  },
  configSchema: [
    { key: 'venueName', label: 'Venue Name', type: 'text', defaultValue: 'Madison Square Garden', group: 'Content' },
    { key: 'eventName', label: 'Event Name', type: 'text', defaultValue: 'Summer Music Festival 2026', group: 'Content' },
    { key: 'section1', label: 'Section 1', type: 'text', defaultValue: 'Floor', group: 'Sections' },
    { key: 'section2', label: 'Section 2', type: 'text', defaultValue: 'Section A', group: 'Sections' },
    { key: 'section3', label: 'Section 3', type: 'text', defaultValue: 'Section B', group: 'Sections' },
    { key: 'yourSection', label: 'Your Section', type: 'text', defaultValue: 'Section A', group: 'Content' },
    { key: 'yourSeat', label: 'Your Seat', type: 'text', defaultValue: 'Row 12, Seat 8', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#08080C', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#14142A', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#F97316', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#F0F0F5', group: 'Style' },
  ],
})
