import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneKidsRecipeConfig {
  recipeName: string
  emoji: string
  ingredients: string[]
  steps: string[]
  difficulty: string
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneKidsRecipeComponent({ config, progress }: MotionGraphicProps<SceneKidsRecipeConfig>) {
  const { recipeName, emoji, ingredients, steps, difficulty, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.15 ? progress / 0.15 : 1
  const holdProgress = progress >= 0.15 && progress < 0.85 ? (progress - 0.15) / 0.7 : progress >= 0.85 ? 1 : 0
  const exitProgress = progress >= 0.85 ? (progress - 0.85) / 0.15 : 0

  const cardY = enterProgress < 1
    ? (1 - easeOutBack(enterProgress)) * 60
    : exitProgress > 0
      ? easeInCubic(exitProgress) * -50
      : 0
  const cardOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : easeOutCubic(enterProgress)

  // Stagger ingredients during first half of hold
  const ingredientCount = Math.min(ingredients.length, Math.floor(holdProgress * 2 * (ingredients.length + 1)))
  // Steps appear in second half
  const stepCount = holdProgress > 0.4
    ? Math.min(steps.length, Math.floor((holdProgress - 0.4) / 0.6 * (steps.length + 1)))
    : 0

  // Cooking emoji wobble
  const cookWobble = Math.sin(holdProgress * Math.PI * 10) * 5

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
      }}
    >
      {/* Scattered food emojis background */}
      {['\u{1F36A}', '\u{1F370}', '\u{1F353}', '\u{1F34C}', '\u{1F95E}', '\u{1F382}'].map((e, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${5 + (i * 18) % 85}%`,
            top: `${5 + (i * 17) % 85}%`,
            fontSize: 'clamp(14px, 2.5vw, 22px)',
            opacity: 0.08,
            transform: `rotate(${i * 30}deg)`,
          }}
        >
          {e}
        </div>
      ))}

      <div
        style={{
          transform: `translateY(${cardY}px)`,
          opacity: cardOpacity,
          width: '88%',
          maxWidth: '480px',
        }}
      >
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(16px, 3vw, 28px)',
            padding: 'clamp(18px, 4vw, 36px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
            border: `3px solid ${accentColor}25`,
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(8px, 2vw, 16px)',
              marginBottom: 'clamp(12px, 3vw, 20px)',
            }}
          >
            {/* Food emoji */}
            <div
              style={{
                fontSize: 'clamp(32px, 8vw, 56px)',
                transform: `rotate(${cookWobble}deg)`,
                flexShrink: 0,
              }}
            >
              {emoji}
            </div>
            <div>
              {/* Recipe badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: `${accentColor}15`,
                  color: accentColor,
                  fontSize: 'clamp(8px, 1.5vw, 12px)',
                  fontWeight: 700,
                  padding: '2px clamp(8px, 1.5vw, 14px)',
                  borderRadius: '100px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                {'\u{1F468}\u200D\u{1F373}'} Kids Recipe
              </div>
              {/* Recipe name */}
              <div
                style={{
                  fontSize: 'clamp(20px, 5vw, 36px)',
                  fontWeight: 700,
                  color: textColor,
                  lineHeight: 1.1,
                }}
              >
                {recipeName}
              </div>
              {/* Difficulty */}
              <div
                style={{
                  fontSize: 'clamp(10px, 1.8vw, 14px)',
                  color: `${textColor}66`,
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                  marginTop: '4px',
                }}
              >
                Difficulty: {difficulty}
              </div>
            </div>
          </div>

          {/* Ingredients section */}
          <div style={{ marginBottom: 'clamp(12px, 3vw, 20px)' }}>
            <div
              style={{
                fontSize: 'clamp(11px, 2vw, 16px)',
                fontWeight: 700,
                color: accentColor,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 'clamp(6px, 1.5vw, 10px)',
              }}
            >
              {'\u{1F952}'} Ingredients
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'clamp(4px, 0.8vw, 8px)',
              }}
            >
              {ingredients.map((ing, i) => {
                const isVisible = i < ingredientCount
                return (
                  <div
                    key={i}
                    style={{
                      background: isVisible ? `${accentColor}12` : `${textColor}05`,
                      border: `1.5px solid ${isVisible ? accentColor + '30' : textColor + '10'}`,
                      borderRadius: 'clamp(6px, 1.2vw, 10px)',
                      padding: 'clamp(3px, 0.6vw, 6px) clamp(8px, 1.5vw, 14px)',
                      fontSize: 'clamp(10px, 2vw, 15px)',
                      fontWeight: 500,
                      color: isVisible ? textColor : `${textColor}30`,
                      fontFamily: "'Inter', sans-serif",
                      transform: `scale(${isVisible ? 1 : 0.9})`,
                    }}
                  >
                    {ing}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Steps section */}
          <div>
            <div
              style={{
                fontSize: 'clamp(11px, 2vw, 16px)',
                fontWeight: 700,
                color: accentColor,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 'clamp(6px, 1.5vw, 10px)',
              }}
            >
              {'\u{1F4CB}'} Steps
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(4px, 1vw, 8px)' }}>
              {steps.map((step, i) => {
                const isVisible = i < stepCount
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 'clamp(6px, 1.2vw, 10px)',
                      opacity: isVisible ? 1 : 0.2,
                      transform: `translateX(${isVisible ? 0 : 10}px)`,
                    }}
                  >
                    {/* Step number */}
                    <div
                      style={{
                        width: 'clamp(18px, 3.5vw, 26px)',
                        height: 'clamp(18px, 3.5vw, 26px)',
                        borderRadius: '50%',
                        background: isVisible ? accentColor : `${textColor}15`,
                        color: isVisible ? '#FFFFFF' : `${textColor}40`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'clamp(9px, 1.8vw, 14px)',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </div>
                    {/* Step text */}
                    <div
                      style={{
                        fontSize: 'clamp(11px, 2.2vw, 16px)',
                        fontWeight: 500,
                        color: isVisible ? textColor : `${textColor}30`,
                        fontFamily: "'Inter', sans-serif",
                        lineHeight: 1.4,
                        paddingTop: '1px',
                      }}
                    >
                      {step}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-kids-recipe',
  title: 'Kids Recipe',
  description: 'Simple recipe card for kids with food emoji, ingredients tags, and numbered steps. Staggered reveals with playful animations.',
  tags: ['scene', 'kids', 'education', 'recipe', 'cooking', 'food', 'cartoon'],
  category: 'scene-layout',
  component: SceneKidsRecipeComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    recipeName: 'Banana Smoothie',
    emoji: '\u{1F34C}',
    ingredients: ['2 bananas', '1 cup milk', 'Honey', 'Ice cubes'],
    steps: ['Peel the bananas', 'Put everything in the blender', 'Blend until smooth', 'Pour and enjoy!'],
    difficulty: 'Easy',
    bgColor: '#FFFDE7',
    cardColor: '#FFFFFF',
    accentColor: '#FF9800',
    textColor: '#2D3436',
  },
  configSchema: [
    { key: 'recipeName', label: 'Recipe Name', type: 'text', defaultValue: 'Banana Smoothie', group: 'Content' },
    { key: 'emoji', label: 'Food Emoji', type: 'text', defaultValue: '\u{1F34C}', group: 'Content' },
    { key: 'ingredients', label: 'Ingredients', type: 'text-array', defaultValue: ['2 bananas', '1 cup milk', 'Honey', 'Ice cubes'], group: 'Content' },
    { key: 'steps', label: 'Steps', type: 'text-array', defaultValue: ['Peel the bananas', 'Put everything in the blender', 'Blend until smooth', 'Pour and enjoy!'], group: 'Content' },
    { key: 'difficulty', label: 'Difficulty', type: 'text', defaultValue: 'Easy', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFDE7', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FF9800', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2D3436', group: 'Style' },
  ],
})
