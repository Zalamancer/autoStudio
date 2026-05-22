import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FitnessTrackerConfig {
  calories: number
  duration: number
  heartRate: number
  workoutName: string
  bgColor: string
  ringColor1: string
  ringColor2: string
  ringColor3: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneFitnessTrackerComponent({ config, progress }: MotionGraphicProps<FitnessTrackerConfig>) {
  const { calories, duration, heartRate, workoutName, bgColor, ringColor1, ringColor2, ringColor3, textColor } = config

  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.15 : 1

  // Title enters
  const titleEnter = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Rings animate with stagger
  const getRingProgress = (index: number): number => {
    const ringStart = 0.15 + index * 0.12
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - ringStart) / 0.6)))
  }

  // Counter values animate
  const getCounterValue = (target: number, index: number): number => {
    const counterProg = getRingProgress(index)
    return Math.round(target * counterProg)
  }

  // Heart pulse during hold
  const heartPulse = 1 + Math.sin(holdProgress * Math.PI * 12) * 0.08

  const radius = 42
  const strokeWidth = 8
  const circumference = 2 * Math.PI * radius
  const ringSize = 'clamp(100px, 22vw, 160px)'

  const rings = [
    { label: 'CALORIES', value: calories, unit: 'kcal', color: ringColor1, percent: Math.min(calories / 800, 1) },
    { label: 'DURATION', value: duration, unit: 'min', color: ringColor2, percent: Math.min(duration / 60, 1) },
    { label: 'HEART RATE', value: heartRate, unit: 'bpm', color: ringColor3, percent: Math.min(heartRate / 200, 1) },
  ]

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6% 5%',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Workout name */}
        <div
          style={{
            fontSize: 'clamp(14px, 2.5vw, 22px)',
            fontWeight: 600,
            color: `${textColor}99`,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            opacity: titleEnter,
            transform: `translateY(${(1 - titleEnter) * -15}px)`,
            marginBottom: 'clamp(4px, 0.8vh, 8px)',
          }}
        >
          {workoutName}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 'clamp(22px, 5vw, 42px)',
            fontWeight: 900,
            color: textColor,
            opacity: titleEnter,
            transform: `translateY(${(1 - titleEnter) * -10}px)`,
            marginBottom: 'clamp(20px, 4vh, 40px)',
            letterSpacing: '-0.02em',
          }}
        >
          WORKOUT STATS
        </div>

        {/* Rings row */}
        <div style={{ display: 'flex', gap: 'clamp(12px, 3vw, 32px)', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          {rings.map((ring, i) => {
            const ringProg = getRingProgress(i)
            const dashOffset = circumference * (1 - ring.percent * ringProg)
            const counterVal = getCounterValue(ring.value, i)
            const isHeart = i === 2
            const scale = isHeart && progress >= 0.3 && progress < 0.8 ? heartPulse : 1

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'clamp(6px, 1vh, 12px)',
                  opacity: ringProg,
                  transform: `scale(${easeOutBack(ringProg) * scale})`,
                }}
              >
                {/* Ring */}
                <div style={{ position: 'relative', width: ringSize, height: ringSize }}>
                  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                    <circle cx="50" cy="50" r={radius} fill="none" stroke={`${ring.color}20`} strokeWidth={strokeWidth} />
                    <circle
                      cx="50" cy="50" r={radius}
                      fill="none"
                      stroke={ring.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      style={{ filter: `drop-shadow(0 0 6px ${ring.color}80)` }}
                    />
                  </svg>
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 'clamp(18px, 4.5vw, 36px)', fontWeight: 900, color: textColor, fontVariantNumeric: 'tabular-nums' }}>
                      {counterVal}
                    </div>
                    <div style={{ fontSize: 'clamp(9px, 1.5vw, 13px)', fontWeight: 500, color: `${textColor}88`, textTransform: 'uppercase' }}>
                      {ring.unit}
                    </div>
                  </div>
                </div>

                {/* Label */}
                <div
                  style={{
                    fontSize: 'clamp(9px, 1.6vw, 13px)',
                    fontWeight: 700,
                    color: ring.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  {ring.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-fitness-tracker',
  title: 'Fitness Tracker',
  description: 'Workout stats with animated rings, counting numbers, and heart-rate pulse effect',
  tags: ['scene', 'fitness', 'health', 'workout', 'lifestyle', 'data', 'personal'],
  category: 'scene-layout',
  component: SceneFitnessTrackerComponent as any,
  defaultConfig: {
    calories: 542,
    duration: 45,
    heartRate: 156,
    workoutName: 'Morning Run',
    bgColor: '#0a0a0f',
    ringColor1: '#ff6b6b',
    ringColor2: '#51cf66',
    ringColor3: '#339af0',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'workoutName', label: 'Workout Name', type: 'text', defaultValue: 'Morning Run', group: 'Content' },
    { key: 'calories', label: 'Calories', type: 'number', defaultValue: 542, min: 0, max: 9999, group: 'Content' },
    { key: 'duration', label: 'Duration (min)', type: 'number', defaultValue: 45, min: 0, max: 999, group: 'Content' },
    { key: 'heartRate', label: 'Heart Rate (bpm)', type: 'number', defaultValue: 156, min: 0, max: 250, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0f', group: 'Style' },
    { key: 'ringColor1', label: 'Calories Ring', type: 'color', defaultValue: '#ff6b6b', group: 'Style' },
    { key: 'ringColor2', label: 'Duration Ring', type: 'color', defaultValue: '#51cf66', group: 'Style' },
    { key: 'ringColor3', label: 'Heart Rate Ring', type: 'color', defaultValue: '#339af0', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
