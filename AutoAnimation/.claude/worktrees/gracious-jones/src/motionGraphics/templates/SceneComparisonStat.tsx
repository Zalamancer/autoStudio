import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneComparisonStatConfig {
  leftLabel: string
  leftValue: number
  rightLabel: string
  rightValue: number
  vsText: string
  leftColor: string
  rightColor: string
  bgColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function formatValue(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  if (Number.isInteger(n)) return n.toLocaleString('en-US')
  return n.toFixed(1)
}

function SceneComparisonStatComponent({ config, progress }: MotionGraphicProps<SceneComparisonStatConfig>) {
  const { leftLabel, leftValue, rightLabel, rightValue, vsText, leftColor, rightColor, bgColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Left counts up first (0-60% of enter)
  const leftEnter = easeOutCubic(Math.min(1, enterProgress / 0.6))
  // Right counts up second (30-90% of enter)
  const rightEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.6)))
  // VS badge pops in last (70-100% of enter)
  const vsEnter = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.3)))

  const leftCount = Math.floor(leftValue * leftEnter)
  const rightCount = Math.floor(rightValue * rightEnter)
  const leftDisplay = leftEnter >= 1 ? formatValue(leftValue) : formatValue(leftCount)
  const rightDisplay = rightEnter >= 1 ? formatValue(rightValue) : formatValue(rightCount)

  // Determine winner for glow
  const winner = rightValue > leftValue ? 'right' : leftValue > rightValue ? 'left' : 'none'
  const isHolding = progress >= 0.25 && progress < 0.8
  const glowPulse = isHolding ? 0.5 + Math.sin(holdProgress * Math.PI * 5) * 0.5 : 0

  // Exit: both sides slide out
  const exitEased = easeInCubic(exitProgress)
  const leftSlide = exitProgress > 0 ? -exitEased * 120 : 0
  const rightSlide = exitProgress > 0 ? exitEased * 120 : 0
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
          padding: '6%',
          opacity: exitOpacity,
        }}
      >
        {/* Left side */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transform: `translateX(${leftSlide}%)`,
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(10px, 1.6vw, 16px)',
              fontWeight: 600,
              color: leftColor,
              opacity: leftEnter * 0.8,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 'clamp(4px, 1vw, 12px)',
            }}
          >
            {leftLabel}
          </div>
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(28px, 8vw, 80px)',
              fontWeight: 900,
              color: leftColor,
              lineHeight: 1.1,
              opacity: leftEnter,
              textShadow: winner === 'left' ? `0 0 ${20 * glowPulse}px ${leftColor}80` : 'none',
            }}
          >
            {leftDisplay}
          </div>
        </div>

        {/* VS Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 'clamp(40px, 8vw, 80px)',
            height: 'clamp(40px, 8vw, 80px)',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            border: '2px solid rgba(255,255,255,0.2)',
            flexShrink: 0,
            transform: `scale(${vsEnter})`,
            opacity: vsEnter,
          }}
        >
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(10px, 2vw, 20px)',
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '0.05em',
            }}
          >
            {vsText}
          </span>
        </div>

        {/* Right side */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transform: `translateX(${rightSlide}%)`,
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(10px, 1.6vw, 16px)',
              fontWeight: 600,
              color: rightColor,
              opacity: rightEnter * 0.8,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 'clamp(4px, 1vw, 12px)',
            }}
          >
            {rightLabel}
          </div>
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(28px, 8vw, 80px)',
              fontWeight: 900,
              color: rightColor,
              lineHeight: 1.1,
              opacity: rightEnter,
              textShadow: winner === 'right' ? `0 0 ${20 * glowPulse}px ${rightColor}80` : 'none',
            }}
          >
            {rightDisplay}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-comparison-stat',
  title: 'Comparison Stat',
  description: 'Side-by-side statistic comparison with animated counters, VS badge, and winner glow effect',
  tags: ['scene', 'data', 'comparison', 'versus', 'stats', 'before-after'],
  category: 'scene-layout',
  component: SceneComparisonStatComponent as any,
  defaultConfig: {
    leftLabel: 'Before',
    leftValue: 12,
    rightLabel: 'After',
    rightValue: 89,
    vsText: 'VS',
    leftColor: '#ef4444',
    rightColor: '#10b981',
    bgColor: '#0f172a',
  },
  configSchema: [
    { key: 'leftLabel', label: 'Left Label', type: 'text', defaultValue: 'Before', group: 'Content' },
    { key: 'leftValue', label: 'Left Value', type: 'number', defaultValue: 12, min: 0, max: 999999999, group: 'Content' },
    { key: 'rightLabel', label: 'Right Label', type: 'text', defaultValue: 'After', group: 'Content' },
    { key: 'rightValue', label: 'Right Value', type: 'number', defaultValue: 89, min: 0, max: 999999999, group: 'Content' },
    { key: 'vsText', label: 'Center Text', type: 'text', defaultValue: 'VS', group: 'Content' },
    { key: 'leftColor', label: 'Left Color', type: 'color', defaultValue: '#ef4444', group: 'Style' },
    { key: 'rightColor', label: 'Right Color', type: 'color', defaultValue: '#10b981', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
  ],
})
