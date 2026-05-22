import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneCyclingRouteConfig {
  routeName: string
  distance: string
  duration: string
  avgSpeed: string
  maxSpeed: string
  elevation: string
  calories: number
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneCyclingRouteComponent({ config, progress }: MotionGraphicProps<SceneCyclingRouteConfig>) {
  const { routeName, distance, duration, avgSpeed, maxSpeed, elevation, calories, bgColor, textColor, accentColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.12 : 1

  const headerEnter = easeOutBack(Math.min(1, enterProgress / 0.5))
  const statsEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.25) / 0.5)))
  const gridEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.5)))

  // Elevation profile path animation
  const pathDraw = easeOutCubic(Math.min(1, enterProgress / 0.9))

  // Wheel spin during hold
  const isHolding = progress >= 0.2 && progress < 0.8
  const wheelRotation = isHolding ? holdProgress * 720 : enterProgress * 180

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Elevation profile */}
      <svg
        viewBox="0 0 500 120"
        style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '18%', opacity: 0.06 }}
      >
        <path
          d="M 0,100 Q 50,90 100,80 T 180,60 T 250,40 T 320,55 T 380,35 T 450,50 T 500,70 V 120 H 0 Z"
          fill={accentColor}
          strokeDasharray="800"
          strokeDashoffset={800 * (1 - pathDraw)}
        />
        <path
          d="M 0,100 Q 50,90 100,80 T 180,60 T 250,40 T 320,55 T 380,35 T 450,50 T 500,70"
          fill="none"
          stroke={accentColor}
          strokeWidth="2"
          strokeDasharray="800"
          strokeDashoffset={800 * (1 - pathDraw)}
          opacity="0.5"
        />
      </svg>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '5%',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Header with cycling icon */}
        <div
          style={{
            marginBottom: 'clamp(10px, 2vw, 20px)',
            opacity: headerEnter,
            transform: `translateY(${(1 - headerEnter) * -25}px)`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 14px)', marginBottom: 'clamp(4px, 0.8vw, 8px)' }}>
            {/* Bike wheel icon */}
            <div
              style={{
                width: 'clamp(28px, 5vw, 42px)',
                height: 'clamp(28px, 5vw, 42px)',
                borderRadius: '50%',
                border: `2px solid ${accentColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `rotate(${wheelRotation}deg)`,
              }}
            >
              <div style={{ width: '60%', height: '1px', background: accentColor }} />
            </div>
            <div
              style={{
                fontSize: 'clamp(10px, 1.6vw, 14px)',
                fontWeight: 700,
                color: `${textColor}55`,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Ride Summary
            </div>
          </div>
          <div
            style={{
              fontSize: 'clamp(22px, 5.5vw, 44px)',
              fontWeight: 900,
              color: textColor,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            {routeName}
          </div>
        </div>

        {/* Hero stats - distance and duration */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'clamp(20px, 5vw, 48px)',
            marginBottom: 'clamp(16px, 3vw, 30px)',
            opacity: statsEnter,
            transform: `translateY(${(1 - statsEnter) * 15}px)`,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(32px, 8vw, 60px)', fontWeight: 900, color: accentColor, lineHeight: 1 }}>
              {distance}
            </div>
            <div style={{ fontSize: 'clamp(9px, 1.4vw, 12px)', fontWeight: 600, color: `${textColor}55`, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Distance
            </div>
          </div>
          <div style={{ width: '1px', height: 'clamp(40px, 8vw, 60px)', background: `${textColor}15` }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(32px, 8vw, 60px)', fontWeight: 900, color: textColor, lineHeight: 1 }}>
              {duration}
            </div>
            <div style={{ fontSize: 'clamp(9px, 1.4vw, 12px)', fontWeight: 600, color: `${textColor}55`, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Duration
            </div>
          </div>
        </div>

        {/* Detailed stats grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'clamp(6px, 1.2vw, 12px)',
            opacity: gridEnter,
            transform: `translateY(${(1 - gridEnter) * 12}px)`,
          }}
        >
          {[
            { label: 'Avg Speed', value: avgSpeed },
            { label: 'Max Speed', value: maxSpeed },
            { label: 'Elevation', value: elevation },
            { label: 'Calories', value: `${Math.round(calories * gridEnter)}` },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                padding: 'clamp(8px, 1.5vw, 14px)',
                background: `${textColor}05`,
                border: `1px solid ${textColor}08`,
                borderRadius: 'clamp(6px, 1.2vw, 10px)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 'clamp(9px, 1.5vw, 13px)', fontWeight: 600, color: `${textColor}55`, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {stat.label}
              </span>
              <span style={{ fontSize: 'clamp(14px, 2.5vw, 22px)', fontWeight: 800, color: textColor, fontVariantNumeric: 'tabular-nums' }}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-cycling-route',
  title: 'Cycling Route',
  description: 'Cycling route stats with spinning wheel icon, elevation profile, distance/duration hero stats, and detailed speed/elevation/calorie grid.',
  tags: ['scene', 'cycling', 'bike', 'route', 'fitness', 'cardio', 'speed', 'distance', 'outdoor'],
  category: 'scene-layout',
  component: SceneCyclingRouteComponent as any,
  defaultConfig: {
    routeName: 'Coastal Loop',
    distance: '42 km',
    duration: '1:38:22',
    avgSpeed: '25.6 km/h',
    maxSpeed: '48.2 km/h',
    elevation: '+680m',
    calories: 920,
    bgColor: '#0a0a0a',
    textColor: '#ffffff',
    accentColor: '#FF6633',
  },
  configSchema: [
    { key: 'routeName', label: 'Route Name', type: 'text', defaultValue: 'Coastal Loop', group: 'Content' },
    { key: 'distance', label: 'Distance', type: 'text', defaultValue: '42 km', group: 'Content' },
    { key: 'duration', label: 'Duration', type: 'text', defaultValue: '1:38:22', group: 'Content' },
    { key: 'avgSpeed', label: 'Avg Speed', type: 'text', defaultValue: '25.6 km/h', group: 'Content' },
    { key: 'maxSpeed', label: 'Max Speed', type: 'text', defaultValue: '48.2 km/h', group: 'Content' },
    { key: 'elevation', label: 'Elevation', type: 'text', defaultValue: '+680m', group: 'Content' },
    { key: 'calories', label: 'Calories', type: 'number', defaultValue: 920, min: 0, max: 9999, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FF6633', group: 'Style' },
  ],
})
