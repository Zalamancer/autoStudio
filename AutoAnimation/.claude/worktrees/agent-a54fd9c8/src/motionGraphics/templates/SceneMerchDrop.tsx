import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MerchDropConfig {
  itemName: string
  price: number
  dropDate: string
  limited: boolean
  bgColor: string
  accentColor: string
  cardColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneMerchDropComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<MerchDropConfig>) {
  const { itemName, price, dropDate, limited, bgColor, accentColor, cardColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.25
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // "NEW DROP" badge slams
  const badgeSlam = easeOutBack(Math.min(1, enterProgress / 0.3))

  // Product card slides up
  const cardSlide = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.35)))
  const cardY = (1 - cardSlide) * 80

  // Product image reveals
  const imgReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.3)))

  // Price counter
  const priceProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3)))
  const displayPrice = (priceProgress * price).toFixed(2)

  // "Add to Cart" button
  const cartBtn = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.25)))

  // Hold: limited edition pulse
  const limitedPulse = Math.sin(holdProgress * Math.PI * 8) * 0.5 + 0.5

  // Hold: card subtle tilt
  const tiltX = Math.sin(holdProgress * Math.PI * 2) * 2
  const tiltY = Math.cos(holdProgress * Math.PI * 3) * 1

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitY = exitEased * -60

  // Floating price tags
  const tags = Array.from({ length: 4 }).map((_, i) => {
    const angle = (i / 4) * Math.PI * 2 + holdProgress * Math.PI
    const radius = 160 + Math.sin(holdProgress * Math.PI * 4 + i) * 20
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    return { x, y, opacity: holdProgress > 0 ? 0.15 : 0 }
  })

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
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          width: '50%',
          height: '50%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)`,
          top: '25%',
          left: '25%',
          opacity: exitOpacity,
        }}
      />

      {/* Floating tag icons */}
      {tags.map((t, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `calc(50% + ${t.x}px)`,
            top: `calc(50% + ${t.y}px)`,
            fontSize: 20,
            opacity: t.opacity * exitOpacity,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {'🏷️'}
        </div>
      ))}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(14px, 2.5vh, 22px)',
          transform: `translateY(${exitY}px)`,
          opacity: exitOpacity,
        }}
      >
        {/* NEW DROP badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transform: `scale(${badgeSlam})`,
          }}
        >
          <div
            style={{
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
              borderRadius: 20,
              padding: 'clamp(4px, 0.8vh, 8px) clamp(14px, 2.5vw, 22px)',
              fontSize: 'clamp(10px, 1.6vw, 13px)',
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {'🔥'} NEW DROP
          </div>
          {limited && (
            <div
              style={{
                background: '#EF444420',
                borderRadius: 8,
                padding: '4px 10px',
                fontSize: 'clamp(8px, 1.2vw, 10px)',
                fontWeight: 800,
                color: '#EF4444',
                letterSpacing: 1,
                opacity: 0.5 + limitedPulse * 0.5,
              }}
            >
              LIMITED
            </div>
          )}
        </div>

        {/* Product card */}
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(16px, 2.5vw, 22px)',
            padding: 'clamp(16px, 3vh, 28px)',
            width: '100%',
            maxWidth: 340,
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(12px, 2vh, 18px)',
            transform: `translateY(${cardY}px) perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
            border: `1px solid ${accentColor}20`,
            boxShadow: `0 16px 48px rgba(0,0,0,0.2), 0 0 30px ${accentColor}08`,
          }}
        >
          {/* Product image placeholder */}
          <div
            style={{
              width: '100%',
              aspectRatio: '1',
              borderRadius: 'clamp(10px, 1.5vw, 16px)',
              background: `linear-gradient(135deg, ${accentColor}10, ${accentColor}05)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: imgReveal,
            }}
          >
            <span style={{ fontSize: 'clamp(48px, 10vw, 72px)' }}>{'👕'}</span>
          </div>

          {/* Item name */}
          <div
            style={{
              fontSize: 'clamp(16px, 3vw, 22px)',
              fontWeight: 800,
              color: textColor,
              opacity: imgReveal,
            }}
          >
            {itemName}
          </div>

          {/* Price + date row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: 'clamp(24px, 5vw, 36px)',
                fontWeight: 900,
                color: accentColor,
              }}
            >
              ${displayPrice}
            </div>
            <div
              style={{
                fontSize: 'clamp(9px, 1.4vw, 12px)',
                fontWeight: 600,
                color: `${textColor}60`,
                opacity: priceProgress,
              }}
            >
              Drops {dropDate}
            </div>
          </div>

          {/* CTA button */}
          <div
            style={{
              background: accentColor,
              borderRadius: 'clamp(10px, 1.5vw, 12px)',
              padding: 'clamp(12px, 2vh, 16px)',
              textAlign: 'center',
              fontSize: 'clamp(12px, 2vw, 15px)',
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: 2,
              textTransform: 'uppercase',
              transform: `scale(${cartBtn})`,
              boxShadow: `0 4px 16px ${accentColor}40`,
            }}
          >
            GET NOTIFIED
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-merch-drop',
  title: 'Scene Merch Drop',
  description:
    'Merchandise drop announcement with product card, price counter, limited badge pulse, 3D tilt on hold, and notification CTA.',
  tags: ['scene', 'social-media', 'merch', 'merchandise', 'drop', 'ecommerce', 'creator', 'shop'],
  category: 'scene-layout',
  component: SceneMerchDropComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'itemName', label: 'Item Name', type: 'text', defaultValue: 'Creator Collection Hoodie', group: 'Content' },
    { key: 'price', label: 'Price', type: 'number', defaultValue: 49.99, min: 0, max: 99999, group: 'Content' },
    { key: 'dropDate', label: 'Drop Date', type: 'text', defaultValue: 'Friday', group: 'Content' },
    { key: 'limited', label: 'Limited Edition', type: 'boolean', defaultValue: true, group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#F43F5E', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A14', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
  defaultConfig: {
    itemName: 'Creator Collection Hoodie',
    price: 49.99,
    dropDate: 'Friday',
    limited: true,
    accentColor: '#F43F5E',
    cardColor: '#1A1A2E',
    bgColor: '#0A0A14',
    textColor: '#FFFFFF',
  },
})
