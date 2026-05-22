import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BudgetBreakdownConfig {
  totalBudget: string
  categories: string[]
  bgColor: string
  textColor: string
  accentColor: string
  barColors: string[]
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function parseCategory(s: string): { label: string; amount: number } {
  const parts = s.split(':')
  return { label: (parts[0] || '').trim(), amount: parseFloat(parts[1] || '0') }
}

function SceneBudgetBreakdownComponent({ config, progress }: MotionGraphicProps<BudgetBreakdownConfig>) {
  const { totalBudget, categories, bgColor, textColor, accentColor, barColors } = config

  const parsed = categories.map(parseCategory)
  const maxAmount = Math.max(...parsed.map(p => p.amount), 1)

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Total counts up
  const totalEnter = easeOutCubic(Math.max(0, Math.min(1, enterProgress / 0.35)))
  const totalNum = parseFloat(totalBudget.replace(/[^0-9.]/g, '')) || 0
  const totalPrefix = totalBudget.match(/^[^0-9]*/)?.[0] || '$'
  const displayTotal = Math.round(totalNum * totalEnter)

  // Categories staggered bar fill
  const getBarProgress = (idx: number): number => {
    const start = 0.3 + idx * 0.1
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.4)))
  }

  // Hold: shimmer across bars
  const shimmerPos = progress >= 0.25 && progress < 0.8 ? holdProgress * 200 - 50 : -50

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '6% 8%',
          gap: 'clamp(10px, 2vh, 20px)',
          opacity: exitOpacity,
          transform: `translateY(${exitEased * 20}px)`,
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 'clamp(6px, 1.5vh, 14px)',
          }}
        >
          <div
            style={{
              fontSize: 'clamp(11px, 1.8vw, 15px)',
              fontWeight: 600,
              color: `${textColor}70`,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              opacity: totalEnter,
            }}
          >
            TRAVEL BUDGET
          </div>
          <div
            style={{
              fontSize: 'clamp(28px, 6vw, 48px)',
              fontWeight: 900,
              color: accentColor,
              opacity: totalEnter,
              letterSpacing: '-0.02em',
            }}
          >
            {totalPrefix}{displayTotal.toLocaleString()}
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            width: '100%',
            height: 1,
            background: `${textColor}15`,
            opacity: totalEnter,
          }}
        />

        {/* Category bars */}
        {parsed.map((cat, i) => {
          const barProg = getBarProgress(i)
          const pct = (cat.amount / maxAmount) * 100
          const color = barColors[i % barColors.length] || accentColor
          const displayAmount = Math.round(cat.amount * barProg)

          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(3px, 0.6vh, 6px)' }}>
              {/* Label row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  opacity: barProg,
                }}
              >
                <div
                  style={{
                    fontSize: 'clamp(11px, 2vw, 16px)',
                    fontWeight: 600,
                    color: textColor,
                  }}
                >
                  {cat.label}
                </div>
                <div
                  style={{
                    fontSize: 'clamp(12px, 2.2vw, 18px)',
                    fontWeight: 700,
                    color: `${textColor}cc`,
                  }}
                >
                  {totalPrefix}{displayAmount.toLocaleString()}
                </div>
              </div>

              {/* Bar */}
              <div
                style={{
                  width: '100%',
                  height: 'clamp(10px, 2vw, 18px)',
                  background: `${textColor}08`,
                  borderRadius: 'clamp(4px, 0.8vw, 8px)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: `${pct * barProg}%`,
                    background: color,
                    borderRadius: 'clamp(4px, 0.8vw, 8px)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Shimmer */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: `${shimmerPos}%`,
                      width: '30%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-budget-breakdown',
  title: 'Budget Breakdown',
  description: 'Travel budget breakdown with counting total, staggered percentage bars, and clean financial layout',
  tags: ['scene', 'travel', 'budget', 'money', 'planning', 'adventure'],
  category: 'scene-layout',
  component: SceneBudgetBreakdownComponent as any,
  defaultConfig: {
    totalBudget: '$3,200',
    categories: ['Flights:850', 'Hotel:1100', 'Food:500', 'Activities:450', 'Transport:300'],
    bgColor: '#0f172a',
    textColor: '#e2e8f0',
    accentColor: '#38bdf8',
    barColors: ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899'],
  },
  configSchema: [
    { key: 'totalBudget', label: 'Total Budget', type: 'text', defaultValue: '$3,200', group: 'Content' },
    { key: 'categories', label: 'Categories (Label:Amount)', type: 'text-array', defaultValue: ['Flights:850', 'Hotel:1100', 'Food:500', 'Activities:450', 'Transport:300'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#38bdf8', group: 'Style' },
    { key: 'barColors', label: 'Bar Colors', type: 'text-array', defaultValue: ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899'], group: 'Style' },
  ],
})
