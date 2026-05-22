import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CocktailRecipeConfig {
  cocktailName: string
  ingredients: string[]
  method: string
  glassType: string
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

function SceneCocktailRecipeComponent({ config, progress }: MotionGraphicProps<CocktailRecipeConfig>) {
  const { cocktailName, ingredients, method, glassType, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.22 ? progress / 0.22 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Card slides up
  const cardEnter = easeOutCubic(Math.min(1, enterProgress / 0.35))
  const cardY = (1 - cardEnter) * 80

  // Cocktail glass icon bounces
  const glassEnter = elasticOut(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.3)))

  // Ingredients list staggered
  const getIngredientProgress = (i: number): number => {
    const start = 0.35 + i * 0.07
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.2)))
  }

  // Method text
  const methodEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.25)))

  // Line draw
  const lineEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.25) / 0.2)))

  const displayIngredients = ingredients.slice(0, 6)

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
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          height: '60%',
          background: `radial-gradient(ellipse, ${accentColor}08 0%, transparent 60%)`,
          pointerEvents: 'none',
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
          transform: `translateY(${exitEased * 50}px)`,
        }}
      >
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(16px, 2.5vw, 24px)',
            padding: 'clamp(24px, 4.5%, 40px)',
            maxWidth: 420,
            width: '100%',
            boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
            transform: `translateY(${cardY}px)`,
            opacity: cardEnter,
            position: 'relative',
          }}
        >
          {/* Top gradient bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, ${accentColor}, #FF6B9D, ${accentColor})`,
              borderRadius: '24px 24px 0 0',
            }}
          />

          {/* Glass icon */}
          <div
            style={{
              textAlign: 'center',
              fontSize: 'clamp(32px, 6vw, 50px)',
              marginBottom: 'clamp(6px, 1vh, 12px)',
              transform: `scale(${glassEnter})`,
              opacity: glassEnter,
            }}
          >
            {'\uD83C\uDF78'}
          </div>

          {/* Cocktail name */}
          <div
            style={{
              fontSize: 'clamp(24px, 5.5vw, 40px)',
              fontWeight: 900,
              color: textColor,
              textAlign: 'center',
              lineHeight: 1.15,
              marginBottom: 'clamp(2px, 0.5vh, 6px)',
              opacity: cardEnter,
            }}
          >
            {cocktailName}
          </div>

          {/* Glass type badge */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: 'clamp(10px, 1.8vh, 18px)',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                fontSize: 'clamp(9px, 1.4vw, 11px)',
                fontWeight: 600,
                color: accentColor,
                background: `${accentColor}10`,
                padding: 'clamp(2px, 0.4vh, 5px) clamp(8px, 1.5vw, 14px)',
                borderRadius: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                opacity: glassEnter,
              }}
            >
              {glassType}
            </span>
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: `${textColor}12`,
              marginBottom: 'clamp(12px, 2vh, 18px)',
              transform: `scaleX(${lineEnter})`,
              transformOrigin: 'center',
            }}
          />

          {/* Ingredients header */}
          <div
            style={{
              fontSize: 'clamp(9px, 1.4vw, 11px)',
              fontWeight: 700,
              color: accentColor,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              marginBottom: 'clamp(8px, 1.2vh, 12px)',
              opacity: getIngredientProgress(0),
            }}
          >
            Ingredients
          </div>

          {/* Ingredient list */}
          {displayIngredients.map((ing, i) => {
            const ip = getIngredientProgress(i)
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(6px, 1vw, 10px)',
                  padding: 'clamp(4px, 0.6vh, 7px) 0',
                  opacity: ip,
                  transform: `translateX(${(1 - ip) * 20}px)`,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: accentColor,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 'clamp(12px, 2vw, 15px)',
                    color: textColor,
                    fontWeight: 500,
                  }}
                >
                  {ing}
                </span>
              </div>
            )
          })}

          {/* Method */}
          <div
            style={{
              marginTop: 'clamp(12px, 2vh, 18px)',
              padding: 'clamp(10px, 1.8vh, 16px)',
              background: `${accentColor}06`,
              borderRadius: 10,
              borderLeft: `3px solid ${accentColor}40`,
              opacity: methodEnter,
              transform: `translateY(${(1 - methodEnter) * 10}px)`,
            }}
          >
            <div
              style={{
                fontSize: 'clamp(9px, 1.4vw, 11px)',
                fontWeight: 700,
                color: accentColor,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: 'clamp(3px, 0.4vh, 6px)',
              }}
            >
              Method
            </div>
            <div
              style={{
                fontSize: 'clamp(11px, 1.8vw, 14px)',
                color: `${textColor}BB`,
                lineHeight: 1.5,
              }}
            >
              {method}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-cocktail-recipe',
  title: 'Cocktail Recipe',
  description: 'Cocktail recipe card with glass icon bounce, staggered ingredient reveal, method section, and vibrant bar-inspired colors',
  tags: ['scene', 'food', 'cocktail', 'drink', 'bar', 'recipe', 'mixology'],
  category: 'scene-layout',
  component: SceneCocktailRecipeComponent as any,
  defaultConfig: {
    cocktailName: 'Espresso Martini',
    ingredients: ['2 oz Vodka', '1 oz Coffee Liqueur', '1 oz Fresh Espresso', '0.5 oz Simple Syrup', '3 Coffee Beans (garnish)'],
    method: 'Shake all ingredients with ice vigorously. Double strain into a chilled martini glass. Garnish with coffee beans.',
    glassType: 'Martini Glass',
    bgColor: '#1A1015',
    cardColor: '#FFFFFF',
    accentColor: '#C0392B',
    textColor: '#2C1810',
  },
  configSchema: [
    { key: 'cocktailName', label: 'Cocktail Name', type: 'text', defaultValue: 'Espresso Martini', group: 'Content' },
    { key: 'ingredients', label: 'Ingredients', type: 'text-array', defaultValue: ['2 oz Vodka', '1 oz Coffee Liqueur', '1 oz Fresh Espresso', '0.5 oz Simple Syrup', '3 Coffee Beans (garnish)'], group: 'Content' },
    { key: 'method', label: 'Method', type: 'text', defaultValue: 'Shake all ingredients with ice vigorously. Double strain into a chilled martini glass. Garnish with coffee beans.', group: 'Content' },
    { key: 'glassType', label: 'Glass Type', type: 'text', defaultValue: 'Martini Glass', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1015', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#C0392B', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2C1810', group: 'Style' },
  ],
})
