import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FlashSaleConfig {
  discountPercent: number
  productName: string
  countdownMinutes: number
  bgColor: string
  accentColor: string
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

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function SceneFlashSaleComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<FlashSaleConfig>) {
  const { discountPercent, productName, countdownMinutes, bgColor, accentColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.25
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Lightning bolts zap in
  const lightningProgress = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Discount slams in
  const discountSlam = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.35)))
  const discountCount = Math.round(easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.4))) * discountPercent)

  // Product name fades in
  const nameProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3)))

  // Countdown appears
  const countdownProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.65) / 0.3)))

  // Hold: pulsing border, discount throb
  const borderPulse = 2 + Math.sin(holdProgress * Math.PI * 8) * 2
  const discountPulse = 1 + Math.sin(holdProgress * Math.PI * 6) * 0.04

  // Lightning flashes during hold
  const lightningFlash = Math.sin(holdProgress * Math.PI * 12) > 0.7 ? 0.15 : 0

  // Countdown ticking
  const countdownSeconds = Math.max(0, countdownMinutes * 60 - Math.floor(holdProgress * 120))
  const mins = Math.floor(countdownSeconds / 60)
  const secs = countdownSeconds % 60

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.2

  // Sparkle particles
  const sparkles = Array.from({ length: 8 }).map((_, i) => {
    const seed = i * 17 + 3
    const x = 10 + seededRandom(seed) * 80
    const y = 10 + seededRandom(seed + 1) * 80
    const phase = (holdProgress * 4 + seededRandom(seed + 2)) % 1
    const opacity = Math.sin(phase * Math.PI) * 0.7
    return { x, y, opacity }
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
      }}
    >
      {/* Pulsing border */}
      <div
        style={{
          position: 'absolute',
          inset: 'clamp(8px, 1.5%, 16px)',
          border: `${borderPulse}px solid ${accentColor}`,
          borderRadius: 'clamp(12px, 2vw, 20px)',
          opacity: exitOpacity * 0.8,
          pointerEvents: 'none',
        }}
      />

      {/* Lightning flash overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `${accentColor}`,
          opacity: lightningFlash * exitOpacity,
          pointerEvents: 'none',
        }}
      />

      {/* Sparkles */}
      {holdProgress > 0 && sparkles.map((sp, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${sp.x}%`,
            top: `${sp.y}%`,
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: '#FFFFFF',
            opacity: sp.opacity * exitOpacity,
            pointerEvents: 'none',
            boxShadow: '0 0 8px #FFFFFF80',
          }}
        />
      ))}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(12px, 2.5vh, 24px)',
          transform: `scale(${exitScale})`,
          opacity: exitOpacity,
        }}
      >
        {/* Flash sale header with lightning */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 14px)',
            opacity: lightningProgress,
            transform: `scaleX(${lightningProgress})`,
          }}
        >
          <span style={{ fontSize: 'clamp(20px, 4vw, 36px)' }}>{'⚡'}</span>
          <span
            style={{
              fontSize: 'clamp(16px, 3vw, 28px)',
              fontWeight: 900,
              color: accentColor,
              letterSpacing: 6,
              textTransform: 'uppercase',
            }}
          >
            FLASH SALE
          </span>
          <span style={{ fontSize: 'clamp(20px, 4vw, 36px)' }}>{'⚡'}</span>
        </div>

        {/* Massive discount */}
        <div
          style={{
            fontSize: 'clamp(56px, 14vw, 120px)',
            fontWeight: 900,
            color: textColor,
            lineHeight: 1,
            transform: `scale(${discountSlam * discountPulse})`,
            textShadow: `0 4px 24px ${accentColor}40`,
          }}
        >
          {discountCount}% OFF
        </div>

        {/* Product name */}
        <div
          style={{
            fontSize: 'clamp(14px, 2.5vw, 22px)',
            fontWeight: 600,
            color: `${textColor}CC`,
            opacity: nameProgress,
            transform: `translateY(${(1 - nameProgress) * 15}px)`,
            textAlign: 'center',
          }}
        >
          {productName}
        </div>

        {/* Countdown timer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1vw, 12px)',
            opacity: countdownProgress,
            transform: `translateY(${(1 - countdownProgress) * 20}px)`,
          }}
        >
          <span
            style={{
              fontSize: 'clamp(10px, 1.6vw, 14px)',
              fontWeight: 600,
              color: `${textColor}80`,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            ENDS IN
          </span>
          <div
            style={{
              display: 'flex',
              gap: 4,
            }}
          >
            {[String(mins).padStart(2, '0'), ':', String(secs).padStart(2, '0')].map((part, i) => (
              <span
                key={i}
                style={{
                  fontSize: 'clamp(18px, 3.5vw, 32px)',
                  fontWeight: 900,
                  color: accentColor,
                  fontFamily: "'Courier New', monospace",
                }}
              >
                {part}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-flash-sale',
  title: 'Scene Flash Sale',
  description:
    'Urgent flash sale banner with lightning bolts, slamming discount, countdown timer, pulsing border, and sparkle effects',
  tags: ['scene', 'ecommerce', 'sale', 'flash-sale', 'discount', 'urgent', 'countdown', 'shopping'],
  category: 'scene-layout',
  component: SceneFlashSaleComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'discountPercent', label: 'Discount %', type: 'number', defaultValue: 50, min: 1, max: 99, group: 'Content' },
    { key: 'productName', label: 'Product Name', type: 'text', defaultValue: 'All Premium Items', group: 'Content' },
    { key: 'countdownMinutes', label: 'Countdown (min)', type: 'number', defaultValue: 30, min: 1, max: 1440, group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#EF4444', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A0F', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
  defaultConfig: {
    discountPercent: 50,
    productName: 'All Premium Items',
    countdownMinutes: 30,
    accentColor: '#EF4444',
    bgColor: '#0A0A0F',
    textColor: '#FFFFFF',
  },
})
