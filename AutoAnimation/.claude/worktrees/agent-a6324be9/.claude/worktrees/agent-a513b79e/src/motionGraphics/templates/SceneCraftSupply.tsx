import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CraftSupplyConfig {
  supplyName: string
  brand: string
  whereToBuy: string
  price: string
  rating: number
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

function SceneCraftSupplyComponent({ config, progress }: MotionGraphicProps<CraftSupplyConfig>) {
  const { supplyName, brand, whereToBuy, price, rating, bgColor, cardColor, accentColor, textColor } = config

  // Enter: 0-0.2
  const enterP = progress < 0.2 ? progress / 0.2 : 1
  // Exit: 0.8-1.0
  const exitP = progress > 0.8 ? (progress - 0.8) / 0.2 : 0
  const overallOpacity = exitP > 0 ? 1 - easeInCubic(exitP) : 1

  // Card slides in from right: 0-0.18
  const cardP = easeOutBack(Math.min(1, enterP / 0.9))

  // Details stagger in
  const nameP = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.08) / 0.1)))
  const brandP = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.14) / 0.1)))
  const storeP = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.2) / 0.1)))
  const priceP = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.26) / 0.1)))
  const ratingP = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.32) / 0.12)))

  const clampedRating = Math.max(0, Math.min(5, rating))
  const fullStars = Math.floor(clampedRating)
  const hasHalf = clampedRating - fullStars >= 0.5

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
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        opacity: overallOpacity,
      }}
    >
      {/* Subtle pattern background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(${accentColor}08 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          pointerEvents: 'none',
        }}
      />

      {/* Card */}
      <div
        style={{
          position: 'relative',
          width: '80%',
          maxWidth: 420,
          background: cardColor,
          borderRadius: 16,
          padding: 'clamp(20px, 5%, 36px)',
          boxShadow: `0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px ${accentColor}20`,
          transform: `translateX(${(1 - cardP) * 120}%) scale(${0.9 + cardP * 0.1})`,
          opacity: cardP,
        }}
      >
        {/* "CRAFT SUPPLY" badge */}
        <div
          style={{
            position: 'absolute',
            top: -12,
            left: 20,
            background: accentColor,
            color: '#FFFFFF',
            fontSize: 'clamp(8px, 1.4vw, 11px)',
            fontWeight: 800,
            padding: '4px 12px',
            borderRadius: 4,
            letterSpacing: 2,
            textTransform: 'uppercase',
            opacity: nameP,
          }}
        >
          Craft Supply
        </div>

        {/* Supply name */}
        <div
          style={{
            fontSize: 'clamp(20px, 4.5vw, 36px)',
            fontWeight: 800,
            color: textColor,
            opacity: nameP,
            transform: `translateY(${(1 - nameP) * 15}px)`,
            marginBottom: '3%',
            lineHeight: 1.2,
          }}
        >
          {supplyName}
        </div>

        {/* Brand */}
        <div
          style={{
            fontSize: 'clamp(12px, 2vw, 16px)',
            fontWeight: 600,
            color: accentColor,
            opacity: brandP,
            transform: `translateY(${(1 - brandP) * 10}px)`,
            marginBottom: '5%',
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}
        >
          {brand}
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: `${textColor}15`,
            marginBottom: '5%',
            width: `${storeP * 100}%`,
          }}
        />

        {/* Where to buy */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: '4%',
            opacity: storeP,
            transform: `translateX(${(1 - storeP) * 20}px)`,
          }}
        >
          <span style={{ fontSize: 'clamp(14px, 2.2vw, 18px)' }}>{'\uD83D\uDED2'}</span>
          <span
            style={{
              fontSize: 'clamp(13px, 2.2vw, 18px)',
              color: textColor,
              opacity: 0.7,
            }}
          >
            {whereToBuy}
          </span>
        </div>

        {/* Price */}
        <div
          style={{
            fontSize: 'clamp(24px, 5vw, 40px)',
            fontWeight: 900,
            color: accentColor,
            opacity: priceP,
            transform: `scale(${0.8 + priceP * 0.2})`,
            marginBottom: '4%',
          }}
        >
          {price}
        </div>

        {/* Rating stars */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            opacity: ratingP,
            transform: `translateY(${(1 - ratingP) * 10}px)`,
          }}
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = star <= fullStars
            const half = !filled && star === fullStars + 1 && hasHalf
            return (
              <span
                key={star}
                style={{
                  fontSize: 'clamp(16px, 3vw, 24px)',
                  opacity: filled || half ? 1 : 0.25,
                  filter: filled || half ? 'none' : 'grayscale(1)',
                }}
              >
                {filled ? '\u2B50' : half ? '\u2B50' : '\u2606'}
              </span>
            )
          })}
          <span
            style={{
              fontSize: 'clamp(12px, 2vw, 16px)',
              color: textColor,
              opacity: 0.5,
              marginLeft: 6,
              fontWeight: 600,
            }}
          >
            {clampedRating.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-craft-supply',
  title: 'Scene Craft Supply',
  description: 'Craft supply spotlight card with name, brand, price, rating stars, and sliding entrance',
  tags: ['scene', 'craft', 'supply', 'product', 'diy', 'review'],
  category: 'scene-layout',
  component: SceneCraftSupplyComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'supplyName', label: 'Supply Name', type: 'text', defaultValue: 'Premium Craft Glue', group: 'Content' },
    { key: 'brand', label: 'Brand', type: 'text', defaultValue: 'Aleene\'s', group: 'Content' },
    { key: 'whereToBuy', label: 'Where to Buy', type: 'text', defaultValue: 'Michael\'s, Amazon', group: 'Content' },
    { key: 'price', label: 'Price', type: 'text', defaultValue: '$6.99', group: 'Content' },
    { key: 'rating', label: 'Rating (0-5)', type: 'number', defaultValue: 4.5, min: 0, max: 5, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5E6D3', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#E85D04', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2D2D2D', group: 'Style' },
  ],
  defaultConfig: {
    supplyName: 'Premium Craft Glue',
    brand: 'Aleene\'s',
    whereToBuy: 'Michael\'s, Amazon',
    price: '$6.99',
    rating: 4.5,
    bgColor: '#F5E6D3',
    cardColor: '#FFFFFF',
    accentColor: '#E85D04',
    textColor: '#2D2D2D',
  },
})
