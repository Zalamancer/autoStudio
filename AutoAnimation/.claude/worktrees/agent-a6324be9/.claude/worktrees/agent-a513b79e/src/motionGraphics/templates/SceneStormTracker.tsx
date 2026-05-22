import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneStormTrackerConfig {
  stormName: string
  category: number
  windSpeed: number
  pressure: number
  movement: string
  distance: string
  bgColor: string
  textColor: string
  stormColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneStormTrackerComponent({ config, progress }: MotionGraphicProps<SceneStormTrackerConfig>) {
  const { stormName, category, windSpeed, pressure, movement, distance, bgColor, textColor, stormColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const enterEased = easeOutCubic(enterProgress)

  // Category color
  const catColor = category >= 4 ? '#dc2626' : category >= 3 ? '#ef4444' : category >= 2 ? '#fb923c' : '#facc15'

  // Storm rotation animation
  const stormRotation = progress * 720

  // Radar pulse effect
  const radarPulse = progress >= 0.25 && progress < 0.8
    ? (holdProgress * 3) % 1
    : 0

  // Animated counters
  const displayWind = Math.round(windSpeed * enterEased)
  const displayPressure = Math.round(pressure * enterEased)

  // Alert flash for high category
  const alertFlash = category >= 3 && progress >= 0.25 && progress < 0.8
    ? Math.sin(holdProgress * Math.PI * 8) > 0.8 ? 0.06 : 0
    : 0

  const getStatProgress = (index: number): number => {
    const start = 0.3 + index * 0.1
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.5)))
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at 50% 40%, ${bgColor} 0%, #050810 100%)`,
      }} />

      {/* Alert flash */}
      {alertFlash > 0 && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `rgba(220,38,38,${alertFlash})`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Radar grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.04,
        backgroundImage: `
          radial-gradient(circle at 50% 40%, ${stormColor} 1px, transparent 1px),
          linear-gradient(${textColor} 0.5px, transparent 0.5px),
          linear-gradient(90deg, ${textColor} 0.5px, transparent 0.5px)
        `,
        backgroundSize: '30px 30px, 60px 60px, 60px 60px',
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '5% 5%',
        opacity: exitOpacity,
      }}>
        {/* Storm spiral visualization */}
        <div style={{
          position: 'relative',
          marginBottom: 'clamp(12px, 2.5vh, 24px)',
          opacity: enterEased,
          transform: `scale(${0.8 + enterEased * 0.2})`,
        }}>
          <svg viewBox="0 0 140 140"
            style={{ width: 'clamp(100px, 25vw, 160px)', height: 'clamp(100px, 25vw, 160px)' }}
          >
            {/* Radar rings */}
            {[20, 35, 50, 65].map((r, i) => (
              <circle key={i} cx={70} cy={70} r={r} fill="none"
                stroke={`${stormColor}15`} strokeWidth={0.5} />
            ))}

            {/* Storm spiral arms */}
            {[0, 90, 180, 270].map((offset, i) => {
              const armAngle = (stormRotation + offset) * (Math.PI / 180)
              const armLen = 25 + Math.sin(progress * 6.28 + i) * 5
              const x1 = 70 + Math.cos(armAngle) * 8
              const y1 = 70 + Math.sin(armAngle) * 8
              const x2 = 70 + Math.cos(armAngle + 0.4) * armLen
              const y2 = 70 + Math.sin(armAngle + 0.4) * armLen
              const cpx = 70 + Math.cos(armAngle + 0.2) * (armLen * 0.8)
              const cpy = 70 + Math.sin(armAngle + 0.2) * (armLen * 0.8)

              return (
                <path key={i}
                  d={`M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`}
                  fill="none" stroke={stormColor}
                  strokeWidth={3} strokeLinecap="round"
                  opacity={0.4 + i * 0.1}
                />
              )
            })}

            {/* Storm eye */}
            <circle cx={70} cy={70} r={6} fill={stormColor} opacity={0.8}
              style={{ filter: `drop-shadow(0 0 6px ${stormColor}80)` }} />
            <circle cx={70} cy={70} r={10} fill="none"
              stroke={stormColor} strokeWidth={1.5} opacity={0.5} />

            {/* Radar pulse */}
            {radarPulse > 0 && (
              <circle cx={70} cy={70} r={radarPulse * 65}
                fill="none" stroke={stormColor}
                strokeWidth={1} opacity={(1 - radarPulse) * 0.3} />
            )}
          </svg>
        </div>

        {/* Storm name */}
        <div style={{
          fontSize: 'clamp(10px, 1.8vw, 14px)',
          fontWeight: 600,
          color: `${textColor}77`,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          opacity: enterEased,
          marginBottom: 'clamp(2px, 0.4vh, 4px)',
        }}>
          Storm Tracker
        </div>

        <div style={{
          fontSize: 'clamp(22px, 6vw, 48px)',
          fontWeight: 900,
          color: textColor,
          letterSpacing: '-0.02em',
          opacity: enterEased,
          marginBottom: 'clamp(2px, 0.5vh, 6px)',
        }}>
          {stormName}
        </div>

        {/* Category badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(4px, 0.8vw, 8px)',
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.2) / 0.8)),
          marginBottom: 'clamp(12px, 2.5vh, 24px)',
        }}>
          <span style={{
            fontSize: 'clamp(12px, 2.2vw, 18px)',
            fontWeight: 800,
            color: catColor,
            padding: 'clamp(2px, 0.4vh, 5px) clamp(8px, 1.5vw, 14px)',
            borderRadius: 6,
            background: `${catColor}18`,
            border: `1px solid ${catColor}35`,
          }}>
            Category {category}
          </span>
        </div>

        {/* Stats grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'clamp(6px, 1.2vw, 12px)',
          width: '85%',
          maxWidth: 'clamp(220px, 60vw, 380px)',
        }}>
          {[
            { label: 'Wind Speed', value: `${displayWind} mph`, color: catColor },
            { label: 'Pressure', value: `${displayPressure} mb`, color: '#38bdf8' },
            { label: 'Movement', value: movement, color: '#a78bfa' },
            { label: 'Distance', value: distance, color: '#fbbf24' },
          ].map((stat, i) => {
            const statProg = getStatProgress(i)
            return (
              <div key={i} style={{
                textAlign: 'center',
                padding: 'clamp(6px, 1vw, 12px)',
                borderRadius: 8,
                background: `${stat.color}0A`,
                border: `1px solid ${stat.color}18`,
                opacity: statProg,
                transform: `translateY(${(1 - statProg) * 12}px)`,
              }}>
                <div style={{
                  fontSize: 'clamp(8px, 1.4vw, 11px)',
                  fontWeight: 600,
                  color: `${textColor}55`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 'clamp(2px, 0.3vh, 4px)',
                }}>{stat.label}</div>
                <div style={{
                  fontSize: 'clamp(14px, 3vw, 22px)',
                  fontWeight: 800,
                  color: stat.color,
                  fontVariantNumeric: 'tabular-nums',
                }}>{stat.value}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-storm-tracker',
  title: 'Storm Tracker',
  description: 'Hurricane/storm tracker with rotating spiral visualization, category rating, and key metrics',
  tags: ['scene', 'weather', 'storm', 'hurricane', 'tracker', 'radar', 'emergency'],
  category: 'scene-layout',
  component: SceneStormTrackerComponent as any,
  defaultConfig: {
    stormName: 'Hurricane Maria',
    category: 3,
    windSpeed: 125,
    pressure: 959,
    movement: 'NW at 14 mph',
    distance: '180 mi SE',
    bgColor: '#0a0e1a',
    textColor: '#e2e8f0',
    stormColor: '#f97316',
  },
  configSchema: [
    { key: 'stormName', label: 'Storm Name', type: 'text', defaultValue: 'Hurricane Maria', group: 'Content' },
    { key: 'category', label: 'Category (1-5)', type: 'number', defaultValue: 3, min: 1, max: 5, group: 'Content' },
    { key: 'windSpeed', label: 'Wind Speed (mph)', type: 'number', defaultValue: 125, min: 0, max: 250, group: 'Content' },
    { key: 'pressure', label: 'Pressure (mb)', type: 'number', defaultValue: 959, min: 800, max: 1100, group: 'Content' },
    { key: 'movement', label: 'Movement', type: 'text', defaultValue: 'NW at 14 mph', group: 'Content' },
    { key: 'distance', label: 'Distance', type: 'text', defaultValue: '180 mi SE', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0e1a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
    { key: 'stormColor', label: 'Storm Color', type: 'color', defaultValue: '#f97316', group: 'Style' },
  ],
})
