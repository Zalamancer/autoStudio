import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RestaurantReviewConfig {
  restaurantName: string
  reviewText: string
  reviewerName: string
  rating: number
  cuisine: string
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

function SceneRestaurantReviewComponent({ config, progress }: MotionGraphicProps<RestaurantReviewConfig>) {
  const { restaurantName, reviewText, reviewerName, rating, cuisine, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.22 ? progress / 0.22 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Card scales in
  const cardEnter = easeOutCubic(Math.min(1, enterProgress / 0.4))
  const cardScale = 0.85 + cardEnter * 0.15

  // Stars pop in staggered
  const getStarProgress = (i: number): number => {
    const start = 0.3 + i * 0.08
    return elasticOut(Math.max(0, Math.min(1, (enterProgress - start) / 0.2)))
  }

  // Review text slides up
  const reviewEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3)))

  // Badge pops
  const badgeEnter = elasticOut(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.25)))

  const fullStars = Math.floor(rating)

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
          background: `radial-gradient(ellipse at 40% 50%, ${accentColor}08 0%, transparent 60%)`,
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
          transform: `scale(${1 - exitEased * 0.1}) translateY(${exitEased * 30}px)`,
        }}
      >
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(16px, 2.5vw, 24px)',
            padding: 'clamp(24px, 4.5%, 40px)',
            maxWidth: 440,
            width: '100%',
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
            transform: `scale(${cardScale})`,
            opacity: cardEnter,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top accent strip */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, ${accentColor}, #FF6B35)`,
            }}
          />

          {/* Cuisine badge */}
          <div
            style={{
              display: 'inline-block',
              background: `${accentColor}15`,
              color: accentColor,
              fontSize: 'clamp(9px, 1.4vw, 11px)',
              fontWeight: 700,
              padding: 'clamp(3px, 0.5vh, 6px) clamp(8px, 1.5vw, 14px)',
              borderRadius: 20,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 'clamp(10px, 1.8vh, 16px)',
              transform: `scale(${badgeEnter})`,
            }}
          >
            {cuisine}
          </div>

          {/* Restaurant name */}
          <div
            style={{
              fontSize: 'clamp(22px, 5vw, 36px)',
              fontWeight: 900,
              color: textColor,
              lineHeight: 1.15,
              marginBottom: 'clamp(8px, 1.5vh, 14px)',
              opacity: cardEnter,
            }}
          >
            {restaurantName}
          </div>

          {/* Star rating */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              alignItems: 'center',
              marginBottom: 'clamp(12px, 2vh, 20px)',
            }}
          >
            {Array.from({ length: 5 }, (_, i) => {
              const sp = getStarProgress(i)
              const isFilled = i < fullStars
              const isHalf = i === fullStars && rating % 1 >= 0.5
              return (
                <div
                  key={i}
                  style={{
                    fontSize: 'clamp(16px, 2.8vw, 24px)',
                    transform: `scale(${sp})`,
                    opacity: sp,
                    color: isFilled || isHalf ? '#F59E0B' : '#D1D5DB',
                  }}
                >
                  {'★'}
                </div>
              )
            })}
            <span
              style={{
                fontSize: 'clamp(14px, 2.2vw, 18px)',
                fontWeight: 800,
                color: textColor,
                marginLeft: 8,
                opacity: getStarProgress(4),
              }}
            >
              {rating.toFixed(1)}
            </span>
          </div>

          {/* Review text */}
          <div
            style={{
              fontSize: 'clamp(13px, 2vw, 16px)',
              color: `${textColor}BB`,
              lineHeight: 1.6,
              fontStyle: 'italic',
              marginBottom: 'clamp(14px, 2.5vh, 22px)',
              opacity: reviewEnter,
              transform: `translateY(${(1 - reviewEnter) * 15}px)`,
            }}
          >
            &ldquo;{reviewText}&rdquo;
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: `${textColor}12`,
              marginBottom: 'clamp(10px, 1.8vh, 16px)',
            }}
          />

          {/* Reviewer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(8px, 1.5vw, 14px)',
              opacity: reviewEnter,
            }}
          >
            {/* Avatar circle */}
            <div
              style={{
                width: 'clamp(28px, 5vw, 38px)',
                height: 'clamp(28px, 5vw, 38px)',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}60)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(12px, 2vw, 16px)',
                fontWeight: 700,
                color: accentColor,
              }}
            >
              {reviewerName.charAt(0)}
            </div>
            <div>
              <div
                style={{
                  fontSize: 'clamp(12px, 1.8vw, 15px)',
                  fontWeight: 700,
                  color: textColor,
                }}
              >
                {reviewerName}
              </div>
              <div
                style={{
                  fontSize: 'clamp(9px, 1.3vw, 11px)',
                  color: `${textColor}60`,
                }}
              >
                Verified Diner
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-restaurant-review',
  title: 'Restaurant Review',
  description: 'Restaurant review card with star rating pop-in, cuisine badge, quoted review text, and reviewer profile with warm appetizing tones',
  tags: ['scene', 'food', 'restaurant', 'review', 'rating', 'stars', 'dining'],
  category: 'scene-layout',
  component: SceneRestaurantReviewComponent as any,
  defaultConfig: {
    restaurantName: 'The Rustic Table',
    reviewText: 'Incredible flavors and perfect ambiance. The truffle pasta was life-changing!',
    reviewerName: 'Sarah M.',
    rating: 4.5,
    cuisine: 'Italian',
    bgColor: '#FFF8F0',
    cardColor: '#FFFFFF',
    accentColor: '#D35400',
    textColor: '#2D1810',
  },
  configSchema: [
    { key: 'restaurantName', label: 'Restaurant Name', type: 'text', defaultValue: 'The Rustic Table', group: 'Content' },
    { key: 'reviewText', label: 'Review', type: 'text', defaultValue: 'Incredible flavors and perfect ambiance. The truffle pasta was life-changing!', group: 'Content' },
    { key: 'reviewerName', label: 'Reviewer', type: 'text', defaultValue: 'Sarah M.', group: 'Content' },
    { key: 'rating', label: 'Rating (1-5)', type: 'number', defaultValue: 4.5, min: 1, max: 5, group: 'Content' },
    { key: 'cuisine', label: 'Cuisine Type', type: 'text', defaultValue: 'Italian', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF8F0', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#D35400', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2D1810', group: 'Style' },
  ],
})
