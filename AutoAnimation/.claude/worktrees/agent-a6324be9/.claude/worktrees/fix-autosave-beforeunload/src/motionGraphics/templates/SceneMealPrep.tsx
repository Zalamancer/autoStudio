import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneMealPrepConfig {
  title: string
  meals: string[]
  bgColor: string
  textColor: string
  accentColor: string
  cardColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

/** Parse: "Breakfast|Chicken & Rice Bowl|520 cal|42P / 58C / 12F" */
function parseMeal(s: string): { label: string; name: string; calories: string; macros: string } {
  const parts = s.split('|')
  return {
    label: (parts[0] || '').trim(),
    name: (parts[1] || '').trim(),
    calories: (parts[2] || '').trim(),
    macros: (parts[3] || '').trim(),
  }
}

function extractCalNumber(cal: string): number {
  const match = cal.match(/([\d]+)/)
  return match ? parseInt(match[1]) : 0
}

const mealIcons: Record<string, string> = {
  breakfast: '\u{1F373}',
  lunch: '\u{1F957}',
  dinner: '\u{1F356}',
  snack: '\u{1F34E}',
  default: '\u{1F37D}\uFE0F',
}

function getMealIcon(label: string): string {
  const lower = label.toLowerCase()
  for (const key of Object.keys(mealIcons)) {
    if (lower.includes(key)) return mealIcons[key]
  }
  return mealIcons.default
}

function SceneMealPrepComponent({ config, progress }: MotionGraphicProps<SceneMealPrepConfig>) {
  const { title, meals, bgColor, textColor, accentColor, cardColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  const parsed = meals.map(parseMeal)

  // Title enters
  const titleEnter = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Staggered meal reveals
  const getMealEnter = (index: number): number => {
    const delay = 0.2 + index * 0.18
    return easeOutBack(Math.max(0, Math.min(1, (enterProgress - delay) / 0.45)))
  }

  // Total calories
  const totalCal = parsed.reduce((sum, m) => sum + extractCalNumber(m.calories), 0)
  const totalEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.3)))
  const isHolding = progress >= 0.25 && progress < 0.8
  const calCount = Math.round(totalCal * (totalEnter >= 1 && isHolding ? 1 : totalEnter))

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'clamp(20px, 5vw, 48px)',
          opacity: exitOpacity,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: 'clamp(20px, 4.5vw, 36px)',
            fontWeight: 900,
            color: textColor,
            letterSpacing: '-0.01em',
            marginBottom: 'clamp(4px, 0.8vw, 8px)',
            opacity: titleEnter,
            transform: `translateY(${(1 - titleEnter) * -15}px)`,
          }}
        >
          {title}
        </div>

        {/* Total calories */}
        <div
          style={{
            fontSize: 'clamp(12px, 2vw, 16px)',
            fontWeight: 600,
            color: accentColor,
            marginBottom: 'clamp(16px, 3vw, 28px)',
            opacity: totalEnter,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          Total: {calCount} calories
        </div>

        {/* Meal cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1.5vw, 14px)' }}>
          {parsed.map((meal, i) => {
            const mealEnter = getMealEnter(i)
            const icon = getMealIcon(meal.label)

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(10px, 2vw, 18px)',
                  background: cardColor,
                  border: `1px solid ${accentColor}15`,
                  borderRadius: 'clamp(8px, 1.5vw, 14px)',
                  padding: 'clamp(10px, 2vw, 18px) clamp(14px, 2.5vw, 22px)',
                  opacity: mealEnter,
                  transform: `translateY(${(1 - mealEnter) * 20}px)`,
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    fontSize: 'clamp(22px, 4.5vw, 36px)',
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 'clamp(10px, 1.6vw, 13px)',
                      fontWeight: 700,
                      color: accentColor,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      marginBottom: '2px',
                    }}
                  >
                    {meal.label}
                  </div>
                  <div
                    style={{
                      fontSize: 'clamp(14px, 2.5vw, 20px)',
                      fontWeight: 700,
                      color: textColor,
                    }}
                  >
                    {meal.name}
                  </div>
                </div>

                {/* Calories & macros */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div
                    style={{
                      fontSize: 'clamp(14px, 2.5vw, 20px)',
                      fontWeight: 800,
                      color: textColor,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {meal.calories}
                  </div>
                  <div
                    style={{
                      fontSize: 'clamp(9px, 1.4vw, 12px)',
                      fontWeight: 500,
                      color: `${textColor}55`,
                    }}
                  >
                    {meal.macros}
                  </div>
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
  id: 'tpl-scene-meal-prep',
  title: 'Meal Prep Plan',
  description: 'Meal prep plan showing meals with macros per meal, total daily calories, and staggered card reveals',
  tags: ['scene', 'fitness', 'nutrition', 'meal-prep', 'diet', 'health', 'food'],
  category: 'scene-layout',
  component: SceneMealPrepComponent as any,
  defaultConfig: {
    title: 'Today\'s Meal Plan',
    meals: [
      'Breakfast|Oatmeal & Berries|380 cal|28P / 52C / 8F',
      'Lunch|Chicken & Rice Bowl|620 cal|45P / 65C / 14F',
      'Dinner|Salmon & Vegetables|540 cal|42P / 32C / 22F',
    ],
    bgColor: '#0f1a0f',
    textColor: '#f1f5f1',
    accentColor: '#4ade80',
    cardColor: '#1a2a1a',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: "Today's Meal Plan", group: 'Content' },
    { key: 'meals', label: 'Meals (label|name|calories|macros)', type: 'text-array', defaultValue: ['Breakfast|Oatmeal & Berries|380 cal|28P / 52C / 8F', 'Lunch|Chicken & Rice Bowl|620 cal|45P / 65C / 14F', 'Dinner|Salmon & Vegetables|540 cal|42P / 32C / 22F'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f1a0f', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f1f5f1', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#4ade80', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1a2a1a', group: 'Style' },
  ],
})
