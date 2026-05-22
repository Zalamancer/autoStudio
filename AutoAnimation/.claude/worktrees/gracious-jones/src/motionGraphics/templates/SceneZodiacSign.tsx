import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneZodiacSignConfig {
  signName: string
  symbol: string
  element: string
  dateRange: string
  traits: string
  bgColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number { const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2) }

function SceneZodiacSignComponent({ config, progress }: MotionGraphicProps<SceneZodiacSignConfig>) {
  const { signName, symbol, element, dateRange, traits, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0
  const isHolding = progress >= 0.25 && progress < 0.8

  // Symbol scales in with glow
  const symbolScale = enterProgress < 1 ? easeOutBack(enterProgress) : 1
  const symbolOpacity = enterProgress < 1 ? easeOutCubic(enterProgress) : exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const glowSize = isHolding ? 20 + Math.sin(holdProgress * Math.PI * 4) * 10 : 20

  // Info slides up staggered
  const nameEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.6)))
  const elementEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.6)))
  const dateEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.5)))
  const traitsEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.65) / 0.35)))

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const exitScale = exitProgress > 0 ? 1 - exitProgress * 0.15 : 1

  const traitWords = traits.split(',').map(t => t.trim())

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, ${bgColor} 0%, #0a0a1a 100%)` }} />

      {/* Subtle star dots */}
      {Array.from({ length: 20 }).map((_, i) => {
        const x = ((i * 37 + 13) % 100)
        const y = ((i * 53 + 7) % 100)
        const size = 1 + (i % 3)
        const twinkle = isHolding ? 0.3 + Math.sin(holdProgress * Math.PI * 6 + i * 1.5) * 0.3 : 0.3
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
              background: accentColor,
              opacity: twinkle * exitOpacity,
            }}
          />
        )
      })}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(6px, 1.5vw, 16px)',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Symbol */}
        <div
          style={{
            fontSize: 'clamp(48px, 14vw, 120px)',
            transform: `scale(${symbolScale})`,
            opacity: symbolOpacity,
            filter: `drop-shadow(0 0 ${glowSize}px ${accentColor})`,
            lineHeight: 1,
            marginBottom: 'clamp(4px, 1vw, 12px)',
          }}
        >
          {symbol}
        </div>

        {/* Sign name */}
        <div
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: 'clamp(24px, 7vw, 64px)',
            fontWeight: 700,
            color: accentColor,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            opacity: nameEnter,
            transform: `translateY(${20 * (1 - nameEnter)}px)`,
          }}
        >
          {signName}
        </div>

        {/* Element badge */}
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(10px, 2vw, 18px)',
            fontWeight: 600,
            color: textColor,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            padding: 'clamp(3px, 0.6vw, 8px) clamp(10px, 2.5vw, 24px)',
            border: `1px solid ${accentColor}44`,
            borderRadius: 20,
            opacity: elementEnter,
            transform: `translateY(${15 * (1 - elementEnter)}px)`,
          }}
        >
          {element}
        </div>

        {/* Date range */}
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(10px, 2vw, 18px)',
            fontWeight: 400,
            color: textColor,
            opacity: dateEnter * 0.7,
            transform: `translateY(${15 * (1 - dateEnter)}px)`,
          }}
        >
          {dateRange}
        </div>

        {/* Divider */}
        <div
          style={{
            width: 'clamp(40px, 10vw, 80px)',
            height: 1,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            opacity: dateEnter * 0.5,
            margin: 'clamp(2px, 0.5vw, 6px) 0',
          }}
        />

        {/* Traits */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(6px, 1.5vw, 14px)',
            opacity: traitsEnter,
            transform: `translateY(${12 * (1 - traitsEnter)}px)`,
          }}
        >
          {traitWords.map((trait, i) => (
            <div
              key={i}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(8px, 1.6vw, 14px)',
                fontWeight: 500,
                color: textColor,
                opacity: 0.8,
                padding: 'clamp(2px, 0.4vw, 5px) clamp(6px, 1.2vw, 12px)',
                background: `${accentColor}15`,
                borderRadius: 12,
              }}
            >
              {trait}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-zodiac-sign',
  title: 'Zodiac Sign Card',
  description: 'Zodiac sign card with symbol, element, date range, and personality traits in a mystical dark purple/gold aesthetic',
  tags: ['scene', 'zodiac', 'astrology', 'horoscope', 'sign', 'mystical'],
  category: 'scene-layout',
  component: SceneZodiacSignComponent as any,
  defaultConfig: {
    signName: 'Aries',
    symbol: '♈',
    element: 'Fire',
    dateRange: 'Mar 21 – Apr 19',
    traits: 'Bold, Ambitious, Passionate',
    bgColor: '#1a1035',
    accentColor: '#d4a843',
    textColor: '#e8e0f0',
  },
  configSchema: [
    { key: 'signName', label: 'Sign Name', type: 'text', defaultValue: 'Aries', group: 'Content' },
    { key: 'symbol', label: 'Symbol Emoji', type: 'text', defaultValue: '♈', group: 'Content' },
    { key: 'element', label: 'Element', type: 'text', defaultValue: 'Fire', group: 'Content' },
    { key: 'dateRange', label: 'Date Range', type: 'text', defaultValue: 'Mar 21 – Apr 19', group: 'Content' },
    { key: 'traits', label: 'Traits (comma-separated)', type: 'text', defaultValue: 'Bold, Ambitious, Passionate', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1035', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#d4a843', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e8e0f0', group: 'Style' },
  ],
})
