import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SalesBannerConfig {
  headerText: string
  discountText: string
  promoCode: string
  ribbonColor: string
  bgColor: string
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

// Deterministic pseudo-random
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function SceneSalesBannerComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<SalesBannerConfig>) {
  const { headerText, discountText, promoCode, ribbonColor, bgColor, textColor } = config
  const progress = frame / durationInFrames

  // Phase breakdown
  const enterEnd = 0.25
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Ribbon slides in diagonally
  const ribbonSlide = easeOutCubic(Math.min(1, enterProgress / 0.4))

  // Discount text pops
  const discountScale = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.35)))
  const discountOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.25)))

  // Promo code reveals left-to-right
  const promoReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.35)))

  // Hold: discount pulse, sparkle on header
  const discountPulse = 1 + Math.sin(holdProgress * Math.PI * 5) * 0.03

  // Sparkle dots on header area
  const sparkleCount = 6
  const sparkles = Array.from({ length: sparkleCount }).map((_, i) => {
    const seed = i * 13 + 7
    const x = 15 + seededRandom(seed) * 70
    const y = 5 + seededRandom(seed + 1) * 20
    const sparklePhase = (holdProgress * 3 + seededRandom(seed + 2)) % 1
    const sparkleOpacity = Math.sin(sparklePhase * Math.PI) * 0.8
    const sparkleSize = 2 + seededRandom(seed + 3) * 3
    return { x, y, opacity: sparkleOpacity, size: sparkleSize }
  })

  // Exit: ribbon retracts, text fades
  const exitEased = easeInCubic(exitProgress)
  const ribbonRetract = 1 - exitEased
  const exitOpacity = 1 - exitEased

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6%',
      }}
    >
      {/* Diagonal ribbon - top left to across */}
      <div
        style={{
          position: 'absolute',
          top: 'clamp(40px, 8%, 80px)',
          left: '-5%',
          right: '-5%',
          height: 'clamp(36px, 6vh, 52px)',
          background: ribbonColor,
          transform: `rotate(-5deg) scaleX(${ribbonSlide * ribbonRetract})`,
          transformOrigin: 'left center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 20px ${ribbonColor}40`,
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontSize: 'clamp(12px, 2vw, 18px)',
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: 4,
            textTransform: 'uppercase',
            opacity: ribbonSlide > 0.7 ? 1 : 0,
          }}
        >
          {headerText}
        </div>
      </div>

      {/* Sparkles over header */}
      {holdProgress > 0 && sparkles.map((sp, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${sp.x}%`,
            top: `${sp.y}%`,
            width: sp.size,
            height: sp.size,
            borderRadius: '50%',
            background: '#FFFFFF',
            opacity: sp.opacity * exitOpacity,
            pointerEvents: 'none',
            zIndex: 3,
            boxShadow: `0 0 ${sp.size * 2}px #FFFFFF80`,
          }}
        />
      ))}

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(16px, 3vh, 32px)',
          opacity: exitOpacity,
          zIndex: 1,
        }}
      >
        {/* Discount text */}
        <div
          style={{
            fontSize: 'clamp(48px, 10vw, 96px)',
            fontWeight: 900,
            color: textColor,
            transform: `scale(${discountScale * discountPulse})`,
            opacity: discountOpacity,
            lineHeight: 1,
            textAlign: 'center',
            textShadow: `0 2px 20px ${ribbonColor}30`,
          }}
        >
          {discountText}
        </div>

        {/* Promo code */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 14px)',
            opacity: promoReveal,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(11px, 1.8vw, 14px)',
              fontWeight: 500,
              color: `${textColor}99`,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            USE CODE
          </div>
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              padding: 'clamp(6px, 1vh, 12px) clamp(14px, 2.5vw, 24px)',
              border: `2px dashed ${ribbonColor}`,
              borderRadius: 8,
            }}
          >
            {/* Reveal mask */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: `${(1 - promoReveal) * 100}%`,
                background: bgColor,
                zIndex: 1,
              }}
            />
            <div
              style={{
                fontSize: 'clamp(14px, 2.5vw, 22px)',
                fontWeight: 800,
                color: ribbonColor,
                letterSpacing: 3,
                fontFamily: "'Courier New', monospace",
              }}
            >
              {promoCode}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-sales-banner',
  title: 'Scene Sales Banner',
  description:
    'Sales promotional banner with diagonal ribbon, popping discount text, promo code reveal, and sparkle effects',
  tags: ['scene', 'brand', 'sale', 'discount', 'promo', 'flash-sale', 'business'],
  category: 'scene-layout',
  component: SceneSalesBannerComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'headerText', label: 'Header Text', type: 'text', defaultValue: 'FLASH SALE', group: 'Content' },
    { key: 'discountText', label: 'Discount Text', type: 'text', defaultValue: '70% OFF', group: 'Content' },
    { key: 'promoCode', label: 'Promo Code', type: 'text', defaultValue: 'SAVE70', group: 'Content' },
    { key: 'ribbonColor', label: 'Ribbon Color', type: 'color', defaultValue: '#EF4444', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A14', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
  defaultConfig: {
    headerText: 'FLASH SALE',
    discountText: '70% OFF',
    promoCode: 'SAVE70',
    ribbonColor: '#EF4444',
    bgColor: '#0A0A14',
    textColor: '#FFFFFF',
  },
})
