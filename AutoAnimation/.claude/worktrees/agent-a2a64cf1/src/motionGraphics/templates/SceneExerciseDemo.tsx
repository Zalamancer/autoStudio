import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneExerciseDemoConfig {
  exerciseName: string
  sets: number
  reps: string
  difficulty: number
  cues: string[]
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

function SceneExerciseDemoComponent({ config, progress }: MotionGraphicProps<SceneExerciseDemoConfig>) {
  const { exerciseName, sets, reps, difficulty, cues, bgColor, textColor, accentColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.12 : 1

  // Name drops from top
  const nameEnter = easeOutBack(Math.min(1, enterProgress / 0.35))
  const nameY = (1 - nameEnter) * -50

  // Sets/reps
  const setsEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.4)))

  // Difficulty dots
  const diffEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.25) / 0.4)))

  // Cues slide in staggered
  const getCueEnter = (index: number): number => {
    const delay = 0.35 + index * 0.12
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - delay) / 0.4)))
  }

  const maxDifficulty = 5
  const diffLevel = Math.min(Math.max(0, Math.round(difficulty)), maxDifficulty)

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Top accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 'clamp(4px, 0.6vw, 6px)',
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}60)`,
          transform: `scaleX(${easeOutCubic(Math.min(1, enterProgress / 0.3))})`,
          transformOrigin: 'left',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'clamp(24px, 6vw, 56px)',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Exercise name */}
        <div
          style={{
            fontSize: 'clamp(28px, 7vw, 56px)',
            fontWeight: 900,
            color: textColor,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            marginBottom: 'clamp(8px, 1.5vw, 16px)',
            opacity: nameEnter,
            transform: `translateY(${nameY}px)`,
          }}
        >
          {exerciseName}
        </div>

        {/* Sets x Reps row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(12px, 2.5vw, 24px)',
            marginBottom: 'clamp(12px, 2.5vw, 24px)',
            opacity: setsEnter,
            transform: `translateX(${(1 - setsEnter) * -30}px)`,
          }}
        >
          <div
            style={{
              background: accentColor,
              color: bgColor,
              fontSize: 'clamp(14px, 2.5vw, 22px)',
              fontWeight: 800,
              padding: 'clamp(4px, 0.8vw, 8px) clamp(12px, 2vw, 20px)',
              borderRadius: 'clamp(4px, 0.6vw, 8px)',
            }}
          >
            {sets} x {reps}
          </div>

          {/* Difficulty indicator */}
          <div
            style={{
              display: 'flex',
              gap: 'clamp(3px, 0.5vw, 6px)',
              opacity: diffEnter,
            }}
          >
            {Array.from({ length: maxDifficulty }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 'clamp(10px, 1.8vw, 16px)',
                  height: 'clamp(10px, 1.8vw, 16px)',
                  borderRadius: '50%',
                  background: i < diffLevel ? accentColor : `${textColor}22`,
                  boxShadow: i < diffLevel ? `0 0 4px ${accentColor}60` : 'none',
                  transform: `scale(${Math.min(1, diffEnter * (1 + i * 0.1))})`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            width: `${easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.4))) * 100}%`,
            maxWidth: '300px',
            height: '1px',
            background: `${textColor}20`,
            marginBottom: 'clamp(12px, 2.5vw, 24px)',
          }}
        />

        {/* Form cues */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1.5vw, 14px)' }}>
          {cues.map((cue, i) => {
            const cueEnter = getCueEnter(i)
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'clamp(8px, 1.5vw, 14px)',
                  opacity: cueEnter,
                  transform: `translateX(${(1 - cueEnter) * 30}px)`,
                }}
              >
                <div
                  style={{
                    width: 'clamp(6px, 1vw, 8px)',
                    height: 'clamp(6px, 1vw, 8px)',
                    borderRadius: '50%',
                    background: accentColor,
                    marginTop: 'clamp(5px, 0.8vw, 8px)',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 'clamp(13px, 2.2vw, 20px)',
                    fontWeight: 500,
                    color: `${textColor}cc`,
                    lineHeight: 1.5,
                  }}
                >
                  {cue}
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
  id: 'tpl-scene-exercise-demo',
  title: 'Exercise Demo',
  description: 'Exercise instruction card with name, sets/reps, form cues as bullet points, and difficulty indicator dots',
  tags: ['scene', 'fitness', 'exercise', 'instruction', 'form', 'workout', 'health'],
  category: 'scene-layout',
  component: SceneExerciseDemoComponent as any,
  defaultConfig: {
    exerciseName: 'Barbell Squat',
    sets: 4,
    reps: '8-10',
    difficulty: 4,
    cues: ['Feet shoulder-width apart', 'Brace your core tight', 'Drive through your heels', 'Keep chest up throughout'],
    bgColor: '#111111',
    textColor: '#ffffff',
    accentColor: '#f97316',
  },
  configSchema: [
    { key: 'exerciseName', label: 'Exercise Name', type: 'text', defaultValue: 'Barbell Squat', group: 'Content' },
    { key: 'sets', label: 'Sets', type: 'number', defaultValue: 4, min: 1, max: 20, group: 'Content' },
    { key: 'reps', label: 'Reps', type: 'text', defaultValue: '8-10', group: 'Content' },
    { key: 'difficulty', label: 'Difficulty (1-5)', type: 'number', defaultValue: 4, min: 1, max: 5, group: 'Content' },
    { key: 'cues', label: 'Form Cues', type: 'text-array', defaultValue: ['Feet shoulder-width apart', 'Brace your core tight', 'Drive through your heels', 'Keep chest up throughout'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111111', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#f97316', group: 'Style' },
  ],
})
