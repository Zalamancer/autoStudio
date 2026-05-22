import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneInvestmentReturnConfig {
  initialInvestment: number
  currentValue: number
  timePeriod: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function formatCurrency(n: number): string {
  if (Math.abs(n) >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M'
  if (Math.abs(n) >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K'
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function SceneInvestmentReturnComponent({ config, progress }: MotionGraphicProps<SceneInvestmentReturnConfig>) {
  const { initialInvestment, currentValue, timePeriod, bgColor, textColor, accentColor } = config

  const totalReturn = currentValue - initialInvestment
  const returnPct = initialInvestment > 0 ? (totalReturn / initialInvestment) * 100 : 0
  const isGain = totalReturn >= 0

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Growth arrow SVG path
  const arrowDrawProgress = easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7))

  // Hold: gentle pulse on current value
  const isHolding = progress >= 0.2 && progress < 0.8
  const pulseScale = isHolding ? 1 + Math.sin(holdProgress * Math.PI * 4) * 0.02 : 1

  const gainColor = isGain ? accentColor : '#ef4444'

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '8%',
        opacity: exitOpacity,
      }}>
        {/* Time period badge */}
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 'clamp(10px, 2vw, 14px)',
          fontWeight: 600,
          color: `${textColor}70`,
          background: `${textColor}08`,
          padding: '4px 14px',
          borderRadius: 20,
          marginBottom: 'clamp(14px, 3.5vw, 28px)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          opacity: easeOutCubic(enterProgress),
        }}>
          {timePeriod}
        </div>

        {/* Initial investment */}
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 'clamp(11px, 2vw, 14px)',
          fontWeight: 500,
          color: `${textColor}50`,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: 4,
          opacity: easeOutCubic(enterProgress),
        }}>
          Invested
        </div>
        <div style={{
          fontFamily: "'SF Mono', 'Fira Code', monospace",
          fontSize: 'clamp(18px, 4vw, 30px)',
          fontWeight: 700,
          color: `${textColor}90`,
          marginBottom: 'clamp(10px, 2.5vw, 20px)',
          opacity: easeOutCubic(enterProgress),
        }}>
          {formatCurrency(initialInvestment * easeOutCubic(enterProgress))}
        </div>

        {/* Growth arrow */}
        <svg
          viewBox="0 0 60 80"
          style={{
            width: 'clamp(30px, 6vw, 50px)',
            height: 'clamp(40px, 8vw, 66px)',
            marginBottom: 'clamp(6px, 1.5vw, 14px)',
            opacity: arrowDrawProgress,
          }}
        >
          {/* Shaft */}
          <line
            x1="30" y1="70" x2="30" y2={70 - 50 * arrowDrawProgress}
            stroke={gainColor}
            strokeWidth={4}
            strokeLinecap="round"
          />
          {/* Arrowhead */}
          {arrowDrawProgress > 0.6 && (
            <>
              <line
                x1="30" y1="20" x2="18" y2="36"
                stroke={gainColor}
                strokeWidth={4}
                strokeLinecap="round"
                opacity={(arrowDrawProgress - 0.6) / 0.4}
              />
              <line
                x1="30" y1="20" x2="42" y2="36"
                stroke={gainColor}
                strokeWidth={4}
                strokeLinecap="round"
                opacity={(arrowDrawProgress - 0.6) / 0.4}
              />
            </>
          )}
        </svg>

        {/* Current value (large) */}
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 'clamp(11px, 2vw, 14px)',
          fontWeight: 500,
          color: `${textColor}50`,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: 4,
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7)),
        }}>
          Current Value
        </div>
        <div style={{
          fontFamily: "'SF Mono', 'Fira Code', monospace",
          fontSize: 'clamp(28px, 7vw, 56px)',
          fontWeight: 800,
          color: gainColor,
          lineHeight: 1.1,
          textShadow: `0 0 24px ${gainColor}25`,
          transform: `scale(${pulseScale})`,
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7)),
        }}>
          {formatCurrency(currentValue * easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7)))}
        </div>

        {/* Return percentage */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 14px)',
          marginTop: 'clamp(10px, 2.5vw, 20px)',
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5)),
        }}>
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(14px, 3vw, 24px)',
            fontWeight: 700,
            color: gainColor,
            background: `${gainColor}12`,
            padding: '4px 14px',
            borderRadius: 10,
          }}>
            {isGain ? '+' : ''}{returnPct.toFixed(1)}%
          </span>
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(12px, 2.5vw, 18px)',
            fontWeight: 600,
            color: gainColor,
          }}>
            {isGain ? '+' : ''}{formatCurrency(totalReturn)}
          </span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-investment-return',
  title: 'Investment Return',
  description: 'Investment return display with initial vs current value, growth arrow, and total return percentage',
  tags: ['scene', 'finance', 'investment', 'return', 'growth', 'gains'],
  category: 'scene-layout',
  component: SceneInvestmentReturnComponent as any,
  defaultConfig: {
    initialInvestment: 10000,
    currentValue: 14750,
    timePeriod: '2 Years',
    bgColor: '#0f172a',
    textColor: '#e2e8f0',
    accentColor: '#00c087',
  },
  configSchema: [
    { key: 'initialInvestment', label: 'Initial Investment', type: 'number', defaultValue: 10000, min: 0, max: 999999999, group: 'Content' },
    { key: 'currentValue', label: 'Current Value', type: 'number', defaultValue: 14750, min: 0, max: 999999999, group: 'Content' },
    { key: 'timePeriod', label: 'Time Period', type: 'text', defaultValue: '2 Years', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#00c087', group: 'Style' },
  ],
})
