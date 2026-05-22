import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneBudgetPlanConfig {
  income: number
  categories: string[]
  barColors: string[]
  title: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function formatCurrency(n: number): string {
  if (Math.abs(n) >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M'
  if (Math.abs(n) >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K'
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function parseCategory(s: string): { label: string; amount: number } {
  const parts = s.split(':')
  return { label: (parts[0] || '').trim(), amount: parseFloat(parts[1] || '0') }
}

function SceneBudgetPlanComponent({ config, progress }: MotionGraphicProps<SceneBudgetPlanConfig>) {
  const { income, categories, barColors, title, bgColor, textColor } = config

  const parsed = categories.map(parseCategory)
  const totalExpenses = parsed.reduce((sum, c) => sum + c.amount, 0)
  const savings = income - totalExpenses

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Hold shimmer
  const isHolding = progress >= 0.25 && progress < 0.8

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
        padding: '6% 10%',
        opacity: exitOpacity,
      }}>
        {/* Title */}
        <div style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(16px, 3.5vw, 26px)',
          fontWeight: 700,
          color: textColor,
          marginBottom: 'clamp(4px, 1vw, 8px)',
          opacity: easeOutCubic(enterProgress),
        }}>
          {title}
        </div>

        {/* Income header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginBottom: 'clamp(14px, 3.5vw, 24px)',
          paddingBottom: 'clamp(8px, 2vw, 14px)',
          borderBottom: `2px solid ${textColor}15`,
          opacity: easeOutCubic(enterProgress),
        }}>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(12px, 2.2vw, 16px)',
            fontWeight: 500,
            color: `${textColor}70`,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            Monthly Income
          </div>
          <div style={{
            fontFamily: "'SF Mono', monospace",
            fontSize: 'clamp(18px, 4vw, 30px)',
            fontWeight: 800,
            color: '#00c087',
          }}>
            {formatCurrency(income * easeOutCubic(enterProgress))}
          </div>
        </div>

        {/* Expense categories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 2vw, 14px)' }}>
          {parsed.map((cat, i) => {
            const stagger = i * 0.1
            const barEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger))))
            const pct = (cat.amount / income) * 100
            const color = barColors[i % barColors.length] || '#6366f1'

            const shimmerPos = isHolding ? (holdProgress * 200 - 50) : -50

            return (
              <div key={i} style={{ opacity: barEnter, transform: `translateX(${(1 - barEnter) * 15}px)` }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 'clamp(2px, 0.5vw, 4px)',
                }}>
                  <span style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 'clamp(11px, 2vw, 15px)',
                    fontWeight: 600,
                    color: textColor,
                  }}>
                    {cat.label}
                  </span>
                  <span style={{
                    fontFamily: "'SF Mono', monospace",
                    fontSize: 'clamp(11px, 2vw, 14px)',
                    fontWeight: 600,
                    color: `${textColor}80`,
                  }}>
                    {formatCurrency(cat.amount * barEnter)} ({Math.round(pct)}%)
                  </span>
                </div>
                <div style={{
                  position: 'relative',
                  height: 'clamp(10px, 2vw, 16px)',
                  borderRadius: 8,
                  background: `${textColor}08`,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, bottom: 0,
                    width: `${pct * barEnter}%`,
                    background: color,
                    borderRadius: 8,
                    overflow: 'hidden',
                    boxShadow: `0 1px 6px ${color}30`,
                  }}>
                    <div style={{
                      position: 'absolute', top: 0,
                      left: `${shimmerPos}%`,
                      width: '30%', height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Savings remainder */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 'clamp(14px, 3.5vw, 24px)',
          paddingTop: 'clamp(8px, 2vw, 14px)',
          borderTop: `2px solid ${textColor}15`,
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5)),
        }}>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(13px, 2.5vw, 18px)',
            fontWeight: 700,
            color: savings >= 0 ? '#00c087' : '#ef4444',
          }}>
            {savings >= 0 ? 'Savings' : 'Over Budget'}
          </div>
          <div style={{
            fontFamily: "'SF Mono', monospace",
            fontSize: 'clamp(18px, 4vw, 28px)',
            fontWeight: 800,
            color: savings >= 0 ? '#00c087' : '#ef4444',
            textShadow: `0 0 16px ${savings >= 0 ? '#00c087' : '#ef4444'}25`,
          }}>
            {formatCurrency(Math.abs(savings))}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-budget-plan',
  title: 'Budget Plan',
  description: 'Monthly budget overview with income, expense bars by category, and savings remainder following 50/30/20 aesthetics',
  tags: ['scene', 'finance', 'budget', 'expenses', 'savings', 'planning'],
  category: 'scene-layout',
  component: SceneBudgetPlanComponent as any,
  defaultConfig: {
    income: 5000,
    categories: ['Housing:1500', 'Food:600', 'Transport:400', 'Utilities:200', 'Entertainment:300', 'Insurance:250'],
    barColors: ['#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#10b981'],
    title: 'Monthly Budget',
    bgColor: '#0f172a',
    textColor: '#e2e8f0',
  },
  configSchema: [
    { key: 'income', label: 'Monthly Income', type: 'number', defaultValue: 5000, min: 0, max: 999999, group: 'Content' },
    { key: 'categories', label: 'Categories (Label:Amount)', type: 'text-array', defaultValue: ['Housing:1500', 'Food:600', 'Transport:400', 'Utilities:200', 'Entertainment:300', 'Insurance:250'], group: 'Content' },
    { key: 'barColors', label: 'Bar Colors', type: 'text-array', defaultValue: ['#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#10b981'], group: 'Style' },
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Monthly Budget', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
})
