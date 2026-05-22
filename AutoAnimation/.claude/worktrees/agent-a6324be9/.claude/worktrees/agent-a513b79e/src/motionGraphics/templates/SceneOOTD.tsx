import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OOTDConfig {
  title: string
  items: string[]
  brands: string[]
  prices: string[]
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneOOTDComponent({ config, progress }: MotionGraphicProps<OOTDConfig>) {
  const { title, items, brands, prices, bgColor, cardColor, accentColor, textColor } = config
  const count = Math.min(items.length, brands.length, prices.length)

  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Header enters with magazine feel
  const headerEnter = easeOutCubic(Math.min(1, enterProgress / 0.25))

  // Subtitle line draws
  const lineEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.2)))

  // Items stagger in (magazine-style card flip)
  const getItemProgress = (index: number): number => {
    const start = 0.2 + (index / count) * 0.5
    return easeOutBack(Math.max(0, Math.min(1, (enterProgress - start) / 0.25)))
  }

  // Total price reveals at end
  const totalEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.8) / 0.2)))

  // Magazine-style subtle grid shift during hold
  const gridShift = Math.sin(holdProgress * Math.PI * 3) * 1.5

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      {/* Diagonal stripe accent (magazine) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: -20,
          width: 'clamp(40px, 8vw, 80px)',
          height: '100%',
          background: `${accentColor}10`,
          transform: 'skewX(-8deg)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '6% 7%',
          opacity: exitOpacity,
          transform: `translateY(${exitEased * 40}px)`,
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 'clamp(8px, 1.5vh, 16px)' }}>
          {/* OOTD badge */}
          <div
            style={{
              display: 'inline-block',
              background: accentColor,
              color: bgColor,
              fontSize: 'clamp(9px, 1.5vw, 13px)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              padding: 'clamp(3px, 0.5vh, 6px) clamp(10px, 1.8vw, 18px)',
              borderRadius: 2,
              opacity: headerEnter,
              transform: `translateX(${(1 - headerEnter) * -20}px)`,
              marginBottom: 'clamp(8px, 1.2vh, 14px)',
            }}
          >
            OOTD
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 'clamp(24px, 6vw, 48px)',
              fontWeight: 900,
              color: textColor,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              opacity: headerEnter,
              transform: `translateY(${(1 - headerEnter) * 20}px)`,
            }}
          >
            {title}
          </div>

          {/* Line separator */}
          <div
            style={{
              width: 'clamp(40px, 10vw, 80px)',
              height: 3,
              background: accentColor,
              marginTop: 'clamp(8px, 1.2vh, 14px)',
              transform: `scaleX(${lineEnter})`,
              transformOrigin: 'left',
            }}
          />
        </div>

        {/* Items list */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(8px, 1.5vh, 16px)',
            justifyContent: 'center',
            transform: `translateX(${gridShift}px)`,
          }}
        >
          {Array.from({ length: count }).map((_, i) => {
            const itemProg = getItemProgress(i)
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: cardColor,
                  borderRadius: 'clamp(8px, 1.2vw, 14px)',
                  padding: 'clamp(10px, 1.8vh, 18px) clamp(12px, 2vw, 20px)',
                  gap: 'clamp(10px, 2vw, 18px)',
                  opacity: itemProg,
                  transform: `translateX(${(1 - itemProg) * 40}px)`,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                }}
              >
                {/* Item number badge */}
                <div
                  style={{
                    width: 'clamp(28px, 5vw, 40px)',
                    height: 'clamp(28px, 5vw, 40px)',
                    borderRadius: '50%',
                    background: `${accentColor}18`,
                    border: `2px solid ${accentColor}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'clamp(11px, 1.8vw, 16px)',
                    fontWeight: 800,
                    color: accentColor,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>

                {/* Item info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 'clamp(13px, 2.5vw, 20px)',
                      fontWeight: 700,
                      color: textColor,
                      lineHeight: 1.2,
                    }}
                  >
                    {items[i]}
                  </div>
                  {/* Brand tag */}
                  <div
                    style={{
                      fontSize: 'clamp(9px, 1.5vw, 13px)',
                      fontWeight: 500,
                      color: `${textColor}77`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginTop: 2,
                    }}
                  >
                    {brands[i]}
                  </div>
                </div>

                {/* Price */}
                <div
                  style={{
                    fontSize: 'clamp(13px, 2.2vw, 19px)',
                    fontWeight: 800,
                    color: accentColor,
                    whiteSpace: 'nowrap',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {prices[i]}
                </div>
              </div>
            )
          })}
        </div>

        {/* Total */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 16px)',
            marginTop: 'clamp(10px, 2vh, 20px)',
            opacity: totalEnter,
            transform: `translateY(${(1 - totalEnter) * 10}px)`,
          }}
        >
          <div
            style={{
              width: 'clamp(30px, 6vw, 50px)',
              height: 1,
              background: `${textColor}30`,
            }}
          />
          <div
            style={{
              fontSize: 'clamp(10px, 1.6vw, 14px)',
              fontWeight: 600,
              color: `${textColor}88`,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Style is self-expression
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-ootd',
  title: 'Outfit of the Day',
  description: 'OOTD card with item labels, brand tags, price, and magazine-style layout with staggered reveal',
  tags: ['scene', 'fashion', 'ootd', 'lifestyle', 'personal', 'outfit', 'style'],
  category: 'scene-layout',
  component: SceneOOTDComponent as any,
  defaultConfig: {
    title: "Today's Look",
    items: ['Oversized Blazer', 'High-Rise Jeans', 'Platform Boots', 'Mini Crossbody'],
    brands: ['Zara', 'Levi\'s', 'Dr. Martens', 'Coach'],
    prices: ['$89', '$98', '$170', '$250'],
    bgColor: '#fafaf9',
    cardColor: '#ffffff',
    accentColor: '#18181b',
    textColor: '#18181b',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: "Today's Look", group: 'Content' },
    { key: 'items', label: 'Items', type: 'text-array', defaultValue: ['Oversized Blazer', 'High-Rise Jeans', 'Platform Boots', 'Mini Crossbody'], group: 'Content' },
    { key: 'brands', label: 'Brands', type: 'text-array', defaultValue: ['Zara', "Levi's", 'Dr. Martens', 'Coach'], group: 'Content' },
    { key: 'prices', label: 'Prices', type: 'text-array', defaultValue: ['$89', '$98', '$170', '$250'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#fafaf9', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#18181b', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#18181b', group: 'Style' },
  ],
})
