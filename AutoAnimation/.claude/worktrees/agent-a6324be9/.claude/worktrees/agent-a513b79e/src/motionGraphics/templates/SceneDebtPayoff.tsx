import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneDebtPayoffConfig {
  totalDebt: number
  paidOff: number
  monthlyPayment: number
  payoffDate: string
  bgColor: string
  textColor: string
  progressColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function formatCurrency(n: number): string {
  if (Math.abs(n) >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M'
  if (Math.abs(n) >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K'
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function SceneDebtPayoffComponent({ config, progress }: MotionGraphicProps<SceneDebtPayoffConfig>) {
  const { totalDebt, paidOff, monthlyPayment, payoffDate, bgColor, textColor, progressColor } = config

  const remaining = Math.max(0, totalDebt - paidOff)
  const paidPct = totalDebt > 0 ? (paidOff / totalDebt) * 100 : 0

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Progress bar fill animation
  const barFill = easeOutCubic(Math.max(0, (enterProgress - 0.2) / 0.8))

  // Hold: shimmer on bar
  const isHolding = progress >= 0.25 && progress < 0.8
  const shimmerPos = isHolding ? (holdProgress * 200 - 50) : -50

  // Milestone message
  const milestoneMsg = paidPct >= 100 ? 'DEBT FREE!' :
    paidPct >= 75 ? 'Almost there!' :
    paidPct >= 50 ? 'Halfway done!' :
    paidPct >= 25 ? 'Great progress!' :
    'Keep going!'

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
          background: `${textColor}04`,
          borderRadius: 'clamp(14px, 3.5vw, 24px)',
          padding: 'clamp(22px, 5.5vw, 44px)',
          border: `1px solid ${textColor}08`,
          width: 'clamp(280px, 72vw, 480px)',
          opacity: easeOutCubic(enterProgress),
          transform: `translateY(${(1 - easeOutCubic(enterProgress)) * 25}px)`,
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 'clamp(14px, 3.5vw, 24px)',
          }}>
            <div style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(16px, 3.5vw, 24px)',
              fontWeight: 700,
              color: textColor,
            }}>
              Debt Payoff Tracker
            </div>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(11px, 2vw, 15px)',
              fontWeight: 700,
              color: progressColor,
              opacity: easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5)),
            }}>
              {milestoneMsg}
            </div>
          </div>

          {/* Total debt */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            marginBottom: 'clamp(6px, 1.5vw, 10px)',
            opacity: easeOutCubic(enterProgress),
          }}>
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(11px, 2vw, 14px)',
              fontWeight: 500,
              color: `${textColor}60`,
            }}>
              Total Debt
            </span>
            <span style={{
              fontFamily: "'SF Mono', monospace",
              fontSize: 'clamp(14px, 3vw, 20px)',
              fontWeight: 700,
              color: textColor,
            }}>
              {formatCurrency(totalDebt)}
            </span>
          </div>

          {/* Progress bar */}
          <div style={{
            position: 'relative',
            height: 'clamp(18px, 3.5vw, 30px)',
            borderRadius: 'clamp(9px, 1.75vw, 15px)',
            background: `${textColor}08`,
            overflow: 'hidden',
            marginBottom: 'clamp(6px, 1.5vw, 10px)',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0,
              width: `${paidPct * barFill}%`,
              background: `linear-gradient(90deg, ${progressColor}, ${progressColor}cc)`,
              borderRadius: 'clamp(9px, 1.75vw, 15px)',
              overflow: 'hidden',
              boxShadow: `0 0 16px ${progressColor}30`,
            }}>
              {/* Shimmer */}
              <div style={{
                position: 'absolute', top: 0,
                left: `${shimmerPos}%`,
                width: '25%', height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
              }} />
            </div>
            {/* Percentage label on bar */}
            <div style={{
              position: 'absolute', top: '50%', left: `${Math.max(5, paidPct * barFill / 2)}%`,
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(9px, 1.5vw, 12px)',
              fontWeight: 700,
              color: '#fff',
              opacity: barFill > 0.3 ? 1 : 0,
            }}>
              {Math.round(paidPct * barFill)}%
            </div>
          </div>

          {/* Paid off / Remaining */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            marginBottom: 'clamp(14px, 3.5vw, 22px)',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.2) / 0.8)),
          }}>
            <div>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(9px, 1.5vw, 11px)',
                fontWeight: 500,
                color: `${textColor}40`,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                Paid Off
              </div>
              <div style={{
                fontFamily: "'SF Mono', monospace",
                fontSize: 'clamp(14px, 3vw, 20px)',
                fontWeight: 700,
                color: progressColor,
              }}>
                {formatCurrency(paidOff * easeOutCubic(enterProgress))}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(9px, 1.5vw, 11px)',
                fontWeight: 500,
                color: `${textColor}40`,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                Remaining
              </div>
              <div style={{
                fontFamily: "'SF Mono', monospace",
                fontSize: 'clamp(14px, 3vw, 20px)',
                fontWeight: 700,
                color: `${textColor}80`,
              }}>
                {formatCurrency(remaining)}
              </div>
            </div>
          </div>

          {/* Footer: monthly payment + payoff date */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderTop: `1px solid ${textColor}08`,
            paddingTop: 'clamp(10px, 2.5vw, 16px)',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6)),
          }}>
            <div>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(9px, 1.5vw, 11px)',
                color: `${textColor}40`,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                Monthly
              </div>
              <div style={{
                fontFamily: "'SF Mono', monospace",
                fontSize: 'clamp(13px, 2.5vw, 18px)',
                fontWeight: 700,
                color: textColor,
              }}>
                {formatCurrency(monthlyPayment)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(9px, 1.5vw, 11px)',
                color: `${textColor}40`,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                Payoff Date
              </div>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(13px, 2.5vw, 18px)',
                fontWeight: 700,
                color: textColor,
              }}>
                {payoffDate}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-debt-payoff',
  title: 'Debt Payoff Tracker',
  description: 'Motivational debt payoff tracker with progress bar, paid/remaining amounts, monthly payment, and payoff date',
  tags: ['scene', 'finance', 'debt', 'payoff', 'tracker', 'progress', 'money'],
  category: 'scene-layout',
  component: SceneDebtPayoffComponent as any,
  defaultConfig: {
    totalDebt: 25000,
    paidOff: 16500,
    monthlyPayment: 850,
    payoffDate: 'March 2026',
    bgColor: '#0f172a',
    textColor: '#e2e8f0',
    progressColor: '#00c087',
  },
  configSchema: [
    { key: 'totalDebt', label: 'Total Debt', type: 'number', defaultValue: 25000, min: 0, max: 999999999, group: 'Content' },
    { key: 'paidOff', label: 'Paid Off', type: 'number', defaultValue: 16500, min: 0, max: 999999999, group: 'Content' },
    { key: 'monthlyPayment', label: 'Monthly Payment', type: 'number', defaultValue: 850, min: 0, max: 999999, group: 'Content' },
    { key: 'payoffDate', label: 'Payoff Date', type: 'text', defaultValue: 'March 2026', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
    { key: 'progressColor', label: 'Progress Color', type: 'color', defaultValue: '#00c087', group: 'Style' },
  ],
})
