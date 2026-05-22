import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WeatherStationConfig {
  stationName: string
  temperature: string
  humidity: string
  windSpeed: string
  pressure: string
  condition: string
  visibility: string
  uvIndex: string
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

function SceneWeatherStationComponent({ config, frame, durationInFrames }: MotionGraphicProps<WeatherStationConfig>) {
  const { stationName, temperature, humidity, windSpeed, pressure, condition, visibility, uvIndex, bgColor, textColor, accentColor } = config
  const progress = frame / durationInFrames

  // Gauge/thermometer animation (0.02-0.2)
  const gaugeFill = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.02) / 0.18)))

  // Station name (0.08-0.2)
  const nameFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.08) / 0.12)))

  // Temperature big number (0.14-0.28)
  const tempFade = easeOutBack(Math.max(0, Math.min(1, (progress - 0.14) / 0.14)))

  // Condition label (0.22-0.32)
  const condFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.22) / 0.1)))

  // Data grid (0.3-0.58)
  const humFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.3) / 0.1)))
  const windFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.36) / 0.1)))
  const pressFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.42) / 0.1)))
  const visFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.48) / 0.1)))
  const uvFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.54) / 0.1)))

  // Wind indicator rotation during hold
  const windAngle = progress * 360 * 0.5

  // Humidity bar pulse
  const humPulse = progress >= 0.6 && progress < 0.8 ? Math.sin(((progress - 0.6) / 0.2) * Math.PI * 4) * 0.05 : 0

  // Exit
  const exitProg = progress >= 0.85 ? easeInCubic((progress - 0.85) / 0.15) : 0

  // UV color
  const uvNum = parseInt(uvIndex)
  const uvColor = isNaN(uvNum) ? accentColor : uvNum <= 2 ? '#22C55E' : uvNum <= 5 ? '#FFD700' : uvNum <= 7 ? '#FF9F43' : '#EF4444'

  const dataItems = [
    { label: 'HUMIDITY', value: humidity, fade: humFade, showBar: true },
    { label: 'WIND', value: windSpeed, fade: windFade, showBar: false },
    { label: 'PRESSURE', value: pressure, fade: pressFade, showBar: false },
    { label: 'VISIBILITY', value: visibility, fade: visFade, showBar: false },
  ]

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 1 - exitProg,
        transform: `scale(${1 - exitProg * 0.12})`,
      }}
    >
      {/* Background gradient representing sky */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: `linear-gradient(180deg, ${accentColor}08, transparent)`,
        }}
      />

      {/* Decorative circles (weather data rings) */}
      {[1, 2, 3].map(r => (
        <div
          key={r}
          style={{
            position: 'absolute',
            right: `${-5 + r * 3}%`,
            top: `${5 + r * 5}%`,
            width: `clamp(${40 + r * 30}px, ${10 + r * 8}vw, ${80 + r * 50}px)`,
            height: `clamp(${40 + r * 30}px, ${10 + r * 8}vw, ${80 + r * 50}px)`,
            border: `1px solid ${accentColor}08`,
            borderRadius: '50%',
            opacity: gaugeFill,
          }}
        />
      ))}

      {/* Main card */}
      <div
        style={{
          width: '84%',
          maxWidth: 480,
          padding: 'clamp(20px, 5vw, 40px)',
        }}
      >
        {/* Station name */}
        <div
          style={{
            fontSize: 'clamp(10px, 2vw, 16px)',
            color: `${textColor}50`,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: 'clamp(6px, 1.5vw, 12px)',
            opacity: nameFade,
          }}
        >
          {stationName}
        </div>

        {/* Temperature */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'clamp(4px, 1vw, 8px)',
            marginBottom: 'clamp(4px, 1vw, 8px)',
            opacity: tempFade,
            transform: `scale(${tempFade})`,
            transformOrigin: 'left center',
          }}
        >
          <span
            style={{
              fontSize: 'clamp(48px, 14vw, 96px)',
              fontWeight: 900,
              color: textColor,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {temperature}
          </span>
        </div>

        {/* Condition */}
        <div
          style={{
            fontSize: 'clamp(16px, 4vw, 28px)',
            color: accentColor,
            fontWeight: 600,
            marginBottom: 'clamp(16px, 4vw, 32px)',
            opacity: condFade,
            transform: `translateX(${(1 - condFade) * 20}px)`,
          }}
        >
          {condition}
        </div>

        {/* Divider */}
        <div
          style={{
            width: `${condFade * 50}%`,
            height: 1,
            background: `${accentColor}30`,
            marginBottom: 'clamp(16px, 4vw, 28px)',
          }}
        />

        {/* Data grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'clamp(12px, 3vw, 22px)',
            marginBottom: 'clamp(14px, 3.5vw, 28px)',
          }}
        >
          {dataItems.map((item, i) => (
            <div key={i} style={{ opacity: item.fade, transform: `translateY(${(1 - item.fade) * 8}px)` }}>
              <div style={{ fontSize: 'clamp(9px, 1.5vw, 11px)', color: `${textColor}40`, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 'clamp(16px, 3.5vw, 26px)', color: textColor, fontWeight: 700 }}>
                {item.value}
              </div>
              {/* Humidity bar */}
              {item.showBar && (
                <div
                  style={{
                    width: '100%',
                    height: 4,
                    background: `${textColor}10`,
                    borderRadius: 4,
                    marginTop: 6,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${(item.fade + humPulse) * 72}%`,
                      height: '100%',
                      background: accentColor,
                      borderRadius: 4,
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* UV Index bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 2vw, 14px)',
            opacity: uvFade,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(9px, 1.5vw, 11px)',
              color: `${textColor}40`,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            UV INDEX
          </div>
          <div
            style={{
              display: 'flex',
              gap: 3,
            }}
          >
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 'clamp(4px, 0.8vw, 7px)',
                  height: 'clamp(14px, 2.5vw, 22px)',
                  borderRadius: 2,
                  background: i < (isNaN(uvNum) ? 3 : uvNum) ? uvColor : `${textColor}12`,
                  opacity: uvFade,
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: 'clamp(13px, 2.5vw, 20px)', fontWeight: 800, color: uvColor }}>
            {uvIndex}
          </span>
        </div>

        {/* Wind direction indicator */}
        <div
          style={{
            position: 'absolute',
            top: '12%',
            right: '10%',
            width: 'clamp(36px, 9vw, 60px)',
            height: 'clamp(36px, 9vw, 60px)',
            borderRadius: '50%',
            border: `1px solid ${accentColor}20`,
            opacity: windFade,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Arrow */}
          <div
            style={{
              width: 2,
              height: '60%',
              background: `linear-gradient(180deg, ${accentColor}, transparent)`,
              transform: `rotate(${windAngle}deg)`,
              transformOrigin: '50% 80%',
              borderRadius: 2,
            }}
          />
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-weather-station',
  title: 'Weather Station',
  description: 'Weather station readings display with temperature, condition, humidity bar, wind indicator, UV index, and data grid',
  tags: ['scene', 'science', 'weather', 'meteorology', 'station', 'data', 'temperature'],
  category: 'scene-layout',
  component: SceneWeatherStationComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'stationName', label: 'Station Name', type: 'text', defaultValue: 'Station Alpha-7', group: 'Content' },
    { key: 'temperature', label: 'Temperature', type: 'text', defaultValue: '24°C', group: 'Content' },
    { key: 'humidity', label: 'Humidity', type: 'text', defaultValue: '72%', group: 'Content' },
    { key: 'windSpeed', label: 'Wind Speed', type: 'text', defaultValue: '18 km/h', group: 'Content' },
    { key: 'pressure', label: 'Pressure', type: 'text', defaultValue: '1013 hPa', group: 'Content' },
    { key: 'condition', label: 'Condition', type: 'text', defaultValue: 'Partly Cloudy', group: 'Content' },
    { key: 'visibility', label: 'Visibility', type: 'text', defaultValue: '12 km', group: 'Content' },
    { key: 'uvIndex', label: 'UV Index', type: 'text', defaultValue: '6', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FFD700', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0e17', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8E8E8', group: 'Style' },
  ],
  defaultConfig: {
    stationName: 'Station Alpha-7',
    temperature: '24°C',
    humidity: '72%',
    windSpeed: '18 km/h',
    pressure: '1013 hPa',
    condition: 'Partly Cloudy',
    visibility: '12 km',
    uvIndex: '6',
    accentColor: '#FFD700',
    bgColor: '#0a0e17',
    textColor: '#E8E8E8',
  },
})
