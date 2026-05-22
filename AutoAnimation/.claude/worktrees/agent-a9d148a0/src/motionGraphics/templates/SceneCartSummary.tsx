import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CartSummaryConfig {
  item1Name: string
  item1Price: number
  item2Name: string
  item2Price: number
  item3Name: string
  item3Price: number
  shippingCost: number
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

function SceneCartSummaryComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<CartSummaryConfig>) {
  const { item1Name, item1Price, item2Name, item2Price, item3Name, item3Price, shippingCost, bgColor, cardColor, accentColor, textColor } = config
  const progress = frame / durationInFrames

  const items = [
    { name: item1Name, price: item1Price },
    { name: item2Name, price: item2Price },
    { name: item3Name, price: item3Price },
  ]
  const subtotal = items.reduce((sum, item) => sum + item.price, 0)
  const total = subtotal + shippingCost

  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Header slides in
  const headerProgress = easeOutCubic(Math.min(1, enterProgress / 0.25))

  // Items stagger in from left
  const getItemProgress = (idx: number): number => {
    const start = 0.15 + idx * 0.12
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.2)))
  }

  // Divider draws
  const dividerProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.15)))

  // Totals appear
  const totalsProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.65) / 0.2)))
  const totalCountProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.25)))
  const displayTotal = (totalCountProgress * total).toFixed(2)

  // Checkout button
  const checkoutProgress = elasticOut(Math.max(0, Math.min(1, (enterProgress - 0.85) / 0.15)))

  // Hold: button glows
  const buttonGlow = 8 + Math.sin(holdProgress * Math.PI * 5) * 6

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitY = exitEased * -60

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
          borderRadius: 'clamp(14px, 2vw, 22px)',
          padding: 'clamp(20px, 4%, 36px)',
          maxWidth: 400,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(10px, 2vh, 18px)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          transform: `translateY(${exitY}px)`,
          opacity: exitOpacity,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 12px)',
            opacity: headerProgress,
            transform: `translateX(${(1 - headerProgress) * -30}px)`,
          }}
        >
          <span style={{ fontSize: 'clamp(18px, 3vw, 26px)' }}>{'🛒'}</span>
          <span
            style={{
              fontSize: 'clamp(16px, 2.5vw, 22px)',
              fontWeight: 800,
              color: textColor,
              letterSpacing: 1,
            }}
          >
            Your Cart ({items.length})
          </span>
        </div>

        {/* Cart items */}
        {items.map((item, i) => {
          const ip = getItemProgress(i)
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                opacity: ip,
                transform: `translateX(${(1 - ip) * -40}px)`,
                padding: 'clamp(6px, 1vh, 10px) 0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 14px)' }}>
                <div
                  style={{
                    width: 'clamp(32px, 5vw, 44px)',
                    height: 'clamp(32px, 5vw, 44px)',
                    borderRadius: 8,
                    background: `${accentColor}12`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'clamp(14px, 2vw, 20px)',
                  }}
                >
                  {'📦'}
                </div>
                <span
                  style={{
                    fontSize: 'clamp(12px, 2vw, 16px)',
                    fontWeight: 600,
                    color: textColor,
                  }}
                >
                  {item.name}
                </span>
              </div>
              <span
                style={{
                  fontSize: 'clamp(12px, 2vw, 16px)',
                  fontWeight: 700,
                  color: textColor,
                }}
              >
                ${item.price.toFixed(2)}
              </span>
            </div>
          )
        })}

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: `${textColor}20`,
            transform: `scaleX(${dividerProgress})`,
            transformOrigin: 'left center',
          }}
        />

        {/* Subtotal, shipping, total */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(6px, 1vh, 10px)',
            opacity: totalsProgress,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'clamp(11px, 1.8vw, 14px)', color: `${textColor}80`, fontWeight: 500 }}>Subtotal</span>
            <span style={{ fontSize: 'clamp(11px, 1.8vw, 14px)', color: `${textColor}80`, fontWeight: 500 }}>${subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'clamp(11px, 1.8vw, 14px)', color: `${textColor}80`, fontWeight: 500 }}>Shipping</span>
            <span style={{ fontSize: 'clamp(11px, 1.8vw, 14px)', color: shippingCost === 0 ? '#22C55E' : `${textColor}80`, fontWeight: 600 }}>
              {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: 'clamp(6px, 1vh, 10px)',
              borderTop: `1px solid ${textColor}15`,
            }}
          >
            <span style={{ fontSize: 'clamp(14px, 2.2vw, 18px)', color: textColor, fontWeight: 800 }}>Total</span>
            <span style={{ fontSize: 'clamp(14px, 2.2vw, 18px)', color: accentColor, fontWeight: 900 }}>${displayTotal}</span>
          </div>
        </div>

        {/* Checkout button */}
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
            transform: `scale(${checkoutProgress})`,
            boxShadow: `0 0 ${buttonGlow}px ${accentColor}60`,
          }}
        >
          CHECKOUT
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-cart-summary',
  title: 'Scene Cart Summary',
  description:
    'Shopping cart summary with staggered item reveal, counting total, and glowing checkout button',
  tags: ['scene', 'ecommerce', 'cart', 'shopping', 'checkout', 'order', 'summary'],
  category: 'scene-layout',
  component: SceneCartSummaryComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'item1Name', label: 'Item 1 Name', type: 'text', defaultValue: 'Wireless Earbuds', group: 'Content' },
    { key: 'item1Price', label: 'Item 1 Price', type: 'number', defaultValue: 29.99, min: 0, max: 99999, group: 'Content' },
    { key: 'item2Name', label: 'Item 2 Name', type: 'text', defaultValue: 'Phone Case', group: 'Content' },
    { key: 'item2Price', label: 'Item 2 Price', type: 'number', defaultValue: 14.99, min: 0, max: 99999, group: 'Content' },
    { key: 'item3Name', label: 'Item 3 Name', type: 'text', defaultValue: 'USB-C Cable', group: 'Content' },
    { key: 'item3Price', label: 'Item 3 Price', type: 'number', defaultValue: 9.99, min: 0, max: 99999, group: 'Content' },
    { key: 'shippingCost', label: 'Shipping Cost', type: 'number', defaultValue: 0, min: 0, max: 999, group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#10B981', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F172A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1E293B', group: 'Style' },
  ],
  defaultConfig: {
    item1Name: 'Wireless Earbuds',
    item1Price: 29.99,
    item2Name: 'Phone Case',
    item2Price: 14.99,
    item3Name: 'USB-C Cable',
    item3Price: 9.99,
    shippingCost: 0,
    accentColor: '#10B981',
    cardColor: '#FFFFFF',
    bgColor: '#0F172A',
    textColor: '#1E293B',
  },
})
