import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ShopMyLookConfig {
  title: string
  items: string[]
  prices: string[]
  brands: string[]
  bgColor: string
  textColor: string
  accentColor: string
  cardColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneShopMyLookComponent({ config, progress }: MotionGraphicProps<ShopMyLookConfig>) {
  const { title, items, prices, brands, bgColor, textColor, accentColor, cardColor } = config

  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Title drops in
  const titleEnter = easeOutCubic(Math.min(1, enterProgress / 0.25))

  // Tag icon
  const tagEnter = elasticOut(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.2)))

  // Items stagger pop
  const getItemProgress = (idx: number): number => {
    const start = 0.3 + idx * 0.15
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.25)))
  }

  // Number badges pop
  const getNumberPop = (idx: number): number => {
    const start = 0.35 + idx * 0.15
    return elasticOut(Math.max(0, Math.min(1, (enterProgress - start) / 0.2)))
  }

  // Connector lines draw
  const getLineProgress = (idx: number): number => {
    const start = 0.32 + idx * 0.15
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.15)))
  }

  // Item positions around the center (simulating outfit pointer areas)
  const itemPositions = [
    { top: '22%', left: '55%' },
    { top: '44%', left: '58%' },
    { top: '62%', left: '52%' },
    { top: '78%', left: '56%' },
  ]

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      {/* Subtle gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, ${bgColor}, ${accentColor}08 50%, ${bgColor})`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '5% 6%',
          opacity: exitOpacity,
          transform: `scale(${1 - exitEased * 0.08})`,
        }}
      >
        {/* Title area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 14px)',
            marginBottom: 'clamp(12px, 2.5vh, 24px)',
          }}
        >
          {/* Shopping tag icon */}
          <div
            style={{
              width: 'clamp(28px, 5vw, 40px)',
              height: 'clamp(28px, 5vw, 40px)',
              borderRadius: 'clamp(6px, 1vw, 10px)',
              background: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${tagEnter}) rotate(${(1 - tagEnter) * -90}deg)`,
              fontSize: 'clamp(14px, 2.5vw, 20px)',
            }}
          >
            🛍️
          </div>

          <div style={{ overflow: 'hidden' }}>
            <div
              style={{
                fontSize: 'clamp(20px, 5vw, 36px)',
                fontWeight: 800,
                color: textColor,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                transform: `translateY(${(1 - titleEnter) * 100}%)`,
                lineHeight: 1.2,
              }}
            >
              {title}
            </div>
          </div>
        </div>

        {/* Accent line under title */}
        <div
          style={{
            width: 'clamp(40px, 10vw, 80px)',
            height: 2,
            background: accentColor,
            marginBottom: 'clamp(16px, 3vh, 30px)',
            transform: `scaleX(${titleEnter})`,
            transformOrigin: 'left',
          }}
        />

        {/* Items list with pointer lines */}
        <div style={{ position: 'relative' }}>
          {items.slice(0, 4).map((item, i) => {
            const itemProg = getItemProgress(i)
            const numPop = getNumberPop(i)
            const lineProg = getLineProgress(i)
            const price = prices[i] || ''
            const brand = brands[i] || ''

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(10px, 2vw, 18px)',
                  marginBottom: 'clamp(10px, 2vh, 18px)',
                  opacity: itemProg,
                  transform: `translateX(${(1 - itemProg) * 30}px)`,
                }}
              >
                {/* Number badge */}
                <div
                  style={{
                    width: 'clamp(28px, 5.5vw, 40px)',
                    height: 'clamp(28px, 5.5vw, 40px)',
                    borderRadius: '50%',
                    border: `2px solid ${accentColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'clamp(12px, 2.2vw, 17px)',
                    fontWeight: 700,
                    color: accentColor,
                    flexShrink: 0,
                    transform: `scale(${numPop})`,
                  }}
                >
                  {i + 1}
                </div>

                {/* Connector line */}
                <div
                  style={{
                    width: 'clamp(20px, 4vw, 36px)',
                    height: 1,
                    background: `${accentColor}50`,
                    transformOrigin: 'left',
                    transform: `scaleX(${lineProg})`,
                    flexShrink: 0,
                  }}
                />

                {/* Item card */}
                <div
                  style={{
                    background: cardColor,
                    borderRadius: 'clamp(6px, 1vw, 10px)',
                    padding: 'clamp(8px, 1.5vh, 14px) clamp(12px, 2vw, 18px)',
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 'clamp(13px, 2.5vw, 19px)',
                        fontWeight: 600,
                        color: textColor,
                        lineHeight: 1.3,
                      }}
                    >
                      {item}
                    </div>
                    {brand && (
                      <div
                        style={{
                          fontSize: 'clamp(9px, 1.5vw, 12px)',
                          fontWeight: 400,
                          color: `${textColor}70`,
                          marginTop: 2,
                        }}
                      >
                        {brand}
                      </div>
                    )}
                  </div>

                  {price && (
                    <div
                      style={{
                        fontSize: 'clamp(12px, 2.2vw, 18px)',
                        fontWeight: 700,
                        color: accentColor,
                        whiteSpace: 'nowrap',
                        marginLeft: 'clamp(8px, 1.5vw, 14px)',
                      }}
                    >
                      {price}
                    </div>
                  )}
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
  id: 'tpl-scene-shop-my-look',
  title: 'Shop My Look',
  description: 'Shop my look card with numbered items, pointer lines, brand/price tags, and shopping aesthetic',
  tags: ['scene', 'shopping', 'fashion', 'outfit', 'look', 'style', 'haul'],
  category: 'scene-layout',
  component: SceneShopMyLookComponent as any,
  defaultConfig: {
    title: 'SHOP MY LOOK',
    items: ['Oversized Blazer', 'Silk Cami Top', 'Wide-Leg Trousers', 'Strappy Heels'],
    prices: ['$128', '$65', '$89', '$110'],
    brands: ['Zara', 'Reformation', 'COS', 'Steve Madden'],
    bgColor: '#110e12',
    textColor: '#f5f0f2',
    accentColor: '#c9a0dc',
    cardColor: '#1e1a20',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'SHOP MY LOOK', group: 'Content' },
    { key: 'items', label: 'Items', type: 'text-array', defaultValue: ['Oversized Blazer', 'Silk Cami Top', 'Wide-Leg Trousers', 'Strappy Heels'], group: 'Content' },
    { key: 'prices', label: 'Prices', type: 'text-array', defaultValue: ['$128', '$65', '$89', '$110'], group: 'Content' },
    { key: 'brands', label: 'Brands', type: 'text-array', defaultValue: ['Zara', 'Reformation', 'COS', 'Steve Madden'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#110e12', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f5f0f2', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#c9a0dc', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1e1a20', group: 'Style' },
  ],
})
