import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SatelliteTrackerConfig {
  satelliteName: string
  orbitType: string
  altitude: string
  speed: string
  inclination: string
  period: string
  signalStatus: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
function easeInCubic(t: number): number { return t * t * t }

function SceneSatelliteTrackerComponent({ config, frame, durationInFrames }: MotionGraphicProps<SatelliteTrackerConfig>) {
  const { satelliteName, orbitType, altitude, speed, inclination, period, signalStatus, bgColor, textColor, accentColor } = config
  const progress = frame / durationInFrames

  // Earth circle appears (0.02-0.18)
  const earthScale = easeOutBack(Math.max(0, Math.min(1, (progress - 0.02) / 0.16)))

  // Orbit path draws (0.1-0.3)
  const orbitDraw = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.1) / 0.2)))

  // Satellite moves along orbit continuously
  const satAngle = progress * Math.PI * 4

  // Name + data (0.2-0.55)
  const nameFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.2) / 0.12)))
  const typeFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.26) / 0.1)))
  const altFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.32) / 0.1)))
  const speedFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.38) / 0.1)))
  const incFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.44) / 0.1)))
  const perFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.5) / 0.1)))

  // Signal bars animate (0.55-0.7)
  const signalFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.55) / 0.15)))
  const isGood = signalStatus.toLowerCase() === 'strong' || signalStatus.toLowerCase() === 'good'
  const signalColor = isGood ? '#22C55E' : '#FFD700'

  // Signal pulse during hold
  const signalPulse = progress >= 0.6 && progress < 0.8 ? Math.sin(((progress - 0.6) / 0.2) * Math.PI * 8) * 0.3 + 0.7 : 1

  // Exit
  const exitProg = progress >= 0.85 ? easeInCubic((progress - 0.85) / 0.15) : 0

  // Orbit ellipse params
  const orbitRx = 28
  const orbitRy = 10

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        opacity: 1 - exitProg,
      }}
    >
      {/* Stars */}
      {Array.from({ length: 30 }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${((i * 73 + 17) % 100)}%`,
            top: `${((i * 41 + 29) % 100)}%`,
            width: 1 + ((i * 11) % 2),
            height: 1 + ((i * 11) % 2),
            borderRadius: '50%',
            background: '#FFFFFF',
            opacity: 0.15 + ((i * 23) % 5) / 20,
          }}
        />
      ))}

      {/* Earth + orbit visualization */}
      <div
        style={{
          position: 'absolute',
          top: '25%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${earthScale})`,
        }}
      >
        {/* Earth */}
        <div
          style={{
            width: 'clamp(60px, 16vw, 110px)',
            height: 'clamp(60px, 16vw, 110px)',
            borderRadius: '50%',
            background: `radial-gradient(circle at 40% 35%, #4488CC, #226699, #1A4466)`,
            boxShadow: '0 0 30px rgba(68,136,204,0.2), inset -8px -8px 20px rgba(0,0,0,0.3)',
            position: 'relative',
          }}
        >
          {/* Land masses (abstract) */}
          <div
            style={{
              position: 'absolute',
              top: '25%',
              left: '30%',
              width: '30%',
              height: '20%',
              borderRadius: '40%',
              background: '#3D8B37',
              opacity: 0.6,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '20%',
              height: '25%',
              borderRadius: '30%',
              background: '#3D8B37',
              opacity: 0.5,
            }}
          />
        </div>

        {/* Orbit ellipse */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: `${orbitRx * 2}vw`,
            height: `${orbitRy * 2}vw`,
            border: `1px dashed ${accentColor}25`,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%) rotateX(60deg)',
            opacity: orbitDraw,
          }}
        />

        {/* Satellite dot */}
        <div
          style={{
            position: 'absolute',
            left: `${50 + Math.cos(satAngle) * orbitRx}%`,
            top: `${50 + Math.sin(satAngle) * orbitRy * 0.3}%`,
            width: 8,
            height: 8,
            background: accentColor,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 0 12px ${accentColor}80, 0 0 24px ${accentColor}30`,
            opacity: orbitDraw,
          }}
        >
          {/* Signal rings */}
          {[1, 2].map(r => (
            <div
              key={r}
              style={{
                position: 'absolute',
                inset: -(r * 6),
                border: `1px solid ${accentColor}${Math.round(15 / r).toString(16)}`,
                borderRadius: '50%',
                opacity: signalPulse,
              }}
            />
          ))}
        </div>
      </div>

      {/* Info panel - bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: '5%',
          left: '50%',
          transform: `translateX(-50%) scale(${1 - exitProg * 0.1})`,
          width: '84%',
          maxWidth: 500,
        }}
      >
        {/* Satellite name */}
        <div
          style={{
            fontSize: 'clamp(22px, 5.5vw, 42px)',
            fontWeight: 900,
            color: textColor,
            marginBottom: 'clamp(2px, 0.5vw, 4px)',
            opacity: nameFade,
            transform: `translateX(${(1 - nameFade) * 30}px)`,
          }}
        >
          {satelliteName}
        </div>

        {/* Orbit type */}
        <div
          style={{
            fontSize: 'clamp(11px, 2.2vw, 18px)',
            color: accentColor,
            fontWeight: 600,
            marginBottom: 'clamp(10px, 2.5vw, 20px)',
            opacity: typeFade,
          }}
        >
          {orbitType}
        </div>

        <div style={{ width: `${typeFade * 40}%`, height: 1, background: `${accentColor}30`, marginBottom: 'clamp(10px, 2.5vw, 18px)' }} />

        {/* Data grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'clamp(8px, 2vw, 16px)',
            marginBottom: 'clamp(12px, 3vw, 24px)',
          }}
        >
          {[
            { label: 'ALTITUDE', value: altitude, fade: altFade },
            { label: 'SPEED', value: speed, fade: speedFade },
            { label: 'INCLINATION', value: inclination, fade: incFade },
            { label: 'PERIOD', value: period, fade: perFade },
          ].map((item, i) => (
            <div key={i} style={{ opacity: item.fade, transform: `translateY(${(1 - item.fade) * 8}px)` }}>
              <div style={{ fontSize: 'clamp(9px, 1.5vw, 11px)', color: `${textColor}40`, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 'clamp(14px, 3vw, 22px)', color: textColor, fontWeight: 700 }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Signal status with bars */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 2vw, 14px)',
            opacity: signalFade,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
            {[1, 2, 3, 4].map(bar => (
              <div
                key={bar}
                style={{
                  width: 'clamp(3px, 0.6vw, 5px)',
                  height: bar * 5,
                  borderRadius: 2,
                  background: bar <= 3 ? signalColor : `${textColor}20`,
                  opacity: signalPulse,
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: 'clamp(11px, 2vw, 16px)', color: signalColor, fontWeight: 700 }}>
            {signalStatus}
          </span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-satellite-tracker',
  title: 'Satellite Tracker',
  description: 'Satellite orbit tracker with Earth visualization, orbiting satellite dot, signal rings, and orbital data grid',
  tags: ['scene', 'science', 'space', 'satellite', 'orbit', 'tracker', 'hud'],
  category: 'scene-layout',
  component: SceneSatelliteTrackerComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'satelliteName', label: 'Satellite Name', type: 'text', defaultValue: 'ISS Zarya', group: 'Content' },
    { key: 'orbitType', label: 'Orbit Type', type: 'text', defaultValue: 'Low Earth Orbit (LEO)', group: 'Content' },
    { key: 'altitude', label: 'Altitude', type: 'text', defaultValue: '408 km', group: 'Content' },
    { key: 'speed', label: 'Speed', type: 'text', defaultValue: '27,600 km/h', group: 'Content' },
    { key: 'inclination', label: 'Inclination', type: 'text', defaultValue: '51.6 deg', group: 'Content' },
    { key: 'period', label: 'Period', type: 'text', defaultValue: '92.65 min', group: 'Content' },
    { key: 'signalStatus', label: 'Signal Status', type: 'text', defaultValue: 'Strong', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#64D8FF', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060a14', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8E8E8', group: 'Style' },
  ],
  defaultConfig: {
    satelliteName: 'ISS Zarya',
    orbitType: 'Low Earth Orbit (LEO)',
    altitude: '408 km',
    speed: '27,600 km/h',
    inclination: '51.6 deg',
    period: '92.65 min',
    signalStatus: 'Strong',
    accentColor: '#64D8FF',
    bgColor: '#060a14',
    textColor: '#E8E8E8',
  },
})
