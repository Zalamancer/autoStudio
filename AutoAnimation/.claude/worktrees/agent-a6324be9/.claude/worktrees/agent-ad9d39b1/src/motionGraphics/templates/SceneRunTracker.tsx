import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneRunTrackerConfig {
  distance: string
  pace: string
  time: string
  elevation: string
  heartRate: number
  splits: string[]
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutQuart(t: number): number { return 1 - Math.pow(1 - t, 4) }

function SceneRunTrackerComponent({ config, progress }: MotionGraphicProps<SceneRunTrackerConfig>) {
  const { distance, pace, time, elevation, heartRate, splits, bgColor, textColor, accentColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.12 : 1

  const distEnter = easeOutQuart(Math.min(1, enterProgress / 0.5))
  const statsEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.5)))
  const splitsEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.5)))

  // Animated path line
  const pathProgress = easeOutCubic(Math.min(1, enterProgress / 0.9))

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Running route path */}
      <svg
        viewBox="0 0 400 300"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.08 }}
      >
        <path
          d="M 50,250 Q 80,200 120,180 T 200,120 T 280,80 T 350,50"
          fill="none"
          stroke={accentColor}
          strokeWidth="3"
          strokeDasharray="600"
          strokeDashoffset={600 * (1 - pathProgress)}
          strokeLinecap="round"
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
          padding: '5%',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Run badge */}
        <div
          style={{
            background: `${accentColor}15`,
            border: `1px solid ${accentColor}30`,
            color: accentColor,
            fontSize: 'clamp(9px, 1.5vw, 13px)',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            padding: 'clamp(3px, 0.6vw, 6px) clamp(12px, 2vw, 22px)',
            borderRadius: '100px',
            marginBottom: 'clamp(12px, 2.5vw, 24px)',
            opacity: easeOutCubic(Math.min(1, enterProgress / 0.3)),
          }}
        >
          {'\u{1F3C3}'} Run Complete
        </div>

        {/* Distance - hero number */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 'clamp(16px, 3vw, 32px)',
            opacity: distEnter,
            transform: `scale(${0.8 + distEnter * 0.2})`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(52px, 14vw, 110px)',
              fontWeight: 900,
              color: textColor,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {distance}
          </div>
          <div
            style={{
              fontSize: 'clamp(11px, 1.8vw, 16px)',
              fontWeight: 600,
              color: `${textColor}55`,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginTop: 'clamp(2px, 0.5vw, 6px)',
            }}
          >
            Total Distance
          </div>
        </div>

        {/* Stats grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'clamp(8px, 1.5vw, 16px)',
            width: '100%',
            maxWidth: '500px',
            marginBottom: 'clamp(16px, 3vw, 30px)',
            opacity: statsEnter,
            transform: `translateY(${(1 - statsEnter) * 15}px)`,
          }}
        >
          {[
            { label: 'Pace', value: pace },
            { label: 'Time', value: time },
            { label: 'Elevation', value: elevation },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                textAlign: 'center',
                padding: 'clamp(8px, 1.5vw, 14px)',
                background: `${textColor}06`,
                borderRadius: 'clamp(6px, 1.2vw, 10px)',
                border: `1px solid ${textColor}08`,
              }}
            >
              <div style={{ fontSize: 'clamp(16px, 3.5vw, 28px)', fontWeight: 800, color: textColor }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 'clamp(8px, 1.3vw, 11px)', fontWeight: 600, color: `${textColor}55`, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Heart rate bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1.2vw, 12px)',
            marginBottom: 'clamp(12px, 2.5vw, 22px)',
            opacity: statsEnter,
          }}
        >
          <span style={{ fontSize: 'clamp(12px, 2vw, 18px)', color: '#FF4444' }}>{'\u2764\uFE0F'}</span>
          <span style={{ fontSize: 'clamp(14px, 2.5vw, 22px)', fontWeight: 800, color: textColor, fontVariantNumeric: 'tabular-nums' }}>
            {Math.round(heartRate * statsEnter)} bpm
          </span>
        </div>

        {/* Splits */}
        {splits.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 'clamp(4px, 0.8vw, 8px)',
              flexWrap: 'wrap',
              justifyContent: 'center',
              opacity: splitsEnter,
              transform: `translateY(${(1 - splitsEnter) * 10}px)`,
            }}
          >
            {splits.map((split, i) => (
              <div
                key={i}
                style={{
                  padding: 'clamp(3px, 0.5vw, 5px) clamp(8px, 1.5vw, 14px)',
                  background: `${accentColor}12`,
                  border: `1px solid ${accentColor}20`,
                  borderRadius: '100px',
                  fontSize: 'clamp(9px, 1.4vw, 12px)',
                  fontWeight: 700,
                  color: `${textColor}88`,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                km{i + 1}: {split}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-run-tracker',
  title: 'Run Tracker',
  description: 'Running distance and pace tracker with animated route path, hero distance number, pace/time/elevation stats, heart rate, and km splits.',
  tags: ['scene', 'running', 'run', 'tracker', 'fitness', 'cardio', 'pace', 'distance', 'health'],
  category: 'scene-layout',
  component: SceneRunTrackerComponent as any,
  defaultConfig: {
    distance: '8.5 km',
    pace: "5'24\"",
    time: '45:54',
    elevation: '+124m',
    heartRate: 162,
    splits: ["5'18\"", "5'22\"", "5'28\"", "5'31\"", "5'20\""],
    bgColor: '#0a0a0a',
    textColor: '#ffffff',
    accentColor: '#FF5533',
  },
  configSchema: [
    { key: 'distance', label: 'Distance', type: 'text', defaultValue: '8.5 km', group: 'Content' },
    { key: 'pace', label: 'Pace', type: 'text', defaultValue: "5'24\"", group: 'Content' },
    { key: 'time', label: 'Time', type: 'text', defaultValue: '45:54', group: 'Content' },
    { key: 'elevation', label: 'Elevation', type: 'text', defaultValue: '+124m', group: 'Content' },
    { key: 'heartRate', label: 'Heart Rate', type: 'number', defaultValue: 162, min: 40, max: 220, group: 'Content' },
    { key: 'splits', label: 'Km Splits', type: 'text-array', defaultValue: ["5'18\"", "5'22\"", "5'28\"", "5'31\"", "5'20\""], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FF5533', group: 'Style' },
  ],
})
