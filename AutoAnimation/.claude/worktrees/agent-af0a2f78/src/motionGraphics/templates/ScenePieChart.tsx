import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScenePieChartConfig {
  segments: string[]
  colors: string[]
  showLabels: boolean
  isDonut: boolean
  bgColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function parseSegment(s: string): { label: string; value: number } {
  const parts = s.split(':')
  return { label: (parts[0] || '').trim(), value: parseFloat(parts[1] || '0') }
}

function ScenePieChartComponent({ config, progress }: MotionGraphicProps<ScenePieChartConfig>) {
  const { segments, colors, showLabels, isDonut, bgColor } = config

  const parsed = segments.map(parseSegment)
  const total = parsed.reduce((sum, s) => sum + s.value, 0) || 1

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Hold: subtle rotation
  const isHolding = progress >= 0.25 && progress < 0.8
  const holdRotation = isHolding ? holdProgress * 8 : 0

  const cx = 150
  const cy = 150
  const radius = 120
  const strokeWidth = isDonut ? 40 : 120
  const innerR = isDonut ? radius : 0
  const circumference = 2 * Math.PI * radius

  // Calculate segment offsets
  let cumulativeAngle = 0
  const segmentData = parsed.map((seg, i) => {
    const fraction = seg.value / total
    const dashLen = circumference * fraction
    const offset = circumference - (circumference * cumulativeAngle)
    cumulativeAngle += fraction
    return { ...seg, fraction, dashLen, offset, color: colors[i % colors.length] || '#6366f1' }
  })

  // Center label: show highlighted segment name (first segment by default)
  const highlightIdx = Math.floor(holdProgress * parsed.length) % parsed.length
  const centerLabel = parsed[highlightIdx]?.label || parsed[0]?.label || ''

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
          gap: 'clamp(16px, 4vw, 40px)',
          opacity: exitOpacity,
        }}
      >
        {/* SVG Chart */}
        <div style={{ position: 'relative' }}>
          <svg
            width={cx * 2}
            height={cy * 2}
            viewBox={`0 0 ${cx * 2} ${cy * 2}`}
            style={{
              transform: `rotate(${-90 + holdRotation}deg)`,
              width: 'clamp(160px, 35vw, 300px)',
              height: 'clamp(160px, 35vw, 300px)',
            }}
          >
            {segmentData.map((seg, i) => {
              const stagger = i * 0.2
              const segEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger))))

              // Exit: retract
              const segExit = exitProgress > 0
                ? 1 - easeInCubic(Math.max(0, Math.min(1, (exitProgress - i * 0.1) / (1 - i * 0.1))))
                : 1

              const animatedDash = seg.dashLen * segEnter * segExit

              // Calculate offset: sum of all previous segment dashes
              let prevSum = 0
              for (let j = 0; j < i; j++) {
                prevSum += segmentData[j].fraction
              }
              const dashOffset = circumference * (1 - prevSum) - animatedDash

              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${animatedDash} ${circumference - animatedDash}`}
                  strokeDashoffset={-circumference * prevSum}
                  style={{ filter: `drop-shadow(0 0 4px ${seg.color}40)` }}
                />
              )
            })}
            {/* Center hole for donut */}
            {isDonut && (
              <circle cx={cx} cy={cy} r={radius - strokeWidth / 2 - 2} fill={bgColor} />
            )}
          </svg>

          {/* Center label for donut */}
          {isDonut && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(12px, 2.5vw, 22px)',
                fontWeight: 700,
                color: '#FFFFFF',
                textAlign: 'center',
                opacity: easeOutCubic(enterProgress),
              }}
            >
              {centerLabel}
            </div>
          )}
        </div>

        {/* Legend */}
        {showLabels && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(4px, 1vw, 10px)' }}>
            {segmentData.map((seg, i) => {
              const stagger = i * 0.15
              const labelEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - stagger - 0.3) / 0.5)))
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(4px, 0.8vw, 10px)',
                    opacity: labelEnter,
                    transform: `translateX(${15 * (1 - labelEnter)}px)`,
                  }}
                >
                  <div style={{ width: 'clamp(8px, 1.2vw, 14px)', height: 'clamp(8px, 1.2vw, 14px)', borderRadius: 3, background: seg.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(10px, 1.5vw, 16px)', fontWeight: 500, color: '#e2e8f0' }}>
                    {seg.label} ({Math.round(seg.fraction * 100)}%)
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-pie-chart',
  title: 'Pie / Donut Chart',
  description: 'Animated pie or donut chart with segments drawing in clockwise, legend labels, and subtle rotation',
  tags: ['scene', 'data', 'chart', 'pie', 'donut', 'segments'],
  category: 'scene-layout',
  component: ScenePieChartComponent as any,
  defaultConfig: {
    segments: ['Marketing:35', 'Engineering:30', 'Design:20', 'Sales:15'],
    colors: ['#6366f1', '#10b981', '#f59e0b', '#ef4444'],
    showLabels: true,
    isDonut: true,
    bgColor: '#0f172a',
  },
  configSchema: [
    { key: 'segments', label: 'Segments (Label:Value)', type: 'text-array', defaultValue: ['Marketing:35', 'Engineering:30', 'Design:20', 'Sales:15'], group: 'Content' },
    { key: 'colors', label: 'Segment Colors', type: 'text-array', defaultValue: ['#6366f1', '#10b981', '#f59e0b', '#ef4444'], group: 'Style' },
    { key: 'showLabels', label: 'Show Labels', type: 'boolean', defaultValue: true, group: 'Layout' },
    { key: 'isDonut', label: 'Donut Style', type: 'boolean', defaultValue: true, group: 'Layout' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
  ],
})
