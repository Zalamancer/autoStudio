import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AirQualityConfig {
  aqiValue: number
  location: string
  pm25: number
  pm10: number
  o3: number
  no2: number
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function getAqiInfo(aqi: number): { label: string; color: string; emoji: string } {
  if (aqi <= 50) return { label: 'Good', color: '#4CAF50', emoji: '\u{1F7E2}' }
  if (aqi <= 100) return { label: 'Moderate', color: '#FFC107', emoji: '\u{1F7E1}' }
  if (aqi <= 150) return { label: 'Unhealthy (SG)', color: '#FF9800', emoji: '\u{1F7E0}' }
  if (aqi <= 200) return { label: 'Unhealthy', color: '#F44336', emoji: '\u{1F534}' }
  if (aqi <= 300) return { label: 'Very Unhealthy', color: '#9C27B0', emoji: '\u{1F7E3}' }
  return { label: 'Hazardous', color: '#880E4F', emoji: '\u26D4' }
}

function SceneAirQualityComponent({ config, progress }: MotionGraphicProps<AirQualityConfig>) {
  const { aqiValue, location, pm25, pm10, o3, no2, bgColor, textColor } = config
  const aqiInfo = getAqiInfo(aqiValue)

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // AQI gauge animation
  const gaugeProg = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.5)))
  const displayAqi = Math.round(gaugeProg * aqiValue)
  const needleAngle = -90 + (gaugeProg * Math.min(aqiValue, 300) / 300) * 180

  // Badge pop
  const badgePop = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.3)))

  // Pollutant cards
  const pollutants = [
    { label: 'PM2.5', value: pm25, unit: '\u00B5g/m\u00B3' },
    { label: 'PM10', value: pm10, unit: '\u00B5g/m\u00B3' },
    { label: 'O\u2083', value: o3, unit: 'ppb' },
    { label: 'NO\u2082', value: no2, unit: 'ppb' },
  ]
  const getPollutantProg = (idx: number) =>
    easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5 - idx * 0.07) / 0.3)))

  // Pulse
  const gaugePulse = progress >= 0.2 && progress < 0.8
    ? 1 + Math.sin(holdProgress * Math.PI * 5) * 0.015
    : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      {/* Subtle colored gradient based on AQI */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 30%, ${aqiInfo.color}12, transparent 60%)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '5%',
          opacity: exitOpacity,
          transform: `scale(${exitProgress > 0 ? 1 - exitEased * 0.08 : 1})`,
        }}
      >
        {/* Location */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.6vw, 13px)',
            fontWeight: 600,
            color: `${textColor}88`,
            marginBottom: 'clamp(4px, 0.8vh, 8px)',
            opacity: easeOutCubic(Math.min(1, enterProgress / 0.3)),
          }}
        >
          \u{1F4CD} {location}
        </div>

        {/* AQI Gauge */}
        <div
          style={{
            position: 'relative',
            width: 'clamp(160px, 36vw, 240px)',
            height: 'clamp(90px, 20vw, 130px)',
            marginBottom: 'clamp(8px, 1.5vh, 14px)',
            transform: `scale(${gaugePulse})`,
          }}
        >
          <svg viewBox="0 0 200 110" style={{ width: '100%', height: '100%' }}>
            {/* Gauge arc background */}
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={`${textColor}15`} strokeWidth="12" strokeLinecap="round" />
            {/* Gauge arc colored */}
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={aqiInfo.color} strokeWidth="12" strokeLinecap="round"
              strokeDasharray={`${gaugeProg * 251} 251`}
              style={{ filter: `drop-shadow(0 0 6px ${aqiInfo.color}50)` }}
            />
            {/* Needle */}
            <line
              x1="100" y1="100" x2="100" y2="35"
              stroke={textColor} strokeWidth="2" strokeLinecap="round"
              transform={`rotate(${needleAngle} 100 100)`}
            />
            <circle cx="100" cy="100" r="4" fill={textColor} />
          </svg>

          {/* AQI number */}
          <div
            style={{
              position: 'absolute',
              bottom: '0',
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 'clamp(28px, 7vw, 48px)', fontWeight: 900, color: aqiInfo.color, lineHeight: 1 }}>
              {displayAqi}
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'clamp(4px, 0.8vw, 8px)',
            background: `${aqiInfo.color}20`,
            border: `1.5px solid ${aqiInfo.color}40`,
            borderRadius: '100px',
            padding: 'clamp(4px, 0.8vw, 8px) clamp(12px, 2.5vw, 20px)',
            marginBottom: 'clamp(14px, 2.5vh, 24px)',
            transform: `scale(${badgePop})`,
          }}
        >
          <span style={{ fontSize: 'clamp(12px, 2.5vw, 16px)' }}>{aqiInfo.emoji}</span>
          <span style={{ fontSize: 'clamp(12px, 2vw, 16px)', fontWeight: 700, color: aqiInfo.color }}>
            {aqiInfo.label}
          </span>
        </div>

        {/* Pollutant grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 'clamp(6px, 1vw, 10px)', width: '100%', maxWidth: '400px' }}>
          {pollutants.map((p, i) => {
            const pProg = getPollutantProg(i)
            return (
              <div
                key={i}
                style={{
                  textAlign: 'center',
                  opacity: pProg,
                  transform: `translateY(${(1 - pProg) * 12}px)`,
                }}
              >
                <div style={{ fontSize: 'clamp(9px, 1.3vw, 11px)', color: `${textColor}66`, fontWeight: 600, marginBottom: '2px' }}>
                  {p.label}
                </div>
                <div style={{ fontSize: 'clamp(16px, 3.5vw, 24px)', fontWeight: 800, color: textColor }}>
                  {Math.round(pProg * p.value)}
                </div>
                <div style={{ fontSize: 'clamp(8px, 1.1vw, 10px)', color: `${textColor}55`, fontWeight: 500 }}>
                  {p.unit}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-air-quality',
  title: 'Air Quality',
  description: 'Air quality index display with animated semicircle gauge, rotating needle, status badge, and pollutant breakdowns.',
  tags: ['scene', 'air', 'quality', 'pollution', 'eco', 'environment', 'health', 'aqi'],
  category: 'scene-layout',
  component: SceneAirQualityComponent as any,
  defaultConfig: {
    aqiValue: 72,
    location: 'San Francisco, CA',
    pm25: 18,
    pm10: 32,
    o3: 45,
    no2: 22,
    bgColor: '#0D1A20',
    textColor: '#E0F7FA',
  },
  configSchema: [
    { key: 'aqiValue', label: 'AQI Value', type: 'number', defaultValue: 72, min: 0, max: 500, group: 'Content' },
    { key: 'location', label: 'Location', type: 'text', defaultValue: 'San Francisco, CA', group: 'Content' },
    { key: 'pm25', label: 'PM2.5', type: 'number', defaultValue: 18, min: 0, max: 999, group: 'Content' },
    { key: 'pm10', label: 'PM10', type: 'number', defaultValue: 32, min: 0, max: 999, group: 'Content' },
    { key: 'o3', label: 'O3 (ppb)', type: 'number', defaultValue: 45, min: 0, max: 999, group: 'Content' },
    { key: 'no2', label: 'NO2 (ppb)', type: 'number', defaultValue: 22, min: 0, max: 999, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D1A20', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E0F7FA', group: 'Style' },
  ],
})
