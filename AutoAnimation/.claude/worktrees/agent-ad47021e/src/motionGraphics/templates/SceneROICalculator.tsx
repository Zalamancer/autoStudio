import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneROICalculatorConfig {
  investment: number
  revenue: number
  timeframe: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function formatMoney(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

function SceneROICalculatorComponent({ config, progress }: MotionGraphicProps<SceneROICalculatorConfig>) {
  const { investment, revenue, timeframe, bgColor, textColor, accentColor } = config

  const profit = revenue - investment
  const roiPercent = investment > 0 ? ((profit / investment) * 100) : 0
  const isPositive = profit >= 0

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Counting animations
  const countEnter = easeOutCubic(enterProgress)
  const countedInvestment = investment * countEnter
  const countedRevenue = revenue * countEnter
  const countedProfit = profit * countEnter
  const countedROI = roiPercent * countEnter

  // Gauge angle (0-180 degrees for the semicircle)
  const gaugeAngle = Math.min(180, (Math.abs(roiPercent) / 500) * 180) * countEnter

  const holdPulse = progress >= 0.25 && progress < 0.8 ? 1 + Math.sin(holdProgress * Math.PI * 3) * 0.008 : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      {/* Background accent */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '80%',
        height: '80%',
        borderRadius: '50%',
        background: `radial-gradient(ellipse, ${accentColor}06, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '6% 8%',
        opacity: exitOpacity,
        transform: `scale(${holdPulse})`,
      }}>
        {/* Title */}
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 'clamp(14px, 3vw, 22px)',
          fontWeight: 700,
          color: textColor,
          marginBottom: 'clamp(4px, 1vw, 8px)',
          opacity: easeOutCubic(enterProgress),
        }}>
          ROI Calculator
        </div>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 'clamp(9px, 1.6vw, 12px)',
          fontWeight: 500,
          color: `${textColor}50`,
          marginBottom: 'clamp(16px, 4vw, 32px)',
          opacity: easeOutCubic(enterProgress),
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          {timeframe}
        </div>

        {/* ROI Gauge */}
        <div style={{ position: 'relative', marginBottom: 'clamp(16px, 4vw, 32px)' }}>
          <svg
            viewBox="0 0 200 110"
            style={{ width: 'clamp(160px, 38vw, 260px)', height: 'auto' }}
          >
            {/* Background arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={`${textColor}10`}
              strokeWidth={12}
              strokeLinecap="round"
            />
            {/* Filled arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={isPositive ? '#10B981' : '#EF4444'}
              strokeWidth={12}
              strokeLinecap="round"
              strokeDasharray={`${gaugeAngle * 1.4} 999`}
              style={{ filter: `drop-shadow(0 0 8px ${isPositive ? '#10B981' : '#EF4444'}30)` }}
            />
            {/* Needle */}
            <line
              x1="100"
              y1="100"
              x2={100 + Math.cos((Math.PI * (180 - gaugeAngle)) / 180) * 60}
              y2={100 - Math.sin((Math.PI * (180 - gaugeAngle)) / 180) * 60}
              stroke={textColor}
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.6}
            />
            <circle cx="100" cy="100" r="4" fill={textColor} opacity={0.4} />
          </svg>
          {/* ROI value in center */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: "'SF Mono', monospace",
              fontSize: 'clamp(24px, 6vw, 44px)',
              fontWeight: 900,
              color: isPositive ? '#10B981' : '#EF4444',
              lineHeight: 1,
            }}>
              {isPositive ? '+' : ''}{countedROI.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Metric cards */}
        <div style={{
          display: 'flex',
          gap: 'clamp(8px, 2vw, 16px)',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          {[
            { label: 'Invested', value: formatMoney(countedInvestment), color: `${textColor}90` },
            { label: 'Revenue', value: formatMoney(countedRevenue), color: accentColor },
            { label: 'Profit', value: `${isPositive ? '+' : ''}${formatMoney(countedProfit)}`, color: isPositive ? '#10B981' : '#EF4444' },
          ].map((item, i) => {
            const stagger = i * 0.12
            const cardEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - stagger - 0.2) / 0.6)))
            return (
              <div key={i} style={{
                background: `${textColor}06`,
                borderRadius: 'clamp(6px, 1vw, 10px)',
                padding: 'clamp(8px, 2vw, 16px) clamp(12px, 3vw, 22px)',
                textAlign: 'center',
                border: `1px solid ${textColor}08`,
                opacity: cardEnter,
                transform: `translateY(${(1 - cardEnter) * 12}px)`,
                minWidth: 'clamp(70px, 18vw, 110px)',
              }}>
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(8px, 1.4vw, 11px)',
                  fontWeight: 500,
                  color: `${textColor}50`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 4,
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontFamily: "'SF Mono', monospace",
                  fontSize: 'clamp(14px, 3vw, 22px)',
                  fontWeight: 800,
                  color: item.color,
                }}>
                  {item.value}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-roi-calculator',
  title: 'ROI Calculator',
  description: 'Return on investment display with animated semicircle gauge, needle indicator, counting values, and investment/revenue/profit metric cards.',
  tags: ['scene', 'roi', 'calculator', 'finance', 'investment', 'analytics', 'business', 'marketing'],
  category: 'scene-layout',
  component: SceneROICalculatorComponent as any,
  defaultConfig: {
    investment: 25000,
    revenue: 87000,
    timeframe: '12-Month Period',
    accentColor: '#3B82F6',
    bgColor: '#0f172a',
    textColor: '#e2e8f0',
  },
  configSchema: [
    { key: 'investment', label: 'Investment ($)', type: 'number', defaultValue: 25000, min: 0, max: 10000000, group: 'Content' },
    { key: 'revenue', label: 'Revenue ($)', type: 'number', defaultValue: 87000, min: 0, max: 10000000, group: 'Content' },
    { key: 'timeframe', label: 'Timeframe', type: 'text', defaultValue: '12-Month Period', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#3B82F6', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
})
