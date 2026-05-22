import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MealPlanConfig {
  title: string
  days: string[]
  breakfast: string[]
  lunch: string[]
  dinner: string[]
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneMealPlanComponent({ config, progress }: MotionGraphicProps<MealPlanConfig>) {
  const { title, days, breakfast, lunch, dinner, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Title enters
  const titleEnter = easeOutCubic(Math.min(1, enterProgress / 0.25))

  // Grid draws in
  const gridEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.3)))

  // Cells fill staggered: row by row, then column by column
  const getCellProgress = (row: number, col: number): number => {
    const totalCells = 3 * days.length
    const cellIndex = col * 3 + row
    const start = 0.3 + (cellIndex / totalCells) * 0.65
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.15)))
  }

  const meals = [breakfast, lunch, dinner]
  const mealLabels = ['Breakfast', 'Lunch', 'Dinner']
  const mealColors = ['#E8A838', '#4A9D5B', '#6B8EC4']

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
          flexDirection: 'column',
          padding: '5%',
          opacity: exitOpacity,
          transform: `translateY(${exitEased * 30}px)`,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: 'clamp(18px, 4vw, 32px)',
            fontWeight: 900,
            color: textColor,
            textAlign: 'center',
            marginBottom: 'clamp(12px, 2vh, 24px)',
            opacity: titleEnter,
            transform: `translateY(${(1 - titleEnter) * 20}px)`,
          }}
        >
          {title}
        </div>

        {/* Grid container */}
        <div
          style={{
            flex: 1,
            background: cardColor,
            borderRadius: 'clamp(12px, 2vw, 20px)',
            overflow: 'hidden',
            boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            opacity: gridEnter,
          }}
        >
          {/* Day headers row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `clamp(60px, 14vw, 90px) repeat(${days.length}, 1fr)`,
              background: accentColor,
            }}
          >
            {/* Empty corner */}
            <div style={{ padding: 'clamp(6px, 1vh, 12px) clamp(6px, 1vw, 10px)' }} />
            {days.map((day, i) => (
              <div
                key={i}
                style={{
                  padding: 'clamp(6px, 1vh, 12px) clamp(4px, 0.8vw, 8px)',
                  fontSize: 'clamp(9px, 1.5vw, 13px)',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15 - i * 0.03) / 0.15))),
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Meal rows */}
          {mealLabels.map((label, row) => (
            <div
              key={row}
              style={{
                display: 'grid',
                gridTemplateColumns: `clamp(60px, 14vw, 90px) repeat(${days.length}, 1fr)`,
                flex: 1,
                borderTop: `1px solid ${textColor}10`,
              }}
            >
              {/* Meal label */}
              <div
                style={{
                  padding: 'clamp(6px, 1vh, 12px) clamp(6px, 1vw, 10px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  borderRight: `1px solid ${textColor}10`,
                }}
              >
                <div
                  style={{
                    width: 'clamp(6px, 1vw, 8px)',
                    height: 'clamp(6px, 1vw, 8px)',
                    borderRadius: '50%',
                    background: mealColors[row],
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 'clamp(8px, 1.3vw, 11px)',
                    fontWeight: 700,
                    color: `${textColor}aa`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {label}
                </span>
              </div>

              {/* Cells */}
              {days.map((_, col) => {
                const cellProg = getCellProgress(row, col)
                const mealText = meals[row]?.[col] || ''
                return (
                  <div
                    key={col}
                    style={{
                      padding: 'clamp(6px, 1vh, 12px) clamp(4px, 0.8vw, 8px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRight: col < days.length - 1 ? `1px solid ${textColor}08` : 'none',
                      background: cellProg > 0 ? `${mealColors[row]}${Math.round(cellProg * 8).toString(16).padStart(2, '0')}` : 'transparent',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'clamp(8px, 1.4vw, 12px)',
                        fontWeight: 500,
                        color: textColor,
                        textAlign: 'center',
                        opacity: cellProg,
                        transform: `scale(${cellProg})`,
                        lineHeight: 1.3,
                      }}
                    >
                      {mealText}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-meal-plan',
  title: 'Weekly Meal Plan',
  description: 'Weekly meal plan grid with days across top, meals down side, cells filling in staggered with pastel colors',
  tags: ['scene', 'food', 'meal-plan', 'cooking', 'health', 'organization'],
  category: 'scene-layout',
  component: SceneMealPlanComponent as any,
  defaultConfig: {
    title: 'Weekly Meal Plan',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    breakfast: ['Oatmeal', 'Eggs', 'Smoothie', 'Yogurt', 'Pancakes', 'Granola', 'Toast'],
    lunch: ['Salad', 'Wrap', 'Soup', 'Bowl', 'Sandwich', 'Pasta', 'Stir-fry'],
    dinner: ['Salmon', 'Chicken', 'Tacos', 'Curry', 'Pizza', 'Steak', 'Risotto'],
    bgColor: '#F0F4F3',
    cardColor: '#FFFFFF',
    accentColor: '#3D8B6E',
    textColor: '#1A2E28',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Weekly Meal Plan', group: 'Content' },
    { key: 'days', label: 'Days', type: 'text-array', defaultValue: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], group: 'Content' },
    { key: 'breakfast', label: 'Breakfast Items', type: 'text-array', defaultValue: ['Oatmeal', 'Eggs', 'Smoothie', 'Yogurt', 'Pancakes', 'Granola', 'Toast'], group: 'Content' },
    { key: 'lunch', label: 'Lunch Items', type: 'text-array', defaultValue: ['Salad', 'Wrap', 'Soup', 'Bowl', 'Sandwich', 'Pasta', 'Stir-fry'], group: 'Content' },
    { key: 'dinner', label: 'Dinner Items', type: 'text-array', defaultValue: ['Salmon', 'Chicken', 'Tacos', 'Curry', 'Pizza', 'Steak', 'Risotto'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F0F4F3', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#3D8B6E', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1A2E28', group: 'Style' },
  ],
})
