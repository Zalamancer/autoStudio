import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface IngredientListConfig {
  title: string
  ingredients: string[]
  quantities: string[]
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

function SceneIngredientListComponent({ config, progress }: MotionGraphicProps<IngredientListConfig>) {
  const { title, ingredients, quantities, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Header slides in
  const headerEnter = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Items stagger in
  const getItemProgress = (index: number): number => {
    const maxItems = Math.max(ingredients.length, 1)
    const start = 0.25 + (index / maxItems) * 0.6
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.2)))
  }

  // Checkmark animation (slightly delayed after item appears)
  const getCheckProgress = (index: number): number => {
    const maxItems = Math.max(ingredients.length, 1)
    const start = 0.35 + (index / maxItems) * 0.6
    return easeOutBack(Math.max(0, Math.min(1, (enterProgress - start) / 0.15)))
  }

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
      {/* Subtle grid pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(${accentColor}08 1px, transparent 1px), linear-gradient(90deg, ${accentColor}08 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
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
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(12px, 2vw, 24px)',
            padding: 'clamp(20px, 4%, 40px)',
            maxWidth: 460,
            width: '100%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(8px, 1.5vw, 14px)',
              marginBottom: 'clamp(16px, 2.5vh, 28px)',
              opacity: headerEnter,
              transform: `translateY(${(1 - headerEnter) * 20}px)`,
            }}
          >
            {/* Shopping bag icon */}
            <svg viewBox="0 0 24 24" style={{ width: 'clamp(24px, 4vw, 36px)', height: 'clamp(24px, 4vw, 36px)', flexShrink: 0 }}>
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" fill="none" stroke={accentColor} strokeWidth="1.5" strokeLinejoin="round" />
              <line x1="3" y1="6" x2="21" y2="6" stroke={accentColor} strokeWidth="1.5" />
              <path d="M16 10a4 4 0 01-8 0" fill="none" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div>
              <div
                style={{
                  fontSize: 'clamp(18px, 4vw, 30px)',
                  fontWeight: 800,
                  color: textColor,
                  lineHeight: 1.2,
                }}
              >
                {title}
              </div>
              <div
                style={{
                  fontSize: 'clamp(10px, 1.5vw, 13px)',
                  fontWeight: 600,
                  color: `${textColor}66`,
                  marginTop: 2,
                }}
              >
                {ingredients.length} items
              </div>
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: `${textColor}12`,
              marginBottom: 'clamp(12px, 2vh, 20px)',
              transform: `scaleX(${headerEnter})`,
              transformOrigin: 'left',
            }}
          />

          {/* Ingredient list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 1vh, 12px)' }}>
            {ingredients.map((item, i) => {
              const itemProg = getItemProgress(i)
              const checkProg = getCheckProgress(i)
              const qty = quantities[i] || ''
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(10px, 2vw, 16px)',
                    opacity: itemProg,
                    transform: `translateX(${(1 - itemProg) * 30}px)`,
                    padding: 'clamp(6px, 1vh, 10px) clamp(8px, 1.5vw, 14px)',
                    borderRadius: 8,
                    background: i % 2 === 0 ? `${accentColor}06` : 'transparent',
                  }}
                >
                  {/* Checkbox */}
                  <div
                    style={{
                      width: 'clamp(18px, 2.8vw, 24px)',
                      height: 'clamp(18px, 2.8vw, 24px)',
                      borderRadius: 6,
                      border: `2px solid ${accentColor}`,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: checkProg > 0.5 ? accentColor : 'transparent',
                      transition: 'none',
                    }}
                  >
                    {checkProg > 0.5 && (
                      <svg viewBox="0 0 12 12" style={{ width: '60%', height: '60%', transform: `scale(${checkProg})` }}>
                        <polyline points="2,6 5,9 10,3" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  {/* Quantity */}
                  {qty && (
                    <div
                      style={{
                        fontSize: 'clamp(11px, 1.8vw, 15px)',
                        fontWeight: 700,
                        color: accentColor,
                        minWidth: 'clamp(40px, 8vw, 70px)',
                      }}
                    >
                      {qty}
                    </div>
                  )}

                  {/* Ingredient name */}
                  <div
                    style={{
                      fontSize: 'clamp(13px, 2.2vw, 18px)',
                      fontWeight: 500,
                      color: `${textColor}dd`,
                      flex: 1,
                    }}
                  >
                    {item}
                  </div>
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
  id: 'tpl-scene-ingredient-list',
  title: 'Ingredient Checklist',
  description: 'Ingredient checklist with items appearing one by one, animated checkmarks, quantities, and clean kitchen aesthetic',
  tags: ['scene', 'food', 'cooking', 'recipe', 'ingredients', 'checklist'],
  category: 'scene-layout',
  component: SceneIngredientListComponent as any,
  defaultConfig: {
    title: 'Ingredients',
    ingredients: ['All-purpose flour', 'Unsalted butter', 'Heavy cream', 'Garlic cloves', 'Parmesan cheese', 'Fresh basil'],
    quantities: ['2 cups', '3 tbsp', '1 cup', '4', '1/2 cup', '1/4 cup'],
    bgColor: '#FFFFFF',
    cardColor: '#FFFFFF',
    accentColor: '#4A9D5B',
    textColor: '#1A1A1A',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Ingredients', group: 'Content' },
    { key: 'ingredients', label: 'Ingredients', type: 'text-array', defaultValue: ['All-purpose flour', 'Unsalted butter', 'Heavy cream', 'Garlic cloves', 'Parmesan cheese', 'Fresh basil'], group: 'Content' },
    { key: 'quantities', label: 'Quantities', type: 'text-array', defaultValue: ['2 cups', '3 tbsp', '1 cup', '4', '1/2 cup', '1/4 cup'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#4A9D5B', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1A1A1A', group: 'Style' },
  ],
})
