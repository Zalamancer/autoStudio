import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PriceReductionConfig {
  headerText: string
  originalPrice: number
  newPrice: number
  address: string
  bgColor: string
  textColor: string
  accentColor: string
  highlightColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function ScenePriceReductionComponent({ config, progress }: MotionGraphicProps<PriceReductionConfig>) {
  const { headerText, originalPrice, newPrice, address, bgColor, textColor, accentColor, highlightColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Header slides down
  const headerSlide = enterProgress < 0.4
    ? easeOutBack(enterProgress / 0.4)
    : 1
  const headerY = (1 - headerSlide) * -40

  // Original price appears then gets crossed out
  const origPriceOpacity = enterProgress > 0.2
    ? easeOutCubic(Math.min(1, (enterProgress - 0.2) / 0.2))
    : 0
  const strikeProgress = enterProgress > 0.4
    ? easeOutCubic(Math.min(1, (enterProgress - 0.4) / 0.2))
    : 0

  // New price counts up
  const newPriceReveal = enterProgress > 0.5
    ? easeOutCubic(Math.min(1, (enterProgress - 0.5) / 0.3))
    : 0
  const displayNewPrice = Math.round(newPrice * newPriceReveal)

  // Savings badge pops
  const savingsReveal = enterProgress > 0.7
    ? easeOutBack(Math.min(1, (enterProgress - 0.7) / 0.3))
    : 0

  // Address
  const addressReveal = enterProgress > 0.6
    ? easeOutCubic(Math.min(1, (enterProgress - 0.6) / 0.3))
    : 0

  const savings = originalPrice - newPrice
  const savingsPct = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0

  const formatPrice = (v: number): string => {
    if (v >= 1000000) return `$${(v / 1000000).toFixed(v % 100000 === 0 ? 1 : 2)}M`
    if (v >= 1000) return `$${Math.round(v / 1000).toLocaleString()}K`
    return `$${v.toLocaleString()}`
  }

  // Urgency pulse during hold
  const pulseScale = holdProgress > 0 ? 1 + Math.sin(holdProgress * Math.PI * 6) * 0.02 : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      {/* Red accent stripe at top */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 'clamp(4px, 0.8vw, 6px)',
        background: accentColor,
        transform: `scaleX(${easeOutCubic(Math.min(1, enterProgress / 0.3))})`,
        transformOrigin: 'left',
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8%',
        opacity: exitOpacity,
        transform: `translateY(${exitEased * -40}px)`,
      }}>
        {/* Header badge */}
        <div style={{
          background: accentColor,
          color: '#FFFFFF',
          padding: 'clamp(6px, 1.2vw, 10px) clamp(16px, 3vw, 28px)',
          borderRadius: 6,
          fontSize: 'clamp(14px, 2.5vw, 22px)',
          fontWeight: 900,
          letterSpacing: 3,
          textTransform: 'uppercase',
          opacity: headerSlide,
          transform: `translateY(${headerY}px)`,
          marginBottom: 'clamp(24px, 5vw, 40px)',
          boxShadow: `0 4px 20px ${accentColor}40`,
        }}>
          {headerText}
        </div>

        {/* Original price with strikethrough */}
        <div style={{
          position: 'relative',
          fontSize: 'clamp(18px, 3.5vw, 30px)',
          fontWeight: 600,
          color: `${textColor}77`,
          opacity: origPriceOpacity,
          marginBottom: 'clamp(8px, 1.5vw, 14px)',
        }}>
          {formatPrice(originalPrice)}
          {/* Animated strikethrough line */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '-4%',
            width: `${strikeProgress * 108}%`,
            height: 3,
            background: accentColor,
            transform: 'rotate(-5deg)',
          }} />
        </div>

        {/* New price */}
        <div style={{
          fontSize: 'clamp(36px, 8vw, 68px)',
          fontWeight: 900,
          color: highlightColor,
          lineHeight: 1.1,
          opacity: newPriceReveal,
          transform: `scale(${pulseScale})`,
          marginBottom: 'clamp(12px, 2.5vw, 22px)',
          textShadow: `0 0 40px ${highlightColor}30`,
        }}>
          {formatPrice(displayNewPrice)}
        </div>

        {/* Savings percentage badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(6px, 1.2vw, 10px)',
          background: `${highlightColor}15`,
          border: `1px solid ${highlightColor}30`,
          padding: 'clamp(6px, 1vw, 10px) clamp(14px, 2.5vw, 22px)',
          borderRadius: 24,
          opacity: savingsReveal,
          transform: `scale(${savingsReveal})`,
          marginBottom: 'clamp(20px, 4vw, 36px)',
        }}>
          <div style={{
            fontSize: 'clamp(14px, 2.2vw, 20px)',
            fontWeight: 800,
            color: highlightColor,
          }}>
            SAVE {savingsPct}%
          </div>
          <div style={{
            fontSize: 'clamp(11px, 1.6vw, 14px)',
            fontWeight: 500,
            color: `${textColor}AA`,
          }}>
            ({formatPrice(savings)} off)
          </div>
        </div>

        {/* Address */}
        <div style={{
          fontSize: 'clamp(12px, 2vw, 18px)',
          fontWeight: 500,
          color: `${textColor}BB`,
          textAlign: 'center',
          opacity: addressReveal,
          transform: `translateY(${(1 - addressReveal) * 15}px)`,
        }}>
          {address}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-price-reduction',
  title: 'Price Reduction',
  description: 'Price drop alert with animated strikethrough on original price, counting new price, and savings percentage badge. Urgency-driven design.',
  tags: ['scene', 'real-estate', 'price', 'reduction', 'deal', 'property'],
  category: 'scene-layout',
  component: ScenePriceReductionComponent as any,
  defaultConfig: {
    headerText: 'PRICE REDUCED!',
    originalPrice: 899000,
    newPrice: 799000,
    address: '321 Pine Street, Austin, TX 78701',
    bgColor: '#0F0A14',
    textColor: '#D4D0E0',
    accentColor: '#E53E3E',
    highlightColor: '#48BB78',
  },
  configSchema: [
    { key: 'headerText', label: 'Header Text', type: 'text', defaultValue: 'PRICE REDUCED!', group: 'Content' },
    { key: 'originalPrice', label: 'Original Price ($)', type: 'number', defaultValue: 899000, min: 0, max: 100000000, group: 'Content' },
    { key: 'newPrice', label: 'New Price ($)', type: 'number', defaultValue: 799000, min: 0, max: 100000000, group: 'Content' },
    { key: 'address', label: 'Address', type: 'text', defaultValue: '321 Pine Street, Austin, TX 78701', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F0A14', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#D4D0E0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#E53E3E', group: 'Style' },
    { key: 'highlightColor', label: 'Highlight Color', type: 'color', defaultValue: '#48BB78', group: 'Style' },
  ],
})
