import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PricingCardConfig {
  planName: string
  price: number
  period: string
  features: string[]
  showBadge: boolean
  accentColor: string
  cardColor: string
  bgColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function easeInCubic(t: number): number {
  return t * t * t
}

function ScenePricingCardComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<PricingCardConfig>) {
  const { planName, price, period, features, showBadge, accentColor, cardColor, bgColor } = config
  const progress = frame / durationInFrames

  // Phase breakdown
  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Card scales up with elastic
  const cardScale = elasticOut(Math.min(1, enterProgress / 0.5))

  // Price counting up
  const priceProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.4)))
  const displayPrice = Math.round(priceProgress * price)

  // Features stagger in
  const getFeatureProgress = (idx: number): number => {
    const featureStart = 0.45 + idx * 0.08
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - featureStart) / 0.2)))
  }

  // Badge pop
  const badgeScale = showBadge ? elasticOut(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.2))) : 0

  // Hold: subtle shadow pulse
  const shadowIntensity = 20 + Math.sin(holdProgress * Math.PI * 4) * 8

  // Exit: card scales down
  const exitEased = easeInCubic(exitProgress)
  const exitScale = 1 - exitEased * 0.3
  const exitOpacity = 1 - exitEased

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
      {/* Card */}
      <div
        style={{
          position: 'relative',
          background: cardColor,
          borderRadius: 'clamp(16px, 2.5vw, 28px)',
          padding: 'clamp(28px, 5%, 48px) clamp(24px, 4%, 40px)',
          maxWidth: 380,
          width: '100%',
          boxShadow: `0 ${shadowIntensity}px ${shadowIntensity * 2}px rgba(0,0,0,0.15)`,
          transform: `scale(${cardScale * exitScale})`,
          opacity: exitOpacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(12px, 2vh, 20px)',
          border: `2px solid ${accentColor}20`,
        }}
      >
        {/* Popular badge */}
        {showBadge && (
          <div
            style={{
              position: 'absolute',
              top: -12,
              right: 20,
              background: accentColor,
              color: '#FFFFFF',
              fontSize: 'clamp(9px, 1.4vw, 12px)',
              fontWeight: 800,
              padding: '5px 14px',
              borderRadius: 20,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              transform: `scale(${badgeScale})`,
              boxShadow: `0 4px 12px ${accentColor}50`,
            }}
          >
            POPULAR
          </div>
        )}

        {/* Plan name */}
        <div
          style={{
            fontSize: 'clamp(12px, 2vw, 16px)',
            fontWeight: 700,
            color: accentColor,
            letterSpacing: 3,
            textTransform: 'uppercase',
            opacity: easeOutCubic(Math.min(1, enterProgress / 0.3)),
          }}
        >
          {planName}
        </div>

        {/* Price */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 4,
          }}
        >
          <span
            style={{
              fontSize: 'clamp(14px, 2.5vw, 20px)',
              fontWeight: 700,
              color: `${cardColor === '#FFFFFF' ? '#333' : '#ccc'}`,
            }}
          >
            $
          </span>
          <span
            style={{
              fontSize: 'clamp(40px, 8vw, 72px)',
              fontWeight: 900,
              color: cardColor === '#FFFFFF' ? '#1A1A2E' : '#FFFFFF',
              lineHeight: 1,
            }}
          >
            {displayPrice}
          </span>
          <span
            style={{
              fontSize: 'clamp(12px, 2vw, 16px)',
              fontWeight: 500,
              color: `${cardColor === '#FFFFFF' ? '#666' : '#999'}`,
            }}
          >
            /{period}
          </span>
        </div>

        {/* Divider */}
        <div
          style={{
            width: '80%',
            height: 1,
            background: `${cardColor === '#FFFFFF' ? '#E5E7EB' : '#333'}`,
          }}
        />

        {/* Features */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(8px, 1.5vh, 14px)',
            width: '100%',
          }}
        >
          {features.map((feature, i) => {
            const fp = getFeatureProgress(i)
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(8px, 1.5vw, 14px)',
                  opacity: fp,
                  transform: `translateX(${(1 - fp) * 20}px)`,
                }}
              >
                <div
                  style={{
                    width: 'clamp(18px, 3vw, 24px)',
                    height: 'clamp(18px, 3vw, 24px)',
                    borderRadius: '50%',
                    background: `${accentColor}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 'clamp(10px, 1.6vw, 14px)',
                    color: accentColor,
                    fontWeight: 700,
                  }}
                >
                  {'\u2713'}
                </div>
                <div
                  style={{
                    fontSize: 'clamp(12px, 2vw, 16px)',
                    fontWeight: 500,
                    color: cardColor === '#FFFFFF' ? '#4A4A5A' : '#CCCCDD',
                  }}
                >
                  {feature}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-pricing-card',
  title: 'Scene Pricing Card',
  description:
    'Pricing card with elastic scale-in, counting price, staggered feature checkmarks, and popular badge',
  tags: ['scene', 'brand', 'pricing', 'plan', 'subscription', 'business'],
  category: 'scene-layout',
  component: ScenePricingCardComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'planName', label: 'Plan Name', type: 'text', defaultValue: 'Pro Plan', group: 'Content' },
    { key: 'price', label: 'Price', type: 'number', defaultValue: 29, min: 0, max: 9999, group: 'Content' },
    { key: 'period', label: 'Period', type: 'text', defaultValue: 'mo', group: 'Content' },
    {
      key: 'features',
      label: 'Features',
      type: 'text-array',
      defaultValue: ['Unlimited projects', 'Priority support', 'Advanced analytics', 'Custom integrations'],
      group: 'Content',
    },
    { key: 'showBadge', label: 'Show Popular Badge', type: 'boolean', defaultValue: true, group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#6366F1', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F172A', group: 'Style' },
  ],
  defaultConfig: {
    planName: 'Pro Plan',
    price: 29,
    period: 'mo',
    features: ['Unlimited projects', 'Priority support', 'Advanced analytics', 'Custom integrations'],
    showBadge: true,
    accentColor: '#6366F1',
    cardColor: '#FFFFFF',
    bgColor: '#0F172A',
  },
})
