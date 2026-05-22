import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BeautyReviewConfig {
  productName: string
  brand: string
  rating: number
  price: string
  verdict: string
  repurchase: boolean
  bgColor: string
  cardColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneProductReviewBeautyComponent({ config, progress }: MotionGraphicProps<BeautyReviewConfig>) {
  const { productName, brand, rating, price, verdict, repurchase, bgColor, cardColor, textColor, accentColor } = config
  const clampedRating = Math.min(10, Math.max(0, rating))

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Card slides up
  const cardEnter = easeOutCubic(Math.min(1, enterProgress / 0.35))
  const cardY = (1 - cardEnter) * 60

  // Brand name
  const brandEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.25)))

  // Product name
  const nameEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.25) / 0.25)))

  // Rating bar fill
  const ratingFill = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.3)))
  const ratingWidth = (clampedRating / 10) * ratingFill * 100

  // Price tag
  const priceEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.2)))

  // Verdict
  const verdictEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.65) / 0.2)))

  // Repurchase badge pops
  const badgeEnter = elasticOut(Math.max(0, Math.min(1, (enterProgress - 0.8) / 0.2)))

  // Hold: subtle shimmer
  const shimmer = Math.sin(holdProgress * Math.PI * 6) * 0.5 + 0.5

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      {/* Soft radial glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 60%, ${accentColor}12, transparent 65%)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6% 8%',
          opacity: exitOpacity,
          transform: `translateY(${exitEased * 50}px)`,
        }}
      >
        {/* Review card */}
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(12px, 2vw, 24px)',
            padding: 'clamp(20px, 4vh, 40px) clamp(20px, 4vw, 36px)',
            maxWidth: 420,
            width: '85%',
            transform: `translateY(${cardY}px)`,
            opacity: cardEnter,
            boxShadow: `0 8px 32px rgba(0,0,0,0.3)`,
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(10px, 2vh, 18px)',
            position: 'relative',
          }}
        >
          {/* Brand */}
          <div
            style={{
              fontSize: 'clamp(10px, 1.8vw, 14px)',
              fontWeight: 500,
              color: accentColor,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              opacity: brandEnter,
              transform: `translateX(${(1 - brandEnter) * -15}px)`,
            }}
          >
            {brand}
          </div>

          {/* Product name */}
          <div
            style={{
              fontSize: 'clamp(22px, 5vw, 36px)',
              fontWeight: 700,
              color: textColor,
              lineHeight: 1.2,
              opacity: nameEnter,
              transform: `translateX(${(1 - nameEnter) * 20}px)`,
            }}
          >
            {productName}
          </div>

          {/* Rating bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 14px)' }}>
            <div
              style={{
                flex: 1,
                height: 'clamp(6px, 1.2vh, 10px)',
                background: `${textColor}15`,
                borderRadius: 99,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${ratingWidth}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)`,
                  borderRadius: 99,
                  transition: 'none',
                }}
              />
            </div>
            <div
              style={{
                fontSize: 'clamp(16px, 3.5vw, 26px)',
                fontWeight: 800,
                color: accentColor,
                opacity: ratingFill,
                minWidth: 'clamp(30px, 6vw, 50px)',
                textAlign: 'right',
              }}
            >
              {clampedRating}/10
            </div>
          </div>

          {/* Price */}
          <div
            style={{
              fontSize: 'clamp(13px, 2.5vw, 20px)',
              fontWeight: 600,
              color: `${textColor}bb`,
              opacity: priceEnter,
              transform: `translateY(${(1 - priceEnter) * 10}px)`,
            }}
          >
            {price}
          </div>

          {/* Verdict divider */}
          <div
            style={{
              width: '100%',
              height: 1,
              background: `${textColor}15`,
              transform: `scaleX(${verdictEnter})`,
              transformOrigin: 'left',
            }}
          />

          {/* Verdict text */}
          <div
            style={{
              fontSize: 'clamp(12px, 2.2vw, 18px)',
              fontWeight: 400,
              color: `${textColor}cc`,
              fontStyle: 'italic',
              lineHeight: 1.5,
              opacity: verdictEnter,
              transform: `translateY(${(1 - verdictEnter) * 8}px)`,
            }}
          >
            &ldquo;{verdict}&rdquo;
          </div>

          {/* Repurchase badge */}
          <div
            style={{
              position: 'absolute',
              top: 'clamp(-12px, -2vh, -18px)',
              right: 'clamp(12px, 3vw, 24px)',
              background: repurchase ? '#22c55e' : '#ef4444',
              color: '#ffffff',
              fontSize: 'clamp(9px, 1.6vw, 13px)',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: 'clamp(4px, 0.8vh, 8px) clamp(10px, 2vw, 18px)',
              borderRadius: 'clamp(4px, 0.8vw, 8px)',
              transform: `scale(${badgeEnter})`,
              boxShadow: `0 4px 12px ${repurchase ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}
          >
            {repurchase ? 'REPURCHASE' : 'SKIP'}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-beauty-review',
  title: 'Beauty Product Review',
  description: 'Beauty product review card with rating bar fill, price, verdict, and repurchase badge pop-in',
  tags: ['scene', 'beauty', 'review', 'product', 'skincare', 'makeup', 'fashion'],
  category: 'scene-layout',
  component: SceneProductReviewBeautyComponent as any,
  defaultConfig: {
    productName: 'Luminous Silk Foundation',
    brand: 'Giorgio Armani',
    rating: 9,
    price: '$65',
    verdict: 'Flawless finish, lasts all day. Holy grail status.',
    repurchase: true,
    bgColor: '#1a1418',
    cardColor: '#2a2228',
    textColor: '#faf0f0',
    accentColor: '#e8a0bf',
  },
  configSchema: [
    { key: 'productName', label: 'Product Name', type: 'text', defaultValue: 'Luminous Silk Foundation', group: 'Content' },
    { key: 'brand', label: 'Brand', type: 'text', defaultValue: 'Giorgio Armani', group: 'Content' },
    { key: 'rating', label: 'Rating (1-10)', type: 'number', defaultValue: 9, min: 1, max: 10, group: 'Content' },
    { key: 'price', label: 'Price', type: 'text', defaultValue: '$65', group: 'Content' },
    { key: 'verdict', label: 'Verdict', type: 'text', defaultValue: 'Flawless finish, lasts all day. Holy grail status.', group: 'Content' },
    { key: 'repurchase', label: 'Would Repurchase?', type: 'boolean', defaultValue: true, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1418', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#2a2228', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#faf0f0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#e8a0bf', group: 'Style' },
  ],
})
