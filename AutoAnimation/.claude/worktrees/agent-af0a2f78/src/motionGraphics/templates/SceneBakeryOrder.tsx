import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BakeryOrderConfig {
  bakeryName: string
  orderType: string
  flavor: string
  size: string
  decoration: string
  message: string
  pickupDate: string
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

function SceneBakeryOrderComponent({ config, progress }: MotionGraphicProps<BakeryOrderConfig>) {
  const { bakeryName, orderType, flavor, size, decoration, message, pickupDate, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.22 ? progress / 0.22 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Card scales in
  const cardEnter = easeOutCubic(Math.min(1, enterProgress / 0.35))
  const cardScale = 0.88 + cardEnter * 0.12

  // Cake icon bounces
  const cakeEnter = elasticOut(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.3)))

  // Details staggered
  const getDetailProgress = (i: number): number => {
    const start = 0.3 + i * 0.08
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.2)))
  }

  // Line draws
  const lineEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.2)))

  const orderDetails = [
    { label: 'Type', value: orderType, icon: '\uD83C\uDF82' },
    { label: 'Flavor', value: flavor, icon: '\uD83C\uDF70' },
    { label: 'Size', value: size, icon: '\uD83D\uDCCF' },
    { label: 'Decoration', value: decoration, icon: '\u2728' },
  ]

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
      {/* Pastel polka dots */}
      {Array.from({ length: 25 }, (_, i) => {
        const seed = i * 41 + 23
        const x = (seed * 13) % 100
        const y = (seed * 19) % 100
        const size = 6 + (seed % 8)
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              borderRadius: '50%',
              background: `${accentColor}08`,
              pointerEvents: 'none',
            }}
          />
        )
      })}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6%',
          opacity: exitOpacity,
          transform: `scale(${1 - exitEased * 0.08})`,
        }}
      >
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(18px, 3vw, 28px)',
            padding: 'clamp(24px, 4.5%, 40px)',
            maxWidth: 420,
            width: '100%',
            boxShadow: '0 10px 36px rgba(0,0,0,0.08)',
            transform: `scale(${cardScale})`,
            opacity: cardEnter,
            position: 'relative',
            border: `2px dashed ${accentColor}25`,
          }}
        >
          {/* Bakery name */}
          <div
            style={{
              fontSize: 'clamp(9px, 1.4vw, 11px)',
              fontWeight: 700,
              color: accentColor,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              textAlign: 'center',
              marginBottom: 'clamp(4px, 0.6vh, 8px)',
              opacity: cardEnter,
            }}
          >
            {bakeryName}
          </div>

          {/* Cake icon */}
          <div
            style={{
              textAlign: 'center',
              fontSize: 'clamp(36px, 7vw, 52px)',
              marginBottom: 'clamp(6px, 1vh, 10px)',
              transform: `scale(${cakeEnter})`,
              opacity: cakeEnter,
            }}
          >
            {'\uD83C\uDF82'}
          </div>

          {/* Order title */}
          <div
            style={{
              fontSize: 'clamp(20px, 4.5vw, 30px)',
              fontWeight: 900,
              color: textColor,
              textAlign: 'center',
              lineHeight: 1.2,
              marginBottom: 'clamp(4px, 0.6vh, 8px)',
              opacity: cardEnter,
            }}
          >
            Custom Order
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: `linear-gradient(90deg, transparent, ${accentColor}30, transparent)`,
              margin: 'clamp(8px, 1.5vh, 14px) 10%',
              transform: `scaleX(${lineEnter})`,
              transformOrigin: 'center',
            }}
          />

          {/* Order details grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'clamp(8px, 1.5vh, 14px)',
              marginBottom: 'clamp(12px, 2vh, 18px)',
            }}
          >
            {orderDetails.map((d, i) => {
              const dp = getDetailProgress(i)
              return (
                <div
                  key={i}
                  style={{
                    background: `${accentColor}06`,
                    borderRadius: 10,
                    padding: 'clamp(8px, 1.5vh, 14px)',
                    opacity: dp,
                    transform: `translateY(${(1 - dp) * 10}px)`,
                  }}
                >
                  <div style={{ fontSize: 'clamp(16px, 2.5vw, 22px)', marginBottom: 2 }}>{d.icon}</div>
                  <div
                    style={{
                      fontSize: 'clamp(8px, 1.2vw, 10px)',
                      fontWeight: 600,
                      color: `${textColor}60`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {d.label}
                  </div>
                  <div
                    style={{
                      fontSize: 'clamp(12px, 2vw, 15px)',
                      fontWeight: 700,
                      color: textColor,
                    }}
                  >
                    {d.value}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Message */}
          {message && (
            <div
              style={{
                background: `${accentColor}08`,
                borderRadius: 10,
                padding: 'clamp(10px, 1.8vh, 14px)',
                marginBottom: 'clamp(10px, 1.8vh, 14px)',
                textAlign: 'center',
                opacity: getDetailProgress(4),
                transform: `translateY(${(1 - getDetailProgress(4)) * 8}px)`,
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(8px, 1.2vw, 10px)',
                  fontWeight: 700,
                  color: accentColor,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: 3,
                }}
              >
                Cake Message
              </div>
              <div
                style={{
                  fontSize: 'clamp(14px, 2.4vw, 18px)',
                  fontWeight: 700,
                  fontStyle: 'italic',
                  color: textColor,
                }}
              >
                &ldquo;{message}&rdquo;
              </div>
            </div>
          )}

          {/* Pickup date */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: getDetailProgress(5),
            }}
          >
            <span style={{ fontSize: 'clamp(14px, 2.2vw, 18px)' }}>{'\uD83D\uDCC5'}</span>
            <span
              style={{
                fontSize: 'clamp(11px, 1.8vw, 14px)',
                fontWeight: 700,
                color: accentColor,
              }}
            >
              Pickup: {pickupDate}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-bakery-order',
  title: 'Bakery Order',
  description: 'Sweet bakery custom order card with cake icon, detail grid, cake message, pickup date, and pastel dashed border',
  tags: ['scene', 'food', 'bakery', 'cake', 'order', 'sweet', 'pastry', 'dessert'],
  category: 'scene-layout',
  component: SceneBakeryOrderComponent as any,
  defaultConfig: {
    bakeryName: 'Sweet Dreams Bakery',
    orderType: 'Birthday Cake',
    flavor: 'Red Velvet',
    size: '10 inch round',
    decoration: 'Buttercream roses',
    message: 'Happy Birthday Emma!',
    pickupDate: 'March 22, 3PM',
    bgColor: '#FFF5F5',
    cardColor: '#FFFFFF',
    accentColor: '#E91E8C',
    textColor: '#2C1810',
  },
  configSchema: [
    { key: 'bakeryName', label: 'Bakery Name', type: 'text', defaultValue: 'Sweet Dreams Bakery', group: 'Content' },
    { key: 'orderType', label: 'Order Type', type: 'text', defaultValue: 'Birthday Cake', group: 'Content' },
    { key: 'flavor', label: 'Flavor', type: 'text', defaultValue: 'Red Velvet', group: 'Content' },
    { key: 'size', label: 'Size', type: 'text', defaultValue: '10 inch round', group: 'Content' },
    { key: 'decoration', label: 'Decoration', type: 'text', defaultValue: 'Buttercream roses', group: 'Content' },
    { key: 'message', label: 'Cake Message', type: 'text', defaultValue: 'Happy Birthday Emma!', group: 'Content' },
    { key: 'pickupDate', label: 'Pickup Date', type: 'text', defaultValue: 'March 22, 3PM', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF5F5', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#E91E8C', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2C1810', group: 'Style' },
  ],
})
