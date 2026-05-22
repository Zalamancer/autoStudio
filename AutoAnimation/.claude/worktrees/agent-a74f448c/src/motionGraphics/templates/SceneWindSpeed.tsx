import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneWindSpeedConfig {
  speed: number
  direction: string
  gusts: number
  label: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

const DIRECTION_DEGREES: Record<string, number> = {
  N: 0, NNE: 22.5, NE: 45, ENE: 67.5,
  E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
  S: 180, SSW: 202.5, SW: 225, WSW: 247.5,
  W: 270, WNW: 292.5, NW: 315, NNW: 337.5,
}

function SceneWindSpeedComponent({ config, progress }: MotionGraphicProps<SceneWindSpeedConfig>) {
  const { speed, direction, gusts, label, bgColor, textColor, accentColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const enterEased = easeOutCubic(enterProgress)

  const dirDeg = DIRECTION_DEGREES[direction.toUpperCase()] ?? 0
  const compassRotate = dirDeg * enterEased

  // Animated speed counting
  const displaySpeed = Math.round(speed * enterEased)
  const displayGusts = Math.round(gusts * enterEased)

  // Wind streaks during hold
  const windStreak = progress >= 0.25 && progress < 0.8
    ? Math.sin(holdProgress * Math.PI * 6) * 3
    : 0

  // Beaufort scale color
  const speedNorm = Math.min(speed / 80, 1)
  const beaufortColor = speedNorm < 0.3 ? '#51cf66' : speedNorm < 0.6 ? '#fcc419' : '#ff6b6b'

  // Compass SVG dimensions
  const svgSize = 140
  const center = svgSize / 2
  const outerR = 58
  const innerR = 48
  const arrowLen = 42

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Animated wind lines in background */}
      {[...Array(10)].map((_, i) => {
        const lineY = 10 + i * 9
        const lineWidth = 20 + (i * 17) % 40
        const lineX = ((progress * 300 + i * 50) % 130) - 15
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${lineX}%`,
              top: `${lineY}%`,
              width: `${lineWidth}%`,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${accentColor}15, ${accentColor}08, transparent)`,
              transform: `translateX(${windStreak}px)`,
            }}
          />
        )
      })}

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
        {/* Label */}
        <div style={{
          fontSize: 'clamp(12px, 2.2vw, 18px)',
          fontWeight: 600,
          color: `${textColor}88`,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          opacity: enterEased,
          transform: `translateY(${(1 - enterEased) * -12}px)`,
          marginBottom: 'clamp(4px, 1vh, 10px)',
        }}>
          {label}
        </div>

        {/* Wind compass */}
        <div style={{
          opacity: enterEased,
          transform: `scale(${0.8 + enterEased * 0.2})`,
          marginBottom: 'clamp(12px, 2.5vh, 24px)',
        }}>
          <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}
            style={{ width: 'clamp(100px, 25vw, 160px)', height: 'clamp(100px, 25vw, 160px)' }}
          >
            {/* Outer ring */}
            <circle cx={center} cy={center} r={outerR} fill="none" stroke={`${textColor}20`} strokeWidth={2} />
            <circle cx={center} cy={center} r={innerR} fill="none" stroke={`${textColor}10`} strokeWidth={1} />

            {/* Cardinal direction marks */}
            {['N', 'E', 'S', 'W'].map((dir, i) => {
              const angle = (i * 90 - 90) * (Math.PI / 180)
              const x = center + Math.cos(angle) * (outerR + 8)
              const y = center + Math.sin(angle) * (outerR + 8)
              return (
                <text key={dir} x={x} y={y} textAnchor="middle" dominantBaseline="central"
                  fill={`${textColor}66`} fontSize={10} fontWeight={700}>{dir}</text>
              )
            })}

            {/* Direction arrow */}
            <g transform={`rotate(${compassRotate} ${center} ${center})`}>
              <line x1={center} y1={center + 15} x2={center} y2={center - arrowLen}
                stroke={accentColor} strokeWidth={3} strokeLinecap="round" />
              <polygon
                points={`${center},${center - arrowLen - 6} ${center - 5},${center - arrowLen + 4} ${center + 5},${center - arrowLen + 4}`}
                fill={accentColor}
              />
            </g>

            {/* Center dot */}
            <circle cx={center} cy={center} r={4} fill={accentColor} />
          </svg>
        </div>

        {/* Speed display */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 'clamp(4px, 1vw, 8px)',
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7)),
        }}>
          <span style={{
            fontSize: 'clamp(36px, 10vw, 80px)',
            fontWeight: 900,
            color: beaufortColor,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            textShadow: `0 0 20px ${beaufortColor}40`,
          }}>
            {displaySpeed}
          </span>
          <span style={{
            fontSize: 'clamp(14px, 3vw, 24px)',
            fontWeight: 600,
            color: `${textColor}88`,
          }}>
            mph
          </span>
        </div>

        {/* Direction text */}
        <div style={{
          fontSize: 'clamp(14px, 3vw, 22px)',
          fontWeight: 700,
          color: accentColor,
          marginTop: 'clamp(4px, 0.5vh, 8px)',
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6)),
        }}>
          {direction}
        </div>

        {/* Gusts */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(4px, 1vw, 10px)',
          marginTop: 'clamp(10px, 2vh, 20px)',
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5)),
        }}>
          <span style={{
            fontSize: 'clamp(10px, 1.8vw, 14px)',
            fontWeight: 600,
            color: `${textColor}66`,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            Gusts up to
          </span>
          <span style={{
            fontSize: 'clamp(16px, 3.5vw, 28px)',
            fontWeight: 800,
            color: textColor,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {displayGusts} mph
          </span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-wind-speed',
  title: 'Wind Speed',
  description: 'Wind speed and direction display with animated compass, speed gauge, and gust data',
  tags: ['scene', 'weather', 'wind', 'speed', 'compass', 'direction', 'data'],
  category: 'scene-layout',
  component: SceneWindSpeedComponent as any,
  defaultConfig: {
    speed: 24,
    direction: 'NW',
    gusts: 38,
    label: 'Wind Conditions',
    bgColor: '#0c1525',
    textColor: '#e2e8f0',
    accentColor: '#38bdf8',
  },
  configSchema: [
    { key: 'speed', label: 'Speed (mph)', type: 'number', defaultValue: 24, min: 0, max: 200, group: 'Content' },
    { key: 'direction', label: 'Direction (N/NE/E/SE/S/SW/W/NW)', type: 'text', defaultValue: 'NW', group: 'Content' },
    { key: 'gusts', label: 'Gusts (mph)', type: 'number', defaultValue: 38, min: 0, max: 300, group: 'Content' },
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Wind Conditions', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c1525', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#38bdf8', group: 'Style' },
  ],
})
