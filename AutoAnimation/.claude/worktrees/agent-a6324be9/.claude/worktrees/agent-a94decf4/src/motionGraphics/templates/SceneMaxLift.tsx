import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneMaxLiftConfig {
  exerciseName: string
  weight: number
  unit: string
  previousMax: number
  date: string
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

function SceneMaxLiftComponent({ config, progress }: MotionGraphicProps<SceneMaxLiftConfig>) {
  const { exerciseName, weight, unit, previousMax, date, bgColor, textColor, accentColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.15 : 1

  const titleEnter = easeOutCubic(Math.min(1, enterProgress / 0.4))
  const weightEnter = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.6)))
  const detailsEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.5)))

  // Weight counter animation
  const displayWeight = Math.round(weight * easeOutCubic(Math.min(1, enterProgress / 0.8)))
  const improvement = weight - previousMax
  const isNewPR = improvement > 0

  // Pulse on hold for PR
  const isHolding = progress >= 0.25 && progress < 0.8
  const prPulse = isHolding && isNewPR ? 1 + Math.sin(holdProgress * Math.PI * 6) * 0.03 : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* PR burst glow */}
      {isNewPR && (
        <div
          style={{
            position: 'absolute',
            top: '35%',
            left: '50%',
            width: '80%',
            height: '40%',
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${accentColor}${isHolding ? '12' : '08'}, transparent 60%)`,
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8%',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* PR Badge */}
        {isNewPR && (
          <div
            style={{
              background: `linear-gradient(135deg, ${accentColor}, #FF6600)`,
              color: '#fff',
              fontSize: 'clamp(10px, 1.8vw, 16px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              padding: 'clamp(4px, 0.8vw, 8px) clamp(12px, 2.5vw, 24px)',
              borderRadius: '100px',
              marginBottom: 'clamp(10px, 2vw, 20px)',
              opacity: titleEnter,
              transform: `scale(${titleEnter})`,
              boxShadow: `0 4px 20px ${accentColor}40`,
            }}
          >
            NEW PR
          </div>
        )}

        {/* Exercise name */}
        <div
          style={{
            fontSize: 'clamp(14px, 2.5vw, 22px)',
            fontWeight: 700,
            color: `${textColor}88`,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: 'clamp(8px, 1.5vw, 16px)',
            opacity: titleEnter,
            transform: `translateY(${(1 - titleEnter) * -15}px)`,
          }}
        >
          {exerciseName}
        </div>

        {/* Weight display */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 'clamp(4px, 1vw, 10px)',
            marginBottom: 'clamp(12px, 2.5vw, 24px)',
            opacity: weightEnter,
            transform: `scale(${weightEnter * prPulse})`,
          }}
        >
          <span
            style={{
              fontSize: 'clamp(56px, 16vw, 120px)',
              fontWeight: 900,
              color: accentColor,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
              textShadow: `0 0 30px ${accentColor}30`,
            }}
          >
            {displayWeight}
          </span>
          <span
            style={{
              fontSize: 'clamp(18px, 4vw, 32px)',
              fontWeight: 700,
              color: `${textColor}66`,
              textTransform: 'uppercase',
            }}
          >
            {unit}
          </span>
        </div>

        {/* Improvement and previous */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(16px, 4vw, 40px)',
            opacity: detailsEnter,
            transform: `translateY(${(1 - detailsEnter) * 15}px)`,
          }}
        >
          {isNewPR && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 'clamp(18px, 4vw, 30px)',
                  fontWeight: 800,
                  color: '#22c55e',
                }}
              >
                +{improvement} {unit}
              </span>
              <span style={{ fontSize: 'clamp(9px, 1.4vw, 12px)', fontWeight: 600, color: `${textColor}55`, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Improvement
              </span>
            </div>
          )}
          <div style={{ width: '1px', height: 'clamp(24px, 4vw, 36px)', background: `${textColor}20` }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 'clamp(16px, 3vw, 26px)', fontWeight: 800, color: `${textColor}aa` }}>
              {previousMax} {unit}
            </span>
            <span style={{ fontSize: 'clamp(9px, 1.4vw, 12px)', fontWeight: 600, color: `${textColor}55`, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Previous Max
            </span>
          </div>
        </div>

        {/* Date */}
        <div
          style={{
            marginTop: 'clamp(16px, 3vw, 32px)',
            fontSize: 'clamp(10px, 1.6vw, 14px)',
            fontWeight: 600,
            color: `${textColor}44`,
            opacity: detailsEnter,
          }}
        >
          {date}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-max-lift',
  title: 'Max Lift',
  description: 'Personal record / max lift display with animated weight counter, PR badge, improvement stat, and previous max comparison.',
  tags: ['scene', 'gym', 'max', 'lift', 'PR', 'record', 'fitness', 'strength', 'powerlifting'],
  category: 'scene-layout',
  component: SceneMaxLiftComponent as any,
  defaultConfig: {
    exerciseName: 'Deadlift',
    weight: 225,
    unit: 'kg',
    previousMax: 210,
    date: 'March 19, 2026',
    bgColor: '#0a0a0a',
    textColor: '#ffffff',
    accentColor: '#FF3333',
  },
  configSchema: [
    { key: 'exerciseName', label: 'Exercise', type: 'text', defaultValue: 'Deadlift', group: 'Content' },
    { key: 'weight', label: 'Weight', type: 'number', defaultValue: 225, min: 0, max: 9999, group: 'Content' },
    { key: 'unit', label: 'Unit', type: 'text', defaultValue: 'kg', group: 'Content' },
    { key: 'previousMax', label: 'Previous Max', type: 'number', defaultValue: 210, min: 0, max: 9999, group: 'Content' },
    { key: 'date', label: 'Date', type: 'text', defaultValue: 'March 19, 2026', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FF3333', group: 'Style' },
  ],
})
