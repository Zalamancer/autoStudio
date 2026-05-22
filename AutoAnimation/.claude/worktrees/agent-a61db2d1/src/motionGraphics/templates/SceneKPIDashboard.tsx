import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneKPIDashboardConfig {
  kpis: string[]
  title: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function parseKPI(s: string): { label: string; value: string; trend: string } {
  const parts = s.split(':')
  return { label: (parts[0] || '').trim(), value: (parts[1] || '0').trim(), trend: (parts[2] || '+0%').trim() }
}

function SceneKPIDashboardComponent({ config, progress }: MotionGraphicProps<SceneKPIDashboardConfig>) {
  const { kpis, title, bgColor, textColor, accentColor } = config
  const parsed = kpis.map(parseKPI)

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      {/* Subtle dot grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: `radial-gradient(${textColor} 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        padding: '6% 8%',
        opacity: exitOpacity,
      }}>
        {/* Header */}
        <div style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(14px, 3vw, 24px)',
          fontWeight: 700,
          color: textColor,
          marginBottom: 'clamp(4px, 1vw, 10px)',
          opacity: easeOutCubic(enterProgress),
          letterSpacing: '-0.01em',
        }}>
          {title}
        </div>
        {/* Separator line */}
        <div style={{
          height: 2,
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}40, transparent)`,
          marginBottom: 'clamp(12px, 3vw, 28px)',
          transform: `scaleX(${easeOutCubic(enterProgress)})`,
          transformOrigin: 'left',
        }} />

        {/* KPI Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: parsed.length <= 2 ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)',
          gap: 'clamp(10px, 2.5vw, 22px)',
          flex: 1,
          alignContent: 'center',
        }}>
          {parsed.map((kpi, i) => {
            const stagger = i * 0.12
            const cardEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger))))
            const isUp = kpi.trend.startsWith('+')
            const trendColor = isUp ? '#10B981' : '#EF4444'

            // Parse numeric value for counting animation
            const numMatch = kpi.value.match(/[\d,.]+/)
            const targetNum = numMatch ? parseFloat(numMatch[0].replace(/,/g, '')) : 0
            const prefix = kpi.value.substring(0, kpi.value.indexOf(numMatch?.[0] || ''))
            const suffix = kpi.value.substring((kpi.value.indexOf(numMatch?.[0] || '') || 0) + (numMatch?.[0]?.length || 0))
            const countedNum = targetNum * cardEnter
            const displayVal = numMatch
              ? `${prefix}${countedNum >= 1000 ? Math.round(countedNum).toLocaleString() : countedNum.toFixed(kpi.value.includes('.') ? 1 : 0)}${suffix}`
              : kpi.value

            // Hold: subtle pulse
            const holdPulse = progress >= 0.2 && progress < 0.8 ? 1 + Math.sin(holdProgress * Math.PI * 4 + i) * 0.01 : 1

            return (
              <div key={i} style={{
                background: `${textColor}06`,
                borderRadius: 'clamp(8px, 1.5vw, 14px)',
                padding: 'clamp(12px, 2.5vw, 24px)',
                border: `1px solid ${textColor}08`,
                opacity: cardEnter,
                transform: `translateY(${(1 - cardEnter) * 20}px) scale(${holdPulse})`,
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(4px, 1vw, 10px)',
              }}>
                {/* Label */}
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(9px, 1.8vw, 13px)',
                  fontWeight: 500,
                  color: `${textColor}70`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}>
                  {kpi.label}
                </div>
                {/* Value */}
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(22px, 5vw, 40px)',
                  fontWeight: 800,
                  color: textColor,
                  lineHeight: 1.1,
                }}>
                  {displayVal}
                </div>
                {/* Trend */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <span style={{
                    fontSize: 'clamp(10px, 2vw, 14px)',
                    color: trendColor,
                  }}>
                    {isUp ? '\u2191' : '\u2193'}
                  </span>
                  <span style={{
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                    fontSize: 'clamp(10px, 1.8vw, 14px)',
                    fontWeight: 600,
                    color: trendColor,
                  }}>
                    {kpi.trend}
                  </span>
                </div>
                {/* Mini sparkline bar */}
                <div style={{
                  height: 3,
                  borderRadius: 2,
                  background: `${textColor}10`,
                  overflow: 'hidden',
                  marginTop: 'auto',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${cardEnter * (60 + (i * 17) % 35)}%`,
                    background: `linear-gradient(90deg, ${accentColor}, ${trendColor})`,
                    borderRadius: 2,
                  }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer timestamp */}
        <div style={{
          fontFamily: "'SF Mono', monospace",
          fontSize: 'clamp(8px, 1.4vw, 11px)',
          color: `${textColor}30`,
          marginTop: 'clamp(8px, 2vw, 16px)',
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.6) / 0.4)),
        }}>
          Last updated: Today 09:41 AM
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-kpi-dashboard',
  title: 'KPI Dashboard',
  description: 'Key performance indicators dashboard with animated counter values, trend arrows, mini sparkline bars, and staggered card entrance.',
  tags: ['scene', 'kpi', 'dashboard', 'analytics', 'metrics', 'business', 'marketing', 'data'],
  category: 'scene-layout',
  component: SceneKPIDashboardComponent as any,
  defaultConfig: {
    kpis: ['Revenue:$124,500:+12.3%', 'Customers:8,420:+8.7%', 'Conversion:3.2%:+0.4%', 'Avg Order:$47.80:-2.1%'],
    title: 'Q4 Performance Dashboard',
    bgColor: '#0f172a',
    textColor: '#e2e8f0',
    accentColor: '#3B82F6',
  },
  configSchema: [
    { key: 'kpis', label: 'KPIs (Label:Value:Trend)', type: 'text-array', defaultValue: ['Revenue:$124,500:+12.3%', 'Customers:8,420:+8.7%', 'Conversion:3.2%:+0.4%', 'Avg Order:$47.80:-2.1%'], group: 'Content' },
    { key: 'title', label: 'Dashboard Title', type: 'text', defaultValue: 'Q4 Performance Dashboard', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#3B82F6', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
})
