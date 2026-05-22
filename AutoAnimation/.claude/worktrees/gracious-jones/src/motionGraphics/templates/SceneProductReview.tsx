import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ProductReviewConfig {
  reviewerName: string
  reviewText: string
  rating: number
  helpfulCount: number
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneProductReviewComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<ProductReviewConfig>) {
  const { reviewerName, reviewText, rating, helpfulCount, bgColor, cardColor, accentColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Card fades and scales in
  const cardScale = elasticOut(Math.min(1, enterProgress / 0.4))

  // Stars fill one by one
  const getStarFill = (idx: number): number => {
    const starStart = 0.1 + idx * 0.07
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - starStart) / 0.12)))
  }

  // Review text typewriter effect
  const typeProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.45)))
  const visibleChars = Math.floor(typeProgress * reviewText.length)
  const displayText = reviewText.slice(0, visibleChars)

  // Verified badge
  const verifiedProgress = elasticOut(Math.max(0, Math.min(1, (enterProgress - 0.8) / 0.18)))

  // Helpful count
  const helpfulProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.88) / 0.12)))

  // Hold: subtle card glow
  const cardGlow = 12 + Math.sin(holdProgress * Math.PI * 3) * 6

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.15

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
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: '6%',
      }}
    >
      <div
        style={{
          background: cardColor,
          borderRadius: 'clamp(14px, 2vw, 22px)',
          padding: 'clamp(22px, 4.5%, 40px)',
          maxWidth: 400,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(12px, 2vh, 20px)',
          transform: `scale(${cardScale * exitScale})`,
          opacity: exitOpacity,
          boxShadow: `0 ${cardGlow}px ${cardGlow * 2}px rgba(0,0,0,0.12)`,
          border: `1px solid ${accentColor}15`,
        }}
      >
        {/* Reviewer header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(10px, 1.8vw, 16px)',
          }}
        >
          {/* Avatar circle */}
          <div
            style={{
              width: 'clamp(36px, 6vw, 48px)',
              height: 'clamp(36px, 6vw, 48px)',
              borderRadius: '50%',
              background: `${accentColor}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(16px, 2.8vw, 22px)',
              fontWeight: 800,
              color: accentColor,
              opacity: easeOutCubic(Math.min(1, enterProgress / 0.2)),
            }}
          >
            {reviewerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div
              style={{
                fontSize: 'clamp(13px, 2.2vw, 17px)',
                fontWeight: 700,
                color: textColor,
                opacity: easeOutCubic(Math.min(1, enterProgress / 0.25)),
              }}
            >
              {reviewerName}
            </div>
            {/* Stars */}
            <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
              {Array.from({ length: 5 }).map((_, i) => {
                const fill = getStarFill(i)
                return (
                  <span
                    key={i}
                    style={{
                      fontSize: 'clamp(12px, 1.8vw, 16px)',
                      transform: `scale(${fill})`,
                      opacity: fill,
                      color: i < rating ? '#FACC15' : '#D1D5DB',
                    }}
                  >
                    {'★'}
                  </span>
                )
              })}
            </div>
          </div>
        </div>

        {/* Review text with typewriter */}
        <div
          style={{
            fontSize: 'clamp(13px, 2vw, 17px)',
            fontWeight: 500,
            color: `${textColor}DD`,
            lineHeight: 1.6,
            minHeight: 'clamp(48px, 8vh, 72px)',
          }}
        >
          {`"${displayText}"`}
          {visibleChars < reviewText.length && (
            <span
              style={{
                display: 'inline-block',
                width: 2,
                height: '1em',
                background: accentColor,
                marginLeft: 2,
                animation: 'none',
                opacity: Math.sin(progress * Math.PI * 20) > 0 ? 1 : 0,
              }}
            />
          )}
        </div>

        {/* Verified purchase badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(4px, 0.8vw, 8px)',
              transform: `scale(${verifiedProgress})`,
            }}
          >
            <div
              style={{
                width: 'clamp(16px, 2.5vw, 22px)',
                height: 'clamp(16px, 2.5vw, 22px)',
                borderRadius: '50%',
                background: '#22C55E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: 'clamp(9px, 1.4vw, 12px)',
                fontWeight: 900,
              }}
            >
              {'\u2713'}
            </div>
            <span
              style={{
                fontSize: 'clamp(10px, 1.6vw, 13px)',
                fontWeight: 600,
                color: '#22C55E',
                letterSpacing: 0.5,
              }}
            >
              Verified Purchase
            </span>
          </div>

          {/* Helpful count */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(4px, 0.8vw, 6px)',
              opacity: helpfulProgress,
              transform: `translateY(${(1 - helpfulProgress) * 10}px)`,
            }}
          >
            <span style={{ fontSize: 'clamp(10px, 1.4vw, 13px)', color: `${textColor}70` }}>{'👍'}</span>
            <span
              style={{
                fontSize: 'clamp(10px, 1.5vw, 13px)',
                fontWeight: 600,
                color: `${textColor}70`,
              }}
            >
              {helpfulCount} found helpful
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-product-review',
  title: 'Scene Product Review',
  description:
    'Customer review card with star rating fill, typewriter review text, verified purchase badge, and helpful count',
  tags: ['scene', 'ecommerce', 'review', 'rating', 'testimonial', 'shopping', 'trust'],
  category: 'scene-layout',
  component: SceneProductReviewComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'reviewerName', label: 'Reviewer Name', type: 'text', defaultValue: 'Sarah M.', group: 'Content' },
    { key: 'reviewText', label: 'Review Text', type: 'text', defaultValue: 'Absolutely love this product! Quality is amazing and shipping was super fast. Would definitely recommend to anyone looking for great value.', group: 'Content' },
    { key: 'rating', label: 'Rating (1-5)', type: 'number', defaultValue: 5, min: 1, max: 5, group: 'Content' },
    { key: 'helpfulCount', label: 'Helpful Count', type: 'number', defaultValue: 47, min: 0, max: 99999, group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#6366F1', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F172A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1E293B', group: 'Style' },
  ],
  defaultConfig: {
    reviewerName: 'Sarah M.',
    reviewText: 'Absolutely love this product! Quality is amazing and shipping was super fast. Would definitely recommend to anyone looking for great value.',
    rating: 5,
    helpfulCount: 47,
    accentColor: '#6366F1',
    cardColor: '#FFFFFF',
    bgColor: '#0F172A',
    textColor: '#1E293B',
  },
})
