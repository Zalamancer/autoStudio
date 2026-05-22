import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FoodDeliveryConfig {
  restaurantName: string
  orderItems: string[]
  estimatedTime: string
  status: string
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneFoodDeliveryComponent({ config, progress }: MotionGraphicProps<FoodDeliveryConfig>) {
  const { restaurantName, orderItems, estimatedTime, status, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.22 ? progress / 0.22 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Card slides up
  const cardEnter = easeOutCubic(Math.min(1, enterProgress / 0.35))
  const cardY = (1 - cardEnter) * 100

  // Status steps
  const steps = ['Confirmed', 'Preparing', 'On the Way', 'Delivered']
  const currentStep = steps.indexOf(status) >= 0 ? steps.indexOf(status) : 2

  // Progress bar fills
  const barProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.4)))
  const barFill = ((currentStep + 1) / steps.length) * barProgress

  // Items staggered
  const getItemProgress = (i: number): number => {
    const start = 0.4 + i * 0.08
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.2)))
  }

  // Time badge bounces
  const timeBadge = elasticOut(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.25)))

  const displayItems = orderItems.slice(0, 5)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6%',
          opacity: exitOpacity,
          transform: `translateY(${exitEased * 50}px)`,
        }}
      >
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(16px, 2.5vw, 24px)',
            padding: 'clamp(24px, 4.5%, 40px)',
            maxWidth: 420,
            width: '100%',
            boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
            transform: `translateY(${cardY}px)`,
            opacity: cardEnter,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'clamp(12px, 2vh, 18px)',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 'clamp(9px, 1.4vw, 11px)',
                  fontWeight: 600,
                  color: accentColor,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                Order From
              </div>
              <div
                style={{
                  fontSize: 'clamp(20px, 4.5vw, 30px)',
                  fontWeight: 900,
                  color: textColor,
                  lineHeight: 1.2,
                }}
              >
                {restaurantName}
              </div>
            </div>
            {/* Delivery icon */}
            <div
              style={{
                fontSize: 'clamp(28px, 5vw, 40px)',
                opacity: cardEnter,
              }}
            >
              {'\uD83D\uDEF5'}
            </div>
          </div>

          {/* Status tracker */}
          <div
            style={{
              marginBottom: 'clamp(16px, 2.5vh, 22px)',
            }}
          >
            {/* Progress bar */}
            <div
              style={{
                height: 4,
                background: `${textColor}10`,
                borderRadius: 2,
                marginBottom: 'clamp(8px, 1.2vh, 12px)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${barFill * 100}%`,
                  background: `linear-gradient(90deg, ${accentColor}, #FF6B35)`,
                  borderRadius: 2,
                }}
              />
            </div>
            {/* Step indicators */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              {steps.map((step, i) => {
                const active = i <= currentStep
                const stepProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3 - i * 0.08) / 0.15)))
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      opacity: stepProgress,
                      transform: `scale(${stepProgress})`,
                    }}
                  >
                    <div
                      style={{
                        width: 'clamp(16px, 2.8vw, 22px)',
                        height: 'clamp(16px, 2.8vw, 22px)',
                        borderRadius: '50%',
                        background: active ? accentColor : `${textColor}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'clamp(8px, 1.2vw, 10px)',
                        color: active ? '#FFFFFF' : `${textColor}50`,
                        fontWeight: 700,
                      }}
                    >
                      {active ? '\u2713' : i + 1}
                    </div>
                    <span
                      style={{
                        fontSize: 'clamp(7px, 1.1vw, 9px)',
                        fontWeight: active ? 700 : 500,
                        color: active ? accentColor : `${textColor}60`,
                        textAlign: 'center',
                      }}
                    >
                      {step}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: `${textColor}10`,
              marginBottom: 'clamp(12px, 2vh, 16px)',
            }}
          />

          {/* Order items */}
          <div
            style={{
              marginBottom: 'clamp(14px, 2.2vh, 20px)',
            }}
          >
            <div
              style={{
                fontSize: 'clamp(9px, 1.4vw, 11px)',
                fontWeight: 700,
                color: `${textColor}60`,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 'clamp(6px, 1vh, 10px)',
              }}
            >
              Your Order
            </div>
            {displayItems.map((item, i) => {
              const ip = getItemProgress(i)
              return (
                <div
                  key={i}
                  style={{
                    fontSize: 'clamp(12px, 2vw, 15px)',
                    color: textColor,
                    fontWeight: 500,
                    padding: 'clamp(3px, 0.5vh, 5px) 0',
                    opacity: ip,
                    transform: `translateX(${(1 - ip) * 15}px)`,
                    borderBottom: i < displayItems.length - 1 ? `1px solid ${textColor}06` : 'none',
                  }}
                >
                  {item}
                </div>
              )
            })}
          </div>

          {/* ETA badge */}
          <div
            style={{
              background: `${accentColor}10`,
              borderRadius: 12,
              padding: 'clamp(10px, 1.8vh, 16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transform: `scale(${timeBadge})`,
              opacity: timeBadge,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 'clamp(9px, 1.3vw, 11px)',
                  fontWeight: 600,
                  color: `${textColor}70`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Estimated Arrival
              </div>
              <div
                style={{
                  fontSize: 'clamp(18px, 3.5vw, 26px)',
                  fontWeight: 900,
                  color: accentColor,
                }}
              >
                {estimatedTime}
              </div>
            </div>
            <div style={{ fontSize: 'clamp(24px, 4vw, 34px)' }}>
              {'\u23F0'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-food-delivery',
  title: 'Food Delivery',
  description: 'Food delivery order tracking with status step indicators, animated progress bar, order items list, and ETA badge',
  tags: ['scene', 'food', 'delivery', 'order', 'tracking', 'restaurant', 'status'],
  category: 'scene-layout',
  component: SceneFoodDeliveryComponent as any,
  defaultConfig: {
    restaurantName: 'Burger Palace',
    orderItems: ['Classic Cheeseburger x2', 'Large Fries', 'Chocolate Milkshake', 'Onion Rings'],
    estimatedTime: '25 min',
    status: 'On the Way',
    bgColor: '#FFF8F0',
    cardColor: '#FFFFFF',
    accentColor: '#E67E22',
    textColor: '#1A1A1A',
  },
  configSchema: [
    { key: 'restaurantName', label: 'Restaurant', type: 'text', defaultValue: 'Burger Palace', group: 'Content' },
    { key: 'orderItems', label: 'Order Items', type: 'text-array', defaultValue: ['Classic Cheeseburger x2', 'Large Fries', 'Chocolate Milkshake', 'Onion Rings'], group: 'Content' },
    { key: 'estimatedTime', label: 'Estimated Time', type: 'text', defaultValue: '25 min', group: 'Content' },
    { key: 'status', label: 'Status', type: 'text', defaultValue: 'On the Way', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF8F0', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#E67E22', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1A1A1A', group: 'Style' },
  ],
})
