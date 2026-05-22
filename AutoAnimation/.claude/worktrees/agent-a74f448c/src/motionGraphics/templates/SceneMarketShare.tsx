import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneMarketShareConfig {
  segments: string[]
  colors: string[]
  title: string
  year: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function parseSegment(s: string): { label: string; value: number } {
  const parts = s.split(':')
  return { label: (parts[0] || '').trim(), value: parseFloat(parts[1] || '0') }
}

function SceneMarketShareComponent({ config, progress }: MotionGraphicProps<SceneMarketShareConfig>) {
  const { segments, colors, title, year, bgColor, textColor } = config
  const parsed = segments.map(parseSegment)
  const total = parsed.reduce((sum, s) => sum + s.value, 0) || 1

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Pie chart params
  const cx = 100
  const cy = 100
  const radius = 80

  // Build pie slices as SVG paths
  const slices: Array<{ path: string; color: string; label: string; pct: number; midAngle: number }> = []
  let cumAngle = -90 // Start from top

  parsed.forEach((seg, i) => {
    const fraction = seg.value / total
    const angle = fraction * 360
    const startAngle = cumAngle
    const endAngle = cumAngle + angle

    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    const x1 = cx + Math.cos(startRad) * radius
    const y1 = cy + Math.sin(startRad) * radius
    const x2 = cx + Math.cos(endRad) * radius
    const y2 = cy + Math.sin(endRad) * radius

    const largeArc = angle > 180 ? 1 : 0

    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
    const midAngle = (startAngle + endAngle) / 2

    slices.push({
      path,
      color: colors[i % colors.length] || '#6366F1',
      label: seg.label,
      pct: Math.round(fraction * 100),
      midAngle,
    })

    cumAngle = endAngle
  })

  // Animated rotation sweep
  const sweepAngle = easeOutCubic(enterProgress) * 360

  // Hold: subtle rotation
  const holdRotation = progress >= 0.25 && progress < 0.8 ? holdProgress * 4 : 0

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '5% 8%',
        opacity: exitOpacity,
      }}>
        {/* Title */}
        <div style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(14px, 3vw, 22px)',
          fontWeight: 700,
          color: textColor,
          marginBottom: 'clamp(2px, 0.5vw, 4px)',
          opacity: easeOutCubic(enterProgress),
        }}>
          {title}
        </div>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 'clamp(9px, 1.6vw, 12px)',
          fontWeight: 500,
          color: `${textColor}40`,
          marginBottom: 'clamp(16px, 4vw, 32px)',
          opacity: easeOutCubic(enterProgress),
        }}>
          {year}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(20px, 5vw, 44px)',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {/* Pie chart */}
          <div style={{ position: 'relative' }}>
            <svg
              viewBox={`0 0 ${cx * 2} ${cy * 2}`}
              style={{
                width: 'clamp(160px, 36vw, 240px)',
                height: 'clamp(160px, 36vw, 240px)',
                transform: `rotate(${holdRotation}deg)`,
              }}
            >
              {/* Clip for animation reveal */}
              <defs>
                <clipPath id="pieReveal">
                  <path d={`M ${cx} ${cy} L ${cx} ${cy - radius - 10} A ${radius + 10} ${radius + 10} 0 ${sweepAngle > 180 ? 1 : 0} 1 ${cx + Math.cos(((sweepAngle - 90) * Math.PI) / 180) * (radius + 10)} ${cy + Math.sin(((sweepAngle - 90) * Math.PI) / 180) * (radius + 10)} Z`} />
                </clipPath>
              </defs>
              <g clipPath="url(#pieReveal)">
                {slices.map((slice, i) => (
                  <path
                    key={i}
                    d={slice.path}
                    fill={slice.color}
                    stroke={bgColor}
                    strokeWidth={2}
                    style={{ filter: `drop-shadow(0 2px 4px ${slice.color}20)` }}
                  />
                ))}
              </g>
              {/* Center hole for donut look */}
              <circle cx={cx} cy={cy} r={radius * 0.4} fill={bgColor} />
            </svg>
            {/* Center label */}
            <div style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              opacity: easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6)),
            }}>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(8px, 1.4vw, 10px)',
                fontWeight: 500,
                color: `${textColor}40`,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}>
                Total
              </div>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(14px, 3.5vw, 24px)',
                fontWeight: 800,
                color: textColor,
              }}>
                100%
              </div>
            </div>
          </div>

          {/* Legend */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(6px, 1.5vw, 12px)',
          }}>
            {slices.map((slice, i) => {
              const stagger = i * 0.1
              const labelEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - stagger - 0.2) / 0.6)))
              const countedPct = Math.round(slice.pct * labelEnter)

              return (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(6px, 1.5vw, 10px)',
                  opacity: labelEnter,
                  transform: `translateX(${(1 - labelEnter) * 12}px)`,
                }}>
                  <div style={{
                    width: 'clamp(10px, 2vw, 14px)',
                    height: 'clamp(10px, 2vw, 14px)',
                    borderRadius: 3,
                    background: slice.color,
                    flexShrink: 0,
                  }} />
                  <div style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 'clamp(10px, 2vw, 14px)',
                    fontWeight: 600,
                    color: textColor,
                    minWidth: 'clamp(60px, 15vw, 100px)',
                  }}>
                    {slice.label}
                  </div>
                  <div style={{
                    fontFamily: "'SF Mono', monospace",
                    fontSize: 'clamp(11px, 2.2vw, 16px)',
                    fontWeight: 800,
                    color: slice.color,
                  }}>
                    {countedPct}%
                  </div>
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
  id: 'tpl-scene-market-share',
  title: 'Market Share',
  description: 'Market share pie/donut chart with animated sweep reveal, center hole, color-coded legend with counting percentages, and subtle hold rotation.',
  tags: ['scene', 'market', 'share', 'pie', 'chart', 'analytics', 'business', 'competition', 'data'],
  category: 'scene-layout',
  component: SceneMarketShareComponent as any,
  defaultConfig: {
    segments: ['Our Brand:35', 'Competitor A:25', 'Competitor B:18', 'Competitor C:12', 'Others:10'],
    colors: ['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#64748B'],
    title: 'Market Share Analysis',
    year: 'FY 2024',
    bgColor: '#0f172a',
    textColor: '#e2e8f0',
  },
  configSchema: [
    { key: 'segments', label: 'Segments (Label:Percent)', type: 'text-array', defaultValue: ['Our Brand:35', 'Competitor A:25', 'Competitor B:18', 'Competitor C:12', 'Others:10'], group: 'Content' },
    { key: 'colors', label: 'Segment Colors', type: 'text-array', defaultValue: ['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#64748B'], group: 'Style' },
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Market Share Analysis', group: 'Content' },
    { key: 'year', label: 'Year/Period', type: 'text', defaultValue: 'FY 2024', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
})
