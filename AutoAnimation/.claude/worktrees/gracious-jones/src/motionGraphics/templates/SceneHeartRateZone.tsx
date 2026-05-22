import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneHeartRateZoneConfig {
  bpm: number
  maxHR: number
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutQuart(t: number): number { return 1 - Math.pow(1 - t, 4) }

interface ZoneInfo {
  name: string
  color: string
  minPct: number
  maxPct: number
}

const ZONES: ZoneInfo[] = [
  { name: 'Rest', color: '#94a3b8', minPct: 0, maxPct: 50 },
  { name: 'Warm Up', color: '#3b82f6', minPct: 50, maxPct: 60 },
  { name: 'Fat Burn', color: '#22c55e', minPct: 60, maxPct: 70 },
  { name: 'Cardio', color: '#f59e0b', minPct: 70, maxPct: 80 },
  { name: 'Peak', color: '#ef4444', minPct: 80, maxPct: 90 },
  { name: 'VO2 Max', color: '#dc2626', minPct: 90, maxPct: 100 },
]

function getZone(bpm: number, maxHR: number): ZoneInfo {
  const pct = (bpm / maxHR) * 100
  for (let i = ZONES.length - 1; i >= 0; i--) {
    if (pct >= ZONES[i].minPct) return ZONES[i]
  }
  return ZONES[0]
}

function SceneHeartRateZoneComponent({ config, progress }: MotionGraphicProps<SceneHeartRateZoneConfig>) {
  const { bpm, maxHR, bgColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  const zone = getZone(bpm, maxHR)
  const hrPercent = Math.min((bpm / maxHR) * 100, 100)

  // BPM counts up
  const bpmEnter = easeOutQuart(Math.min(1, enterProgress / 0.6))
  const currentBPM = Math.round(bpm * bpmEnter)

  // Heart pulse during hold
  const isHolding = progress >= 0.25 && progress < 0.8
  const heartBeatRate = 1.5 + (bpm / 200) * 3 // Faster pulse for higher BPM
  const heartScale = isHolding
    ? 1 + Math.abs(Math.sin(holdProgress * Math.PI * heartBeatRate * 6)) * 0.15
    : 1 + Math.abs(Math.sin(enterProgress * Math.PI * 2)) * 0.1

  // Zone bar enters
  const barEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.5)))

  // Zone label
  const zoneEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.5)))

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Colored glow */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          width: '70%',
          height: '40%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${zone.color}12, transparent 70%)`,
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
          padding: '6% 8%',
          opacity: exitOpacity,
        }}
      >
        {/* Heart icon */}
        <div
          style={{
            fontSize: 'clamp(28px, 6vw, 48px)',
            transform: `scale(${heartScale})`,
            marginBottom: 'clamp(8px, 1.5vw, 16px)',
            filter: `drop-shadow(0 0 12px ${zone.color}80)`,
            opacity: easeOutCubic(Math.min(1, enterProgress / 0.3)),
          }}
        >
          {'\u2764\uFE0F'}
        </div>

        {/* BPM number */}
        <div
          style={{
            fontSize: 'clamp(56px, 14vw, 112px)',
            fontWeight: 900,
            color: zone.color,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            textShadow: `0 0 30px ${zone.color}40`,
            opacity: bpmEnter,
          }}
        >
          {currentBPM}
        </div>
        <div
          style={{
            fontSize: 'clamp(12px, 2vw, 18px)',
            fontWeight: 700,
            color: `${textColor}66`,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginTop: '4px',
            opacity: bpmEnter,
          }}
        >
          BPM
        </div>

        {/* Zone name */}
        <div
          style={{
            fontSize: 'clamp(18px, 4vw, 32px)',
            fontWeight: 800,
            color: zone.color,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginTop: 'clamp(16px, 3vw, 28px)',
            opacity: zoneEnter,
            transform: `translateY(${(1 - zoneEnter) * 10}px)`,
          }}
        >
          {zone.name} Zone
        </div>

        {/* Zone bar */}
        <div
          style={{
            width: '100%',
            maxWidth: '400px',
            marginTop: 'clamp(20px, 4vw, 36px)',
            opacity: barEnter,
            transform: `translateY(${(1 - barEnter) * 15}px)`,
          }}
        >
          {/* Zone segments */}
          <div
            style={{
              display: 'flex',
              gap: '3px',
              height: 'clamp(8px, 1.4vw, 14px)',
              borderRadius: '100px',
              overflow: 'hidden',
            }}
          >
            {ZONES.slice(1).map((z, i) => {
              const isActive = hrPercent >= z.minPct
              const isCurrent = zone.name === z.name
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    background: isActive ? z.color : `${textColor}15`,
                    opacity: isActive ? (isCurrent ? 1 : 0.5) : 0.3,
                    borderRadius: '100px',
                    boxShadow: isCurrent ? `0 0 8px ${z.color}60` : 'none',
                  }}
                />
              )
            })}
          </div>

          {/* Zone labels */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 'clamp(4px, 0.6vw, 8px)',
            }}
          >
            {ZONES.slice(1).map((z, i) => (
              <div
                key={i}
                style={{
                  fontSize: 'clamp(7px, 1.1vw, 10px)',
                  fontWeight: 600,
                  color: zone.name === z.name ? z.color : `${textColor}44`,
                  textAlign: 'center',
                  flex: 1,
                }}
              >
                {z.name}
              </div>
            ))}
          </div>
        </div>

        {/* HR percentage */}
        <div
          style={{
            fontSize: 'clamp(11px, 1.8vw, 15px)',
            fontWeight: 600,
            color: `${textColor}55`,
            marginTop: 'clamp(12px, 2vw, 20px)',
            opacity: zoneEnter,
          }}
        >
          {Math.round(hrPercent)}% of max HR ({maxHR} bpm)
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-heart-rate-zone',
  title: 'Heart Rate Zone',
  description: 'Heart rate display with pulsing BPM, zone name, color-coded zone bar indicator, and HR percentage',
  tags: ['scene', 'fitness', 'heart-rate', 'cardio', 'health', 'workout', 'data'],
  category: 'scene-layout',
  component: SceneHeartRateZoneComponent as any,
  defaultConfig: {
    bpm: 152,
    maxHR: 190,
    bgColor: '#0a0a0f',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'bpm', label: 'Heart Rate (BPM)', type: 'number', defaultValue: 152, min: 40, max: 220, group: 'Content' },
    { key: 'maxHR', label: 'Max Heart Rate', type: 'number', defaultValue: 190, min: 100, max: 250, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0f', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
