import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RecipeCardConfig {
  recipeName: string
  cookTime: string
  servings: string
  ingredients: string[]
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneRecipeCardComponent({ config, progress }: MotionGraphicProps<RecipeCardConfig>) {
  const { recipeName, cookTime, servings, ingredients, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Card slides up
  const cardEnter = easeOutCubic(Math.min(1, enterProgress / 0.4))
  const cardY = (1 - cardEnter) * 60

  // Recipe name
  const nameEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.3)))

  // Meta info (cook time, servings)
  const metaEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.25)))

  // Ingredients stagger in
  const getIngredientProgress = (index: number): number => {
    const start = 0.4 + (index / ingredients.length) * 0.5
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.2)))
  }

  // Decorative whisk/spoon icon rotation during hold
  const iconRotation = holdProgress * 15

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      {/* Decorative dots pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(${accentColor}12 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />

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
        {/* Card */}
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(12px, 2vw, 24px)',
            padding: 'clamp(20px, 4%, 40px)',
            maxWidth: 480,
            width: '100%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            transform: `translateY(${cardY}px)`,
            opacity: cardEnter,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top accent bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: accentColor,
              transform: `scaleX(${cardEnter})`,
              transformOrigin: 'left',
            }}
          />

          {/* Kitchen utensil icon */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'clamp(8px, 1.5vh, 16px)' }}>
            <svg
              viewBox="0 0 24 24"
              style={{
                width: 'clamp(28px, 5vw, 44px)',
                height: 'clamp(28px, 5vw, 44px)',
                transform: `rotate(${iconRotation}deg) scale(${easeOutBack(Math.min(1, enterProgress / 0.3))})`,
              }}
            >
              <circle cx="12" cy="8" r="6" fill="none" stroke={accentColor} strokeWidth="1.5" />
              <line x1="12" y1="14" x2="12" y2="22" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
              <line x1="9" y1="5" x2="9" y2="11" stroke={accentColor} strokeWidth="1" strokeLinecap="round" />
              <line x1="12" y1="4" x2="12" y2="12" stroke={accentColor} strokeWidth="1" strokeLinecap="round" />
              <line x1="15" y1="5" x2="15" y2="11" stroke={accentColor} strokeWidth="1" strokeLinecap="round" />
            </svg>
          </div>

          {/* Recipe name */}
          <div
            style={{
              fontSize: 'clamp(20px, 5vw, 38px)',
              fontWeight: 900,
              color: textColor,
              textAlign: 'center',
              opacity: nameEnter,
              transform: `translateY(${(1 - nameEnter) * 15}px)`,
              lineHeight: 1.2,
              marginBottom: 'clamp(8px, 1.5vh, 16px)',
            }}
          >
            {recipeName}
          </div>

          {/* Meta badges */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 'clamp(12px, 2.5vw, 24px)',
              marginBottom: 'clamp(12px, 2vh, 24px)',
              opacity: metaEnter,
              transform: `translateY(${(1 - metaEnter) * 10}px)`,
            }}
          >
            {/* Cook time */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg viewBox="0 0 16 16" style={{ width: 16, height: 16 }}>
                <circle cx="8" cy="8" r="7" fill="none" stroke={accentColor} strokeWidth="1.2" />
                <line x1="8" y1="4" x2="8" y2="8" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" />
                <line x1="8" y1="8" x2="11" y2="8" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span style={{ fontSize: 'clamp(11px, 1.8vw, 15px)', fontWeight: 600, color: `${textColor}cc` }}>{cookTime}</span>
            </div>
            {/* Servings */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg viewBox="0 0 16 16" style={{ width: 16, height: 16 }}>
                <circle cx="8" cy="6" r="3" fill="none" stroke={accentColor} strokeWidth="1.2" />
                <path d="M2 14c0-3 3-5 6-5s6 2 6 5" fill="none" stroke={accentColor} strokeWidth="1.2" />
              </svg>
              <span style={{ fontSize: 'clamp(11px, 1.8vw, 15px)', fontWeight: 600, color: `${textColor}cc` }}>{servings}</span>
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: `${textColor}15`,
              marginBottom: 'clamp(10px, 2vh, 20px)',
              transform: `scaleX(${metaEnter})`,
            }}
          />

          {/* Ingredients header */}
          <div
            style={{
              fontSize: 'clamp(10px, 1.6vw, 14px)',
              fontWeight: 700,
              color: accentColor,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: 'clamp(8px, 1.5vh, 14px)',
              opacity: metaEnter,
            }}
          >
            Ingredients
          </div>

          {/* Ingredients list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(4px, 0.8vh, 10px)' }}>
            {ingredients.map((item, i) => {
              const itemProg = getIngredientProgress(i)
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(8px, 1.5vw, 14px)',
                    opacity: itemProg,
                    transform: `translateX(${(1 - itemProg) * 20}px)`,
                  }}
                >
                  {/* Checkbox */}
                  <div
                    style={{
                      width: 'clamp(14px, 2.2vw, 20px)',
                      height: 'clamp(14px, 2.2vw, 20px)',
                      borderRadius: 4,
                      border: `2px solid ${accentColor}60`,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '60%',
                        height: '60%',
                        borderRadius: 2,
                        background: accentColor,
                        transform: `scale(${itemProg > 0.8 ? 1 : 0})`,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 'clamp(12px, 2vw, 17px)', fontWeight: 400, color: `${textColor}dd` }}>
                    {item}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-recipe-card',
  title: 'Recipe Card',
  description: 'Recipe card with title, cook time, servings badges, and ingredient checklist with kitchen-themed styling',
  tags: ['scene', 'recipe', 'food', 'cooking', 'lifestyle', 'personal'],
  category: 'scene-layout',
  component: SceneRecipeCardComponent as any,
  defaultConfig: {
    recipeName: 'Avocado Toast',
    cookTime: '10 min',
    servings: '2 servings',
    ingredients: ['2 ripe avocados', 'Sourdough bread', 'Lemon juice', 'Red pepper flakes', 'Sea salt & pepper'],
    bgColor: '#fdf6ec',
    cardColor: '#ffffff',
    accentColor: '#d97706',
    textColor: '#292524',
  },
  configSchema: [
    { key: 'recipeName', label: 'Recipe Name', type: 'text', defaultValue: 'Avocado Toast', group: 'Content' },
    { key: 'cookTime', label: 'Cook Time', type: 'text', defaultValue: '10 min', group: 'Content' },
    { key: 'servings', label: 'Servings', type: 'text', defaultValue: '2 servings', group: 'Content' },
    { key: 'ingredients', label: 'Ingredients', type: 'text-array', defaultValue: ['2 ripe avocados', 'Sourdough bread', 'Lemon juice', 'Red pepper flakes', 'Sea salt & pepper'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#fdf6ec', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#d97706', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#292524', group: 'Style' },
  ],
})
