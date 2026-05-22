import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneFormCheckConfig {
  exerciseName: string
  formTips: string[]
  commonMistakes: string[]
  difficulty: string
  targetMuscle: string
  bgColor: string
  textColor: string
  accentColor: string
  warningColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneFormCheckComponent({ config, progress }: MotionGraphicProps<SceneFormCheckConfig>) {
  const { exerciseName, formTips, commonMistakes, difficulty, targetMuscle, bgColor, textColor, accentColor, warningColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.1 : 1

  const headerEnter = easeOutBack(Math.min(1, enterProgress / 0.5))
  const badgesEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.4)))

  // Show tips first half of hold, mistakes second half
  const showMistakes = holdProgress > 0.5

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Crosshair / form guide lines */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 'clamp(200px, 40vw, 350px)',
          height: 'clamp(200px, 40vw, 350px)',
          transform: 'translate(-50%, -50%)',
          border: `1px solid ${textColor}06`,
          borderRadius: '50%',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '20%',
          bottom: '20%',
          left: '50%',
          width: '1px',
          background: `${textColor}04`,
        }}
      />

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
        {/* Header */}
        <div
          style={{
            marginBottom: 'clamp(8px, 1.5vw, 16px)',
            opacity: headerEnter,
            transform: `translateX(${(1 - headerEnter) * -30}px)`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.2vw, 12px)', marginBottom: 'clamp(4px, 0.8vw, 8px)', flexWrap: 'wrap' }}>
            <div
              style={{
                background: accentColor,
                color: bgColor,
                fontSize: 'clamp(8px, 1.3vw, 11px)',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: 'clamp(2px, 0.4vw, 4px) clamp(7px, 1.2vw, 12px)',
                borderRadius: '100px',
                opacity: badgesEnter,
              }}
            >
              {difficulty}
            </div>
            <div
              style={{
                background: `${textColor}10`,
                color: `${textColor}88`,
                fontSize: 'clamp(8px, 1.3vw, 11px)',
                fontWeight: 700,
                padding: 'clamp(2px, 0.4vw, 4px) clamp(7px, 1.2vw, 12px)',
                borderRadius: '100px',
                opacity: badgesEnter,
              }}
            >
              {targetMuscle}
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
            {exerciseName}
          </div>
          <div
            style={{
              fontSize: 'clamp(10px, 1.8vw, 15px)',
              fontWeight: 700,
              color: `${textColor}55`,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginTop: 'clamp(4px, 0.8vw, 8px)',
            }}
          >
            Form Check
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: `${headerEnter * 100}%`, height: '2px', background: `linear-gradient(90deg, ${accentColor}, transparent)`, marginBottom: 'clamp(10px, 2vw, 20px)' }} />

        {/* Tips section */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'clamp(6px, 1.2vw, 12px)' }}>
          {/* Section header */}
          <div
            style={{
              fontSize: 'clamp(10px, 1.6vw, 14px)',
              fontWeight: 800,
              color: showMistakes ? warningColor : accentColor,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: 'clamp(2px, 0.5vw, 6px)',
            }}
          >
            {showMistakes ? '\u26A0 Common Mistakes' : '\u2713 Proper Form'}
          </div>

          {(showMistakes ? commonMistakes : formTips).map((tip, i) => {
            const itemDelay = 0.2 + i * 0.08
            const itemEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - itemDelay) / 0.35)))
            const tipColor = showMistakes ? warningColor : accentColor

            return (
              <div
                key={`${showMistakes ? 'm' : 't'}-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'clamp(8px, 1.5vw, 14px)',
                  padding: 'clamp(8px, 1.5vw, 14px)',
                  background: `${tipColor}08`,
                  border: `1px solid ${tipColor}15`,
                  borderRadius: 'clamp(6px, 1.2vw, 10px)',
                  opacity: itemEnter,
                  transform: `translateX(${(1 - itemEnter) * 25}px)`,
                }}
              >
                <div
                  style={{
                    width: 'clamp(18px, 3.2vw, 26px)',
                    height: 'clamp(18px, 3.2vw, 26px)',
                    borderRadius: '50%',
                    background: showMistakes ? `${warningColor}20` : `${accentColor}20`,
                    color: tipColor,
                    fontSize: 'clamp(10px, 1.6vw, 14px)',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {showMistakes ? '\u2717' : '\u2713'}
                </div>
                <span style={{ fontSize: 'clamp(11px, 2vw, 16px)', fontWeight: 600, color: textColor, lineHeight: 1.4 }}>
                  {tip}
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
  id: 'tpl-scene-form-check',
  title: 'Form Check',
  description: 'Exercise form check card with proper form tips and common mistakes. Shows tips first, then switches to mistakes during hold.',
  tags: ['scene', 'form', 'check', 'exercise', 'gym', 'fitness', 'technique', 'tips'],
  category: 'scene-layout',
  component: SceneFormCheckComponent as any,
  defaultConfig: {
    exerciseName: 'Barbell Squat',
    formTips: ['Feet shoulder-width apart', 'Chest up, core braced', 'Knees track over toes', 'Break parallel at hip crease'],
    commonMistakes: ['Knees caving inward', 'Rounding the lower back', 'Rising on toes', 'Not hitting depth'],
    difficulty: 'Intermediate',
    targetMuscle: 'Quads / Glutes',
    bgColor: '#0a0a0a',
    textColor: '#ffffff',
    accentColor: '#22c55e',
    warningColor: '#FF4433',
  },
  configSchema: [
    { key: 'exerciseName', label: 'Exercise', type: 'text', defaultValue: 'Barbell Squat', group: 'Content' },
    { key: 'formTips', label: 'Form Tips', type: 'text-array', defaultValue: ['Feet shoulder-width apart', 'Chest up, core braced', 'Knees track over toes', 'Break parallel at hip crease'], group: 'Content' },
    { key: 'commonMistakes', label: 'Common Mistakes', type: 'text-array', defaultValue: ['Knees caving inward', 'Rounding the lower back', 'Rising on toes', 'Not hitting depth'], group: 'Content' },
    { key: 'difficulty', label: 'Difficulty', type: 'text', defaultValue: 'Intermediate', group: 'Content' },
    { key: 'targetMuscle', label: 'Target Muscle', type: 'text', defaultValue: 'Quads / Glutes', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#22c55e', group: 'Style' },
    { key: 'warningColor', label: 'Warning Color', type: 'color', defaultValue: '#FF4433', group: 'Style' },
  ],
})
