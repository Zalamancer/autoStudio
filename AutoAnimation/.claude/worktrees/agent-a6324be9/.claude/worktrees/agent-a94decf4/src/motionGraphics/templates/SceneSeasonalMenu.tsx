import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SeasonalMenuConfig {
  season: string
  restaurantName: string
  highlightDish: string
  description: string
  price: string
  available: string
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

function SceneSeasonalMenuComponent({ config, progress }: MotionGraphicProps<SeasonalMenuConfig>) {
  const { season, restaurantName, highlightDish, description, price, available, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.22 ? progress / 0.22 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Card fades and slides from bottom
  const cardEnter = easeOutCubic(Math.min(1, enterProgress / 0.35))
  const cardY = (1 - cardEnter) * 60

  // Season badge bounces
  const badgeEnter = elasticOut(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.3)))

  // Dish name types in
  const nameEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.25)))

  // Description fades
  const descEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.25)))

  // Price pops
  const priceEnter = elasticOut(Math.max(0, Math.min(1, (enterProgress - 0.65) / 0.25)))

  // Decorative line
  const lineEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.2)))

  // Season emojis
  const seasonEmojis: Record<string, string> = {
    'Spring': '\uD83C\uDF38',
    'Summer': '\u2600\uFE0F',
    'Autumn': '\uD83C\uDF41',
    'Winter': '\u2744\uFE0F',
  }
  const seasonEmoji = seasonEmojis[season] || '\uD83C\uDF3F'

  // Season gradient colors
  const seasonGradients: Record<string, string> = {
    'Spring': 'linear-gradient(135deg, #E8F5E9, #FFF8E1)',
    'Summer': 'linear-gradient(135deg, #FFF8E1, #FFECB3)',
    'Autumn': 'linear-gradient(135deg, #FBE9E7, #FFF3E0)',
    'Winter': 'linear-gradient(135deg, #E3F2FD, #F3E5F5)',
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Georgia', 'Palatino', serif",
      }}
    >
      {/* Season-themed background gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: seasonGradients[season] || `radial-gradient(ellipse at 50% 40%, ${accentColor}08 0%, transparent 50%)`,
          opacity: 0.3,
          pointerEvents: 'none',
        }}
      />

      {/* Floating seasonal particles */}
      {Array.from({ length: 8 }, (_, i) => {
        const seed = i * 37 + 11
        const x = 10 + ((seed * 13) % 80)
        const y = 10 + ((seed * 19) % 80)
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              fontSize: 'clamp(12px, 2vw, 18px)',
              opacity: 0.12,
              transform: `rotate(${seed % 60 - 30}deg)`,
              pointerEvents: 'none',
            }}
          >
            {seasonEmoji}
          </div>
        )
      })}

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
            padding: 'clamp(28px, 5%, 44px)',
            maxWidth: 420,
            width: '100%',
            boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
            transform: `translateY(${cardY}px)`,
            opacity: cardEnter,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top decorative gradient bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, ${accentColor}60, ${accentColor}, ${accentColor}60)`,
              transform: `scaleX(${lineEnter})`,
              transformOrigin: 'center',
            }}
          />

          {/* Restaurant name */}
          <div
            style={{
              fontSize: 'clamp(9px, 1.4vw, 11px)',
              fontWeight: 600,
              color: `${textColor}60`,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              textAlign: 'center',
              marginBottom: 'clamp(8px, 1.5vh, 14px)',
              opacity: cardEnter,
            }}
          >
            {restaurantName}
          </div>

          {/* Season badge */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 'clamp(12px, 2vh, 18px)',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: `${accentColor}12`,
                borderRadius: 24,
                padding: 'clamp(6px, 1vh, 10px) clamp(14px, 2.5vw, 22px)',
                transform: `scale(${badgeEnter})`,
                opacity: badgeEnter,
              }}
            >
              <span style={{ fontSize: 'clamp(16px, 2.5vw, 22px)' }}>{seasonEmoji}</span>
              <span
                style={{
                  fontSize: 'clamp(11px, 1.8vw, 14px)',
                  fontWeight: 700,
                  color: accentColor,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                {season} Special
              </span>
            </div>
          </div>

          {/* Highlight dish */}
          <div
            style={{
              fontSize: 'clamp(26px, 6vw, 42px)',
              fontWeight: 700,
              color: textColor,
              textAlign: 'center',
              lineHeight: 1.15,
              marginBottom: 'clamp(8px, 1.5vh, 14px)',
              opacity: nameEnter,
              transform: `translateY(${(1 - nameEnter) * 12}px)`,
            }}
          >
            {highlightDish}
          </div>

          {/* Decorative divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              marginBottom: 'clamp(10px, 1.8vh, 16px)',
              opacity: lineEnter,
            }}
          >
            <div style={{ height: 1, width: 40, background: `${accentColor}30` }} />
            <div style={{ fontSize: 10, color: accentColor }}>{seasonEmoji}</div>
            <div style={{ height: 1, width: 40, background: `${accentColor}30` }} />
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: 'clamp(12px, 2vw, 15px)',
              color: `${textColor}BB`,
              textAlign: 'center',
              lineHeight: 1.6,
              fontStyle: 'italic',
              marginBottom: 'clamp(16px, 2.5vh, 24px)',
              opacity: descEnter,
              transform: `translateY(${(1 - descEnter) * 10}px)`,
            }}
          >
            {description}
          </div>

          {/* Price and availability */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 'clamp(12px, 2.5vw, 24px)',
              alignItems: 'center',
            }}
          >
            {/* Price */}
            <div
              style={{
                background: accentColor,
                borderRadius: 12,
                padding: 'clamp(8px, 1.5vh, 14px) clamp(16px, 3vw, 28px)',
                transform: `scale(${priceEnter})`,
                opacity: priceEnter,
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(22px, 4.5vw, 34px)',
                  fontWeight: 900,
                  color: '#FFFFFF',
                  textAlign: 'center',
                  lineHeight: 1,
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                }}
              >
                {price}
              </div>
            </div>

            {/* Availability */}
            <div
              style={{
                opacity: priceEnter,
                transform: `translateX(${(1 - priceEnter) * 10}px)`,
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(8px, 1.2vw, 10px)',
                  fontWeight: 700,
                  color: `${textColor}60`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Available
              </div>
              <div
                style={{
                  fontSize: 'clamp(13px, 2.2vw, 17px)',
                  fontWeight: 700,
                  color: textColor,
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                }}
              >
                {available}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-seasonal-menu',
  title: 'Seasonal Menu',
  description: 'Seasonal menu highlight card with themed badge, floating season emojis, dish description, price tag, and availability dates',
  tags: ['scene', 'food', 'seasonal', 'menu', 'special', 'restaurant', 'limited'],
  category: 'scene-layout',
  component: SceneSeasonalMenuComponent as any,
  defaultConfig: {
    season: 'Autumn',
    restaurantName: 'The Harvest Table',
    highlightDish: 'Pumpkin Spice Risotto',
    description: 'Creamy arborio rice with roasted pumpkin, sage brown butter, toasted pepitas, and aged parmesan.',
    price: '$26',
    available: 'Oct - Nov',
    bgColor: '#FFF8F0',
    cardColor: '#FFFFFF',
    accentColor: '#D35400',
    textColor: '#2C1810',
  },
  configSchema: [
    { key: 'season', label: 'Season', type: 'text', defaultValue: 'Autumn', group: 'Content' },
    { key: 'restaurantName', label: 'Restaurant', type: 'text', defaultValue: 'The Harvest Table', group: 'Content' },
    { key: 'highlightDish', label: 'Dish Name', type: 'text', defaultValue: 'Pumpkin Spice Risotto', group: 'Content' },
    { key: 'description', label: 'Description', type: 'text', defaultValue: 'Creamy arborio rice with roasted pumpkin, sage brown butter, toasted pepitas, and aged parmesan.', group: 'Content' },
    { key: 'price', label: 'Price', type: 'text', defaultValue: '$26', group: 'Content' },
    { key: 'available', label: 'Availability', type: 'text', defaultValue: 'Oct - Nov', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF8F0', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#D35400', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2C1810', group: 'Style' },
  ],
})
