import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NutritionFactsConfig {
  title: string
  servingSize: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneNutritionFactsComponent({ config, progress }: MotionGraphicProps<NutritionFactsConfig>) {
  const { title, servingSize, calories, protein, carbs, fat, fiber, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Panel slides in from left
  const panelEnter = easeOutCubic(Math.min(1, enterProgress / 0.35))
  const panelX = (1 - panelEnter) * -60

  // Calories count up
  const calProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.4)))
  const displayCalories = Math.round(calProgress * calories)

  // Macro bars fill
  const macros = [
    { label: 'Protein', value: protein, max: 100, color: '#4A9D5B' },
    { label: 'Carbs', value: carbs, max: 200, color: '#E8A838' },
    { label: 'Fat', value: fat, max: 100, color: '#D45B5B' },
    { label: 'Fiber', value: fiber, max: 50, color: '#6B8EC4' },
  ]

  const getBarProgress = (index: number): number => {
    const start = 0.35 + index * 0.1
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.3)))
  }

  // Thick dividers animate
  const dividerEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.2)))

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '5%',
          opacity: exitOpacity,
          transform: `translateX(${exitEased * -40}px)`,
        }}
      >
        {/* Nutrition label card */}
        <div
          style={{
            background: cardColor,
            border: `2px solid ${textColor}`,
            borderRadius: 4,
            padding: 'clamp(16px, 3%, 32px)',
            maxWidth: 400,
            width: '100%',
            transform: `translateX(${panelX}px)`,
            opacity: panelEnter,
          }}
        >
          {/* Title */}
          <div
            style={{
              fontSize: 'clamp(22px, 5vw, 38px)',
              fontWeight: 900,
              color: textColor,
              lineHeight: 1.1,
              marginBottom: 2,
            }}
          >
            {title}
          </div>

          {/* Thick divider */}
          <div
            style={{
              height: 8,
              background: textColor,
              marginTop: 'clamp(4px, 0.8vh, 8px)',
              marginBottom: 'clamp(4px, 0.8vh, 8px)',
              transform: `scaleX(${dividerEnter})`,
              transformOrigin: 'left',
            }}
          />

          {/* Serving size */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 'clamp(11px, 1.8vw, 14px)',
              fontWeight: 500,
              color: textColor,
              marginBottom: 'clamp(4px, 0.6vh, 8px)',
            }}
          >
            <span>Serving Size</span>
            <span style={{ fontWeight: 700 }}>{servingSize}</span>
          </div>

          {/* Thin divider */}
          <div
            style={{
              height: 4,
              background: textColor,
              marginBottom: 'clamp(6px, 1vh, 12px)',
              transform: `scaleX(${dividerEnter})`,
              transformOrigin: 'left',
            }}
          />

          {/* Calories */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 'clamp(6px, 1vh, 12px)',
            }}
          >
            <span
              style={{
                fontSize: 'clamp(14px, 2.2vw, 18px)',
                fontWeight: 900,
                color: textColor,
              }}
            >
              Calories
            </span>
            <span
              style={{
                fontSize: 'clamp(32px, 7vw, 54px)',
                fontWeight: 900,
                color: textColor,
                lineHeight: 1,
              }}
            >
              {displayCalories}
            </span>
          </div>

          {/* Medium divider */}
          <div
            style={{
              height: 3,
              background: textColor,
              marginBottom: 'clamp(8px, 1.2vh, 14px)',
              transform: `scaleX(${dividerEnter})`,
              transformOrigin: 'left',
            }}
          />

          {/* % Daily Value header */}
          <div
            style={{
              fontSize: 'clamp(9px, 1.4vw, 12px)',
              fontWeight: 700,
              color: textColor,
              textAlign: 'right',
              marginBottom: 'clamp(6px, 1vh, 10px)',
            }}
          >
            % Daily Value*
          </div>

          {/* Macro rows with bars */}
          {macros.map((macro, i) => {
            const barProg = getBarProgress(i)
            const displayValue = Math.round(barProg * macro.value)
            const barFill = (macro.value / macro.max) * barProg
            return (
              <div key={i} style={{ marginBottom: 'clamp(8px, 1.2vh, 14px)' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 'clamp(3px, 0.4vh, 6px)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'clamp(12px, 2vw, 16px)',
                      fontWeight: 700,
                      color: textColor,
                    }}
                  >
                    {macro.label}
                  </span>
                  <span
                    style={{
                      fontSize: 'clamp(12px, 2vw, 16px)',
                      fontWeight: 600,
                      color: textColor,
                    }}
                  >
                    {displayValue}g
                  </span>
                </div>
                {/* Bar */}
                <div
                  style={{
                    height: 'clamp(6px, 1vw, 10px)',
                    background: `${textColor}12`,
                    borderRadius: 5,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, barFill * 100)}%`,
                      background: macro.color,
                      borderRadius: 5,
                    }}
                  />
                </div>
                {/* Thin separator */}
                {i < macros.length - 1 && (
                  <div
                    style={{
                      height: 1,
                      background: `${textColor}15`,
                      marginTop: 'clamp(6px, 1vh, 10px)',
                    }}
                  />
                )}
              </div>
            )
          })}

          {/* Footer note */}
          <div
            style={{
              height: 1,
              background: textColor,
              marginTop: 'clamp(4px, 0.6vh, 8px)',
              marginBottom: 'clamp(4px, 0.6vh, 8px)',
            }}
          />
          <div
            style={{
              fontSize: 'clamp(8px, 1.2vw, 10px)',
              color: `${textColor}88`,
              lineHeight: 1.4,
            }}
          >
            * Percent Daily Values are based on a 2,000 calorie diet.
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-nutrition-facts',
  title: 'Nutrition Facts',
  description: 'FDA-style nutrition facts panel with calorie count-up, macro bars that fill in, and classic label aesthetic',
  tags: ['scene', 'food', 'health', 'nutrition', 'fitness', 'data'],
  category: 'scene-layout',
  component: SceneNutritionFactsComponent as any,
  defaultConfig: {
    title: 'Nutrition Facts',
    servingSize: '1 cup (240g)',
    calories: 350,
    protein: 28,
    carbs: 42,
    fat: 12,
    fiber: 6,
    bgColor: '#F5F0E8',
    cardColor: '#FFFFFF',
    accentColor: '#2D6A4F',
    textColor: '#1A1A1A',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Nutrition Facts', group: 'Content' },
    { key: 'servingSize', label: 'Serving Size', type: 'text', defaultValue: '1 cup (240g)', group: 'Content' },
    { key: 'calories', label: 'Calories', type: 'number', defaultValue: 350, min: 0, max: 9999, group: 'Content' },
    { key: 'protein', label: 'Protein (g)', type: 'number', defaultValue: 28, min: 0, max: 500, group: 'Content' },
    { key: 'carbs', label: 'Carbs (g)', type: 'number', defaultValue: 42, min: 0, max: 500, group: 'Content' },
    { key: 'fat', label: 'Fat (g)', type: 'number', defaultValue: 12, min: 0, max: 500, group: 'Content' },
    { key: 'fiber', label: 'Fiber (g)', type: 'number', defaultValue: 6, min: 0, max: 100, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5F0E8', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#2D6A4F', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1A1A1A', group: 'Style' },
  ],
})
