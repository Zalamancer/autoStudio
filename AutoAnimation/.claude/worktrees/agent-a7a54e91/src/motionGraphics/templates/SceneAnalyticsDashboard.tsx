import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AnalyticsDashboardConfig {
  views: number
  likes: number
  shares: number
  comments: number
  bgColor: string
  accentColor: string
  cardColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function formatNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(Math.round(n))
}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function SceneAnalyticsDashboardComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<AnalyticsDashboardConfig>) {
  const { views, likes, shares, comments, bgColor, accentColor, cardColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Header
  const headerFade = easeOutCubic(Math.min(1, enterProgress / 0.25))

  const metrics = [
    { label: 'Views', value: views, icon: '👁️', color: '#60A5FA' },
    { label: 'Likes', value: likes, icon: '❤️', color: '#F43F5E' },
    { label: 'Shares', value: shares, icon: '🔄', color: '#10B981' },
    { label: 'Comments', value: comments, icon: '💬', color: '#F59E0B' },
  ]

  // Each metric card animates in
  const getMetricProgress = (idx: number): number => {
    const delay = 0.15 + idx * 0.12
    return easeOutBack(Math.max(0, Math.min(1, (enterProgress - delay) / 0.3)))
  }

  // Count-up
  const countProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.6)))

  // Chart bars animation
  const chartProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.4)))

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.1

  // Engagement chart data (7 days)
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const base = 0.3 + seededRand(i * 41 + 7) * 0.7
    return base
  })
  const maxChart = Math.max(...chartData)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: '5%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(14px, 2.5vh, 24px)',
          width: '100%',
          maxWidth: 460,
          transform: `scale(${exitScale})`,
          opacity: exitOpacity,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            opacity: headerFade,
            transform: `translateY(${(1 - headerFade) * -15}px)`,
          }}
        >
          <div>
            <div style={{ fontSize: 'clamp(16px, 3vw, 24px)', fontWeight: 900, color: textColor }}>
              Analytics
            </div>
            <div style={{ fontSize: 'clamp(9px, 1.4vw, 12px)', fontWeight: 500, color: `${textColor}60` }}>
              Last 7 days performance
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#10B98120',
              borderRadius: 8,
              padding: '4px 10px',
              fontSize: 'clamp(9px, 1.3vw, 12px)',
              fontWeight: 700,
              color: '#10B981',
            }}
          >
            <span style={{ transform: 'rotate(-45deg)', display: 'inline-block' }}>{'→'}</span>
            +24%
          </div>
        </div>

        {/* Metrics grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'clamp(8px, 1.5vh, 14px)',
          }}
        >
          {metrics.map((m, i) => {
            const mp = getMetricProgress(i)
            const isActive = holdProgress > 0 && Math.floor(holdProgress * 4) % 4 === i
            const pulse = isActive ? 1 + Math.sin(holdProgress * Math.PI * 8) * 0.03 : 1

            return (
              <div
                key={i}
                style={{
                  background: cardColor,
                  borderRadius: 'clamp(10px, 1.5vw, 14px)',
                  padding: 'clamp(12px, 2vh, 18px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  transform: `scale(${mp * pulse})`,
                  opacity: mp,
                  border: isActive ? `1px solid ${m.color}40` : `1px solid ${textColor}08`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'clamp(16px, 2.5vw, 22px)' }}>{m.icon}</span>
                  <span
                    style={{
                      fontSize: 'clamp(8px, 1.2vw, 10px)',
                      fontWeight: 600,
                      color: m.color,
                      background: `${m.color}15`,
                      borderRadius: 6,
                      padding: '2px 6px',
                    }}
                  >
                    +{Math.round(seededRand(i * 71) * 30 + 5)}%
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 'clamp(20px, 4vw, 32px)',
                    fontWeight: 900,
                    color: textColor,
                    lineHeight: 1,
                  }}
                >
                  {formatNum(countProgress * m.value)}
                </div>
                <div
                  style={{
                    fontSize: 'clamp(9px, 1.3vw, 11px)',
                    fontWeight: 500,
                    color: `${textColor}60`,
                  }}
                >
                  {m.label}
                </div>
              </div>
            )
          })}
        </div>

        {/* Engagement chart */}
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(10px, 1.5vw, 14px)',
            padding: 'clamp(12px, 2vh, 18px)',
            opacity: chartProgress,
            transform: `translateY(${(1 - chartProgress) * 20}px)`,
            border: `1px solid ${textColor}08`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(10px, 1.6vw, 13px)',
              fontWeight: 700,
              color: `${textColor}80`,
              marginBottom: 'clamp(8px, 1.5vh, 14px)',
            }}
          >
            Engagement Trend
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 'clamp(4px, 0.8vw, 8px)',
              height: 'clamp(50px, 10vh, 80px)',
            }}
          >
            {chartData.map((val, i) => {
              const barH = (val / maxChart) * 100 * chartProgress
              const isToday = i === chartData.length - 1
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: `${barH}%`,
                      borderRadius: 'clamp(3px, 0.5vw, 5px)',
                      background: isToday
                        ? `linear-gradient(180deg, ${accentColor}, ${accentColor}80)`
                        : `${accentColor}30`,
                      minHeight: 4,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 'clamp(7px, 1vw, 9px)',
                      color: `${textColor}40`,
                      fontWeight: 500,
                    }}
                  >
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                  </span>
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
  id: 'tpl-scene-analytics-dashboard',
  title: 'Scene Analytics Dashboard',
  description:
    'Creator analytics dashboard with metric cards, count-up numbers, engagement chart bars, and growth indicators.',
  tags: ['scene', 'social-media', 'analytics', 'dashboard', 'metrics', 'creator', 'data'],
  category: 'scene-layout',
  component: SceneAnalyticsDashboardComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'views', label: 'Views', type: 'number', defaultValue: 125000, min: 0, max: 100000000, group: 'Content' },
    { key: 'likes', label: 'Likes', type: 'number', defaultValue: 8400, min: 0, max: 100000000, group: 'Content' },
    { key: 'shares', label: 'Shares', type: 'number', defaultValue: 2100, min: 0, max: 100000000, group: 'Content' },
    { key: 'comments', label: 'Comments', type: 'number', defaultValue: 940, min: 0, max: 100000000, group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#8B5CF6', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#161625', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A14', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
  defaultConfig: {
    views: 125000,
    likes: 8400,
    shares: 2100,
    comments: 940,
    accentColor: '#8B5CF6',
    cardColor: '#161625',
    bgColor: '#0A0A14',
    textColor: '#FFFFFF',
  },
})
