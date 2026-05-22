import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScenePortfolioBreakdownConfig {
  segments: string[]
  colors: string[]
  title: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function parseSegment(s: string): { label: string; value: number } {
  const parts = s.split(':')
  return { label: (parts[0] || '').trim(), value: parseFloat(parts[1] || '0') }
}

function ScenePortfolioBreakdownComponent({ config, progress }: MotionGraphicProps<ScenePortfolioBreakdownConfig>) {
  const { segments, colors, title, bgColor, textColor } = config

  const parsed = segments.map(parseSegment)
  const total = parsed.reduce((sum, s) => sum + s.value, 0) || 1

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Donut chart params
  const cx = 150
  const cy = 150
  const radius = 110
  const strokeWidth = 35
  const circumference = 2 * Math.PI * radius

  // Hold: subtle rotation
  const isHolding = progress >= 0.25 && progress < 0.8
  const holdRotation = isHolding ? holdProgress * 6 : 0

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '6% 8%',
        opacity: exitOpacity,
      }}>
        {/* Title */}
        <div style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(16px, 3.5vw, 28px)',
          fontWeight: 700,
          color: textColor,
          marginBottom: 'clamp(12px, 3vw, 28px)',
          opacity: easeOutCubic(enterProgress),
          letterSpacing: '-0.01em',
        }}>
          {title}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 'clamp(20px, 5vw, 48px)',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {/* Donut Chart */}
          <div style={{ position: 'relative' }}>
            <svg
              width={cx * 2}
              height={cy * 2}
              viewBox={`0 0 ${cx * 2} ${cy * 2}`}
              style={{
                transform: `rotate(${-90 + holdRotation}deg)`,
                width: 'clamp(160px, 35vw, 260px)',
                height: 'clamp(160px, 35vw, 260px)',
              }}
            >
              {/* Background track */}
              <circle
                cx={cx} cy={cy} r={radius}
                fill="none"
                stroke={`${textColor}08`}
                strokeWidth={strokeWidth}
              />
              {/* Segments */}
              {parsed.map((seg, i) => {
                const fraction = seg.value / total
                const dashLen = circumference * fraction

                let prevSum = 0
                for (let j = 0; j < i; j++) {
                  prevSum += parsed[j].value / total
                }

                const stagger = i * 0.15
                const segEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger))))
                const animatedDash = dashLen * segEnter
                const color = colors[i % colors.length] || '#6366f1'

                return (
                  <circle
                    key={i}
                    cx={cx} cy={cy} r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${animatedDash} ${circumference - animatedDash}`}
                    strokeDashoffset={-circumference * prevSum}
                    strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 6px ${color}30)` }}
                  />
                )
              })}
            </svg>

            {/* Center total */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              opacity: easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7)),
            }}>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(10px, 1.8vw, 13px)',
                fontWeight: 500,
                color: `${textColor}60`,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}>
                Total
              </div>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(16px, 3.5vw, 28px)',
                fontWeight: 800,
                color: textColor,
              }}>
                100%
              </div>
            </div>
          </div>

          {/* Legend */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            gap: 'clamp(6px, 1.5vw, 12px)',
          }}>
            {parsed.map((seg, i) => {
              const stagger = i * 0.12
              const labelEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - stagger - 0.3) / 0.5)))
              const color = colors[i % colors.length] || '#6366f1'
              const pct = Math.round((seg.value / total) * 100)

              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center',
                  gap: 'clamp(6px, 1.5vw, 12px)',
                  opacity: labelEnter,
                  transform: `translateX(${12 * (1 - labelEnter)}px)`,
                }}>
                  <div style={{
                    width: 'clamp(10px, 2vw, 16px)',
                    height: 'clamp(10px, 2vw, 16px)',
                    borderRadius: 4,
                    background: color,
                    flexShrink: 0,
                  }} />
                  <div style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 'clamp(12px, 2.2vw, 18px)',
                    fontWeight: 600,
                    color: textColor,
                  }}>
                    {seg.label}
                  </div>
                  <div style={{
                    fontFamily: "'SF Mono', monospace",
                    fontSize: 'clamp(12px, 2vw, 16px)',
                    fontWeight: 700,
                    color: color,
                    marginLeft: 'auto',
                    paddingLeft: 'clamp(8px, 2vw, 16px)',
                  }}>
                    {Math.round(pct * easeOutCubic(enterProgress))}%
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-portfolio-breakdown',
  title: 'Portfolio Breakdown',
  description: 'Animated donut chart showing portfolio allocation with percentage labels for stocks, bonds, crypto, and cash',
  tags: ['scene', 'finance', 'portfolio', 'allocation', 'donut', 'chart', 'investing'],
  category: 'scene-layout',
  component: ScenePortfolioBreakdownComponent as any,
  defaultConfig: {
    segments: ['Stocks:50', 'Bonds:20', 'Crypto:15', 'Cash:10', 'Real Estate:5'],
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
    title: 'Portfolio Allocation',
    bgColor: '#0f172a',
    textColor: '#e2e8f0',
  },
  configSchema: [
    { key: 'segments', label: 'Segments (Label:Percent)', type: 'text-array', defaultValue: ['Stocks:50', 'Bonds:20', 'Crypto:15', 'Cash:10', 'Real Estate:5'], group: 'Content' },
    { key: 'colors', label: 'Segment Colors', type: 'text-array', defaultValue: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'], group: 'Style' },
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Portfolio Allocation', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
})
