import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MenuBoardConfig {
  restaurantName: string
  items: string[]
  prices: string[]
  bgColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneMenuBoardComponent({ config, progress }: MotionGraphicProps<MenuBoardConfig>) {
  const { restaurantName, items, prices, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Board slides down from top
  const boardEnter = easeOutCubic(Math.min(1, enterProgress / 0.4))
  const boardY = (1 - boardEnter) * -80

  // Title fades in
  const titleEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.3)))

  // Decorative line draws
  const lineEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.3)))

  // Items appear staggered
  const getItemProgress = (index: number): number => {
    const start = 0.35 + index * 0.08
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.25)))
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
        fontFamily: "'Georgia', 'Palatino', serif",
      }}
    >
      {/* Warm ambient glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 30%, ${accentColor}10 0%, transparent 60%)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6%',
          opacity: exitOpacity,
          transform: `translateY(${exitEased * -50}px)`,
        }}
      >
        {/* Menu board */}
        <div
          style={{
            background: '#2A1A0A',
            borderRadius: 8,
            padding: 'clamp(24px, 4.5%, 44px)',
            maxWidth: 440,
            width: '100%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 0 40px rgba(0,0,0,0.2)',
            border: '6px solid #5C3D1F',
            transform: `translateY(${boardY}px)`,
            position: 'relative',
          }}
        >
          {/* Restaurant name */}
          <div
            style={{
              fontSize: 'clamp(20px, 4.5vw, 34px)',
              fontWeight: 700,
              color: accentColor,
              textAlign: 'center',
              letterSpacing: '0.08em',
              marginBottom: 'clamp(4px, 1vh, 10px)',
              opacity: titleEnter,
              textShadow: `0 0 10px ${accentColor}40`,
            }}
          >
            {restaurantName}
          </div>

          {/* Decorative line */}
          <div
            style={{
              height: 2,
              background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)`,
              marginBottom: 'clamp(12px, 2vh, 22px)',
              transform: `scaleX(${lineEnter})`,
              transformOrigin: 'center',
            }}
          />

          {/* Menu ITEMS header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 'clamp(9px, 1.4vw, 11px)',
              fontWeight: 600,
              color: `${textColor}60`,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              marginBottom: 'clamp(8px, 1.5vh, 14px)',
              opacity: titleEnter,
            }}
          >
            <span>Menu</span>
            <span>Price</span>
          </div>

          {/* Menu items */}
          {displayItems.map((item, i) => {
            const ip = getItemProgress(i)
            return (
              <div key={i}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    padding: 'clamp(6px, 1vh, 10px) 0',
                    opacity: ip,
                    transform: `translateX(${(1 - ip) * 30}px)`,
                  }}
                >
                  <span
                    style={{
                      fontSize: 'clamp(13px, 2.2vw, 18px)',
                      fontWeight: 600,
                      color: textColor,
                    }}
                  >
                    {item}
                  </span>
                  {/* Dotted line filler */}
                  <div
                    style={{
                      flex: 1,
                      borderBottom: `1px dotted ${textColor}30`,
                      margin: '0 clamp(6px, 1vw, 12px)',
                      minWidth: 20,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 'clamp(13px, 2.2vw, 18px)',
                      fontWeight: 700,
                      color: accentColor,
                    }}
                  >
                    {displayPrices[i] || ''}
                  </span>
                </div>
                {i < displayItems.length - 1 && (
                  <div
                    style={{
                      height: 1,
                      background: `${textColor}10`,
                    }}
                  />
                )}
              </div>
            )
          })}

          {/* Bottom ornament */}
          <div
            style={{
              marginTop: 'clamp(12px, 2vh, 20px)',
              textAlign: 'center',
              fontSize: 'clamp(10px, 1.6vw, 13px)',
              color: `${textColor}40`,
              letterSpacing: '0.2em',
              opacity: lineEnter,
            }}
          >
            {'~ Bon Appetit ~'}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-menu-board',
  title: 'Menu Board',
  description: 'Restaurant menu board on dark wood background with staggered item reveal, dotted price lines, and warm amber accents',
  tags: ['scene', 'food', 'restaurant', 'menu', 'board', 'dining', 'price'],
  category: 'scene-layout',
  component: SceneMenuBoardComponent as any,
  defaultConfig: {
    restaurantName: 'La Cucina',
    items: ['Truffle Risotto', 'Grilled Salmon', 'Caesar Salad', 'Beef Tenderloin', 'Tiramisu'],
    prices: ['$24', '$28', '$14', '$36', '$12'],
    bgColor: '#1A1008',
    accentColor: '#D4A853',
    textColor: '#F0E6D0',
  },
  configSchema: [
    { key: 'restaurantName', label: 'Restaurant Name', type: 'text', defaultValue: 'La Cucina', group: 'Content' },
    { key: 'items', label: 'Menu Items', type: 'text-array', defaultValue: ['Truffle Risotto', 'Grilled Salmon', 'Caesar Salad', 'Beef Tenderloin', 'Tiramisu'], group: 'Content' },
    { key: 'prices', label: 'Prices', type: 'text-array', defaultValue: ['$24', '$28', '$14', '$36', '$12'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1008', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#D4A853', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#F0E6D0', group: 'Style' },
  ],
})
