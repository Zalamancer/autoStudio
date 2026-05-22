import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneCompatibilityConfig {
  sign1: string
  symbol1: string
  sign2: string
  symbol2: string
  percentage: number
  verdict: string
  bgColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number { const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2) }

function SceneCompatibilityComponent({ config, progress }: MotionGraphicProps<SceneCompatibilityConfig>) {
  const { sign1, symbol1, sign2, symbol2, percentage, verdict, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0
  const isHolding = progress >= 0.3 && progress < 0.8

  // Signs slide in from sides
  const sign1Enter = easeOutBack(Math.min(1, enterProgress * 1.5))
  const sign2Enter = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.1) * 1.5)))

  // Ring fills
  const ringEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.7)))
  const currentPercent = percentage * ringEnter
  const displayPercent = Math.round(currentPercent)

  // SVG ring
  const radius = 70
  const strokeWidth = 10
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - currentPercent / 100)

  // Heart glow pulse
  const heartGlow = isHolding ? 15 + Math.sin(holdProgress * Math.PI * 4) * 10 : 15

  // Verdict enters
  const verdictEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.3)))

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const exitScale = exitProgress > 0 ? 1 - exitProgress * 0.15 : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at center, ${bgColor} 0%, #0c0818 100%)` }} />

      {/* Floating hearts */}
      {Array.from({ length: 8 }).map((_, i) => {
        const x = 15 + (i * 10) % 70
        const baseY = 80 - (i * 13) % 60
        const floatY = isHolding ? Math.sin(holdProgress * Math.PI * 3 + i * 1.2) * 8 : 0
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${baseY + floatY}%`,
              fontSize: 'clamp(8px, 1.5vw, 14px)',
              opacity: enterProgress * 0.15 * exitOpacity,
            }}
          >
            ♥
          </div>
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
          gap: 'clamp(8px, 2vw, 20px)',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Signs row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(16px, 5vw, 50px)' }}>
          {/* Sign 1 */}
          <div
            style={{
              textAlign: 'center',
              transform: `translateX(${-40 * (1 - sign1Enter)}px)`,
              opacity: sign1Enter,
            }}
          >
            <div style={{ fontSize: 'clamp(32px, 8vw, 64px)', lineHeight: 1 }}>{symbol1}</div>
            <div
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: 'clamp(12px, 2.5vw, 22px)',
                fontWeight: 700,
                color: accentColor,
                marginTop: 6,
                letterSpacing: '0.05em',
              }}
            >
              {sign1}
            </div>
          </div>

          {/* Heart connector */}
          <div
            style={{
              fontSize: 'clamp(18px, 4vw, 32px)',
              opacity: Math.min(sign1Enter, sign2Enter) * 0.8,
              filter: `drop-shadow(0 0 ${heartGlow}px ${accentColor})`,
              color: accentColor,
            }}
          >
            ♥
          </div>

          {/* Sign 2 */}
          <div
            style={{
              textAlign: 'center',
              transform: `translateX(${40 * (1 - sign2Enter)}px)`,
              opacity: sign2Enter,
            }}
          >
            <div style={{ fontSize: 'clamp(32px, 8vw, 64px)', lineHeight: 1 }}>{symbol2}</div>
            <div
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: 'clamp(12px, 2.5vw, 22px)',
                fontWeight: 700,
                color: accentColor,
                marginTop: 6,
                letterSpacing: '0.05em',
              }}
            >
              {sign2}
            </div>
          </div>
        </div>

        {/* Compatibility ring */}
        <div style={{ position: 'relative', width: 'clamp(100px, 25vw, 200px)', height: 'clamp(100px, 25vw, 200px)' }}>
          <svg
            viewBox={`0 0 ${(radius + strokeWidth) * 2} ${(radius + strokeWidth) * 2}`}
            style={{ width: '100%', height: '100%' }}
          >
            <circle
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              fill="none"
              stroke={textColor}
              strokeWidth={strokeWidth}
              opacity={0.15}
            />
            <circle
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              fill="none"
              stroke={accentColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${radius + strokeWidth} ${radius + strokeWidth})`}
              style={{ filter: `drop-shadow(0 0 8px ${accentColor}66)` }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(22px, 5.5vw, 44px)',
              fontWeight: 900,
              color: '#FFFFFF',
              opacity: ringEnter,
            }}
          >
            {displayPercent}<span style={{ fontSize: '0.5em', opacity: 0.7 }}>%</span>
          </div>
        </div>

        {/* Verdict */}
        <div
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: 'clamp(14px, 3.5vw, 30px)',
            fontWeight: 700,
            color: accentColor,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            opacity: verdictEnter,
            transform: `translateY(${12 * (1 - verdictEnter)}px) scale(${0.85 + verdictEnter * 0.15})`,
            textShadow: `0 0 20px ${accentColor}44`,
          }}
        >
          {verdict}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-compatibility',
  title: 'Zodiac Compatibility',
  description: 'Zodiac compatibility card with two signs sliding in, animated percentage ring, and verdict reveal',
  tags: ['scene', 'zodiac', 'compatibility', 'love', 'astrology', 'percentage'],
  category: 'scene-layout',
  component: SceneCompatibilityComponent as any,
  defaultConfig: {
    sign1: 'Leo',
    symbol1: '♌',
    sign2: 'Sagittarius',
    symbol2: '♐',
    percentage: 92,
    verdict: 'Soulmates',
    bgColor: '#1a0c2e',
    accentColor: '#e85d75',
    textColor: '#f0e0f0',
  },
  configSchema: [
    { key: 'sign1', label: 'Sign 1', type: 'text', defaultValue: 'Leo', group: 'Content' },
    { key: 'symbol1', label: 'Symbol 1', type: 'text', defaultValue: '♌', group: 'Content' },
    { key: 'sign2', label: 'Sign 2', type: 'text', defaultValue: 'Sagittarius', group: 'Content' },
    { key: 'symbol2', label: 'Symbol 2', type: 'text', defaultValue: '♐', group: 'Content' },
    { key: 'percentage', label: 'Compatibility %', type: 'number', defaultValue: 92, min: 0, max: 100, group: 'Content' },
    { key: 'verdict', label: 'Verdict', type: 'text', defaultValue: 'Soulmates', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0c2e', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#e85d75', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f0e0f0', group: 'Style' },
  ],
})
