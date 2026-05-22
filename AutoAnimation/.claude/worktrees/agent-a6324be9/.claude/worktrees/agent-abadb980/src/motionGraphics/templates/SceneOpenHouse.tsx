import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OpenHouseConfig {
  headerText: string
  date: string
  time: string
  address: string
  agentName: string
  bgColor: string
  textColor: string
  accentColor: string
  doorColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneOpenHouseComponent({ config, progress }: MotionGraphicProps<OpenHouseConfig>) {
  const { headerText, date, time, address, agentName, bgColor, textColor, accentColor, doorColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Door opening animation (rotateY perspective)
  const doorOpen = easeOutCubic(Math.min(1, enterProgress / 0.6))
  const doorAngle = doorOpen * 75 // opens 75 degrees

  // Header staggers in
  const headerOpacity = easeOutBack(Math.min(1, enterProgress / 0.4))
  const headerY = (1 - headerOpacity) * -30

  // Info elements stagger
  const getStagger = (idx: number): number => {
    const start = 0.25 + idx * 0.15
    return enterProgress > start ? easeOutCubic(Math.min(1, (enterProgress - start) / 0.3)) : 0
  }

  // Warm glow from open door during hold
  const glowPulse = holdProgress > 0 ? 0.3 + Math.sin(holdProgress * Math.PI * 3) * 0.1 : 0

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      {/* Warm gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at 50% 60%, ${accentColor}${Math.round(glowPulse * 25).toString(16).padStart(2, '0')} 0%, transparent 60%)`,
        pointerEvents: 'none',
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
        {/* Header */}
        <div style={{
          fontSize: 'clamp(24px, 5.5vw, 48px)',
          fontWeight: 900,
          color: accentColor,
          letterSpacing: 4,
          textTransform: 'uppercase',
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
          marginBottom: 'clamp(16px, 3vw, 28px)',
          textAlign: 'center',
        }}>
          {headerText}
        </div>

        {/* Door visual */}
        <div style={{
          width: 'clamp(80px, 16vw, 140px)',
          height: 'clamp(120px, 24vw, 200px)',
          perspective: 400,
          marginBottom: 'clamp(16px, 3vw, 28px)',
        }}>
          {/* Door frame */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            border: `3px solid ${textColor}40`,
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            {/* Warm light behind door */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(180deg, ${accentColor}30 0%, ${accentColor}10 100%)`,
              opacity: doorOpen,
            }} />

            {/* Door panel (opens via rotateY) */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: doorColor,
              transformOrigin: 'left center',
              transform: `rotateY(-${doorAngle}deg)`,
              borderRight: `2px solid ${textColor}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingRight: 'clamp(6px, 1.2vw, 12px)',
            }}>
              {/* Door knob */}
              <div style={{
                width: 'clamp(6px, 1.2vw, 10px)',
                height: 'clamp(6px, 1.2vw, 10px)',
                borderRadius: '50%',
                background: accentColor,
                boxShadow: `0 0 6px ${accentColor}60`,
              }} />
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div style={{
          display: 'flex',
          gap: 'clamp(12px, 2.5vw, 24px)',
          marginBottom: 'clamp(8px, 1.5vw, 14px)',
          opacity: getStagger(0),
          transform: `translateY(${(1 - getStagger(0)) * 15}px)`,
        }}>
          <div style={{
            fontSize: 'clamp(14px, 2.5vw, 22px)',
            fontWeight: 700,
            color: textColor,
          }}>
            {date}
          </div>
          <div style={{
            fontSize: 'clamp(14px, 2.5vw, 22px)',
            fontWeight: 700,
            color: accentColor,
          }}>
            {time}
          </div>
        </div>

        {/* Address */}
        <div style={{
          fontSize: 'clamp(12px, 2vw, 18px)',
          fontWeight: 500,
          color: `${textColor}BB`,
          textAlign: 'center',
          opacity: getStagger(1),
          transform: `translateY(${(1 - getStagger(1)) * 15}px)`,
          marginBottom: 'clamp(12px, 2.5vw, 22px)',
        }}>
          {address}
        </div>

        {/* Divider */}
        <div style={{
          width: 'clamp(40px, 8vw, 60px)',
          height: 2,
          background: accentColor,
          opacity: getStagger(2),
          marginBottom: 'clamp(12px, 2.5vw, 22px)',
        }} />

        {/* Agent name */}
        <div style={{
          fontSize: 'clamp(11px, 1.8vw, 16px)',
          fontWeight: 600,
          color: `${textColor}99`,
          letterSpacing: 1,
          textTransform: 'uppercase',
          opacity: getStagger(3),
          transform: `translateY(${(1 - getStagger(3)) * 15}px)`,
        }}>
          {agentName}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-open-house',
  title: 'Open House',
  description: 'Open house announcement with animated door-opening visual, staggered date/time/address info, and warm inviting aesthetic.',
  tags: ['scene', 'real-estate', 'open-house', 'event', 'property', 'agent'],
  category: 'scene-layout',
  component: SceneOpenHouseComponent as any,
  defaultConfig: {
    headerText: 'OPEN HOUSE',
    date: 'Saturday, March 22',
    time: '1:00 PM - 4:00 PM',
    address: '456 Oak Avenue, Pasadena, CA 91101',
    agentName: 'Hosted by Sarah Mitchell',
    bgColor: '#1A1410',
    textColor: '#F5EDE3',
    accentColor: '#E8A84C',
    doorColor: '#5C3D2E',
  },
  configSchema: [
    { key: 'headerText', label: 'Header Text', type: 'text', defaultValue: 'OPEN HOUSE', group: 'Content' },
    { key: 'date', label: 'Date', type: 'text', defaultValue: 'Saturday, March 22', group: 'Content' },
    { key: 'time', label: 'Time', type: 'text', defaultValue: '1:00 PM - 4:00 PM', group: 'Content' },
    { key: 'address', label: 'Address', type: 'text', defaultValue: '456 Oak Avenue, Pasadena, CA 91101', group: 'Content' },
    { key: 'agentName', label: 'Agent Name', type: 'text', defaultValue: 'Hosted by Sarah Mitchell', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1410', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#F5EDE3', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#E8A84C', group: 'Style' },
    { key: 'doorColor', label: 'Door Color', type: 'color', defaultValue: '#5C3D2E', group: 'Style' },
  ],
})
