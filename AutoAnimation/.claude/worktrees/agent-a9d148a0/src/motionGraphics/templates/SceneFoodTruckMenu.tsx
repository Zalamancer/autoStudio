import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FoodTruckMenuConfig {
  truckName: string
  tagline: string
  items: string[]
  prices: string[]
  bgColor: string
  accentColor: string
  secondaryColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneFoodTruckMenuComponent({ config, progress }: MotionGraphicProps<FoodTruckMenuConfig>) {
  const { truckName, tagline, items, prices, bgColor, accentColor, secondaryColor, textColor } = config

  const enterProgress = progress < 0.22 ? progress / 0.22 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Board slams down
  const boardEnter = easeOutCubic(Math.min(1, enterProgress / 0.3))
  const boardY = (1 - boardEnter) * -100
  const boardRotate = (1 - boardEnter) * -5

  // Title bounces
  const titleEnter = elasticOut(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.3)))

  // Items slide in staggered
  const getItemProgress = (i: number): number => {
    const start = 0.35 + i * 0.07
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.2)))
  }

  const displayItems = items.slice(0, 6)
  const displayPrices = prices.slice(0, 6)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Impact', 'Arial Black', sans-serif",
      }}
    >
      {/* Fun pattern background */}
      {Array.from({ length: 20 }, (_, i) => {
        const seed = i * 47 + 19
        const x = (seed * 11) % 100
        const y = (seed * 17) % 100
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: 4 + (seed % 6),
              height: 4 + (seed % 6),
              borderRadius: seed % 2 === 0 ? '50%' : 2,
              background: `${accentColor}08`,
              transform: `rotate(${seed % 45}deg)`,
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
          padding: '5%',
          opacity: exitOpacity,
          transform: `translateY(${exitEased * -60}px)`,
        }}
      >
        <div
          style={{
            background: accentColor,
            borderRadius: 'clamp(16px, 2.5vw, 24px)',
            padding: 'clamp(24px, 4.5%, 40px)',
            maxWidth: 440,
            width: '100%',
            boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
            transform: `translateY(${boardY}px) rotate(${boardRotate}deg)`,
            opacity: boardEnter,
            position: 'relative',
          }}
        >
          {/* Corner decorations */}
          {[
            { top: 8, left: 8 },
            { top: 8, right: 8 },
            { bottom: 8, left: 8 },
            { bottom: 8, right: 8 },
          ].map((pos, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                ...pos,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: secondaryColor,
                opacity: 0.6,
              } as any}
            />
          ))}

          {/* Truck icon */}
          <div
            style={{
              textAlign: 'center',
              fontSize: 'clamp(28px, 5vw, 40px)',
              marginBottom: 'clamp(4px, 0.8vh, 8px)',
              transform: `scale(${titleEnter})`,
            }}
          >
            {'\uD83D\uDE9A'}
          </div>

          {/* Truck name */}
          <div
            style={{
              fontSize: 'clamp(26px, 6vw, 44px)',
              fontWeight: 900,
              color: textColor,
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: 3,
              lineHeight: 1.1,
              transform: `scale(${titleEnter})`,
              textShadow: '2px 2px 0 rgba(0,0,0,0.15)',
            }}
          >
            {truckName}
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 'clamp(10px, 1.6vw, 13px)',
              fontFamily: "'Georgia', serif",
              fontWeight: 400,
              fontStyle: 'italic',
              color: `${textColor}CC`,
              textAlign: 'center',
              marginBottom: 'clamp(12px, 2vh, 18px)',
              opacity: titleEnter,
            }}
          >
            {tagline}
          </div>

          {/* Divider */}
          <div
            style={{
              height: 3,
              background: secondaryColor,
              borderRadius: 2,
              marginBottom: 'clamp(12px, 2vh, 18px)',
              opacity: 0.7,
            }}
          />

          {/* Menu items on dark inner panel */}
          <div
            style={{
              background: 'rgba(0,0,0,0.15)',
              borderRadius: 12,
              padding: 'clamp(14px, 2.5%, 22px)',
            }}
          >
            {displayItems.map((item, i) => {
              const ip = getItemProgress(i)
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'clamp(6px, 1vh, 10px) 0',
                    borderBottom: i < displayItems.length - 1 ? '1px dashed rgba(255,255,255,0.15)' : 'none',
                    opacity: ip,
                    transform: `translateX(${(1 - ip) * 25}px)`,
                  }}
                >
                  <span
                    style={{
                      fontSize: 'clamp(13px, 2.2vw, 17px)',
                      fontFamily: "'Helvetica Neue', Arial, sans-serif",
                      fontWeight: 700,
                      color: textColor,
                    }}
                  >
                    {item}
                  </span>
                  <span
                    style={{
                      fontSize: 'clamp(14px, 2.4vw, 18px)',
                      fontWeight: 900,
                      color: secondaryColor,
                      marginLeft: 8,
                    }}
                  >
                    {displayPrices[i] || ''}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Bottom banner */}
          <div
            style={{
              marginTop: 'clamp(10px, 1.8vh, 16px)',
              textAlign: 'center',
              fontSize: 'clamp(9px, 1.4vw, 11px)',
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              fontWeight: 700,
              color: `${textColor}AA`,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              opacity: getItemProgress(displayItems.length - 1),
            }}
          >
            {'Cash & Card Accepted'}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-food-truck-menu',
  title: 'Food Truck Menu',
  description: 'Fun food truck menu board with bold colors, slam-down entrance, dashed price lines, and playful corner dots',
  tags: ['scene', 'food', 'truck', 'street', 'menu', 'casual', 'fast'],
  category: 'scene-layout',
  component: SceneFoodTruckMenuComponent as any,
  defaultConfig: {
    truckName: 'Taco Loco',
    tagline: 'Authentic street tacos since 2015',
    items: ['Classic Beef Taco', 'Chicken Burrito', 'Loaded Nachos', 'Fish Tacos (2)', 'Churros'],
    prices: ['$4', '$9', '$8', '$7', '$5'],
    bgColor: '#FFF5E1',
    accentColor: '#E74C3C',
    secondaryColor: '#F1C40F',
    textColor: '#FFFFFF',
  },
  configSchema: [
    { key: 'truckName', label: 'Truck Name', type: 'text', defaultValue: 'Taco Loco', group: 'Content' },
    { key: 'tagline', label: 'Tagline', type: 'text', defaultValue: 'Authentic street tacos since 2015', group: 'Content' },
    { key: 'items', label: 'Menu Items', type: 'text-array', defaultValue: ['Classic Beef Taco', 'Chicken Burrito', 'Loaded Nachos', 'Fish Tacos (2)', 'Churros'], group: 'Content' },
    { key: 'prices', label: 'Prices', type: 'text-array', defaultValue: ['$4', '$9', '$8', '$7', '$5'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF5E1', group: 'Style' },
    { key: 'accentColor', label: 'Primary Color', type: 'color', defaultValue: '#E74C3C', group: 'Style' },
    { key: 'secondaryColor', label: 'Secondary Color', type: 'color', defaultValue: '#F1C40F', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
})
