import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FurnitureSpecConfig {
  itemName: string
  brand: string
  material: string
  dimensions: string
  price: number
  weight: string
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

function SceneFurnitureSpecComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<FurnitureSpecConfig>) {
  const { itemName, brand, material, dimensions, price, weight, bgColor, cardColor, accentColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.25
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Card entrance
  const cardSlide = easeOutCubic(Math.min(1, enterProgress / 0.4))
  const cardY = (1 - cardSlide) * 80

  // Item image
  const imageProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.3)))
  // Specs cascade
  const getSpecProgress = (idx: number) => {
    const delay = 0.35 + idx * 0.08
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - delay) / 0.25)))
  }
  // Price
  const priceProgress = elasticOut(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.25)))

  // Hold: rotating spec highlight
  const highlightSpec = Math.floor(holdProgress * 4) % 4

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  const specs = [
    { icon: '📐', label: 'DIMENSIONS', value: dimensions },
    { icon: '🪵', label: 'MATERIAL', value: material },
    { icon: '⚖️', label: 'WEIGHT', value: weight },
    { icon: '🏷️', label: 'BRAND', value: brand },
  ]

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
        padding: '5%',
      }}
    >
      <div
        style={{
          background: cardColor,
          borderRadius: 'clamp(16px, 2.5vw, 24px)',
          padding: 'clamp(20px, 4%, 36px)',
          maxWidth: 400,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(12px, 2vh, 20px)',
          transform: `translateY(${cardY}px)`,
          opacity: exitOpacity,
          boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
        }}
      >
        {/* Item image placeholder */}
        <div
          style={{
            width: '100%',
            aspectRatio: '3/2',
            borderRadius: 'clamp(10px, 1.5vw, 14px)',
            background: `${accentColor}08`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(40px, 8vw, 64px)',
            opacity: imageProgress,
            transform: `scale(${0.85 + imageProgress * 0.15})`,
          }}
        >
          {'🪑'}
        </div>

        {/* Item name */}
        <div>
          <div
            style={{
              fontSize: 'clamp(18px, 3.5vw, 26px)',
              fontWeight: 800,
              color: textColor,
              opacity: cardSlide,
            }}
          >
            {itemName}
          </div>
          <div
            style={{
              fontSize: 'clamp(10px, 1.6vw, 13px)',
              fontWeight: 500,
              color: `${textColor}60`,
              marginTop: 2,
              opacity: cardSlide,
            }}
          >
            by {brand}
          </div>
        </div>

        {/* Specs grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'clamp(8px, 1.5vh, 14px)',
          }}
        >
          {specs.map((spec, i) => {
            const p = getSpecProgress(i)
            const isHighlighted = holdProgress > 0 && i === highlightSpec
            return (
              <div
                key={i}
                style={{
                  padding: 'clamp(8px, 1.5vh, 14px)',
                  borderRadius: 'clamp(8px, 1.2vw, 12px)',
                  background: isHighlighted ? `${accentColor}12` : `${textColor}06`,
                  border: isHighlighted ? `1px solid ${accentColor}30` : '1px solid transparent',
                  opacity: p,
                  transform: `translateY(${(1 - p) * 12}px)`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 'clamp(10px, 1.6vw, 14px)' }}>{spec.icon}</span>
                  <span style={{ fontSize: 'clamp(7px, 1vw, 9px)', fontWeight: 700, color: `${textColor}50`, letterSpacing: 1.5 }}>
                    {spec.label}
                  </span>
                </div>
                <div style={{ fontSize: 'clamp(11px, 1.8vw, 15px)', fontWeight: 700, color: textColor }}>
                  {spec.value}
                </div>
              </div>
            )
          })}
        </div>

        {/* Price */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'clamp(10px, 1.8vh, 16px)',
            borderRadius: 'clamp(10px, 1.5vw, 14px)',
            background: accentColor,
            transform: `scale(${priceProgress})`,
          }}
        >
          <span style={{ fontSize: 'clamp(11px, 1.6vw, 14px)', fontWeight: 700, color: '#FFFFFF', letterSpacing: 1 }}>
            PRICE
          </span>
          <span style={{ fontSize: 'clamp(20px, 4vw, 32px)', fontWeight: 900, color: '#FFFFFF' }}>
            ${Math.round(priceProgress * price).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-furniture-spec',
  title: 'Scene Furniture Spec',
  description: 'Furniture specification card with item preview, cascading specs grid, rotating highlight, and price reveal',
  tags: ['scene', 'furniture', 'specification', 'interior', 'design', 'product', 'architecture'],
  category: 'scene-layout',
  component: SceneFurnitureSpecComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'itemName', label: 'Item Name', type: 'text', defaultValue: 'Eames Lounge Chair', group: 'Content' },
    { key: 'brand', label: 'Brand', type: 'text', defaultValue: 'Herman Miller', group: 'Content' },
    { key: 'material', label: 'Material', type: 'text', defaultValue: 'Walnut & Leather', group: 'Content' },
    { key: 'dimensions', label: 'Dimensions', type: 'text', defaultValue: '84 x 83 x 82 cm', group: 'Content' },
    { key: 'price', label: 'Price', type: 'number', defaultValue: 5495, min: 1, max: 999999, group: 'Content' },
    { key: 'weight', label: 'Weight', type: 'text', defaultValue: '19.5 kg', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#1E3A5F', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F0EDE8', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1E293B', group: 'Style' },
  ],
  defaultConfig: {
    itemName: 'Eames Lounge Chair',
    brand: 'Herman Miller',
    material: 'Walnut & Leather',
    dimensions: '84 x 83 x 82 cm',
    price: 5495,
    weight: '19.5 kg',
    accentColor: '#1E3A5F',
    cardColor: '#FFFFFF',
    bgColor: '#F0EDE8',
    textColor: '#1E293B',
  },
})
