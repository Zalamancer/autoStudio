import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ProductCardConfig {
  productName: string
  price: number
  originalPrice: number
  rating: number
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

function SceneProductCardComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<ProductCardConfig>) {
  const { productName, price, originalPrice, rating, bgColor, cardColor, accentColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.25
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Card slides up
  const cardSlide = easeOutCubic(Math.min(1, enterProgress / 0.5))
  const cardY = (1 - cardSlide) * 120

  // Price counting
  const priceCountProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.4)))
  const displayPrice = (priceCountProgress * price).toFixed(2)

  // Stars fill one by one
  const getStarFill = (idx: number): number => {
    const starStart = 0.15 + idx * 0.08
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - starStart) / 0.15)))
  }

  // Button appears
  const buttonProgress = elasticOut(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.25)))

  // Hold: button pulses
  const buttonPulse = 1 + Math.sin(holdProgress * Math.PI * 6) * 0.04

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitY = exitEased * -80

  const fullStars = Math.floor(rating)
  const partialStar = rating - fullStars

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
          borderRadius: 'clamp(16px, 2.5vw, 24px)',
          padding: 'clamp(24px, 5%, 44px)',
          maxWidth: 380,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(14px, 2.5vh, 22px)',
          transform: `translateY(${cardY + exitY}px)`,
          opacity: exitOpacity,
          boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
          border: `1px solid ${accentColor}20`,
        }}
      >
        {/* Product image placeholder */}
        <div
          style={{
            width: '100%',
            aspectRatio: '4/3',
            borderRadius: 'clamp(10px, 1.5vw, 16px)',
            background: `${accentColor}12`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(32px, 6vw, 56px)',
          }}
        >
          {'🛍️'}
        </div>

        {/* Product name */}
        <div
          style={{
            fontSize: 'clamp(16px, 2.8vw, 22px)',
            fontWeight: 700,
            color: textColor,
            opacity: easeOutCubic(Math.min(1, enterProgress / 0.3)),
          }}
        >
          {productName}
        </div>

        {/* Star rating */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {Array.from({ length: 5 }).map((_, i) => {
            const fill = getStarFill(i)
            const isFilled = i < fullStars || (i === fullStars && partialStar > 0)
            return (
              <div
                key={i}
                style={{
                  fontSize: 'clamp(14px, 2.2vw, 20px)',
                  transform: `scale(${fill})`,
                  opacity: fill,
                  color: isFilled ? '#FACC15' : '#D1D5DB',
                }}
              >
                {'★'}
              </div>
            )
          })}
          <span
            style={{
              fontSize: 'clamp(11px, 1.6vw, 14px)',
              color: `${textColor}80`,
              marginLeft: 6,
              fontWeight: 500,
            }}
          >
            {rating.toFixed(1)}
          </span>
        </div>

        {/* Price row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'clamp(8px, 1.5vw, 14px)' }}>
          <span
            style={{
              fontSize: 'clamp(28px, 5.5vw, 44px)',
              fontWeight: 900,
              color: accentColor,
              lineHeight: 1,
            }}
          >
            ${displayPrice}
          </span>
          {originalPrice > price && (
            <span
              style={{
                fontSize: 'clamp(14px, 2.2vw, 20px)',
                fontWeight: 500,
                color: `${textColor}50`,
                textDecoration: 'line-through',
                opacity: priceCountProgress,
              }}
            >
              ${originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Add to cart button */}
        <div
          style={{
            background: accentColor,
            color: '#FFFFFF',
            fontSize: 'clamp(12px, 2vw, 16px)',
            fontWeight: 800,
            padding: 'clamp(10px, 1.8vh, 16px)',
            borderRadius: 'clamp(8px, 1.2vw, 12px)',
            textAlign: 'center',
            letterSpacing: 2,
            textTransform: 'uppercase',
            transform: `scale(${buttonProgress * buttonPulse})`,
            boxShadow: `0 4px 16px ${accentColor}40`,
            cursor: 'pointer',
          }}
        >
          ADD TO CART
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-product-card',
  title: 'Scene Product Card',
  description:
    'E-commerce product card with slide-up entrance, price counter, star rating fill, and pulsing add-to-cart button',
  tags: ['scene', 'ecommerce', 'product', 'shopping', 'cart', 'price', 'rating'],
  category: 'scene-layout',
  component: SceneProductCardComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'productName', label: 'Product Name', type: 'text', defaultValue: 'Premium Wireless Headphones', group: 'Content' },
    { key: 'price', label: 'Sale Price', type: 'number', defaultValue: 49.99, min: 0, max: 99999, group: 'Content' },
    { key: 'originalPrice', label: 'Original Price', type: 'number', defaultValue: 89.99, min: 0, max: 99999, group: 'Content' },
    { key: 'rating', label: 'Rating (1-5)', type: 'number', defaultValue: 4.5, min: 1, max: 5, group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#2563EB', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F172A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1E293B', group: 'Style' },
  ],
  defaultConfig: {
    productName: 'Premium Wireless Headphones',
    price: 49.99,
    originalPrice: 89.99,
    rating: 4.5,
    accentColor: '#2563EB',
    cardColor: '#FFFFFF',
    bgColor: '#0F172A',
    textColor: '#1E293B',
  },
})
