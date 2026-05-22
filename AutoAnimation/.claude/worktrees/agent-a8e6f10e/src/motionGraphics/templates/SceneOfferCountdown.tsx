import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OfferCountdownConfig {
  offerText: string
  discount: string
  countdownText: string
  urgentColor: string
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

function SceneOfferCountdownComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<OfferCountdownConfig>) {
  const { offerText, discount, countdownText, urgentColor, bgColor, textColor } = config
  const progress = frame / durationInFrames

  // Phase breakdown
  const enterEnd = 0.25
  const holdEnd = 0.82
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Discount number scales in with impact
  const discountScale = easeOutBack(Math.min(1, enterProgress / 0.4))
  const discountOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Offer text fades in
  const offerOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.3)))
  const offerY = (1 - offerOpacity) * 20

  // "ENDS IN" fades in
  const endsInOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.45) / 0.25)))

  // Countdown digits flip in
  const countdownDigits = countdownText.split('')
  const getDigitProgress = (idx: number): number => {
    const digitStart = 0.55 + idx * 0.025
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - digitStart) / 0.2)))
  }

  // Pulsing border
  const borderPulse = Math.sin(holdProgress * Math.PI * 6) * 0.5 + 0.5
  const borderOpacity = enterProgress > 0.5 ? 0.4 + borderPulse * 0.4 : 0

  // Hold: digits occasionally animate (subtle scale bump)
  const getDigitHoldBump = (idx: number): number => {
    const cycle = Math.sin(holdProgress * Math.PI * 8 + idx * 1.2)
    return cycle > 0.85 ? 1.08 : 1
  }

  // Exit: "EXPIRED" crossfade or slide away
  const exitEased = easeInCubic(exitProgress)
  const contentOpacity = 1 - exitEased
  const expiredOpacity = exitProgress > 0.1 ? easeOutCubic(Math.min(1, (exitProgress - 0.1) / 0.4)) : 0

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
      {/* Pulsing border frame */}
      <div
        style={{
          position: 'absolute',
          inset: 'clamp(8px, 1.5%, 16px)',
          border: `3px solid ${urgentColor}`,
          borderRadius: 'clamp(12px, 2vw, 20px)',
          opacity: borderOpacity,
          pointerEvents: 'none',
        }}
      />

      {/* Corner accents */}
      {[0, 1, 2, 3].map(corner => {
        const isTop = corner < 2
        const isLeft = corner % 2 === 0
        return (
          <div
            key={corner}
            style={{
              position: 'absolute',
              [isTop ? 'top' : 'bottom']: 'clamp(12px, 2%, 24px)',
              [isLeft ? 'left' : 'right']: 'clamp(12px, 2%, 24px)',
              width: 20,
              height: 20,
              borderTop: isTop ? `3px solid ${urgentColor}` : 'none',
              borderBottom: !isTop ? `3px solid ${urgentColor}` : 'none',
              borderLeft: isLeft ? `3px solid ${urgentColor}` : 'none',
              borderRight: !isLeft ? `3px solid ${urgentColor}` : 'none',
              opacity: borderOpacity,
            }}
          />
        )
      })}

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(10px, 2vh, 22px)',
          opacity: contentOpacity,
        }}
      >
        {/* Offer text */}
        <div
          style={{
            fontSize: 'clamp(12px, 2vw, 18px)',
            fontWeight: 600,
            color: `${textColor}CC`,
            opacity: offerOpacity,
            transform: `translateY(${offerY}px)`,
            letterSpacing: 2,
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          {offerText}
        </div>

        {/* Discount */}
        <div
          style={{
            fontSize: 'clamp(48px, 10vw, 96px)',
            fontWeight: 900,
            color: urgentColor,
            transform: `scale(${discountScale})`,
            opacity: discountOpacity,
            lineHeight: 1,
            textShadow: `0 0 30px ${urgentColor}30`,
          }}
        >
          {discount}
        </div>

        {/* ENDS IN label */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.6vw, 14px)',
            fontWeight: 700,
            color: `${textColor}99`,
            opacity: endsInOpacity,
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          ENDS IN
        </div>

        {/* Countdown */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {countdownDigits.map((digit, i) => {
            const dp = getDigitProgress(i)
            const holdBump = holdProgress > 0 ? getDigitHoldBump(i) : 1
            const isColon = digit === ':'

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: isColon ? 'clamp(12px, 2vw, 20px)' : 'clamp(28px, 5vw, 48px)',
                  height: isColon ? 'auto' : 'clamp(36px, 6vw, 56px)',
                  background: isColon ? 'transparent' : `${urgentColor}15`,
                  borderRadius: isColon ? 0 : 8,
                  fontSize: 'clamp(18px, 4vw, 32px)',
                  fontWeight: 800,
                  color: isColon ? `${textColor}60` : textColor,
                  opacity: dp,
                  transform: `scale(${dp * holdBump}) rotateX(${(1 - dp) * 90}deg)`,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {digit}
              </div>
            )
          })}
        </div>
      </div>

      {/* EXPIRED overlay on exit */}
      {exitProgress > 0.1 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: expiredOpacity,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(32px, 7vw, 64px)',
              fontWeight: 900,
              color: urgentColor,
              letterSpacing: 8,
              opacity: 0.8,
            }}
          >
            EXPIRED
          </div>
        </div>
      )}
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-offer-countdown',
  title: 'Scene Offer Countdown',
  description:
    'Limited-time offer with impact discount reveal, countdown digits, pulsing urgency border, and expired exit',
  tags: ['scene', 'brand', 'offer', 'countdown', 'sale', 'urgency', 'business'],
  category: 'scene-layout',
  component: SceneOfferCountdownComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'offerText', label: 'Offer Text', type: 'text', defaultValue: 'Limited Time Offer', group: 'Content' },
    { key: 'discount', label: 'Discount', type: 'text', defaultValue: '50% OFF', group: 'Content' },
    { key: 'countdownText', label: 'Countdown', type: 'text', defaultValue: '02:34:56', group: 'Content' },
    { key: 'urgentColor', label: 'Urgent Color', type: 'color', defaultValue: '#EF4444', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A14', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
  defaultConfig: {
    offerText: 'Limited Time Offer',
    discount: '50% OFF',
    countdownText: '02:34:56',
    urgentColor: '#EF4444',
    bgColor: '#0A0A14',
    textColor: '#FFFFFF',
  },
})
