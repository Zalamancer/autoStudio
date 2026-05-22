import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PropertyListingConfig {
  address: string
  price: number
  bedrooms: number
  bathrooms: number
  sqft: number
  tagText: string
  bgColor: string
  textColor: string
  accentColor: string
  priceColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function ScenePropertyListingComponent({ config, progress }: MotionGraphicProps<PropertyListingConfig>) {
  const { address, price, bedrooms, bathrooms, sqft, tagText, bgColor, textColor, accentColor, priceColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Card slides in from right
  const cardSlide = (1 - easeOutCubic(Math.min(1, enterProgress / 0.6))) * 120
  const cardOpacity = easeOutCubic(Math.min(1, enterProgress / 0.4))

  // Tag pops in with bounce
  const tagScale = enterProgress > 0.3
    ? easeOutBack(Math.min(1, (enterProgress - 0.3) / 0.4))
    : 0

  // Price counter
  const priceReveal = enterProgress > 0.2
    ? easeOutCubic(Math.min(1, (enterProgress - 0.2) / 0.5))
    : 0
  const displayPrice = Math.round(price * priceReveal)

  // Stats stagger in
  const getStatProgress = (idx: number): number => {
    const start = 0.4 + idx * 0.12
    return enterProgress > start
      ? easeOutCubic(Math.min(1, (enterProgress - start) / 0.3))
      : 0
  }

  // Address fades in
  const addressOpacity = easeOutCubic(Math.min(1, enterProgress / 0.5))
  const addressY = (1 - addressOpacity) * 15

  const stats = [
    { icon: '\uD83D\uDECF\uFE0F', value: bedrooms, label: 'Beds' },
    { icon: '\uD83D\uDEBF', value: bathrooms, label: 'Baths' },
    { icon: '\uD83D\uDCD0', value: sqft, label: 'Sq Ft' },
  ]

  const formatPrice = (v: number): string => {
    if (v >= 1000000) return `$${(v / 1000000).toFixed(v % 1000000 === 0 ? 0 : 1)}M`
    if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`
    return `$${v.toLocaleString()}`
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      {/* Subtle gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${accentColor}08 0%, transparent 60%, ${accentColor}05 100%)` }} />

      {/* Decorative line */}
      <div style={{
        position: 'absolute',
        top: '8%',
        left: '8%',
        width: `${easeOutCubic(Math.min(1, enterProgress / 0.5)) * 30}%`,
        height: 2,
        background: accentColor,
        opacity: exitOpacity,
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '10% 8%',
        opacity: exitOpacity,
        transform: `translateX(${cardSlide - exitEased * 80}px)`,
      }}>
        {/* FOR SALE tag */}
        <div style={{
          alignSelf: 'flex-start',
          background: accentColor,
          color: '#FFFFFF',
          padding: 'clamp(4px, 0.8vw, 8px) clamp(12px, 2vw, 20px)',
          borderRadius: 4,
          fontSize: 'clamp(10px, 1.6vw, 14px)',
          fontWeight: 800,
          letterSpacing: 2,
          textTransform: 'uppercase',
          transform: `scale(${tagScale})`,
          transformOrigin: 'left center',
          marginBottom: 'clamp(12px, 2vw, 20px)',
          opacity: cardOpacity,
        }}>
          {tagText}
        </div>

        {/* Price */}
        <div style={{
          fontSize: 'clamp(32px, 7vw, 64px)',
          fontWeight: 900,
          color: priceColor,
          lineHeight: 1.1,
          opacity: cardOpacity,
          marginBottom: 'clamp(4px, 1vw, 10px)',
          letterSpacing: -1,
        }}>
          {formatPrice(displayPrice)}
        </div>

        {/* Address */}
        <div style={{
          fontSize: 'clamp(14px, 2.5vw, 22px)',
          fontWeight: 500,
          color: `${textColor}CC`,
          opacity: addressOpacity,
          transform: `translateY(${addressY}px)`,
          marginBottom: 'clamp(20px, 4vw, 36px)',
        }}>
          {address}
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex',
          gap: 'clamp(16px, 4vw, 40px)',
        }}>
          {stats.map((stat, i) => {
            const sp = getStatProgress(i)
            return (
              <div key={i} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                opacity: sp,
                transform: `translateY(${(1 - sp) * 20}px)`,
              }}>
                <div style={{ fontSize: 'clamp(18px, 3.5vw, 32px)', marginBottom: 4 }}>{stat.icon}</div>
                <div style={{
                  fontSize: 'clamp(18px, 3.5vw, 32px)',
                  fontWeight: 800,
                  color: textColor,
                }}>
                  {stat.label === 'Sq Ft' ? Math.round(stat.value * sp).toLocaleString() : Math.round(stat.value * sp)}
                </div>
                <div style={{
                  fontSize: 'clamp(10px, 1.5vw, 13px)',
                  fontWeight: 500,
                  color: `${textColor}88`,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}>
                  {stat.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom accent bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        background: `linear-gradient(90deg, ${accentColor}, ${priceColor})`,
        transform: `scaleX(${easeOutCubic(Math.min(1, enterProgress / 0.6))})`,
        transformOrigin: 'left',
        opacity: exitOpacity,
      }} />
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-property-listing',
  title: 'Property Listing',
  description: 'Luxury property card with animated price counter, bed/bath/sqft stats, and FOR SALE tag. Dark blue and gold aesthetic.',
  tags: ['scene', 'real-estate', 'property', 'listing', 'price', 'luxury'],
  category: 'scene-layout',
  component: ScenePropertyListingComponent as any,
  defaultConfig: {
    address: '1234 Sunset Blvd, Beverly Hills, CA 90210',
    price: 2450000,
    bedrooms: 4,
    bathrooms: 3,
    sqft: 3200,
    tagText: 'FOR SALE',
    bgColor: '#0A1628',
    textColor: '#E8E0D0',
    accentColor: '#C9A84C',
    priceColor: '#F0D78C',
  },
  configSchema: [
    { key: 'address', label: 'Address', type: 'text', defaultValue: '1234 Sunset Blvd, Beverly Hills, CA 90210', group: 'Content' },
    { key: 'price', label: 'Price ($)', type: 'number', defaultValue: 2450000, min: 0, max: 100000000, group: 'Content' },
    { key: 'bedrooms', label: 'Bedrooms', type: 'number', defaultValue: 4, min: 0, max: 20, group: 'Content' },
    { key: 'bathrooms', label: 'Bathrooms', type: 'number', defaultValue: 3, min: 0, max: 20, group: 'Content' },
    { key: 'sqft', label: 'Square Feet', type: 'number', defaultValue: 3200, min: 0, max: 100000, group: 'Content' },
    { key: 'tagText', label: 'Tag Text', type: 'text', defaultValue: 'FOR SALE', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A1628', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8E0D0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#C9A84C', group: 'Style' },
    { key: 'priceColor', label: 'Price Color', type: 'color', defaultValue: '#F0D78C', group: 'Style' },
  ],
})
