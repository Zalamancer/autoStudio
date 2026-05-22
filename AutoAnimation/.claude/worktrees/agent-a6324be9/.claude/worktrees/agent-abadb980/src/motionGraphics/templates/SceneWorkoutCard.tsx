import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneWorkoutCardConfig {
  exerciseName: string
  sets: number
  reps: number
  restSeconds: number
  muscleGroup: string
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

function SceneWorkoutCardComponent({ config, progress }: MotionGraphicProps<SceneWorkoutCardConfig>) {
  const { exerciseName, sets, reps, restSeconds, muscleGroup, bgColor, textColor, accentColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.15 : 1

  // Card slides in from right with bounce
  const cardEnter = easeOutBack(Math.min(1, enterProgress / 0.8))
  const cardX = (1 - cardEnter) * 120

  // Staggered reveals
  const nameEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.5)))
  const setsEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.5)))
  const restEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.5)))
  const tagEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.4)))

  // Rep counter pulse during hold
  const isHolding = progress >= 0.2 && progress < 0.8
  const repPulse = isHolding ? 1 + Math.sin(holdProgress * Math.PI * 8) * 0.06 : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Subtle accent gradient corner */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '50%',
          height: '50%',
          background: `radial-gradient(circle at top right, ${accentColor}15, transparent 70%)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8%',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Card */}
        <div
          style={{
            background: `${textColor}08`,
            border: `2px solid ${accentColor}40`,
            borderRadius: 'clamp(12px, 2.5vw, 24px)',
            padding: 'clamp(20px, 5vw, 48px)',
            width: '100%',
            maxWidth: '500px',
            transform: `translateX(${cardX}%)`,
          }}
        >
          {/* Muscle group tag */}
          <div
            style={{
              display: 'inline-block',
              background: accentColor,
              color: bgColor,
              fontSize: 'clamp(9px, 1.6vw, 14px)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              padding: 'clamp(3px, 0.6vw, 6px) clamp(8px, 1.5vw, 16px)',
              borderRadius: '100px',
              marginBottom: 'clamp(12px, 2.5vw, 24px)',
              opacity: tagEnter,
              transform: `scale(${tagEnter})`,
            }}
          >
            {muscleGroup}
          </div>

          {/* Exercise name */}
          <div
            style={{
              fontSize: 'clamp(24px, 6vw, 52px)',
              fontWeight: 900,
              color: textColor,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              marginBottom: 'clamp(16px, 3vw, 32px)',
              opacity: nameEnter,
              transform: `translateY(${(1 - nameEnter) * 20}px)`,
            }}
          >
            {exerciseName}
          </div>

          {/* Sets x Reps */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 'clamp(6px, 1vw, 12px)',
              marginBottom: 'clamp(10px, 2vw, 20px)',
              opacity: setsEnter,
              transform: `translateY(${(1 - setsEnter) * 15}px) scale(${repPulse})`,
            }}
          >
            <span
              style={{
                fontSize: 'clamp(32px, 8vw, 68px)',
                fontWeight: 900,
                color: accentColor,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {sets} x {reps}
            </span>
            <span
              style={{
                fontSize: 'clamp(12px, 2vw, 18px)',
                fontWeight: 600,
                color: `${textColor}88`,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              sets x reps
            </span>
          </div>

          {/* Rest time */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(6px, 1vw, 10px)',
              opacity: restEnter,
              transform: `translateY(${(1 - restEnter) * 10}px)`,
            }}
          >
            <div
              style={{
                width: 'clamp(3px, 0.5vw, 4px)',
                height: 'clamp(20px, 3vw, 28px)',
                background: accentColor,
                borderRadius: '2px',
              }}
            />
            <span
              style={{
                fontSize: 'clamp(13px, 2.2vw, 20px)',
                fontWeight: 600,
                color: `${textColor}aa`,
              }}
            >
              {restSeconds}s rest
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-workout-card',
  title: 'Workout Card',
  description: 'Exercise card with name, sets x reps, rest time, and muscle group tag. Slides in with bounce, rep counter pulses.',
  tags: ['scene', 'fitness', 'workout', 'exercise', 'gym', 'health'],
  category: 'scene-layout',
  component: SceneWorkoutCardComponent as any,
  defaultConfig: {
    exerciseName: 'Bench Press',
    sets: 4,
    reps: 12,
    restSeconds: 90,
    muscleGroup: 'Chest',
    bgColor: '#0a0a0a',
    textColor: '#ffffff',
    accentColor: '#39ff14',
  },
  configSchema: [
    { key: 'exerciseName', label: 'Exercise Name', type: 'text', defaultValue: 'Bench Press', group: 'Content' },
    { key: 'sets', label: 'Sets', type: 'number', defaultValue: 4, min: 1, max: 20, group: 'Content' },
    { key: 'reps', label: 'Reps', type: 'number', defaultValue: 12, min: 1, max: 100, group: 'Content' },
    { key: 'restSeconds', label: 'Rest (seconds)', type: 'number', defaultValue: 90, min: 0, max: 600, group: 'Content' },
    { key: 'muscleGroup', label: 'Muscle Group', type: 'text', defaultValue: 'Chest', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#39ff14', group: 'Style' },
  ],
})
