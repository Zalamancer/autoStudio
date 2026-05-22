import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneSavingsGoalConfig {
  goalName: string
  targetAmount: number
  currentAmount: number
  bgColor: string
  textColor: string
  ringColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function formatCurrency(n: number): string {
  if (Math.abs(n) >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M'
  if (Math.abs(n) >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K'
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function SceneSavingsGoalComponent({ config, progress }: MotionGraphicProps<SceneSavingsGoalConfig>) {
  const { goalName, targetAmount, currentAmount, bgColor, textColor, ringColor } = config

  const pct = targetAmount > 0 ? Math.min(100, (currentAmount / targetAmount) * 100) : 0

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Ring params
  const cx = 120
  const cy = 120
  const radius = 100
  const strokeWidth = 14
  const circumference = 2 * Math.PI * radius

  // Ring fill animation
  const ringFill = easeOutCubic(Math.max(0, (enterProgress - 0.2) / 0.8))
  const dashLen = (pct / 100) * circumference * ringFill

  // Hold: gentle ring glow pulse
  const isHolding = progress >= 0.25 && progress < 0.8
  const glowIntensity = isHolding ? 10 + Math.sin(holdProgress * Math.PI * 5) * 6 : 10

  // Encouragement message
  const encouragement = pct >= 100 ? 'Goal reached!' :
    pct >= 75 ? 'Almost there!' :
    pct >= 50 ? 'Halfway!' :
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
        {/* Goal name + piggy bank */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.5vw, 12px)',
          marginBottom: 'clamp(12px, 3vw, 24px)',
          opacity: easeOutCubic(enterProgress),
        }}>
          <span style={{ fontSize: 'clamp(20px, 4.5vw, 36px)' }}>{'\ud83d\udc37'}</span>
          <span style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(16px, 3.5vw, 26px)',
            fontWeight: 700,
            color: textColor,
          }}>
            {goalName}
          </span>
        </div>

        {/* Percentage ring */}
        <div style={{ position: 'relative', marginBottom: 'clamp(14px, 3.5vw, 28px)' }}>
          <svg
            width={cx * 2}
            height={cy * 2}
            viewBox={`0 0 ${cx * 2} ${cy * 2}`}
            style={{
              width: 'clamp(170px, 38vw, 260px)',
              height: 'clamp(170px, 38vw, 260px)',
              transform: 'rotate(-90deg)',
            }}
          >
            {/* Track */}
            <circle
              cx={cx} cy={cy} r={radius}
              fill="none"
              stroke={`${textColor}10`}
              strokeWidth={strokeWidth}
            />
            {/* Progress arc */}
            <circle
              cx={cx} cy={cy} r={radius}
              fill="none"
              stroke={ringColor}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLen} ${circumference - dashLen}`}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 ${glowIntensity}px ${ringColor}50)` }}
            />
          </svg>

          {/* Center content */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7)),
          }}>
            <div style={{
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              fontSize: 'clamp(28px, 7vw, 48px)',
              fontWeight: 800,
              color: ringColor,
              lineHeight: 1.1,
            }}>
              {Math.round(pct * ringFill)}%
            </div>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(10px, 2vw, 13px)',
              fontWeight: 600,
              color: `${textColor}50`,
              marginTop: 2,
            }}>
              {encouragement}
            </div>
          </div>
        </div>

        {/* Amounts */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 'clamp(16px, 4vw, 32px)',
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6)),
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(9px, 1.6vw, 12px)',
              fontWeight: 500,
              color: `${textColor}40`,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 2,
            }}>
              Saved
            </div>
            <div style={{
              fontFamily: "'SF Mono', monospace",
              fontSize: 'clamp(16px, 3.5vw, 26px)',
              fontWeight: 700,
              color: ringColor,
            }}>
              {formatCurrency(currentAmount * easeOutCubic(enterProgress))}
            </div>
          </div>

          <div style={{
            width: 1, height: 'clamp(24px, 5vw, 40px)',
            background: `${textColor}15`,
          }} />

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(9px, 1.6vw, 12px)',
              fontWeight: 500,
              color: `${textColor}40`,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 2,
            }}>
              Goal
            </div>
            <div style={{
              fontFamily: "'SF Mono', monospace",
              fontSize: 'clamp(16px, 3.5vw, 26px)',
              fontWeight: 700,
              color: textColor,
            }}>
              {formatCurrency(targetAmount)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-savings-goal',
  title: 'Savings Goal',
  description: 'Savings goal progress with animated percentage ring, current/target amounts, and motivational encouragement',
  tags: ['scene', 'finance', 'savings', 'goal', 'progress', 'ring', 'money'],
  category: 'scene-layout',
  component: SceneSavingsGoalComponent as any,
  defaultConfig: {
    goalName: 'Emergency Fund',
    targetAmount: 10000,
    currentAmount: 6800,
    bgColor: '#0f172a',
    textColor: '#e2e8f0',
    ringColor: '#00c087',
  },
  configSchema: [
    { key: 'goalName', label: 'Goal Name', type: 'text', defaultValue: 'Emergency Fund', group: 'Content' },
    { key: 'targetAmount', label: 'Target Amount', type: 'number', defaultValue: 10000, min: 0, max: 999999999, group: 'Content' },
    { key: 'currentAmount', label: 'Current Amount', type: 'number', defaultValue: 6800, min: 0, max: 999999999, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
    { key: 'ringColor', label: 'Ring Color', type: 'color', defaultValue: '#00c087', group: 'Style' },
  ],
})
