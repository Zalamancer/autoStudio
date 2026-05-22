import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneScoreCardConfig {
  metrics: string[]
  bgColor: string
  cardColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function parseMetric(s: string): { icon: string; rawValue: string; numericValue: number; suffix: string; label: string; trend: string } {
  const parts = s.split(':')
  const icon = (parts[0] || '').trim()
  const rawValue = (parts[1] || '0').trim()
  const label = (parts[2] || '').trim()
  const trend = (parts[3] || '').trim().toLowerCase()

  const match = rawValue.match(/^([\d,.]+)\s*(.*)$/)
  if (match) {
    const num = parseFloat(match[1].replace(/,/g, ''))
    return { icon, rawValue, numericValue: isNaN(num) ? 0 : num, suffix: match[2] || '', label, trend }
  }
  return { icon, rawValue, numericValue: 0, suffix: '', label, trend }
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  if (Number.isInteger(n)) return n.toLocaleString('en-US')
  return n.toFixed(1)
}

function SceneScoreCardComponent({ config, progress }: MotionGraphicProps<SceneScoreCardConfig>) {
  const { metrics, bgColor, cardColor, textColor } = config

  const parsed = metrics.map(parseMetric)
  const cols = parsed.length <= 2 ? parsed.length : 2

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Card slide in
  const cardEnter = easeOutBack(Math.min(1, enterProgress / 0.4))
  const cardSlideY = (1 - cardEnter) * 60

  // Hold: subtle float
  const isHolding = progress >= 0.25 && progress < 0.8
  const floatY = isHolding ? Math.sin(holdProgress * Math.PI * 3) * 4 : 0

  // Exit: card slides out
  const exitEased = easeInCubic(exitProgress)
  const exitSlideY = exitProgress > 0 ? exitEased * 80 : 0
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8%',
        }}
      >
        {/* Card */}
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(12px, 2vw, 24px)',
            padding: 'clamp(16px, 3vw, 36px)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)',
            width: '100%',
            maxWidth: 520,
            opacity: exitOpacity * cardEnter,
            transform: `translateY(${cardSlideY + floatY + exitSlideY}px)`,
          }}
        >
          {/* Metrics grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gap: 'clamp(12px, 2.5vw, 28px)',
            }}
          >
            {parsed.map((metric, i) => {
              const stagger = i * 0.12
              const metricEnter = Math.max(0, Math.min(1, (enterProgress - 0.35 - stagger) / 0.5))
              const countEased = easeOutCubic(metricEnter)
              const currentNum = metric.numericValue * countEased
              const displayNum = countEased >= 1 ? formatNumber(metric.numericValue) : formatNumber(Math.floor(currentNum))

              const trendColor = metric.trend === 'up' ? '#10b981' : metric.trend === 'down' ? '#ef4444' : '#94a3b8'
              const trendArrow = metric.trend === 'up' ? '\u2191' : metric.trend === 'down' ? '\u2193' : ''

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'clamp(2px, 0.5vw, 6px)',
                    opacity: easeOutCubic(metricEnter),
                    transform: `translateY(${12 * (1 - easeOutCubic(metricEnter))}px)`,
                  }}
                >
                  {/* Icon */}
                  <div style={{ fontSize: 'clamp(20px, 3.5vw, 36px)', lineHeight: 1 }}>
                    {metric.icon}
                  </div>

                  {/* Value + trend */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 'clamp(4px, 0.6vw, 8px)' }}>
                    <span
                      style={{
                        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                        fontSize: 'clamp(18px, 4vw, 36px)',
                        fontWeight: 800,
                        color: textColor,
                        lineHeight: 1.1,
                      }}
                    >
                      {displayNum}
                      {metric.suffix && <span style={{ fontSize: '0.55em', opacity: 0.7 }}>{metric.suffix}</span>}
                    </span>
                    {trendArrow && (
                      <span
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: 'clamp(12px, 2vw, 20px)',
                          fontWeight: 700,
                          color: trendColor,
                        }}
                      >
                        {trendArrow}
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <div
                    style={{
                      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                      fontSize: 'clamp(9px, 1.3vw, 13px)',
                      fontWeight: 500,
                      color: `${textColor}90`,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {metric.label}
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
  id: 'tpl-scene-score-card',
  title: 'Score Card',
  description: 'Multi-metric dashboard card with staggered counting numbers, trend indicators, and floating animation',
  tags: ['scene', 'data', 'scorecard', 'dashboard', 'kpi', 'metrics'],
  category: 'scene-layout',
  component: SceneScoreCardComponent as any,
  defaultConfig: {
    metrics: [
      '\u{1F4C8}:12.5K:Revenue:up',
      '\u{1F465}:8.2K:Users:up',
      '\u{1F4E6}:340:Orders:down',
      '\u2B50:4.8:Rating:up',
    ],
    bgColor: '#0f172a',
    cardColor: '#1e293b',
    textColor: '#e2e8f0',
  },
  configSchema: [
    { key: 'metrics', label: 'Metrics (Icon:Value:Label:Trend)', type: 'text-array', defaultValue: ['\u{1F4C8}:12.5K:Revenue:up', '\u{1F465}:8.2K:Users:up', '\u{1F4E6}:340:Orders:down', '\u2B50:4.8:Rating:up'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1e293b', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
})
