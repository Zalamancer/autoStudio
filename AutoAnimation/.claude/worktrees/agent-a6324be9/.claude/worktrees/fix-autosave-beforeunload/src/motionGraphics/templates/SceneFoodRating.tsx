import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FoodRatingConfig {
  dishName: string
  location: string
  rating: number
  spiceLevel: number
  priceRange: string
  verdict: string
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

function SceneFoodRatingComponent({ config, progress }: MotionGraphicProps<FoodRatingConfig>) {
  const { dishName, location, rating, spiceLevel, priceRange, verdict, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Card flips in (simulated with scaleX + opacity)
  const cardEnter = easeOutBack(Math.min(1, enterProgress / 0.4))
  const cardScaleX = Math.max(0, cardEnter)

  // Dish name
  const nameEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.25)))

  // Location
  const locEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.2)))

  // Stars pop in staggered
  const getStarProgress = (index: number): number => {
    const start = 0.4 + index * 0.08
    return easeOutBack(Math.max(0, Math.min(1, (enterProgress - start) / 0.15)))
  }

  // Spice peppers pop in staggered
  const getSpiceProgress = (index: number): number => {
    const start = 0.55 + index * 0.06
    return easeOutBack(Math.max(0, Math.min(1, (enterProgress - start) / 0.15)))
  }

  // Price and verdict
  const detailsEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.25)))

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
      {/* Decorative food pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(${accentColor}08 2px, transparent 2px)`,
          backgroundSize: '30px 30px',
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
            borderRadius: 'clamp(16px, 2.5vw, 28px)',
            padding: 'clamp(24px, 4.5%, 44px)',
            maxWidth: 440,
            width: '100%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
            transform: `scaleX(${cardScaleX})`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Accent corner */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 'clamp(50px, 10vw, 80px)',
              height: 'clamp(50px, 10vw, 80px)',
              background: `linear-gradient(135deg, transparent 50%, ${accentColor}15 50%)`,
            }}
          />

          {/* Dish name */}
          <div
            style={{
              fontSize: 'clamp(22px, 5vw, 38px)',
              fontWeight: 900,
              color: textColor,
              lineHeight: 1.2,
              marginBottom: 'clamp(4px, 0.6vh, 8px)',
              opacity: nameEnter,
              transform: `translateY(${(1 - nameEnter) * 15}px)`,
            }}
          >
            {dishName}
          </div>

          {/* Location */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(4px, 0.8vw, 8px)',
              marginBottom: 'clamp(16px, 2.5vh, 28px)',
              opacity: locEnter,
              transform: `translateY(${(1 - locEnter) * 10}px)`,
            }}
          >
            <svg viewBox="0 0 16 16" style={{ width: 14, height: 14, flexShrink: 0 }}>
              <path d="M8 1C5.2 1 3 3.2 3 6c0 4 5 9 5 9s5-5 5-9c0-2.8-2.2-5-5-5z" fill="none" stroke={accentColor} strokeWidth="1.2" />
              <circle cx="8" cy="6" r="2" fill={accentColor} />
            </svg>
            <span
              style={{
                fontSize: 'clamp(12px, 2vw, 16px)',
                fontWeight: 500,
                color: `${textColor}88`,
              }}
            >
              {location}
            </span>
          </div>

          {/* Star rating */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(3px, 0.5vw, 6px)',
              marginBottom: 'clamp(10px, 1.5vh, 18px)',
            }}
          >
            <span
              style={{
                fontSize: 'clamp(11px, 1.6vw, 14px)',
                fontWeight: 700,
                color: `${textColor}88`,
                marginRight: 'clamp(4px, 0.8vw, 8px)',
              }}
            >
              Rating
            </span>
            {Array.from({ length: 5 }).map((_, i) => {
              const sp = getStarProgress(i)
              const filled = i < rating
              return (
                <span
                  key={i}
                  style={{
                    fontSize: 'clamp(18px, 3.5vw, 28px)',
                    transform: `scale(${sp})`,
                    opacity: sp,
                    filter: filled ? 'none' : 'grayscale(1) opacity(0.3)',
                  }}
                >
                  {'\u2B50'}
                </span>
              )
            })}
          </div>

          {/* Spice level */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(3px, 0.5vw, 6px)',
              marginBottom: 'clamp(16px, 2.5vh, 28px)',
            }}
          >
            <span
              style={{
                fontSize: 'clamp(11px, 1.6vw, 14px)',
                fontWeight: 700,
                color: `${textColor}88`,
                marginRight: 'clamp(4px, 0.8vw, 8px)',
              }}
            >
              Spice
            </span>
            {Array.from({ length: 5 }).map((_, i) => {
              const sp = getSpiceProgress(i)
              const filled = i < spiceLevel
              return (
                <span
                  key={i}
                  style={{
                    fontSize: 'clamp(16px, 3vw, 24px)',
                    transform: `scale(${sp})`,
                    opacity: filled ? sp : sp * 0.25,
                  }}
                >
                  {'\u{1F336}\uFE0F'}
                </span>
              )
            })}
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: `${textColor}12`,
              marginBottom: 'clamp(12px, 2vh, 20px)',
            }}
          />

          {/* Price and verdict row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              opacity: detailsEnter,
              transform: `translateY(${(1 - detailsEnter) * 12}px)`,
            }}
          >
            <div
              style={{
                fontSize: 'clamp(16px, 3vw, 24px)',
                fontWeight: 800,
                color: accentColor,
              }}
            >
              {priceRange}
            </div>
            <div
              style={{
                fontSize: 'clamp(12px, 2vw, 17px)',
                fontWeight: 600,
                color: `${textColor}cc`,
                fontStyle: 'italic',
                maxWidth: '60%',
                textAlign: 'right',
              }}
            >
              &ldquo;{verdict}&rdquo;
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-food-rating',
  title: 'Food Rating Card',
  description: 'Food review card with dish name, location, star rating, spice level peppers, price range and verdict',
  tags: ['scene', 'food', 'review', 'rating', 'restaurant', 'foodie'],
  category: 'scene-layout',
  component: SceneFoodRatingComponent as any,
  defaultConfig: {
    dishName: 'Spicy Tonkotsu Ramen',
    location: 'Ichiran, Shibuya',
    rating: 4,
    spiceLevel: 3,
    priceRange: '$$$',
    verdict: 'Rich, bold, absolutely worth the wait',
    bgColor: '#FEF3E2',
    cardColor: '#FFFFFF',
    accentColor: '#C4421A',
    textColor: '#2D1810',
  },
  configSchema: [
    { key: 'dishName', label: 'Dish Name', type: 'text', defaultValue: 'Spicy Tonkotsu Ramen', group: 'Content' },
    { key: 'location', label: 'Location', type: 'text', defaultValue: 'Ichiran, Shibuya', group: 'Content' },
    { key: 'rating', label: 'Star Rating (1-5)', type: 'number', defaultValue: 4, min: 1, max: 5, group: 'Content' },
    { key: 'spiceLevel', label: 'Spice Level (0-5)', type: 'number', defaultValue: 3, min: 0, max: 5, group: 'Content' },
    { key: 'priceRange', label: 'Price Range', type: 'text', defaultValue: '$$$', group: 'Content' },
    { key: 'verdict', label: 'Verdict', type: 'text', defaultValue: 'Rich, bold, absolutely worth the wait', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FEF3E2', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#C4421A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2D1810', group: 'Style' },
  ],
})
