import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneProfitLossConfig {
  revenue: number
  expenses: number
  title: string
  period: string
  bgColor: string
  textColor: string
  profitColor: string
  lossColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function formatCurrency(n: number): string {
  if (Math.abs(n) >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M'
  if (Math.abs(n) >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K'
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function SceneProfitLossComponent({ config, progress }: MotionGraphicProps<SceneProfitLossConfig>) {
  const { revenue, expenses, title, period, bgColor, textColor, profitColor, lossColor } = config

  const netAmount = revenue - expenses
  const isProfit = netAmount >= 0
  const netColor = isProfit ? profitColor : lossColor

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Staggered line items
  const lineItems = [
    { label: 'Revenue', value: revenue, color: profitColor, delay: 0 },
    { label: 'Expenses', value: -expenses, color: lossColor, delay: 0.15 },
  ]

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
        {/* Card */}
        <div style={{
          background: `${textColor}05`,
          borderRadius: 'clamp(12px, 3vw, 20px)',
          padding: 'clamp(20px, 5vw, 44px)',
          border: `1px solid ${textColor}10`,
          width: 'clamp(280px, 70vw, 480px)',
          opacity: easeOutCubic(enterProgress),
          transform: `translateY(${(1 - easeOutCubic(enterProgress)) * 30}px)`,
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 'clamp(16px, 4vw, 28px)',
            opacity: easeOutCubic(enterProgress),
          }}>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(16px, 3.5vw, 24px)',
              fontWeight: 700,
              color: textColor,
            }}>
              {title}
            </div>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(10px, 2vw, 14px)',
              fontWeight: 500,
              color: `${textColor}50`,
              background: `${textColor}08`,
              padding: '3px 10px',
              borderRadius: 6,
            }}>
              {period}
            </div>
          </div>

          {/* Line items */}
          {lineItems.map((item, i) => {
            const itemEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - item.delay) / (1 - item.delay))))
            const countedValue = Math.abs(item.value) * itemEnter
            const displayValue = itemEnter >= 1
              ? formatCurrency(Math.abs(item.value))
              : formatCurrency(countedValue)

            return (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'clamp(10px, 2.5vw, 16px) 0',
                borderBottom: `1px solid ${textColor}08`,
                opacity: itemEnter,
                transform: `translateX(${(1 - itemEnter) * 20}px)`,
              }}>
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(13px, 2.5vw, 18px)',
                  fontWeight: 500,
                  color: `${textColor}90`,
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                  fontSize: 'clamp(14px, 3vw, 20px)',
                  fontWeight: 700,
                  color: item.color,
                }}>
                  {item.value < 0 ? '-' : '+'}{displayValue}
                </div>
              </div>
            )
          })}

          {/* Net Profit/Loss - bottom line */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: 'clamp(14px, 3vw, 22px) 0 0 0',
            marginTop: 'clamp(4px, 1vw, 8px)',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6)),
          }}>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(14px, 3vw, 20px)',
              fontWeight: 700,
              color: textColor,
            }}>
              Net {isProfit ? 'Profit' : 'Loss'}
            </div>
            <div style={{
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              fontSize: 'clamp(20px, 5vw, 36px)',
              fontWeight: 800,
              color: netColor,
              textShadow: `0 0 20px ${netColor}30`,
            }}>
              {isProfit ? '+' : '-'}{formatCurrency(Math.abs(netAmount))}
            </div>
          </div>

          {/* Emphasis bar */}
          <div style={{
            height: 4,
            borderRadius: 2,
            background: `linear-gradient(90deg, ${netColor}, ${netColor}40)`,
            marginTop: 'clamp(8px, 2vw, 14px)',
            width: `${easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5)) * 100}%`,
            boxShadow: `0 0 12px ${netColor}30`,
          }} />
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-profit-loss',
  title: 'Profit & Loss',
  description: 'Income statement display with revenue, expenses, and net profit/loss with counting numbers and staggered reveal',
  tags: ['scene', 'finance', 'profit', 'loss', 'income', 'statement', 'accounting'],
  category: 'scene-layout',
  component: SceneProfitLossComponent as any,
  defaultConfig: {
    revenue: 125000,
    expenses: 87000,
    title: 'P&L Statement',
    period: 'Q4 2024',
    bgColor: '#0f172a',
    textColor: '#e2e8f0',
    profitColor: '#00c087',
    lossColor: '#ef4444',
  },
  configSchema: [
    { key: 'revenue', label: 'Revenue', type: 'number', defaultValue: 125000, min: 0, max: 999999999, group: 'Content' },
    { key: 'expenses', label: 'Expenses', type: 'number', defaultValue: 87000, min: 0, max: 999999999, group: 'Content' },
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'P&L Statement', group: 'Content' },
    { key: 'period', label: 'Period', type: 'text', defaultValue: 'Q4 2024', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
    { key: 'profitColor', label: 'Profit Color', type: 'color', defaultValue: '#00c087', group: 'Style' },
    { key: 'lossColor', label: 'Loss Color', type: 'color', defaultValue: '#ef4444', group: 'Style' },
  ],
})
