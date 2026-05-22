import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneMacroTrackerConfig {
  calories: number
  calorieGoal: number
  protein: number
  proteinGoal: number
  carbs: number
  carbsGoal: number
  fat: number
  fatGoal: number
  proteinColor: string
  carbsColor: string
  fatColor: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneMacroTrackerComponent({ config, progress }: MotionGraphicProps<SceneMacroTrackerConfig>) {
  const { calories, calorieGoal, protein, proteinGoal, carbs, carbsGoal, fat, fatGoal, proteinColor, carbsColor, fatColor, bgColor, textColor } = config

  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.15 : 1

  const rings = [
    { label: 'Protein', value: protein, goal: proteinGoal, color: proteinColor, unit: 'g' },
    { label: 'Carbs', value: carbs, goal: carbsGoal, color: carbsColor, unit: 'g' },
    { label: 'Fat', value: fat, goal: fatGoal, color: fatColor, unit: 'g' },
  ]

  // Staggered ring fills
  const getRingEnter = (index: number): number => {
    const delay = 0.15 + index * 0.2
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - delay) / 0.6)))
  }

  // Calorie counter enters first
  const calEnter = easeOutCubic(Math.min(1, enterProgress / 0.4))
  const calCount = Math.round(calories * calEnter)

  // Hold glow pulse
  const isHolding = progress >= 0.3 && progress < 0.8
  const glowPulse = isHolding ? 0.6 + Math.sin(holdProgress * Math.PI * 6) * 0.3 : 0.6

  // SVG ring params -- 3 concentric rings
  const cx = 120
  const cy = 120
  const strokeWidth = 14
  const gap = 6
  const radii = [100, 100 - strokeWidth - gap, 100 - 2 * (strokeWidth + gap)]

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

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
        {/* Rings SVG */}
        <div style={{ position: 'relative', width: 'clamp(200px, 45vw, 320px)', height: 'clamp(200px, 45vw, 320px)' }}>
          <svg viewBox={`0 0 ${cx * 2} ${cy * 2}`} style={{ width: '100%', height: '100%' }}>
            {rings.map((ring, i) => {
              const r = radii[i]
              const circumference = 2 * Math.PI * r
              const percent = Math.min(ring.value / ring.goal, 1)
              const ringProg = getRingEnter(i)
              const dashOffset = circumference * (1 - percent * ringProg)

              return (
                <React.Fragment key={i}>
                  {/* Track */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke={`${ring.color}18`}
                    strokeWidth={strokeWidth}
                  />
                  {/* Progress */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke={ring.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${cx} ${cy})`}
                    style={{ filter: `drop-shadow(0 0 6px ${ring.color}${Math.round(glowPulse * 255).toString(16).padStart(2, '0')})` }}
                  />
                </React.Fragment>
              )
            })}
          </svg>

          {/* Center calorie count */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              opacity: calEnter,
            }}
          >
            <div
              style={{
                fontSize: 'clamp(28px, 7vw, 52px)',
                fontWeight: 900,
                color: textColor,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}
            >
              {calCount}
            </div>
            <div
              style={{
                fontSize: 'clamp(9px, 1.5vw, 13px)',
                fontWeight: 600,
                color: `${textColor}66`,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginTop: '2px',
              }}
            >
              / {calorieGoal} kcal
            </div>
          </div>
        </div>

        {/* Macro breakdown row */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(16px, 4vw, 40px)',
            marginTop: 'clamp(16px, 3vw, 32px)',
          }}
        >
          {rings.map((ring, i) => {
            const ringProg = getRingEnter(i)
            const currentVal = Math.round(ring.value * ringProg)
            const pct = Math.round((ring.value / ring.goal) * 100 * ringProg)

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  opacity: ringProg,
                  transform: `translateY(${(1 - ringProg) * 12}px)`,
                }}
              >
                <div
                  style={{
                    width: 'clamp(8px, 1.2vw, 12px)',
                    height: 'clamp(8px, 1.2vw, 12px)',
                    borderRadius: '50%',
                    background: ring.color,
                    marginBottom: '6px',
                    boxShadow: `0 0 6px ${ring.color}60`,
                  }}
                />
                <div
                  style={{
                    fontSize: 'clamp(16px, 3.5vw, 28px)',
                    fontWeight: 800,
                    color: textColor,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {currentVal}{ring.unit}
                </div>
                <div
                  style={{
                    fontSize: 'clamp(9px, 1.4vw, 12px)',
                    fontWeight: 600,
                    color: `${textColor}66`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {ring.label} ({pct}%)
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
  id: 'tpl-scene-macro-tracker',
  title: 'Macro Tracker',
  description: 'Daily macro tracker with 3 concentric SVG rings for protein/carbs/fat, calorie total center, and percentages',
  tags: ['scene', 'fitness', 'nutrition', 'macros', 'health', 'data', 'diet'],
  category: 'scene-layout',
  component: SceneMacroTrackerComponent as any,
  defaultConfig: {
    calories: 1840,
    calorieGoal: 2200,
    protein: 145,
    proteinGoal: 180,
    carbs: 210,
    carbsGoal: 250,
    fat: 55,
    fatGoal: 70,
    proteinColor: '#ef4444',
    carbsColor: '#3b82f6',
    fatColor: '#eab308',
    bgColor: '#0a0a0f',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'calories', label: 'Calories', type: 'number', defaultValue: 1840, min: 0, max: 9999, group: 'Content' },
    { key: 'calorieGoal', label: 'Calorie Goal', type: 'number', defaultValue: 2200, min: 0, max: 9999, group: 'Content' },
    { key: 'protein', label: 'Protein (g)', type: 'number', defaultValue: 145, min: 0, max: 999, group: 'Content' },
    { key: 'proteinGoal', label: 'Protein Goal (g)', type: 'number', defaultValue: 180, min: 0, max: 999, group: 'Content' },
    { key: 'carbs', label: 'Carbs (g)', type: 'number', defaultValue: 210, min: 0, max: 999, group: 'Content' },
    { key: 'carbsGoal', label: 'Carbs Goal (g)', type: 'number', defaultValue: 250, min: 0, max: 999, group: 'Content' },
    { key: 'fat', label: 'Fat (g)', type: 'number', defaultValue: 55, min: 0, max: 999, group: 'Content' },
    { key: 'fatGoal', label: 'Fat Goal (g)', type: 'number', defaultValue: 70, min: 0, max: 999, group: 'Content' },
    { key: 'proteinColor', label: 'Protein Color', type: 'color', defaultValue: '#ef4444', group: 'Style' },
    { key: 'carbsColor', label: 'Carbs Color', type: 'color', defaultValue: '#3b82f6', group: 'Style' },
    { key: 'fatColor', label: 'Fat Color', type: 'color', defaultValue: '#eab308', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0f', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
