import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RecipeTitleConfig {
  dishName: string
  prepTime: string
  cookTime: string
  servings: string
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneRecipeTitleComponent({ config, progress }: MotionGraphicProps<RecipeTitleConfig>) {
  const { dishName, prepTime, cookTime, servings, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Title slides in from right
  const titleEnter = easeOutCubic(Math.min(1, enterProgress / 0.5))
  const titleX = (1 - titleEnter) * 80

  // Decorative line draws
  const lineEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.3)))

  // Stats pop in staggered
  const stats = [
    { icon: '\u23F1\uFE0F', label: 'Prep', value: prepTime },
    { icon: '\u{1F373}', label: 'Cook', value: cookTime },
    { icon: '\u{1F37D}\uFE0F', label: 'Serves', value: servings },
  ]

  const getStatProgress = (index: number): number => {
    const start = 0.4 + index * 0.15
    return elasticOut(Math.max(0, Math.min(1, (enterProgress - start) / 0.25)))
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
      {/* Warm gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 30% 40%, ${accentColor}15 0%, transparent 60%)`,
        }}
      />

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
          transform: `translateY(${exitEased * 40}px)`,
        }}
      >
        {/* Card */}
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(16px, 2.5vw, 28px)',
            padding: 'clamp(28px, 5%, 48px)',
            maxWidth: 480,
            width: '100%',
            boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
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
              height: 5,
              background: `linear-gradient(90deg, ${accentColor}, ${accentColor}99)`,
              transform: `scaleX(${lineEnter})`,
              transformOrigin: 'left',
            }}
          />

          {/* Small label */}
          <div
            style={{
              fontSize: 'clamp(10px, 1.5vw, 13px)',
              fontWeight: 700,
              color: accentColor,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              textAlign: 'center',
              marginBottom: 'clamp(8px, 1.5vh, 14px)',
              opacity: easeOutCubic(Math.min(1, enterProgress / 0.3)),
            }}
          >
            Recipe
          </div>

          {/* Dish name */}
          <div
            style={{
              fontSize: 'clamp(26px, 6vw, 48px)',
              fontWeight: 900,
              color: textColor,
              textAlign: 'center',
              lineHeight: 1.15,
              marginBottom: 'clamp(12px, 2vh, 24px)',
              transform: `translateX(${titleX}px)`,
              opacity: titleEnter,
            }}
          >
            {dishName}
          </div>

          {/* Divider line */}
          <div
            style={{
              height: 2,
              background: `${accentColor}30`,
              marginBottom: 'clamp(16px, 2.5vh, 28px)',
              transform: `scaleX(${lineEnter})`,
              transformOrigin: 'center',
            }}
          />

          {/* Stats row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 'clamp(16px, 4vw, 40px)',
            }}
          >
            {stats.map((stat, i) => {
              const sp = getStatProgress(i)
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'clamp(4px, 0.6vh, 8px)',
                    transform: `scale(${sp})`,
                    opacity: sp,
                  }}
                >
                  <div style={{ fontSize: 'clamp(22px, 4vw, 36px)' }}>{stat.icon}</div>
                  <div
                    style={{
                      fontSize: 'clamp(14px, 2.2vw, 20px)',
                      fontWeight: 700,
                      color: textColor,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontSize: 'clamp(10px, 1.4vw, 13px)',
                      fontWeight: 600,
                      color: `${textColor}88`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {stat.label}
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
  id: 'tpl-scene-recipe-title',
  title: 'Recipe Title Card',
  description: 'Recipe intro card with dish name, prep/cook time and servings icons that pop in staggered with warm appetizing colors',
  tags: ['scene', 'food', 'cooking', 'recipe', 'lifestyle'],
  category: 'scene-layout',
  component: SceneRecipeTitleComponent as any,
  defaultConfig: {
    dishName: 'Creamy Garlic Pasta',
    prepTime: '10 min',
    cookTime: '25 min',
    servings: '4',
    bgColor: '#FFF8F0',
    cardColor: '#FFFFFF',
    accentColor: '#E8751A',
    textColor: '#2D1810',
  },
  configSchema: [
    { key: 'dishName', label: 'Dish Name', type: 'text', defaultValue: 'Creamy Garlic Pasta', group: 'Content' },
    { key: 'prepTime', label: 'Prep Time', type: 'text', defaultValue: '10 min', group: 'Content' },
    { key: 'cookTime', label: 'Cook Time', type: 'text', defaultValue: '25 min', group: 'Content' },
    { key: 'servings', label: 'Servings', type: 'text', defaultValue: '4', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF8F0', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#E8751A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2D1810', group: 'Style' },
  ],
})
