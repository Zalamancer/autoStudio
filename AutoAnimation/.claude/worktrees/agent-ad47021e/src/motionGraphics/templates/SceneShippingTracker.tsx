import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ShippingTrackerConfig {
  orderNumber: string
  currentStep: number
  estimatedDate: string
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

const STEPS = ['Ordered', 'Shipped', 'In Transit', 'Delivered']
const STEP_EMOJIS = ['✅', '📤', '🚚', '📦']

function SceneShippingTrackerComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<ShippingTrackerConfig>) {
  const { orderNumber, currentStep, estimatedDate, bgColor, cardColor, accentColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Card slides up
  const cardSlide = easeOutCubic(Math.min(1, enterProgress / 0.3))
  const cardY = (1 - cardSlide) * 100

  // Header appears
  const headerProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.2)))

  // Line draws from left to right
  const lineDrawProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.5)))

  // Dots activate staggered
  const getDotProgress = (idx: number): number => {
    const start = 0.25 + idx * 0.12
    return elasticOut(Math.max(0, Math.min(1, (enterProgress - start) / 0.18)))
  }

  // Estimated date
  const dateProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.85) / 0.15)))

  // Hold: current step pulses
  const currentStepPulse = 1 + Math.sin(holdProgress * Math.PI * 5) * 0.15

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitY = exitEased * -70

  const clampedStep = Math.max(1, Math.min(4, currentStep))

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
          padding: 'clamp(22px, 4.5%, 40px)',
          maxWidth: 440,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(18px, 3vh, 30px)',
          transform: `translateY(${cardY + exitY}px)`,
          opacity: exitOpacity,
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            opacity: headerProgress,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 12px)' }}>
            <span style={{ fontSize: 'clamp(20px, 3.5vw, 28px)' }}>{'📦'}</span>
            <div>
              <div style={{ fontSize: 'clamp(14px, 2.2vw, 18px)', fontWeight: 800, color: textColor }}>
                Order Tracking
              </div>
              <div style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', fontWeight: 500, color: `${textColor}70` }}>
                #{orderNumber}
              </div>
            </div>
          </div>
        </div>

        {/* Tracking progress */}
        <div
          style={{
            position: 'relative',
            padding: '0 clamp(8px, 1.5%, 16px)',
          }}
        >
          {/* Connecting line background */}
          <div
            style={{
              position: 'absolute',
              top: 'clamp(14px, 2.5vw, 20px)',
              left: 'clamp(22px, 4vw, 36px)',
              right: 'clamp(22px, 4vw, 36px)',
              height: 3,
              background: `${textColor}15`,
              borderRadius: 2,
            }}
          />
          {/* Connecting line progress */}
          <div
            style={{
              position: 'absolute',
              top: 'clamp(14px, 2.5vw, 20px)',
              left: 'clamp(22px, 4vw, 36px)',
              right: 'clamp(22px, 4vw, 36px)',
              height: 3,
              background: accentColor,
              borderRadius: 2,
              transformOrigin: 'left center',
              transform: `scaleX(${lineDrawProgress * Math.min(1, (clampedStep - 1) / 3)})`,
            }}
          />

          {/* Step dots and labels */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              position: 'relative',
            }}
          >
            {STEPS.map((step, i) => {
              const dotP = getDotProgress(i)
              const isCompleted = i < clampedStep
              const isCurrent = i === clampedStep - 1
              const dotScale = isCurrent ? dotP * currentStepPulse : dotP
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'clamp(6px, 1vh, 10px)',
                    flex: 1,
                  }}
                >
                  {/* Dot */}
                  <div
                    style={{
                      width: 'clamp(28px, 5vw, 40px)',
                      height: 'clamp(28px, 5vw, 40px)',
                      borderRadius: '50%',
                      background: isCompleted ? accentColor : `${textColor}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: `scale(${dotScale})`,
                      boxShadow: isCurrent ? `0 0 12px ${accentColor}50` : 'none',
                      border: isCurrent ? `2px solid ${accentColor}` : 'none',
                      zIndex: 1,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'clamp(11px, 1.8vw, 16px)',
                        opacity: dotP,
                      }}
                    >
                      {isCompleted ? STEP_EMOJIS[i] : ''}
                    </span>
                  </div>
                  {/* Label */}
                  <div
                    style={{
                      fontSize: 'clamp(9px, 1.4vw, 12px)',
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCompleted ? accentColor : `${textColor}60`,
                      textAlign: 'center',
                      opacity: dotP,
                    }}
                  >
                    {step}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Estimated delivery */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(6px, 1vw, 10px)',
            opacity: dateProgress,
            transform: `translateY(${(1 - dateProgress) * 12}px)`,
            padding: 'clamp(8px, 1.5vh, 14px)',
            background: `${accentColor}10`,
            borderRadius: 'clamp(8px, 1.2vw, 12px)',
          }}
        >
          <span style={{ fontSize: 'clamp(10px, 1.5vw, 13px)', fontWeight: 500, color: `${textColor}80` }}>
            Estimated Delivery:
          </span>
          <span style={{ fontSize: 'clamp(11px, 1.7vw, 14px)', fontWeight: 700, color: accentColor }}>
            {estimatedDate}
          </span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-shipping-tracker',
  title: 'Scene Shipping Tracker',
  description:
    'Order tracking with line-drawing progress, activating step dots, pulsing current step, and estimated delivery date',
  tags: ['scene', 'ecommerce', 'shipping', 'tracking', 'order', 'delivery', 'shopping'],
  category: 'scene-layout',
  component: SceneShippingTrackerComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'orderNumber', label: 'Order Number', type: 'text', defaultValue: 'ORD-20240315', group: 'Content' },
    { key: 'currentStep', label: 'Current Step (1-4)', type: 'number', defaultValue: 3, min: 1, max: 4, group: 'Content' },
    { key: 'estimatedDate', label: 'Est. Delivery', type: 'text', defaultValue: 'March 22, 2024', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#2563EB', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F172A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1E293B', group: 'Style' },
  ],
  defaultConfig: {
    orderNumber: 'ORD-20240315',
    currentStep: 3,
    estimatedDate: 'March 22, 2024',
    accentColor: '#2563EB',
    cardColor: '#FFFFFF',
    bgColor: '#0F172A',
    textColor: '#1E293B',
  },
})
