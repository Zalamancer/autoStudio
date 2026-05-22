import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneSwimLapConfig {
  totalLaps: number
  poolLength: number
  totalTime: string
  avgPace: string
  stroke: string
  distance: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutQuart(t: number): number { return 1 - Math.pow(1 - t, 4) }

function SceneSwimLapComponent({ config, progress }: MotionGraphicProps<SceneSwimLapConfig>) {
  const { totalLaps, poolLength, totalTime, avgPace, stroke, distance, bgColor, textColor, accentColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.12 : 1

  const lapCountEnter = easeOutQuart(Math.min(1, enterProgress / 0.6))
  const displayLaps = Math.round(totalLaps * lapCountEnter)
  const statsEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.5)))
  const laneEnter = easeOutCubic(Math.min(1, enterProgress / 0.8))

  // Wave animation
  const isHolding = progress >= 0.25 && progress < 0.8
  const waveOffset = isHolding ? holdProgress * 400 : enterProgress * 200

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Pool lane lines */}
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${18 + i * 16}%`,
            left: 0,
            right: 0,
            height: '1px',
            background: `${accentColor}${laneEnter > i * 0.15 ? '08' : '00'}`,
          }}
        />
      ))}

      {/* Water wave effect */}
      <svg
        viewBox="0 0 1000 60"
        style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '8%', opacity: 0.06 }}
      >
        <path
          d={`M 0,30 Q ${50 + waveOffset % 100},${10 + Math.sin(waveOffset * 0.02) * 15} ${100 + waveOffset % 100},30 T ${200 + waveOffset % 100},30 T ${300 + waveOffset % 100},30 T ${400 + waveOffset % 100},30 T ${500 + waveOffset % 100},30 T ${600 + waveOffset % 100},30 T ${700 + waveOffset % 100},30 T ${800 + waveOffset % 100},30 T ${900 + waveOffset % 100},30 T 1000,30 V 60 H 0 Z`}
          fill={accentColor}
        />
      </svg>

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
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Stroke badge */}
        <div
          style={{
            background: `${accentColor}18`,
            border: `1px solid ${accentColor}30`,
            color: accentColor,
            fontSize: 'clamp(9px, 1.5vw, 13px)',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            padding: 'clamp(3px, 0.6vw, 6px) clamp(10px, 2vw, 20px)',
            borderRadius: '100px',
            marginBottom: 'clamp(14px, 3vw, 28px)',
            opacity: easeOutCubic(Math.min(1, enterProgress / 0.3)),
          }}
        >
          {'\u{1F3CA}'} {stroke}
        </div>

        {/* Lap counter */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 'clamp(8px, 1.5vw, 16px)',
            opacity: lapCountEnter,
            transform: `scale(${0.85 + lapCountEnter * 0.15})`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(56px, 16vw, 120px)',
              fontWeight: 900,
              color: accentColor,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              textShadow: `0 0 30px ${accentColor}25`,
            }}
          >
            {displayLaps}
          </div>
          <div
            style={{
              fontSize: 'clamp(12px, 2vw, 18px)',
              fontWeight: 600,
              color: `${textColor}55`,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Laps ({poolLength}m pool)
          </div>
        </div>

        {/* Distance */}
        <div
          style={{
            fontSize: 'clamp(20px, 5vw, 38px)',
            fontWeight: 800,
            color: textColor,
            marginBottom: 'clamp(16px, 3vw, 30px)',
            opacity: statsEnter,
          }}
        >
          {distance}
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(16px, 4vw, 40px)',
            opacity: statsEnter,
            transform: `translateY(${(1 - statsEnter) * 15}px)`,
          }}
        >
          {[
            { label: 'Total Time', value: totalTime },
            { label: 'Avg Pace', value: avgPace },
          ].map((stat, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div style={{ width: '1px', height: 'clamp(28px, 5vw, 44px)', background: `${textColor}20` }} />}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 'clamp(18px, 4vw, 32px)', fontWeight: 800, color: textColor }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 'clamp(9px, 1.4vw, 12px)', fontWeight: 600, color: `${textColor}55`, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {stat.label}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Lap progress dots */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(3px, 0.5vw, 5px)',
            marginTop: 'clamp(16px, 3vw, 28px)',
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: '80%',
            opacity: statsEnter,
          }}
        >
          {Array.from({ length: Math.min(totalLaps, 40) }).map((_, i) => {
            const dotFilled = i < displayLaps
            return (
              <div
                key={i}
                style={{
                  width: 'clamp(6px, 1vw, 10px)',
                  height: 'clamp(6px, 1vw, 10px)',
                  borderRadius: '50%',
                  background: dotFilled ? accentColor : `${textColor}15`,
                  boxShadow: dotFilled ? `0 0 4px ${accentColor}40` : 'none',
                }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-swim-lap',
  title: 'Swim Lap',
  description: 'Swim lap counter with animated count-up, pool lane lines, wave effect, total distance, time, pace, and lap dots.',
  tags: ['scene', 'swim', 'lap', 'pool', 'fitness', 'cardio', 'water', 'tracker'],
  category: 'scene-layout',
  component: SceneSwimLapComponent as any,
  defaultConfig: {
    totalLaps: 32,
    poolLength: 25,
    totalTime: '38:12',
    avgPace: "1'12\"/100m",
    stroke: 'Freestyle',
    distance: '800m',
    bgColor: '#060d14',
    textColor: '#ffffff',
    accentColor: '#3B9AE8',
  },
  configSchema: [
    { key: 'totalLaps', label: 'Total Laps', type: 'number', defaultValue: 32, min: 1, max: 200, group: 'Content' },
    { key: 'poolLength', label: 'Pool Length (m)', type: 'number', defaultValue: 25, min: 10, max: 50, group: 'Content' },
    { key: 'totalTime', label: 'Total Time', type: 'text', defaultValue: '38:12', group: 'Content' },
    { key: 'avgPace', label: 'Avg Pace', type: 'text', defaultValue: "1'12\"/100m", group: 'Content' },
    { key: 'stroke', label: 'Stroke', type: 'text', defaultValue: 'Freestyle', group: 'Content' },
    { key: 'distance', label: 'Distance', type: 'text', defaultValue: '800m', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060d14', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#3B9AE8', group: 'Style' },
  ],
})
