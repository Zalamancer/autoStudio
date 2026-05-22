import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneLapTimerConfig {
  trackName: string
  lapNumber: number
  totalLaps: number
  sector1: string
  sector2: string
  sector3: string
  bestLap: string
  currentLap: string
  bgColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneLapTimerComponent({ config, progress }: MotionGraphicProps<SceneLapTimerConfig>) {
  const { trackName, lapNumber, totalLaps, sector1, sector2, sector3, bestLap, currentLap, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.12

  const headerEnter = easeOutBack(Math.min(1, enterProgress / 0.5))
  const timeEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.5)))
  const sectorEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.5)))

  // Sector coloring (green = fast, yellow = neutral, purple = personal best)
  const sectorColors = ['#44dd44', '#dddd44', '#bb44ff']

  // Timer colon blink during hold
  const isHolding = progress >= 0.2 && progress < 0.8
  const colonVisible = isHolding ? Math.sin(holdProgress * Math.PI * 12) > 0 : true

  // Lap progress bar
  const lapFrac = lapNumber / totalLaps
  const barWidth = sectorEnter * lapFrac * 100

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      {/* Track map silhouette (abstract) */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          right: '5%',
          width: '25%',
          height: '25%',
          border: `2px solid ${textColor}08`,
          borderRadius: '40% 60% 30% 70% / 50% 40% 60% 50%',
          opacity: sectorEnter * 0.3,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'clamp(16px, 4vw, 40px) clamp(20px, 5vw, 48px)',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Track name + Lap counter */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'clamp(6px, 1.5vw, 14px)',
            opacity: headerEnter,
            transform: `translateY(${(1 - headerEnter) * -20}px)`,
          }}
        >
          <div style={{ fontSize: 'clamp(10px, 1.6vw, 14px)', fontWeight: 700, color: `${textColor}70`, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            {trackName}
          </div>
          <div style={{ fontSize: 'clamp(10px, 1.6vw, 14px)', fontWeight: 800, color: accentColor, fontVariantNumeric: 'tabular-nums' }}>
            LAP {lapNumber}/{totalLaps}
          </div>
        </div>

        {/* Lap progress bar */}
        <div style={{ height: 'clamp(3px, 0.5vw, 4px)', background: `${textColor}0a`, borderRadius: 4, marginBottom: 'clamp(16px, 3vw, 28px)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${barWidth}%`,
              background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80)`,
              borderRadius: 4,
              boxShadow: `0 0 8px ${accentColor}40`,
            }}
          />
        </div>

        {/* Current lap time (big) */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 'clamp(10px, 2vw, 20px)',
            opacity: timeEnter,
            transform: `scale(${0.8 + timeEnter * 0.2})`,
          }}
        >
          <div style={{ fontSize: 'clamp(9px, 1.2vw, 11px)', fontWeight: 600, color: `${textColor}50`, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 'clamp(4px, 0.8vw, 8px)' }}>
            Current Lap
          </div>
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 9vw, 72px)',
              fontWeight: 900,
              color: textColor,
              letterSpacing: '0.02em',
              textShadow: `0 0 20px ${accentColor}30`,
            }}
          >
            {currentLap}
          </div>
        </div>

        {/* Sector times */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(6px, 1.2vw, 12px)',
            marginBottom: 'clamp(14px, 3vw, 24px)',
            opacity: sectorEnter,
            transform: `translateY(${(1 - sectorEnter) * 15}px)`,
          }}
        >
          {[
            { label: 'S1', time: sector1, color: sectorColors[0] },
            { label: 'S2', time: sector2, color: sectorColors[1] },
            { label: 'S3', time: sector3, color: sectorColors[2] },
          ].map((s, i) => {
            const stagger = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5 - i * 0.06) / 0.4)))
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: `${s.color}10`,
                  border: `1px solid ${s.color}30`,
                  borderRadius: 'clamp(6px, 1vw, 10px)',
                  padding: 'clamp(8px, 1.5vw, 14px)',
                  textAlign: 'center',
                  opacity: stagger,
                  transform: `translateY(${(1 - stagger) * 10}px)`,
                }}
              >
                <div style={{ fontSize: 'clamp(8px, 1.2vw, 11px)', fontWeight: 700, color: s.color, marginBottom: 'clamp(2px, 0.4vw, 4px)', letterSpacing: '0.1em' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 'clamp(12px, 2vw, 18px)', fontWeight: 800, color: textColor, fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>
                  {s.time}
                </div>
              </div>
            )
          })}
        </div>

        {/* Best lap */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1vw, 10px)',
            opacity: sectorEnter,
          }}
        >
          <div style={{ width: 'clamp(3px, 0.4vw, 4px)', height: 'clamp(16px, 2.5vw, 24px)', background: '#bb44ff', borderRadius: 2 }} />
          <div>
            <div style={{ fontSize: 'clamp(8px, 1.1vw, 10px)', fontWeight: 600, color: `${textColor}50`, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Best Lap
            </div>
            <div style={{ fontSize: 'clamp(13px, 2.2vw, 20px)', fontWeight: 800, color: '#bb44ff', fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>
              {bestLap}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-lap-timer',
  title: 'Lap Timer',
  description: 'Race lap timer with sector times, current/best lap, lap progress bar, and colored sector indicators. Timer colon blinks on hold.',
  tags: ['scene', 'lap', 'timer', 'race', 'sector', 'F1', 'motorsport', 'auto'],
  category: 'scene-layout',
  component: SceneLapTimerComponent as any,
  defaultConfig: {
    trackName: 'CIRCUIT DE MONACO',
    lapNumber: 42,
    totalLaps: 78,
    sector1: '24.891',
    sector2: '33.442',
    sector3: '18.221',
    bestLap: '1:14.260',
    currentLap: '1:16.554',
    bgColor: '#0a0a14',
    accentColor: '#e10600',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'trackName', label: 'Track Name', type: 'text', defaultValue: 'CIRCUIT DE MONACO', group: 'Content' },
    { key: 'lapNumber', label: 'Current Lap', type: 'number', defaultValue: 42, min: 1, max: 200, group: 'Content' },
    { key: 'totalLaps', label: 'Total Laps', type: 'number', defaultValue: 78, min: 1, max: 200, group: 'Content' },
    { key: 'sector1', label: 'Sector 1', type: 'text', defaultValue: '24.891', group: 'Timing' },
    { key: 'sector2', label: 'Sector 2', type: 'text', defaultValue: '33.442', group: 'Timing' },
    { key: 'sector3', label: 'Sector 3', type: 'text', defaultValue: '18.221', group: 'Timing' },
    { key: 'bestLap', label: 'Best Lap', type: 'text', defaultValue: '1:14.260', group: 'Timing' },
    { key: 'currentLap', label: 'Current Lap Time', type: 'text', defaultValue: '1:16.554', group: 'Timing' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#e10600', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
