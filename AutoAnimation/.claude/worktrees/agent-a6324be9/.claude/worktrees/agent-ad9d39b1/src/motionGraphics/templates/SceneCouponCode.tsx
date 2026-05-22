import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CouponCodeConfig {
  discountText: string
  couponCode: string
  description: string
  bgColor: string
  couponColor: string
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

function SceneCouponCodeComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<CouponCodeConfig>) {
  const { discountText, couponCode, description, bgColor, couponColor, accentColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Coupon tears in from sides
  const tearProgress = easeOutCubic(Math.min(1, enterProgress / 0.4))
  const leftTear = tearProgress
  const rightTear = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.05) / 0.4)))

  // Scissors icon
  const scissorsProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.3)))
  const scissorsX = -20 + scissorsProgress * 120

  // Discount text appears
  const discountProgress = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.3)))

  // Description fades in
  const descProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.25)))

  // Code reveals character by character
  const codeRevealProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.3)))
  const visibleCodeChars = Math.floor(codeRevealProgress * couponCode.length)

  // Copy hint
  const copyProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.85) / 0.15)))

  // Hold: code highlight pulses
  const codePulse = Math.sin(holdProgress * Math.PI * 5) > 0.3 ? 1 : 0.85

  // Dashed border animation
  const dashOffset = holdProgress * 40

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.15

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
      {/* Scissors */}
      <div
        style={{
          position: 'absolute',
          left: `${scissorsX}%`,
          top: '50%',
          transform: 'translateY(-50%) rotate(0deg)',
          fontSize: 'clamp(20px, 3.5vw, 32px)',
          opacity: scissorsProgress < 1 ? scissorsProgress : Math.max(0, 1 - (enterProgress - 0.4) * 3),
          zIndex: 5,
        }}
      >
        {'✂️'}
      </div>

      <div
        style={{
          transform: `scale(${exitScale})`,
          opacity: exitOpacity,
          width: '100%',
          maxWidth: 420,
        }}
      >
        {/* Coupon card */}
        <div
          style={{
            position: 'relative',
            background: couponColor,
            borderRadius: 'clamp(12px, 2vw, 20px)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 'clamp(28px, 5%, 48px) clamp(20px, 4%, 36px)',
            gap: 'clamp(12px, 2vh, 20px)',
          }}
        >
          {/* Dashed border (inner) */}
          <div
            style={{
              position: 'absolute',
              inset: 'clamp(6px, 1%, 10px)',
              border: `2px dashed ${accentColor}60`,
              borderRadius: 'clamp(8px, 1.5vw, 14px)',
              pointerEvents: 'none',
              opacity: tearProgress,
            }}
          />

          {/* Circle cutouts on sides */}
          <div
            style={{
              position: 'absolute',
              left: -12,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: bgColor,
              opacity: leftTear,
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: -12,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: bgColor,
              opacity: rightTear,
            }}
          />

          {/* Discount text */}
          <div
            style={{
              fontSize: 'clamp(32px, 7vw, 60px)',
              fontWeight: 900,
              color: accentColor,
              lineHeight: 1,
              transform: `scale(${discountProgress})`,
              textAlign: 'center',
            }}
          >
            {discountText}
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: 'clamp(12px, 2vw, 16px)',
              fontWeight: 500,
              color: `${textColor}AA`,
              textAlign: 'center',
              opacity: descProgress,
              transform: `translateY(${(1 - descProgress) * 10}px)`,
            }}
          >
            {description}
          </div>

          {/* Dotted separator */}
          <div
            style={{
              width: '80%',
              borderTop: `2px dashed ${textColor}25`,
              opacity: descProgress,
            }}
          />

          {/* Code box */}
          <div
            style={{
              position: 'relative',
              background: `${accentColor}12`,
              border: `2px dashed ${accentColor}50`,
              borderRadius: 'clamp(6px, 1vw, 10px)',
              padding: 'clamp(10px, 1.8vh, 16px) clamp(20px, 3.5vw, 36px)',
              opacity: codePulse,
            }}
          >
            <div
              style={{
                fontSize: 'clamp(20px, 4vw, 32px)',
                fontWeight: 900,
                color: accentColor,
                letterSpacing: 4,
                fontFamily: "'Courier New', monospace",
                textAlign: 'center',
              }}
            >
              {couponCode.slice(0, visibleCodeChars)}
              {visibleCodeChars < couponCode.length && (
                <span style={{ opacity: 0.3 }}>
                  {couponCode.slice(visibleCodeChars).replace(/./g, '•')}
                </span>
              )}
            </div>
          </div>

          {/* Copy code hint */}
          <div
            style={{
              fontSize: 'clamp(10px, 1.5vw, 13px)',
              fontWeight: 600,
              color: `${textColor}70`,
              opacity: copyProgress,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            {'📋'} TAP TO COPY CODE
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-coupon-code',
  title: 'Scene Coupon Code',
  description:
    'Coupon card with scissors tear-in, dashed border aesthetic, character-by-character code reveal, and circle cutouts',
  tags: ['scene', 'ecommerce', 'coupon', 'promo', 'discount', 'code', 'shopping', 'deal'],
  category: 'scene-layout',
  component: SceneCouponCodeComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'discountText', label: 'Discount Text', type: 'text', defaultValue: '25% OFF', group: 'Content' },
    { key: 'couponCode', label: 'Coupon Code', type: 'text', defaultValue: 'SAVE25NOW', group: 'Content' },
    { key: 'description', label: 'Description', type: 'text', defaultValue: 'On your next purchase of $50+', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#E11D48', group: 'Style' },
    { key: 'couponColor', label: 'Coupon Color', type: 'color', defaultValue: '#FFF7ED', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F172A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1E293B', group: 'Style' },
  ],
  defaultConfig: {
    discountText: '25% OFF',
    couponCode: 'SAVE25NOW',
    description: 'On your next purchase of $50+',
    accentColor: '#E11D48',
    couponColor: '#FFF7ED',
    bgColor: '#0F172A',
    textColor: '#1E293B',
  },
})
