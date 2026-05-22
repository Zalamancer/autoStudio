import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneClimateGraphConfig {
  title: string
  subtitle: string
  years: string
  values: string
  unit: string
  baseline: number
  bgColor: string
  textColor: string
  warmColor: string
  coolColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneClimateGraphComponent({ config, progress }: MotionGraphicProps<SceneClimateGraphConfig>) {
  const { title, subtitle, years, values, unit, baseline, bgColor, textColor, warmColor, coolColor } = config

  const yearList = years.split(',').map(s => s.trim())
  const valueList = values.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))

  const minVal = Math.min(...valueList, baseline)
  const maxVal = Math.max(...valueList, baseline)
  const range = maxVal - minVal || 1

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const enterEased = easeOutCubic(enterProgress)

  // Chart dimensions
  const svgW = 300
  const svgH = 140
  const padX = 35
  const padY = 15
  const chartW = svgW - padX * 2
  const chartH = svgH - padY * 2

  // Baseline position
  const baselineY = padY + chartH - ((baseline - minVal) / range) * chartH

  // Bar width
  const barCount = valueList.length
  const barGap = 2
  const barWidth = Math.max(2, (chartW - barGap * (barCount - 1)) / barCount)

  // Draw progress (bars animate left to right)
  const drawProgress = easeOutCubic(enterProgress)

  // Trend line during hold
  const trendGlow = progress >= 0.25 && progress < 0.8
    ? 0.5 + Math.sin(holdProgress * Math.PI * 2) * 0.2
    : 0

  // Latest value for display
  const latestValue = valueList[valueList.length - 1] ?? 0
  const latestYear = yearList[yearList.length - 1] ?? ''
  const displayLatest = (latestValue * enterEased).toFixed(2)
  const isAboveBaseline = latestValue >= baseline

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Subtle grid pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.03,
        backgroundImage: `linear-gradient(${textColor} 0.5px, transparent 0.5px), linear-gradient(90deg, ${textColor} 0.5px, transparent 0.5px)`,
        backgroundSize: '40px 40px',
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '5% 4%',
        opacity: exitOpacity,
      }}>
        {/* Title */}
        <div style={{
          fontSize: 'clamp(16px, 4vw, 32px)',
          fontWeight: 800,
          color: textColor,
          opacity: enterEased,
          transform: `translateY(${(1 - enterEased) * -12}px)`,
          marginBottom: 'clamp(2px, 0.3vh, 4px)',
          letterSpacing: '-0.02em',
          textAlign: 'center',
        }}>
          {title}
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: 'clamp(9px, 1.6vw, 13px)',
          fontWeight: 500,
          color: `${textColor}66`,
          opacity: enterEased,
          marginBottom: 'clamp(8px, 1.5vh, 16px)',
          textAlign: 'center',
        }}>
          {subtitle}
        </div>

        {/* Chart */}
        <div style={{
          opacity: enterEased,
          marginBottom: 'clamp(10px, 2vh, 20px)',
        }}>
          <svg viewBox={`0 0 ${svgW} ${svgH}`}
            style={{ width: 'clamp(220px, 60vw, 400px)', height: 'clamp(100px, 28vw, 180px)' }}
          >
            {/* Y-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map(frac => {
              const val = minVal + range * frac
              const y = padY + chartH * (1 - frac)
              return (
                <g key={frac}>
                  <line x1={padX} y1={y} x2={svgW - padX} y2={y}
                    stroke={`${textColor}08`} strokeWidth={0.5} />
                  <text x={padX - 4} y={y + 3} textAnchor="end"
                    fill={`${textColor}44`} fontSize={6} fontWeight={500}>
                    {val.toFixed(1)}
                  </text>
                </g>
              )
            })}

            {/* Baseline */}
            <line x1={padX} y1={baselineY} x2={svgW - padX} y2={baselineY}
              stroke={`${textColor}30`} strokeWidth={1} strokeDasharray="4,3" />
            <text x={svgW - padX + 3} y={baselineY + 3}
              fill={`${textColor}55`} fontSize={6} fontWeight={600}>
              {baseline}{unit}
            </text>

            {/* Bars */}
            {valueList.map((val, i) => {
              const barDrawn = Math.max(0, Math.min(1, (drawProgress * barCount - i) / 1.5))
              const x = padX + i * (barWidth + barGap)
              const valY = padY + chartH - ((val - minVal) / range) * chartH
              const barTop = Math.min(valY, baselineY)
              const barH = Math.abs(valY - baselineY) * barDrawn
              const isWarm = val >= baseline
              const barColor = isWarm ? warmColor : coolColor

              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={isWarm ? baselineY - barH : baselineY}
                    width={barWidth}
                    height={barH}
                    fill={barColor}
                    opacity={0.8}
                    rx={1}
                    style={{ filter: `drop-shadow(0 0 2px ${barColor}40)` }}
                  />
                </g>
              )
            })}

            {/* X-axis year labels (every few) */}
            {yearList.map((year, i) => {
              const showLabel = i === 0 || i === yearList.length - 1 || i % Math.ceil(yearList.length / 5) === 0
              if (!showLabel) return null
              const x = padX + i * (barWidth + barGap) + barWidth / 2
              return (
                <text key={i} x={x} y={svgH - 2} textAnchor="middle"
                  fill={`${textColor}44`} fontSize={6} fontWeight={500}>
                  {year}
                </text>
              )
            })}
          </svg>
        </div>

        {/* Latest value highlight */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(8px, 2vw, 16px)',
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5)),
          transform: `translateY(${(1 - easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5))) * 12}px)`,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 'clamp(9px, 1.5vw, 12px)',
              fontWeight: 600,
              color: `${textColor}55`,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 2,
            }}>
              {latestYear}
            </div>
            <div style={{
              fontSize: 'clamp(24px, 6vw, 44px)',
              fontWeight: 900,
              color: isAboveBaseline ? warmColor : coolColor,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
              textShadow: `0 0 12px ${isAboveBaseline ? warmColor : coolColor}30`,
            }}>
              {isAboveBaseline ? '+' : ''}{displayLatest}{unit}
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}>
            <span style={{
              fontSize: 'clamp(9px, 1.5vw, 12px)',
              fontWeight: 600,
              color: `${textColor}55`,
            }}>
              vs {baseline}{unit} baseline
            </span>
            <span style={{
              fontSize: 'clamp(10px, 1.8vw, 14px)',
              fontWeight: 700,
              color: isAboveBaseline ? warmColor : coolColor,
            }}>
              {isAboveBaseline ? '\u2191 Above' : '\u2193 Below'} Average
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-climate-graph',
  title: 'Climate Graph',
  description: 'Climate change data bar chart with warm/cool color coding, baseline reference, and trend display',
  tags: ['scene', 'weather', 'climate', 'graph', 'data', 'temperature', 'environment', 'science'],
  category: 'scene-layout',
  component: SceneClimateGraphComponent as any,
  defaultConfig: {
    title: 'Global Temperature Anomaly',
    subtitle: 'Deviation from 1951-1980 average (\u00B0C)',
    years: '1980,1985,1990,1995,2000,2005,2010,2015,2020,2025',
    values: '0.26,0.12,0.45,0.42,0.39,0.67,0.72,0.87,1.02,1.18',
    unit: '\u00B0C',
    baseline: 0,
    bgColor: '#0a0e17',
    textColor: '#e2e8f0',
    warmColor: '#ef4444',
    coolColor: '#3b82f6',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Global Temperature Anomaly', group: 'Content' },
    { key: 'subtitle', label: 'Subtitle', type: 'text', defaultValue: 'Deviation from 1951-1980 average (\u00B0C)', group: 'Content' },
    { key: 'years', label: 'Years (comma-separated)', type: 'text', defaultValue: '1980,1985,1990,1995,2000,2005,2010,2015,2020,2025', group: 'Content' },
    { key: 'values', label: 'Values (comma-separated)', type: 'text', defaultValue: '0.26,0.12,0.45,0.42,0.39,0.67,0.72,0.87,1.02,1.18', group: 'Content' },
    { key: 'unit', label: 'Unit', type: 'text', defaultValue: '\u00B0C', group: 'Content' },
    { key: 'baseline', label: 'Baseline Value', type: 'number', defaultValue: 0, min: -10, max: 100, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0e17', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
    { key: 'warmColor', label: 'Warm Color', type: 'color', defaultValue: '#ef4444', group: 'Style' },
    { key: 'coolColor', label: 'Cool Color', type: 'color', defaultValue: '#3b82f6', group: 'Style' },
  ],
})
