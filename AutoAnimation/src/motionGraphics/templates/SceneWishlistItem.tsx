import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WishlistItemConfig {
  productName: string
  originalPrice: number
  salePrice: number
  urgencyText: string
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

function SceneWishlistItemComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<WishlistItemConfig>) {
  const { productName, originalPrice, salePrice, urgencyText, bgColor, cardColor, accentColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Card slides in from right
  const cardSlide = easeOutCubic(Math.min(1, enterProgress / 0.4))
  const cardX = (1 - cardSlide) * 150

  // Heart fills red
  const heartProgress = elasticOut(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.25)))

  // Product name
  const nameProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.25)))

  // Price animation: original crossed, sale slides in
  const originalPriceProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.2)))
  const salePriceProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.45) / 0.25)))
  const strikethroughProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.15)))

  // Savings badge
  const savingsProgress = elasticOut(Math.max(0, Math.min(1, (enterProgress - 0.65) / 0.2)))
  const savings = Math.round(((originalPrice - salePrice) / originalPrice) * 100)

  // Urgency text
  const urgencyProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.8) / 0.2)))

  // Hold: heart pulse, urgency blink
  const heartPulse = 1 + Math.sin(holdProgress * Math.PI * 6) * 0.12
  const urgencyBlink = Math.sin(holdProgress * Math.PI * 4) > 0 ? 1 : 0.6

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitX = exitEased * -100

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
          gap: 'clamp(14px, 2.5vh, 22px)',
          transform: `translateX(${cardX + exitX}px)`,
          opacity: exitOpacity,
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          border: `1px solid ${accentColor}15`,
          position: 'relative',
        }}
      >
        {/* Heart icon (top right) */}
        <div
          style={{
            position: 'absolute',
            top: 'clamp(14px, 2.5%, 22px)',
            right: 'clamp(14px, 2.5%, 22px)',
            fontSize: 'clamp(24px, 4.5vw, 36px)',
            transform: `scale(${heartProgress * heartPulse})`,
            color: '#EF4444',
            filter: 'drop-shadow(0 2px 4px rgba(239,68,68,0.3))',
          }}
        >
          {'❤️'}
        </div>

        {/* Product image placeholder */}
        <div
          style={{
            width: '100%',
            aspectRatio: '16/9',
            borderRadius: 'clamp(10px, 1.5vw, 14px)',
            background: `${accentColor}10`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(28px, 5vw, 44px)',
            opacity: cardSlide,
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
            opacity: nameProgress,
            transform: `translateX(${(1 - nameProgress) * 20}px)`,
          }}
        >
          {productName}
        </div>

        {/* Price row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'clamp(10px, 2vw, 18px)', flexWrap: 'wrap' }}>
          {/* Original price with strikethrough */}
          <div style={{ position: 'relative', opacity: originalPriceProgress }}>
            <span
              style={{
                fontSize: 'clamp(16px, 2.5vw, 22px)',
                fontWeight: 500,
                color: `${textColor}60`,
              }}
            >
              ${originalPrice.toFixed(2)}
            </span>
            {/* Strikethrough line animates */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                height: 2,
                background: '#EF4444',
                width: `${strikethroughProgress * 100}%`,
              }}
            />
          </div>

          {/* Sale price */}
          <span
            style={{
              fontSize: 'clamp(28px, 5.5vw, 44px)',
              fontWeight: 900,
              color: accentColor,
              lineHeight: 1,
              opacity: salePriceProgress,
              transform: `translateY(${(1 - salePriceProgress) * 15}px)`,
            }}
          >
            ${salePrice.toFixed(2)}
          </span>

          {/* Savings badge */}
          <div
            style={{
              background: '#22C55E',
              color: '#FFFFFF',
              fontSize: 'clamp(9px, 1.4vw, 12px)',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: 20,
              transform: `scale(${savingsProgress})`,
              letterSpacing: 0.5,
            }}
          >
            SAVE {savings}%
          </div>
        </div>

        {/* Urgency text */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1vw, 10px)',
            opacity: urgencyProgress * urgencyBlink,
            transform: `translateY(${(1 - urgencyProgress) * 10}px)`,
          }}
        >
          <span style={{ fontSize: 'clamp(12px, 1.8vw, 16px)', color: '#EF4444' }}>{'⏰'}</span>
          <span
            style={{
              fontSize: 'clamp(11px, 1.8vw, 14px)',
              fontWeight: 700,
              color: '#EF4444',
              letterSpacing: 0.5,
            }}
          >
            {urgencyText}
          </span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-wishlist-item',
  title: 'Scene Wishlist Item',
  description:
    'Wishlist item card with heart fill animation, animated price strikethrough, savings badge, and blinking urgency text',
  tags: ['scene', 'ecommerce', 'wishlist', 'save', 'deal', 'shopping', 'price-drop', 'heart'],
  category: 'scene-layout',
  component: SceneWishlistItemComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'productName', label: 'Product Name', type: 'text', defaultValue: 'Designer Sneakers', group: 'Content' },
    { key: 'originalPrice', label: 'Original Price', type: 'number', defaultValue: 149.99, min: 0, max: 99999, group: 'Content' },
    { key: 'salePrice', label: 'Sale Price', type: 'number', defaultValue: 79.99, min: 0, max: 99999, group: 'Content' },
    { key: 'urgencyText', label: 'Urgency Text', type: 'text', defaultValue: "Don't miss out! Sale ends tonight", group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#8B5CF6', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F172A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1E293B', group: 'Style' },
  ],
  defaultConfig: {
    productName: 'Designer Sneakers',
    originalPrice: 149.99,
    salePrice: 79.99,
    urgencyText: "Don't miss out! Sale ends tonight",
    accentColor: '#8B5CF6',
    cardColor: '#FFFFFF',
    bgColor: '#0F172A',
    textColor: '#1E293B',
  },
})
