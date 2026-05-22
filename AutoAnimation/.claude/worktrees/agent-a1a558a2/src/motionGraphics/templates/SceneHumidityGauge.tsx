import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneHumidityGaugeConfig {
  humidity: number
  dewPoint: number
  feelsLike: number
  location: string
  bgColor: string
  textColor: string
  gaugeColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function getHumidityLevel(h: number): { label: string; color: string } {
  if (h < 30) return { label: 'Dry', color: '#fb923c' }
  if (h < 50) return { label: 'Comfortable', color: '#4ade80' }
  if (h < 70) return { label: 'Humid', color: '#38bdf8' }
  return { label: 'Very Humid', color: '#818cf8' }
}

function SceneHumidityGaugeComponent({ config, progress }: MotionGraphicProps<SceneHumidityGaugeConfig>) {
  const { humidity, dewPoint, feelsLike, location, bgColor, textColor, gaugeColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const enterEased = easeOutCubic(enterProgress)

  const humLevel = getHumidityLevel(humidity)
  const displayHumidity = Math.round(humidity * enterEased)

  // Water drop animation during hold
  const dropScale = progress >= 0.25 && progress < 0.8
    ? 1 + Math.sin(holdProgress * Math.PI * 4) * 0.05
    : 1

  // Circular gauge
  const svgSize = 160
  const center = svgSize / 2
  const radius = 62
  const strokeW = 10
  const circumference = 2 * Math.PI * radius
  const fillPercent = (humidity / 100) * enterEased
  const dashOffset = circumference * (1 - fillPercent)

  // Water droplets rising
  const droplets = Array.from({ length: 8 }, (_, i) => {
    const seed = i * 89 + 37
    const x = 20 + (seed * 23) % 60
    const speed = 0.2 + ((seed * 7) % 10) / 20
    const y = 100 - ((progress * 100 * speed + seed * 5) % 110)
    const size = 3 + (i % 4)
    const opacity = 0.06 + (i % 4) / 30
    return { x, y, size, opacity }
  })

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Rising water droplets */}
      {droplets.map((d, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.size,
            height: d.size * 1.3,
            borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
            background: `rgba(100,180,255,${d.opacity})`,
          }}
        />
      ))}

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '6% 5%',
        opacity: exitOpacity,
      }}>
        {/* Location */}
        <div style={{
          fontSize: 'clamp(10px, 1.8vw, 14px)',
          fontWeight: 600,
          color: `${textColor}77`,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          opacity: enterEased,
          marginBottom: 'clamp(2px, 0.5vh, 6px)',
        }}>
          {location}
        </div>

        {/* Title */}
        <div style={{
          fontSize: 'clamp(18px, 4.5vw, 36px)',
          fontWeight: 800,
          color: textColor,
          opacity: enterEased,
          marginBottom: 'clamp(14px, 3vh, 28px)',
        }}>
          Humidity
        </div>

        {/* Circular gauge */}
        <div style={{
          position: 'relative',
          opacity: enterEased,
          transform: `scale(${0.8 + enterEased * 0.2}) scale(${dropScale})`,
          marginBottom: 'clamp(14px, 2.5vh, 24px)',
        }}>
          <svg viewBox={`0 0 ${svgSize} ${svgSize}`}
            style={{ width: 'clamp(120px, 30vw, 200px)', height: 'clamp(120px, 30vw, 200px)' }}
          >
            {/* Background ring */}
            <circle cx={center} cy={center} r={radius} fill="none"
              stroke={`${textColor}12`} strokeWidth={strokeW} />

            {/* Fill ring */}
            <circle
              cx={center} cy={center} r={radius}
              fill="none"
              stroke={gaugeColor}
              strokeWidth={strokeW}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
              style={{ filter: `drop-shadow(0 0 6px ${gaugeColor}60)` }}
            />

            {/* Tick marks */}
            {Array.from({ length: 10 }, (_, i) => {
              const angle = ((i / 10) * 360 - 90) * (Math.PI / 180)
              const x1 = center + Math.cos(angle) * (radius + strokeW / 2 + 3)
              const y1 = center + Math.sin(angle) * (radius + strokeW / 2 + 3)
              const x2 = center + Math.cos(angle) * (radius + strokeW / 2 + 7)
              const y2 = center + Math.sin(angle) * (radius + strokeW / 2 + 7)
              return (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={`${textColor}25`} strokeWidth={1.5} />
              )
            })}
          </svg>

          {/* Center content */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 'clamp(32px, 8vw, 60px)',
              fontWeight: 900,
              color: gaugeColor,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
              textShadow: `0 0 15px ${gaugeColor}30`,
            }}>
              {displayHumidity}%
            </div>
            <div style={{
              fontSize: 'clamp(10px, 1.8vw, 14px)',
              fontWeight: 700,
              color: humLevel.color,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginTop: 2,
            }}>
              {humLevel.label}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex',
          gap: 'clamp(16px, 4vw, 32px)',
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5)),
          transform: `translateY(${(1 - easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5))) * 15}px)`,
        }}>
          {[
            { label: 'Dew Point', value: `${Math.round(dewPoint * enterEased)}°`, color: '#38bdf8' },
            { label: 'Feels Like', value: `${Math.round(feelsLike * enterEased)}°`, color: '#fb923c' },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 'clamp(9px, 1.5vw, 12px)',
                fontWeight: 600,
                color: `${textColor}66`,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 2,
              }}>
                {stat.label}
              </div>
              <div style={{
                fontSize: 'clamp(18px, 4vw, 30px)',
                fontWeight: 800,
                color: stat.color,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-humidity-gauge',
  title: 'Humidity Gauge',
  description: 'Humidity level circular gauge with animated fill, dew point, and feels-like temperature',
  tags: ['scene', 'weather', 'humidity', 'gauge', 'moisture', 'data'],
  category: 'scene-layout',
  component: SceneHumidityGaugeComponent as any,
  defaultConfig: {
    humidity: 72,
    dewPoint: 65,
    feelsLike: 82,
    location: 'Houston, TX',
    bgColor: '#0a1020',
    textColor: '#e2e8f0',
    gaugeColor: '#38bdf8',
  },
  configSchema: [
    { key: 'humidity', label: 'Humidity %', type: 'number', defaultValue: 72, min: 0, max: 100, group: 'Content' },
    { key: 'dewPoint', label: 'Dew Point (F)', type: 'number', defaultValue: 65, min: -20, max: 100, group: 'Content' },
    { key: 'feelsLike', label: 'Feels Like (F)', type: 'number', defaultValue: 82, min: -40, max: 150, group: 'Content' },
    { key: 'location', label: 'Location', type: 'text', defaultValue: 'Houston, TX', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a1020', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
    { key: 'gaugeColor', label: 'Gauge Color', type: 'color', defaultValue: '#38bdf8', group: 'Style' },
  ],
})
