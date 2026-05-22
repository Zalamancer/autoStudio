import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneGroceryListConfig {
  title: string
  categories: { name: string; items: string[] }[]
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
  checkColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158; const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneGroceryListComponent({ config, frame, durationInFrames }: MotionGraphicProps<SceneGroceryListConfig>) {
  const { title, categories, bgColor, cardColor, accentColor, textColor, checkColor } = config
  const progress = frame / durationInFrames

  const enterProgress = Math.min(1, progress / 0.25)
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Card slides down from top
  const cardSlide = easeOutCubic(Math.min(1, enterProgress / 0.4))
  const cardY = (1 - cardSlide) * -100

  // Title reveal
  const titleReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.3)))

  // Flatten all items for staggered animation
  let globalItemIndex = 0
  const allItems: { category: string; item: string; idx: number }[] = []
  categories.forEach(cat => {
    cat.items.forEach(item => {
      allItems.push({ category: cat.name, item, idx: globalItemIndex++ })
    })
  })

  // During hold, items get checked off one by one
  const checkedCount = holdProgress > 0 ? Math.floor(holdProgress * allItems.length * 1.2) : 0

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Paper texture background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `repeating-linear-gradient(0deg, transparent, transparent 28px, ${textColor}06 28px, ${textColor}06 29px)`,
        }}
      />

      <div
        style={{
          width: '85%',
          maxWidth: 400,
          maxHeight: '88%',
          background: cardColor,
          borderRadius: 'clamp(12px, 2.5vw, 20px)',
          padding: 'clamp(16px, 3.5vw, 32px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: `1px solid ${accentColor}15`,
          transform: `translateY(${cardY + exitEased * 80}px)`,
          opacity: cardSlide * exitOpacity,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1.2vw, 10px)',
            marginBottom: 'clamp(14px, 3vw, 24px)',
            opacity: titleReveal,
            transform: `translateY(${(1 - titleReveal) * 10}px)`,
          }}
        >
          <div style={{ fontSize: 'clamp(20px, 4vw, 32px)' }}>{'🛒'}</div>
          <div>
            <div style={{ fontSize: 'clamp(18px, 4vw, 28px)', fontWeight: 900, color: textColor }}>{title}</div>
            <div style={{ fontSize: 'clamp(9px, 1.4vw, 12px)', color: `${textColor}66`, fontWeight: 500 }}>
              {allItems.length} items
            </div>
          </div>
        </div>

        {/* Categories and items */}
        {categories.map((cat, ci) => {
          const catDelay = 0.2 + ci * 0.12
          const catReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - catDelay) / 0.25)))

          return (
            <div
              key={ci}
              style={{
                marginBottom: 'clamp(10px, 2vw, 16px)',
                opacity: catReveal,
                transform: `translateX(${(1 - catReveal) * 20}px)`,
              }}
            >
              {/* Category header */}
              <div
                style={{
                  fontSize: 'clamp(9px, 1.4vw, 12px)',
                  fontWeight: 800,
                  color: accentColor,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  marginBottom: 'clamp(4px, 0.8vw, 8px)',
                  paddingBottom: 'clamp(2px, 0.4vw, 4px)',
                  borderBottom: `1px solid ${accentColor}20`,
                }}
              >
                {cat.name}
              </div>

              {/* Items */}
              {cat.items.map((item, ii) => {
                const itemGlobalIdx = allItems.findIndex(a => a.category === cat.name && a.item === item)
                const itemDelay = catDelay + 0.05 + ii * 0.04
                const itemReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - itemDelay) / 0.2)))
                const isChecked = itemGlobalIdx < checkedCount

                return (
                  <div
                    key={ii}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'clamp(6px, 1vw, 10px)',
                      padding: 'clamp(2px, 0.4vw, 4px) 0',
                      opacity: itemReveal,
                      transform: `translateX(${(1 - itemReveal) * 10}px)`,
                    }}
                  >
                    {/* Checkbox */}
                    <div
                      style={{
                        width: 'clamp(12px, 2vw, 16px)',
                        height: 'clamp(12px, 2vw, 16px)',
                        borderRadius: 3,
                        border: `2px solid ${isChecked ? checkColor : `${textColor}30`}`,
                        background: isChecked ? checkColor : 'transparent',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'none',
                      }}
                    >
                      {isChecked && (
                        <div style={{ color: '#fff', fontSize: 'clamp(8px, 1.2vw, 10px)', fontWeight: 900 }}>{'✓'}</div>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 'clamp(10px, 1.6vw, 14px)',
                        fontWeight: 500,
                        color: isChecked ? `${textColor}50` : textColor,
                        textDecoration: isChecked ? 'line-through' : 'none',
                      }}
                    >
                      {item}
                    </span>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-grocery-list',
  title: 'Grocery List',
  description: 'Grocery shopping list with categories, animated checkboxes that tick off during hold, and staggered item reveal',
  tags: ['scene', 'grocery', 'shopping', 'list', 'food', 'checklist', 'organize'],
  category: 'scene-layout',
  component: SceneGroceryListComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    title: 'Grocery Run',
    categories: [
      { name: 'Produce', items: ['Avocados', 'Bananas', 'Spinach'] },
      { name: 'Dairy', items: ['Oat Milk', 'Greek Yogurt'] },
      { name: 'Pantry', items: ['Pasta', 'Olive Oil', 'Rice'] },
    ],
    bgColor: '#FAFAF5',
    cardColor: '#FFFFFF',
    accentColor: '#059669',
    textColor: '#1F2937',
    checkColor: '#059669',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Grocery Run', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FAFAF5', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#059669', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1F2937', group: 'Style' },
    { key: 'checkColor', label: 'Check Color', type: 'color', defaultValue: '#059669', group: 'Style' },
  ],
})
