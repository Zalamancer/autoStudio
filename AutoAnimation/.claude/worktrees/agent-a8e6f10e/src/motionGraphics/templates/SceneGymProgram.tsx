import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneGymProgramConfig {
  programName: string
  exercises: string[]
  setsReps: string[]
  duration: string
  level: string
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

function SceneGymProgramComponent({ config, progress }: MotionGraphicProps<SceneGymProgramConfig>) {
  const { programName, exercises, setsReps, duration, level, bgColor, textColor, accentColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.12 : 1

  const headerEnter = easeOutBack(Math.min(1, enterProgress / 0.5))
  const badgeEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.4)))

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Accent diagonal stripe */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '40%',
          height: '140%',
          background: `${accentColor}08`,
          transform: 'skewX(-12deg)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '6%',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Header */}
        <div
          style={{
            marginBottom: 'clamp(10px, 2vw, 20px)',
            opacity: headerEnter,
            transform: `translateY(${(1 - headerEnter) * -30}px)`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 16px)', marginBottom: 'clamp(4px, 0.8vw, 8px)' }}>
            <div
              style={{
                background: accentColor,
                color: bgColor,
                fontSize: 'clamp(8px, 1.4vw, 12px)',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                padding: 'clamp(2px, 0.4vw, 5px) clamp(8px, 1.5vw, 14px)',
                borderRadius: '100px',
                opacity: badgeEnter,
                transform: `scale(${badgeEnter})`,
              }}
            >
              {level}
            </div>
            <span style={{ fontSize: 'clamp(10px, 1.6vw, 14px)', color: `${textColor}66`, fontWeight: 600 }}>
              {duration}
            </span>
          </div>
          <div
            style={{
              fontSize: 'clamp(22px, 5.5vw, 46px)',
              fontWeight: 900,
              color: textColor,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            {programName}
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            width: `${Math.min(100, headerEnter * 100)}%`,
            height: '2px',
            background: `linear-gradient(90deg, ${accentColor}, transparent)`,
            marginBottom: 'clamp(10px, 2vw, 20px)',
          }}
        />

        {/* Exercise list */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 1.2vw, 12px)' }}>
          {exercises.map((exercise, i) => {
            const itemDelay = 0.3 + i * 0.1
            const itemEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - itemDelay) / 0.4)))
            const isActive = progress >= 0.2 && progress < 0.8 && Math.floor(holdProgress * exercises.length) === i
            const activeGlow = isActive ? `0 0 12px ${accentColor}30` : 'none'

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'clamp(8px, 1.5vw, 14px) clamp(10px, 2vw, 18px)',
                  background: isActive ? `${accentColor}12` : `${textColor}06`,
                  border: `1px solid ${isActive ? `${accentColor}40` : `${textColor}10`}`,
                  borderRadius: 'clamp(6px, 1.2vw, 12px)',
                  opacity: itemEnter,
                  transform: `translateX(${(1 - itemEnter) * 40}px)`,
                  boxShadow: activeGlow,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 14px)' }}>
                  <div
                    style={{
                      width: 'clamp(22px, 4vw, 34px)',
                      height: 'clamp(22px, 4vw, 34px)',
                      borderRadius: '50%',
                      background: isActive ? accentColor : `${textColor}15`,
                      color: isActive ? bgColor : `${textColor}80`,
                      fontSize: 'clamp(10px, 1.8vw, 15px)',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {i + 1}
                  </div>
                  <span
                    style={{
                      fontSize: 'clamp(12px, 2.2vw, 19px)',
                      fontWeight: 700,
                      color: textColor,
                    }}
                  >
                    {exercise}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 'clamp(11px, 1.8vw, 16px)',
                    fontWeight: 700,
                    color: accentColor,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {setsReps[i] || '3x12'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-gym-program',
  title: 'Gym Program',
  description: 'Workout program card with numbered exercise list, sets/reps, level badge, and duration. Exercises highlight one by one during hold.',
  tags: ['scene', 'gym', 'program', 'workout', 'exercise', 'fitness', 'plan', 'routine'],
  category: 'scene-layout',
  component: SceneGymProgramComponent as any,
  defaultConfig: {
    programName: 'Push Day',
    exercises: ['Bench Press', 'Overhead Press', 'Incline DB Press', 'Cable Flyes', 'Lateral Raises'],
    setsReps: ['4x8', '4x10', '3x12', '3x15', '3x15'],
    duration: '55 min',
    level: 'Intermediate',
    bgColor: '#0a0a0a',
    textColor: '#ffffff',
    accentColor: '#FF3333',
  },
  configSchema: [
    { key: 'programName', label: 'Program Name', type: 'text', defaultValue: 'Push Day', group: 'Content' },
    { key: 'exercises', label: 'Exercises', type: 'text-array', defaultValue: ['Bench Press', 'Overhead Press', 'Incline DB Press', 'Cable Flyes', 'Lateral Raises'], group: 'Content' },
    { key: 'setsReps', label: 'Sets x Reps', type: 'text-array', defaultValue: ['4x8', '4x10', '3x12', '3x15', '3x15'], group: 'Content' },
    { key: 'duration', label: 'Duration', type: 'text', defaultValue: '55 min', group: 'Content' },
    { key: 'level', label: 'Level', type: 'text', defaultValue: 'Intermediate', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FF3333', group: 'Style' },
  ],
})
