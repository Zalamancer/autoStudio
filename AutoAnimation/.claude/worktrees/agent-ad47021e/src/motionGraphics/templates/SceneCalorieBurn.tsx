import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneCalorieBurnConfig {
  calories: number
  goal: number
  exerciseType: string
  duration: string
  heartRate: number
  bgColor: string
  textColor: string
  accentColor: string
  ringColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutQuart(t: number): number { return 1 - Math.pow(1 - t, 4) }

function SceneCalorieBurnComponent({ config, progress }: MotionGraphicProps<SceneCalorieBurnConfig>) {
  const { calories, goal, exerciseType, duration, heartRate, bgColor, textColor, accentColor, ringColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.12 : 1

  // Counter counts up
  const counterEnter = easeOutQuart(Math.min(1, enterProgress / 0.8))
  const displayCalories = Math.round(calories * counterEnter)

  // Ring
  const ringEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.7)))
  const percent = Math.min(calories / goal, 1)
  const radius = 100
  const strokeWidth = 14
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - percent * ringEnter)

  const statsEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.5)))

  // Flame flicker
  const isHolding = progress >= 0.25 && progress < 0.8
  const flameScale = isHolding ? 1 + Math.sin(holdProgress * Math.PI * 10) * 0.08 : 1
  const ringGlow = isHolding ? 10 + Math.sin(holdProgress * Math.PI * 8) * 5 : 10

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Heat glow */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          width: '70%',
          height: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${accentColor}0a, transparent 60%)`,
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
          padding: '5%',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Exercise type badge */}
        <div
          style={{
            background: `${accentColor}20`,
            border: `1px solid ${accentColor}40`,
            color: accentColor,
            fontSize: 'clamp(9px, 1.6vw, 13px)',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            padding: 'clamp(3px, 0.6vw, 6px) clamp(10px, 2vw, 20px)',
            borderRadius: '100px',
            marginBottom: 'clamp(14px, 3vw, 28px)',
            opacity: easeOutCubic(Math.min(1, enterProgress / 0.3)),
          }}
        >
          {exerciseType}
        </div>

        {/* Calorie ring */}
        <div
          style={{
            position: 'relative',
            width: 'clamp(190px, 42vw, 300px)',
            height: 'clamp(190px, 42vw, 300px)',
          }}
        >
          <svg
            viewBox={`0 0 ${(radius + strokeWidth) * 2} ${(radius + strokeWidth) * 2}`}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Track */}
            <circle
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              fill="none"
              stroke={`${ringColor}15`}
              strokeWidth={strokeWidth}
            />
            {/* Progress */}
            <circle
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              fill="none"
              stroke={ringColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${radius + strokeWidth} ${radius + strokeWidth})`}
              style={{ filter: `drop-shadow(0 0 ${ringGlow}px ${ringColor}80)` }}
            />
          </svg>

          {/* Center content */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            {/* Flame icon */}
            <div
              style={{
                fontSize: 'clamp(20px, 4vw, 34px)',
                marginBottom: '2px',
                transform: `scale(${flameScale})`,
                opacity: counterEnter,
                filter: `drop-shadow(0 0 6px ${accentColor}60)`,
              }}
            >
              {'\u{1F525}'}
            </div>
            {/* Calorie count */}
            <div
              style={{
                fontSize: 'clamp(36px, 9vw, 68px)',
                fontWeight: 900,
                color: textColor,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}
            >
              {displayCalories}
            </div>
            <div
              style={{
                fontSize: 'clamp(10px, 1.6vw, 14px)',
                fontWeight: 600,
                color: `${textColor}55`,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginTop: '2px',
              }}
            >
              / {goal} kcal
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(20px, 5vw, 48px)',
            marginTop: 'clamp(18px, 3.5vw, 36px)',
            opacity: statsEnter,
            transform: `translateY(${(1 - statsEnter) * 15}px)`,
          }}
        >
          {/* Duration */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 'clamp(18px, 4vw, 30px)', fontWeight: 800, color: textColor }}>
              {duration}
            </div>
            <div style={{ fontSize: 'clamp(9px, 1.4vw, 12px)', fontWeight: 600, color: `${textColor}55`, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Duration
            </div>
          </div>

          <div style={{ width: '1px', height: 'clamp(24px, 4vw, 38px)', background: `${textColor}20` }} />

          {/* Heart rate */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 'clamp(18px, 4vw, 30px)', fontWeight: 800, color: textColor, fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(heartRate * statsEnter)}
            </div>
            <div style={{ fontSize: 'clamp(9px, 1.4vw, 12px)', fontWeight: 600, color: `${textColor}55`, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Avg BPM
            </div>
          </div>

          <div style={{ width: '1px', height: 'clamp(24px, 4vw, 38px)', background: `${textColor}20` }} />

          {/* Percentage */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 'clamp(18px, 4vw, 30px)', fontWeight: 800, color: accentColor }}>
              {Math.round(percent * 100 * statsEnter)}%
            </div>
            <div style={{ fontSize: 'clamp(9px, 1.4vw, 12px)', fontWeight: 600, color: `${textColor}55`, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Goal
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-calorie-burn',
  title: 'Calorie Burn',
  description: 'Calories burned counter with animated progress ring, flame icon, duration, heart rate, and goal percentage stats.',
  tags: ['scene', 'calorie', 'burn', 'fitness', 'gym', 'health', 'tracker', 'cardio'],
  category: 'scene-layout',
  component: SceneCalorieBurnComponent as any,
  defaultConfig: {
    calories: 486,
    goal: 600,
    exerciseType: 'HIIT Training',
    duration: '42 min',
    heartRate: 156,
    bgColor: '#0a0a0a',
    textColor: '#ffffff',
    accentColor: '#FF4400',
    ringColor: '#FF4400',
  },
  configSchema: [
    { key: 'calories', label: 'Calories', type: 'number', defaultValue: 486, min: 0, max: 9999, group: 'Content' },
    { key: 'goal', label: 'Goal', type: 'number', defaultValue: 600, min: 100, max: 9999, group: 'Content' },
    { key: 'exerciseType', label: 'Exercise Type', type: 'text', defaultValue: 'HIIT Training', group: 'Content' },
    { key: 'duration', label: 'Duration', type: 'text', defaultValue: '42 min', group: 'Content' },
    { key: 'heartRate', label: 'Heart Rate', type: 'number', defaultValue: 156, min: 40, max: 220, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FF4400', group: 'Style' },
    { key: 'ringColor', label: 'Ring Color', type: 'color', defaultValue: '#FF4400', group: 'Style' },
  ],
})
