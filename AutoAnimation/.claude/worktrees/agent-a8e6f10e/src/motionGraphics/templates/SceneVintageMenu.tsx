import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface VintageMenuConfig {
  restaurantName: string
  items: string
  prices: string
  tagline: string
  bgColor: string
  menuColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c = 1.70158
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneVintageMenuComponent({
  config,
  frame,
  fps,
  durationInFrames,
}: MotionGraphicProps<VintageMenuConfig>) {
  const { restaurantName, items, prices, tagline, bgColor, menuColor, textColor, accentColor } = config
  const progress = frame / durationInFrames
  const time = frame / fps

  const enterEnd = 0.3
  const holdEnd = 0.78
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Menu card flips open (rotation)
  const flipProgress = easeOutCubic(Math.min(1, enterProgress / 0.4))
  const menuRotateY = (1 - flipProgress) * -90
  const menuOpacity = flipProgress

  // Restaurant name
  const nameProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.25)))

  // Menu items stagger in
  const itemList = items.split(',').map(s => s.trim())
  const priceList = prices.split(',').map(s => s.trim())
  const getItemProgress = (idx: number) => easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35 - idx * 0.05) / 0.2)))

  // Tagline
  const taglineProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.75) / 0.2)))

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitRotateY = exitEased * 90

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Georgia', 'Times New Roman', serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: 800,
      }}
    >
      {/* Tablecloth texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(180,140,80,0.02) 0px, transparent 1px, transparent 12px), repeating-linear-gradient(90deg, rgba(180,140,80,0.02) 0px, transparent 1px, transparent 12px)',
          pointerEvents: 'none',
        }}
      />

      {/* Menu card */}
      <div
        style={{
          position: 'relative',
          width: 'clamp(280px, 65vw, 420px)',
          padding: 'clamp(28px, 5.5vw, 48px) clamp(24px, 4.5vw, 40px)',
          background: menuColor,
          border: `2px solid ${accentColor}60`,
          borderRadius: 4,
          transform: `rotateY(${menuRotateY + exitRotateY}deg)`,
          opacity: menuOpacity * exitOpacity,
          textAlign: 'center',
          boxShadow: '0 8px 30px rgba(0,0,0,0.25), inset 0 0 25px rgba(140,110,50,0.06)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Ornate top border */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            right: 10,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${accentColor}50, transparent)`,
          }}
        />

        {/* Corner decorations */}
        {[
          { top: 6, left: 6 },
          { top: 6, right: 6 },
          { bottom: 6, left: 6 },
          { bottom: 6, right: 6 },
        ].map((pos, i) => (
          <div
            key={`corner-${i}`}
            style={{
              position: 'absolute',
              ...pos,
              width: 8,
              height: 8,
              borderTop: i < 2 ? `1px solid ${accentColor}50` : 'none',
              borderBottom: i >= 2 ? `1px solid ${accentColor}50` : 'none',
              borderLeft: i % 2 === 0 ? `1px solid ${accentColor}50` : 'none',
              borderRight: i % 2 === 1 ? `1px solid ${accentColor}50` : 'none',
            } as any}
          />
        ))}

        {/* MENU header */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.8vw, 14px)',
            fontWeight: 600,
            color: accentColor,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            marginBottom: 'clamp(4px, 0.8vw, 6px)',
            opacity: nameProgress,
          }}
        >
          MENU
        </div>

        {/* Restaurant name */}
        <div
          style={{
            fontSize: 'clamp(24px, 6vw, 44px)',
            fontWeight: 900,
            fontStyle: 'italic',
            color: textColor,
            lineHeight: 1.1,
            marginBottom: 'clamp(4px, 0.8vw, 8px)',
            opacity: nameProgress,
          }}
        >
          {restaurantName}
        </div>

        {/* Decorative flourish */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginBottom: 'clamp(16px, 3vw, 26px)',
            opacity: nameProgress,
          }}
        >
          <div style={{ width: 'clamp(25px, 5vw, 40px)', height: 1, background: `${accentColor}60` }} />
          <div style={{ fontSize: 'clamp(8px, 1.4vw, 12px)', color: accentColor }}>&#10045;</div>
          <div style={{ width: 'clamp(25px, 5vw, 40px)', height: 1, background: `${accentColor}60` }} />
        </div>

        {/* Menu items */}
        {itemList.map((item, i) => {
          const p = getItemProgress(i)
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 'clamp(8px, 1.6vw, 14px)',
                opacity: p,
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(12px, 2.2vw, 17px)',
                  fontWeight: 600,
                  color: textColor,
                  fontStyle: 'italic',
                }}
              >
                {item}
              </span>
              <span
                style={{
                  flex: 1,
                  borderBottom: `1px dotted ${textColor}30`,
                  margin: '0 6px',
                  minWidth: 20,
                }}
              />
              <span
                style={{
                  fontSize: 'clamp(12px, 2.2vw, 17px)',
                  fontWeight: 700,
                  color: accentColor,
                }}
              >
                {priceList[i] || ''}
              </span>
            </div>
          )
        })}

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)`,
            margin: 'clamp(12px, 2.5vw, 20px) 0',
            opacity: taglineProgress,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.8vw, 14px)',
            fontStyle: 'italic',
            color: `${textColor}AA`,
            letterSpacing: '0.1em',
            opacity: taglineProgress,
          }}
        >
          {tagline}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-vintage-menu',
  title: 'Scene Vintage Menu',
  description: 'Vintage restaurant menu card with flip-open entrance, ornate borders, dotted price lines, staggered item reveal, and aged paper',
  tags: ['scene', 'vintage', 'menu', 'retro', 'restaurant', 'food', 'dining', 'elegant'],
  category: 'scene-layout',
  component: SceneVintageMenuComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    restaurantName: 'Le Petit Bistro',
    items: 'French Onion Soup, Coq au Vin, Cr\u00e8me Br\u00fbl\u00e9e, Espresso',
    prices: '$3.50, $8.75, $4.25, $1.50',
    tagline: 'Serving fine cuisine since 1934',
    bgColor: '#1A0F05',
    menuColor: '#F5E6CC',
    textColor: '#3E2723',
    accentColor: '#8B6914',
  },
  configSchema: [
    { key: 'restaurantName', label: 'Restaurant Name', type: 'text', defaultValue: 'Le Petit Bistro', group: 'Content' },
    { key: 'items', label: 'Items (comma sep)', type: 'text', defaultValue: 'French Onion Soup, Coq au Vin, Cr\u00e8me Br\u00fbl\u00e9e, Espresso', group: 'Content' },
    { key: 'prices', label: 'Prices (comma sep)', type: 'text', defaultValue: '$3.50, $8.75, $4.25, $1.50', group: 'Content' },
    { key: 'tagline', label: 'Tagline', type: 'text', defaultValue: 'Serving fine cuisine since 1934', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A0F05', group: 'Style' },
    { key: 'menuColor', label: 'Menu Color', type: 'color', defaultValue: '#F5E6CC', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#3E2723', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#8B6914', group: 'Style' },
  ],
})
