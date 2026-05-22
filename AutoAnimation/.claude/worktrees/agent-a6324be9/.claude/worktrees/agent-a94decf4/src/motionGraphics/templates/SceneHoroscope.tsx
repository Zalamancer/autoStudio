import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneHoroscopeConfig {
  sign: string
  symbol: string
  date: string
  horoscope: string
  luckyNumber: string
  luckyColor: string
  bgColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

// Constellation dot positions (simplified pattern)
const CONSTELLATION_DOTS = [
  { x: 25, y: 18 }, { x: 35, y: 25 }, { x: 45, y: 15 },
  { x: 55, y: 28 }, { x: 65, y: 20 }, { x: 72, y: 30 },
  { x: 40, y: 35 }, { x: 58, y: 38 },
]
const CONSTELLATION_LINES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [1, 6], [3, 7],
]

function SceneHoroscopeComponent({ config, progress }: MotionGraphicProps<SceneHoroscopeConfig>) {
  const { sign, symbol, date, horoscope, luckyNumber, luckyColor, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0
  const isHolding = progress >= 0.3 && progress < 0.8

  // Constellation dots connect during enter
  const dotsRevealed = Math.floor(easeOutCubic(Math.min(1, enterProgress * 1.5)) * CONSTELLATION_DOTS.length)
  const linesRevealed = Math.floor(easeOutCubic(Math.min(1, enterProgress * 1.2)) * CONSTELLATION_LINES.length)

  // Word-by-word horoscope reveal
  const words = horoscope.split(/\s+/)
  const wordsRevealed = enterProgress < 1
    ? Math.floor(easeOutCubic(enterProgress) * words.length)
    : words.length

  // Staggered info reveals
  const signEnter = easeOutCubic(Math.min(1, enterProgress * 2))
  const dateEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.6)))
  const luckyEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.3)))

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg, ${bgColor} 0%, #0a0a20 100%)` }} />

      {/* Constellation SVG */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: exitOpacity * 0.4 }}>
        {CONSTELLATION_LINES.slice(0, linesRevealed).map(([a, b], i) => {
          const dotA = CONSTELLATION_DOTS[a]
          const dotB = CONSTELLATION_DOTS[b]
          return (
            <line
              key={`l-${i}`}
              x1={`${dotA.x}%`}
              y1={`${dotA.y}%`}
              x2={`${dotB.x}%`}
              y2={`${dotB.y}%`}
              stroke={accentColor}
              strokeWidth={1}
              opacity={0.3}
            />
          )
        })}
        {CONSTELLATION_DOTS.slice(0, dotsRevealed).map((dot, i) => {
          const twinkle = isHolding ? 0.6 + Math.sin(holdProgress * Math.PI * 6 + i * 2) * 0.4 : 0.6
          return (
            <circle
              key={`d-${i}`}
              cx={`${dot.x}%`}
              cy={`${dot.y}%`}
              r={3}
              fill={accentColor}
              opacity={twinkle}
            />
          )
        })}
      </svg>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8% 8%',
          gap: 'clamp(4px, 1vw, 12px)',
          opacity: exitOpacity,
        }}
      >
        {/* Sign header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.5vw, 14px)', opacity: signEnter }}>
          <span style={{ fontSize: 'clamp(24px, 6vw, 48px)' }}>{symbol}</span>
          <div
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(20px, 5vw, 42px)',
              fontWeight: 700,
              color: accentColor,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {sign}
          </div>
        </div>

        {/* Date */}
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(9px, 1.8vw, 15px)',
            color: textColor,
            opacity: dateEnter * 0.6,
            letterSpacing: '0.08em',
          }}
        >
          {date}
        </div>

        {/* Divider */}
        <div
          style={{
            width: 'clamp(30px, 8vw, 60px)',
            height: 1,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            opacity: dateEnter * 0.4,
            margin: 'clamp(2px, 0.5vw, 6px) 0',
          }}
        />

        {/* Horoscope text word-by-word */}
        <div
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: 'clamp(12px, 2.8vw, 26px)',
            fontWeight: 400,
            color: textColor,
            lineHeight: 1.7,
            textAlign: 'center',
            maxWidth: '85%',
          }}
        >
          {words.map((word, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: i < wordsRevealed ? 1 : 0,
                transform: i < wordsRevealed ? 'translateY(0)' : 'translateY(6px)',
                marginRight: '0.25em',
              }}
            >
              {word}
            </span>
          ))}
        </div>

        {/* Lucky info */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(12px, 3vw, 28px)',
            marginTop: 'clamp(6px, 1.5vw, 16px)',
            opacity: luckyEnter,
            transform: `translateY(${10 * (1 - luckyEnter)}px)`,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(8px, 1.4vw, 11px)', color: textColor, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Lucky #</div>
            <div style={{ fontFamily: "'Georgia', serif", fontSize: 'clamp(16px, 3.5vw, 28px)', fontWeight: 700, color: accentColor }}>{luckyNumber}</div>
          </div>
          <div style={{ width: 1, background: `${accentColor}33` }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(8px, 1.4vw, 11px)', color: textColor, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Lucky Color</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 4 }}>
              <div style={{ width: 'clamp(10px, 2vw, 16px)', height: 'clamp(10px, 2vw, 16px)', borderRadius: '50%', background: luckyColor, border: '1px solid rgba(255,255,255,0.2)' }} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(10px, 2vw, 16px)', color: textColor, fontWeight: 500 }}>{luckyColor}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-horoscope',
  title: 'Daily Horoscope',
  description: 'Daily horoscope card with constellation dots connecting, word-by-word text reveal, lucky number and color',
  tags: ['scene', 'horoscope', 'astrology', 'zodiac', 'daily', 'celestial'],
  category: 'scene-layout',
  component: SceneHoroscopeComponent as any,
  defaultConfig: {
    sign: 'Leo',
    symbol: '♌',
    date: 'March 19, 2026',
    horoscope: 'The stars align in your favor today. Trust your instincts and take bold steps toward your dreams. A surprising connection may open new doors.',
    luckyNumber: '7',
    luckyColor: '#FFD700',
    bgColor: '#12102a',
    accentColor: '#c9a96e',
    textColor: '#e8e0f0',
  },
  configSchema: [
    { key: 'sign', label: 'Sign', type: 'text', defaultValue: 'Leo', group: 'Content' },
    { key: 'symbol', label: 'Symbol', type: 'text', defaultValue: '♌', group: 'Content' },
    { key: 'date', label: 'Date', type: 'text', defaultValue: 'March 19, 2026', group: 'Content' },
    { key: 'horoscope', label: 'Horoscope Text', type: 'text', defaultValue: 'The stars align in your favor today. Trust your instincts and take bold steps toward your dreams.', group: 'Content' },
    { key: 'luckyNumber', label: 'Lucky Number', type: 'text', defaultValue: '7', group: 'Content' },
    { key: 'luckyColor', label: 'Lucky Color', type: 'color', defaultValue: '#FFD700', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#12102a', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#c9a96e', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e8e0f0', group: 'Style' },
  ],
})
