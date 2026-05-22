import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneUVIndexConfig {
  uvIndex: number
  location: string
  time: string
  advice: string
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

const UV_LEVELS = [
  { max: 2, label: 'Low', color: '#4ade80' },
  { max: 5, label: 'Moderate', color: '#facc15' },
  { max: 7, label: 'High', color: '#fb923c' },
  { max: 10, label: 'Very High', color: '#ef4444' },
  { max: 15, label: 'Extreme', color: '#a855f7' },
]

function getUVLevel(index: number) {
  return UV_LEVELS.find(l => index <= l.max) || UV_LEVELS[UV_LEVELS.length - 1]
}

function SceneUVIndexComponent({ config, progress }: MotionGraphicProps<SceneUVIndexConfig>) {
  const { uvIndex, location, time, advice, bgColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const enterEased = easeOutCubic(enterProgress)

  const uvLevel = getUVLevel(uvIndex)
  const meterFill = Math.min(uvIndex / 11, 1) * enterEased

  // Animated counter
  const displayUV = Math.round(uvIndex * enterEased * 10) / 10

  // Sun pulse on high UV during hold
  const isHighUV = uvIndex >= 6
  const sunPulse = isHighUV && progress >= 0.25 && progress < 0.8
    ? 1 + Math.sin(holdProgress * Math.PI * 5) * 0.06
    : 1

  // Meter segments
  const segmentCount = 11
  const svgW = 240
  const svgH = 130
  const arcR = 90
  const centerX = svgW / 2
  const centerY = svgH - 10

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Sun glow background */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '50%',
        transform: `translateX(-50%) scale(${sunPulse})`,
        width: '60%',
        height: '40%',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${uvLevel.color}15, transparent 70%)`,
        opacity: enterEased,
      }} />

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
        {/* Location & time */}
        <div style={{
          fontSize: 'clamp(10px, 1.8vw, 14px)',
          fontWeight: 600,
          color: `${textColor}77`,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          opacity: enterEased,
          transform: `translateY(${(1 - enterEased) * -10}px)`,
          marginBottom: 'clamp(2px, 0.5vh, 6px)',
        }}>
          {location} \u2022 {time}
        </div>

        {/* Title */}
        <div style={{
          fontSize: 'clamp(18px, 4.5vw, 36px)',
          fontWeight: 800,
          color: textColor,
          opacity: enterEased,
          marginBottom: 'clamp(14px, 3vh, 28px)',
          letterSpacing: '-0.02em',
        }}>
          UV Index
        </div>

        {/* Arc meter */}
        <div style={{
          opacity: enterEased,
          transform: `scale(${0.85 + enterEased * 0.15})`,
          marginBottom: 'clamp(8px, 1.5vh, 16px)',
        }}>
          <svg viewBox={`0 0 ${svgW} ${svgH}`}
            style={{ width: 'clamp(180px, 45vw, 300px)', height: 'clamp(100px, 24vw, 160px)' }}
          >
            {/* Background arc segments */}
            {Array.from({ length: segmentCount }, (_, i) => {
              const startAngle = Math.PI + (i / segmentCount) * Math.PI
              const endAngle = Math.PI + ((i + 0.85) / segmentCount) * Math.PI
              const x1 = centerX + Math.cos(startAngle) * arcR
              const y1 = centerY + Math.sin(startAngle) * arcR
              const x2 = centerX + Math.cos(endAngle) * arcR
              const y2 = centerY + Math.sin(endAngle) * arcR
              const filled = (i / segmentCount) < meterFill
              const segColor = getUVLevel(i + 1).color

              return (
                <path
                  key={i}
                  d={`M ${x1} ${y1} A ${arcR} ${arcR} 0 0 1 ${x2} ${y2}`}
                  fill="none"
                  stroke={filled ? segColor : `${textColor}15`}
                  strokeWidth={12}
                  strokeLinecap="round"
                  opacity={filled ? 1 : 0.5}
                  style={filled ? { filter: `drop-shadow(0 0 4px ${segColor}60)` } : undefined}
                />
              )
            })}
          </svg>
        </div>

        {/* UV value */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 'clamp(6px, 1.2vw, 12px)',
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7)),
          transform: `scale(${easeOutBack(Math.max(0, (enterProgress - 0.3) / 0.7))})`,
        }}>
          <span style={{
            fontSize: 'clamp(40px, 11vw, 88px)',
            fontWeight: 900,
            color: uvLevel.color,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            textShadow: `0 0 20px ${uvLevel.color}40`,
          }}>
            {displayUV.toFixed(1)}
          </span>
        </div>

        {/* Level label */}
        <div style={{
          fontSize: 'clamp(14px, 3vw, 24px)',
          fontWeight: 700,
          color: uvLevel.color,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginTop: 'clamp(2px, 0.5vh, 6px)',
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6)),
        }}>
          {uvLevel.label}
        </div>

        {/* Advice */}
        <div style={{
          fontSize: 'clamp(10px, 2vw, 16px)',
          fontWeight: 500,
          color: `${textColor}77`,
          textAlign: 'center',
          marginTop: 'clamp(8px, 1.5vh, 16px)',
          maxWidth: '80%',
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.6) / 0.4)),
        }}>
          {advice}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-uv-index',
  title: 'UV Index',
  description: 'UV index meter display with color-coded arc gauge, risk level, and protection advice',
  tags: ['scene', 'weather', 'uv', 'sun', 'index', 'health', 'data'],
  category: 'scene-layout',
  component: SceneUVIndexComponent as any,
  defaultConfig: {
    uvIndex: 8,
    location: 'Miami, FL',
    time: '12:30 PM',
    advice: 'Wear sunscreen SPF 30+. Seek shade during midday hours.',
    bgColor: '#0f0a1a',
    textColor: '#e2e8f0',
  },
  configSchema: [
    { key: 'uvIndex', label: 'UV Index', type: 'number', defaultValue: 8, min: 0, max: 15, group: 'Content' },
    { key: 'location', label: 'Location', type: 'text', defaultValue: 'Miami, FL', group: 'Content' },
    { key: 'time', label: 'Time', type: 'text', defaultValue: '12:30 PM', group: 'Content' },
    { key: 'advice', label: 'Advice', type: 'text', defaultValue: 'Wear sunscreen SPF 30+. Seek shade during midday hours.', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0a1a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
})
