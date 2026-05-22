import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CalorieBreakdownConfig {
  mealName: string
  totalCalories: number
  protein: number
  carbs: number
  fat: number
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneCalorieBreakdownComponent({ config, progress }: MotionGraphicProps<CalorieBreakdownConfig>) {
  const { mealName, totalCalories, protein, carbs, fat, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Card enter
  const cardEnter = easeOutCubic(Math.min(1, enterProgress / 0.35))

  // Calorie count up
  const calProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.4)))
  const displayCal = Math.round(calProgress * totalCalories)

  // Macro ring segments
  const total = protein + carbs + fat || 1
  const proteinPct = protein / total
  const carbsPct = carbs / total
  const fatPct = fat / total

  // Ring animation
  const ringProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.4)))

  // Macro bars staggered
  const macros = [
    { label: 'Protein', value: protein, pct: proteinPct, color: '#27AE60', unit: 'g' },
    { label: 'Carbs', value: carbs, pct: carbsPct, color: '#F39C12', unit: 'g' },
    { label: 'Fat', value: fat, pct: fatPct, color: '#E74C3C', unit: 'g' },
  ]

  const getMacroProgress = (i: number): number => {
    const start = 0.5 + i * 0.1
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.25)))
  }

  // SVG donut chart values
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const proteinDash = proteinPct * circumference * ringProgress
  const carbsDash = carbsPct * circumference * ringProgress
  const fatDash = fatPct * circumference * ringProgress
  const proteinOffset = 0
  const carbsOffset = -(proteinPct * circumference)
  const fatOffset = -((proteinPct + carbsPct) * circumference)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6%',
          opacity: exitOpacity,
          transform: `translateY(${exitEased * 40}px)`,
        }}
      >
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(16px, 2.5vw, 24px)',
            padding: 'clamp(24px, 4.5%, 40px)',
            maxWidth: 420,
            width: '100%',
            boxShadow: '0 10px 36px rgba(0,0,0,0.1)',
            opacity: cardEnter,
            transform: `scale(${0.9 + cardEnter * 0.1})`,
          }}
        >
          {/* Meal name */}
          <div
            style={{
              fontSize: 'clamp(10px, 1.6vw, 13px)',
              fontWeight: 700,
              color: accentColor,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              textAlign: 'center',
              marginBottom: 'clamp(2px, 0.4vh, 4px)',
              opacity: cardEnter,
            }}
          >
            Calorie Breakdown
          </div>
          <div
            style={{
              fontSize: 'clamp(20px, 4.5vw, 32px)',
              fontWeight: 900,
              color: textColor,
              textAlign: 'center',
              lineHeight: 1.2,
              marginBottom: 'clamp(16px, 2.5vh, 24px)',
              opacity: cardEnter,
            }}
          >
            {mealName}
          </div>

          {/* Donut chart */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 'clamp(16px, 2.5vh, 24px)',
              position: 'relative',
            }}
          >
            <svg width="150" height="150" viewBox="0 0 150 150" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background ring */}
              <circle cx="75" cy="75" r={radius} fill="none" stroke={`${textColor}10`} strokeWidth="14" />
              {/* Protein segment */}
              <circle
                cx="75" cy="75" r={radius} fill="none"
                stroke={macros[0].color}
                strokeWidth="14"
                strokeDasharray={`${proteinDash} ${circumference}`}
                strokeDashoffset={proteinOffset}
                strokeLinecap="round"
              />
              {/* Carbs segment */}
              <circle
                cx="75" cy="75" r={radius} fill="none"
                stroke={macros[1].color}
                strokeWidth="14"
                strokeDasharray={`${carbsDash} ${circumference}`}
                strokeDashoffset={carbsOffset}
                strokeLinecap="round"
              />
              {/* Fat segment */}
              <circle
                cx="75" cy="75" r={radius} fill="none"
                stroke={macros[2].color}
                strokeWidth="14"
                strokeDasharray={`${fatDash} ${circumference}`}
                strokeDashoffset={fatOffset}
                strokeLinecap="round"
              />
            </svg>
            {/* Center calorie count */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(28px, 5.5vw, 42px)',
                  fontWeight: 900,
                  color: textColor,
                  lineHeight: 1,
                }}
              >
                {displayCal}
              </div>
              <div
                style={{
                  fontSize: 'clamp(9px, 1.4vw, 11px)',
                  fontWeight: 600,
                  color: `${textColor}70`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                kcal
              </div>
            </div>
          </div>

          {/* Macro breakdown bars */}
          {macros.map((macro, i) => {
            const mp = getMacroProgress(i)
            const displayVal = Math.round(mp * macro.value)
            return (
              <div
                key={i}
                style={{
                  marginBottom: 'clamp(10px, 1.5vh, 16px)',
                  opacity: mp,
                  transform: `translateX(${(1 - mp) * 20}px)`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 'clamp(3px, 0.4vh, 6px)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: macro.color,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 'clamp(12px, 1.9vw, 15px)',
                        fontWeight: 600,
                        color: textColor,
                      }}
                    >
                      {macro.label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 'clamp(13px, 2vw, 16px)',
                      fontWeight: 800,
                      color: textColor,
                    }}
                  >
                    {displayVal}{macro.unit}
                  </span>
                </div>
                <div
                  style={{
                    height: 'clamp(6px, 1vw, 10px)',
                    background: `${textColor}08`,
                    borderRadius: 5,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.round(macro.pct * 100 * mp)}%`,
                      background: macro.color,
                      borderRadius: 5,
                    }}
                  />
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
  id: 'tpl-scene-calorie-breakdown',
  title: 'Calorie Breakdown',
  description: 'Meal calorie and macro breakdown with animated donut chart, count-up calories, and color-coded protein/carb/fat bars',
  tags: ['scene', 'food', 'nutrition', 'calories', 'macros', 'health', 'fitness', 'diet'],
  category: 'scene-layout',
  component: SceneCalorieBreakdownComponent as any,
  defaultConfig: {
    mealName: 'Grilled Chicken Bowl',
    totalCalories: 485,
    protein: 38,
    carbs: 52,
    fat: 14,
    bgColor: '#F5F0E8',
    cardColor: '#FFFFFF',
    accentColor: '#27AE60',
    textColor: '#1A1A1A',
  },
  configSchema: [
    { key: 'mealName', label: 'Meal Name', type: 'text', defaultValue: 'Grilled Chicken Bowl', group: 'Content' },
    { key: 'totalCalories', label: 'Total Calories', type: 'number', defaultValue: 485, min: 0, max: 9999, group: 'Content' },
    { key: 'protein', label: 'Protein (g)', type: 'number', defaultValue: 38, min: 0, max: 500, group: 'Content' },
    { key: 'carbs', label: 'Carbs (g)', type: 'number', defaultValue: 52, min: 0, max: 500, group: 'Content' },
    { key: 'fat', label: 'Fat (g)', type: 'number', defaultValue: 14, min: 0, max: 500, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5F0E8', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#27AE60', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1A1A1A', group: 'Style' },
  ],
})
