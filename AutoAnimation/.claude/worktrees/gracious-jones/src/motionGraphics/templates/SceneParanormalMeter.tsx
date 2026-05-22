import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneParanormalMeterConfig {
  locationName: string
  activityLevel: number
  emfReading: number
  temperature: string
  status: string
  bgColor: string
  textColor: string
  dangerColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function SceneParanormalMeterComponent({ config, progress, frame }: MotionGraphicProps<SceneParanormalMeterConfig>) {
  const { locationName, activityLevel, emfReading, temperature, status, bgColor, textColor, dangerColor } = config
  const f = frame ?? 0

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Meter needle fluctuation
  const meterTarget = activityLevel / 10
  const meterValue = enterProgress < 1
    ? easeOutCubic(enterProgress) * meterTarget
    : meterTarget + Math.sin(f * 0.08) * 0.05 + rand(Math.floor(f / 3)) * 0.03

  const needleAngle = -90 + meterValue * 180 // -90 to 90 degrees

  // Static/interference overlay
  const staticIntensity = 0.03 + (meterValue > 0.7 ? (meterValue - 0.7) * 0.15 : 0)
  const staticLines = Array.from({ length: 5 }, (_, i) => {
    const lineY = rand(f * 7 + i * 31) * 100
    return (
      <div
        key={`static-${i}`}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${lineY}%`,
          height: 1,
          background: 'rgba(255,255,255,0.05)',
          opacity: staticIntensity * 10,
        }}
      />
    )
  })

  // Danger level colors
  const getMeterColor = (val: number) => {
    if (val < 0.3) return '#22AA44'
    if (val < 0.6) return '#DDAA00'
    if (val < 0.8) return '#DD6600'
    return dangerColor
  }

  const meterColor = getMeterColor(meterValue)
  const isHighActivity = meterValue > 0.7
  const alertFlash = isHighActivity ? (f % 20 < 10 ? 1 : 0.6) : 1

  const cardEnter = easeOutCubic(enterProgress)
  const detailsEnter = easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6))

  // EMF bar segments
  const emfSegments = 5
  const emfFilled = Math.round((emfReading / 5) * emfSegments * easeOutCubic(enterProgress))

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      {/* Static overlay */}
      {staticLines}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6%',
          opacity: exitOpacity,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1.5vw, 12px)',
            marginBottom: 'clamp(6px, 1.5vw, 12px)',
            opacity: cardEnter,
          }}
        >
          <span style={{ fontSize: 'clamp(14px, 3vw, 22px)' }}>{'\ud83d\udd2e'}</span>
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(10px, 2vw, 15px)',
              fontWeight: 700,
              color: meterColor,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              opacity: alertFlash,
            }}
          >
            Paranormal Activity
          </span>
        </div>

        {/* Card */}
        <div
          style={{
            width: 'clamp(280px, 75vw, 460px)',
            background: 'rgba(8, 10, 18, 0.85)',
            borderRadius: 'clamp(10px, 2.5vw, 18px)',
            border: `1px solid ${meterColor}33`,
            padding: 'clamp(18px, 4.5vw, 36px)',
            opacity: cardEnter,
            boxShadow: `0 0 30px ${meterColor}10, inset 0 0 20px rgba(0,0,0,0.3)`,
          }}
        >
          {/* Location */}
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(14px, 3vw, 22px)', fontWeight: 700, color: textColor, marginBottom: 'clamp(4px, 1vw, 8px)' }}>
            {locationName}
          </div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(9px, 1.6vw, 12px)', color: `${textColor}55`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'clamp(14px, 3.5vw, 24px)' }}>
            Live Monitoring
          </div>

          {/* Meter arc */}
          <div style={{ position: 'relative', width: '100%', height: 'clamp(70px, 18vw, 120px)', marginBottom: 'clamp(14px, 3.5vw, 24px)', display: 'flex', justifyContent: 'center' }}>
            {/* Arc background */}
            <svg width="200" height="110" viewBox="0 0 200 110" style={{ maxWidth: '100%' }}>
              {/* Background arc */}
              <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" strokeLinecap="round" />
              {/* Colored arc (filled portion) */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke={meterColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${meterValue * 252} 252`}
                opacity={0.8}
              />
              {/* Needle */}
              <line
                x1="100"
                y1="100"
                x2={100 + Math.cos((needleAngle * Math.PI) / 180) * 65}
                y2={100 + Math.sin((needleAngle * Math.PI) / 180) * 65}
                stroke={textColor}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="100" cy="100" r="4" fill={meterColor} />
              {/* Labels */}
              <text x="15" y="108" fill={`${textColor}44`} fontSize="8" fontFamily="Inter, sans-serif">LOW</text>
              <text x="160" y="108" fill={`${textColor}44`} fontSize="8" fontFamily="Inter, sans-serif">HIGH</text>
            </svg>
            {/* Activity level number */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                fontSize: 'clamp(20px, 5vw, 36px)',
                fontWeight: 800,
                color: meterColor,
                textShadow: `0 0 15px ${meterColor}44`,
              }}
            >
              {(meterValue * 10).toFixed(1)}
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'clamp(8px, 2vw, 16px)', opacity: detailsEnter }}>
            {/* EMF */}
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(8px, 1.4vw, 10px)', color: `${textColor}44`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>EMF</div>
              <div style={{ display: 'flex', gap: 3 }}>
                {Array.from({ length: emfSegments }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 'clamp(16px, 4vw, 28px)',
                      height: 'clamp(6px, 1.5vw, 10px)',
                      borderRadius: 2,
                      background: i < emfFilled ? (i < 3 ? '#22AA44' : i < 4 ? '#DDAA00' : dangerColor) : 'rgba(255,255,255,0.06)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Temperature */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(8px, 1.4vw, 10px)', color: `${textColor}44`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Temp</div>
              <div style={{ fontFamily: "'SF Mono', monospace", fontSize: 'clamp(12px, 2.5vw, 18px)', fontWeight: 700, color: '#4488CC' }}>{temperature}</div>
            </div>

            {/* Status */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(8px, 1.4vw, 10px)', color: `${textColor}44`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Status</div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(10px, 2vw, 14px)', fontWeight: 700, color: meterColor, opacity: alertFlash }}>{status}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-paranormal-meter',
  title: 'Paranormal Activity Meter',
  description: 'EMF paranormal activity meter with animated needle, static interference, activity level, temperature, and danger indicators',
  tags: ['scene', 'horror', 'paranormal', 'EMF', 'ghost', 'meter', 'investigation', 'creepy'],
  category: 'scene-layout',
  component: SceneParanormalMeterComponent as any,
  defaultConfig: {
    locationName: 'Abandoned Asylum - Ward 7',
    activityLevel: 7.8,
    emfReading: 4,
    temperature: '-2.4\u00b0C',
    status: 'DANGER',
    bgColor: '#060810',
    textColor: '#d0d8e8',
    dangerColor: '#CC0000',
  },
  configSchema: [
    { key: 'locationName', label: 'Location', type: 'text', defaultValue: 'Abandoned Asylum - Ward 7', group: 'Content' },
    { key: 'activityLevel', label: 'Activity Level (0-10)', type: 'number', defaultValue: 7.8, min: 0, max: 10, group: 'Content' },
    { key: 'emfReading', label: 'EMF Reading (0-5)', type: 'number', defaultValue: 4, min: 0, max: 5, group: 'Content' },
    { key: 'temperature', label: 'Temperature', type: 'text', defaultValue: '-2.4\u00b0C', group: 'Content' },
    { key: 'status', label: 'Status', type: 'text', defaultValue: 'DANGER', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060810', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#d0d8e8', group: 'Style' },
    { key: 'dangerColor', label: 'Danger Color', type: 'color', defaultValue: '#CC0000', group: 'Style' },
  ],
})
