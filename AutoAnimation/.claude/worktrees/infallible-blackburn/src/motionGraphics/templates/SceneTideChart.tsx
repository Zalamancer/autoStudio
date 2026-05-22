import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneTideChartConfig {
  location: string
  highTideTime: string
  lowTideTime: string
  highTideHeight: number
  lowTideHeight: number
  tideData: string
  unit: string
  bgColor: string
  textColor: string
  waterColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneTideChartComponent({ config, progress }: MotionGraphicProps<SceneTideChartConfig>) {
  const { location, highTideTime, lowTideTime, highTideHeight, lowTideHeight, tideData, unit, bgColor, textColor, waterColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const enterEased = easeOutCubic(enterProgress)

  // Parse tide data
  const dataPoints = tideData.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
  const minVal = Math.min(...dataPoints)
  const maxVal = Math.max(...dataPoints)
  const range = maxVal - minVal || 1

  // Chart dimensions
  const svgW = 280
  const svgH = 120
  const padX = 20
  const padY = 15
  const chartW = svgW - padX * 2
  const chartH = svgH - padY * 2

  // Build smooth curve path
  const drawProgress = easeOutCubic(enterProgress)
  const points = dataPoints.map((v, i) => {
    const x = padX + (i / (dataPoints.length - 1)) * chartW
    const y = padY + chartH - ((v - minVal) / range) * chartH
    return { x, y }
  })

  // Create smooth bezier path
  let curvePath = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const cpx = (prev.x + curr.x) / 2
    curvePath += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`
  }

  // Fill area path
  const fillPath = curvePath + ` L ${points[points.length - 1].x} ${svgH - padY} L ${points[0].x} ${svgH - padY} Z`

  const pathLen = dataPoints.length * 50

  // Water wave animation during hold
  const waveShift = progress >= 0.25 ? holdProgress * 20 : 0

  // Animated values
  const displayHigh = (highTideHeight * enterEased).toFixed(1)
  const displayLow = (lowTideHeight * enterEased).toFixed(1)

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Subtle wave pattern at bottom */}
      <svg style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '15%', opacity: 0.08 }}
        viewBox="0 0 400 40" preserveAspectRatio="none">
        <path
          d={`M 0 20 Q 50 ${10 + Math.sin(progress * 12.56) * 10} 100 20 Q 150 ${30 - Math.sin(progress * 12.56) * 10} 200 20 Q 250 ${10 + Math.sin(progress * 12.56 + 1) * 10} 300 20 Q 350 ${30 - Math.sin(progress * 12.56 + 1) * 10} 400 20 L 400 40 L 0 40 Z`}
          fill={waterColor}
        />
      </svg>

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '6% 5%',
        opacity: exitOpacity,
      }}>
        {/* Location */}
        <div style={{
          fontSize: 'clamp(10px, 1.8vw, 14px)',
          fontWeight: 600,
          color: `${textColor}77`,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          opacity: enterEased,
          marginBottom: 'clamp(2px, 0.5vh, 6px)',
        }}>
          {location}
        </div>

        {/* Title */}
        <div style={{
          fontSize: 'clamp(18px, 4.5vw, 36px)',
          fontWeight: 800,
          color: textColor,
          opacity: enterEased,
          marginBottom: 'clamp(12px, 2.5vh, 24px)',
        }}>
          Tide Chart
        </div>

        {/* Tide chart SVG */}
        {dataPoints.length > 1 && (
          <div style={{
            opacity: enterEased,
            transform: `scale(${0.9 + enterEased * 0.1})`,
            marginBottom: 'clamp(12px, 2.5vh, 24px)',
          }}>
            <svg viewBox={`0 0 ${svgW} ${svgH}`}
              style={{ width: 'clamp(200px, 55vw, 360px)', height: 'clamp(85px, 23vw, 155px)' }}
            >
              {/* Grid lines */}
              {[0.25, 0.5, 0.75].map(frac => (
                <line key={frac}
                  x1={padX} y1={padY + chartH * (1 - frac)}
                  x2={svgW - padX} y2={padY + chartH * (1 - frac)}
                  stroke={`${textColor}10`} strokeWidth={0.5} />
              ))}

              {/* Fill area */}
              <path d={fillPath} fill={`${waterColor}15`}
                strokeDasharray={pathLen * 3}
                strokeDashoffset={pathLen * 3 * (1 - drawProgress)} />

              {/* Curve line */}
              <path d={curvePath} fill="none" stroke={waterColor}
                strokeWidth={2.5} strokeLinecap="round"
                strokeDasharray={pathLen}
                strokeDashoffset={pathLen * (1 - drawProgress)} />

              {/* Glow line */}
              <path d={curvePath} fill="none" stroke={waterColor}
                strokeWidth={6} strokeLinecap="round" opacity={0.15}
                strokeDasharray={pathLen}
                strokeDashoffset={pathLen * (1 - drawProgress)} />

              {/* Time labels */}
              {['12AM', '6AM', '12PM', '6PM', '12AM'].map((label, i) => (
                <text key={i}
                  x={padX + (i / 4) * chartW}
                  y={svgH - 2}
                  textAnchor="middle"
                  fill={`${textColor}44`}
                  fontSize={7}
                  fontWeight={500}
                >{label}</text>
              ))}
            </svg>
          </div>
        )}

        {/* High/Low tide cards */}
        <div style={{
          display: 'flex',
          gap: 'clamp(12px, 3vw, 28px)',
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6)),
          transform: `translateY(${(1 - easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6))) * 15}px)`,
        }}>
          {[
            { label: 'High Tide', time: highTideTime, value: displayHigh, color: waterColor, icon: '\u2B06' },
            { label: 'Low Tide', time: lowTideTime, value: displayLow, color: '#94a3b8', icon: '\u2B07' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'clamp(2px, 0.4vh, 5px)',
              padding: 'clamp(6px, 1.2vw, 12px) clamp(10px, 2vw, 18px)',
              borderRadius: 'clamp(6px, 1.2vw, 10px)',
              background: `${item.color}10`,
              border: `1px solid ${item.color}20`,
            }}>
              <span style={{
                fontSize: 'clamp(9px, 1.5vw, 12px)',
                fontWeight: 600,
                color: `${textColor}66`,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                {item.icon} {item.label}
              </span>
              <span style={{
                fontSize: 'clamp(18px, 4vw, 30px)',
                fontWeight: 900,
                color: item.color,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {item.value} {unit}
              </span>
              <span style={{
                fontSize: 'clamp(9px, 1.5vw, 12px)',
                fontWeight: 500,
                color: `${textColor}55`,
              }}>
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-tide-chart',
  title: 'Tide Chart',
  description: 'Ocean tide chart with animated curve, high/low tide markers, and time-based display',
  tags: ['scene', 'weather', 'tide', 'ocean', 'marine', 'chart', 'data'],
  category: 'scene-layout',
  component: SceneTideChartComponent as any,
  defaultConfig: {
    location: 'Santa Cruz, CA',
    highTideTime: '8:45 AM',
    lowTideTime: '3:12 PM',
    highTideHeight: 5.8,
    lowTideHeight: 0.9,
    tideData: '2.1,3.5,4.8,5.6,5.8,5.2,4.1,2.8,1.5,0.9,1.2,2.4,3.6,4.5,5.1',
    unit: 'ft',
    bgColor: '#060e1a',
    textColor: '#e2e8f0',
    waterColor: '#22d3ee',
  },
  configSchema: [
    { key: 'location', label: 'Location', type: 'text', defaultValue: 'Santa Cruz, CA', group: 'Content' },
    { key: 'highTideTime', label: 'High Tide Time', type: 'text', defaultValue: '8:45 AM', group: 'Content' },
    { key: 'lowTideTime', label: 'Low Tide Time', type: 'text', defaultValue: '3:12 PM', group: 'Content' },
    { key: 'highTideHeight', label: 'High Tide Height', type: 'number', defaultValue: 5.8, min: 0, max: 30, group: 'Content' },
    { key: 'lowTideHeight', label: 'Low Tide Height', type: 'number', defaultValue: 0.9, min: -5, max: 30, group: 'Content' },
    { key: 'tideData', label: 'Tide Data (comma-separated)', type: 'text', defaultValue: '2.1,3.5,4.8,5.6,5.8,5.2,4.1,2.8,1.5,0.9,1.2,2.4,3.6,4.5,5.1', group: 'Content' },
    { key: 'unit', label: 'Unit (ft/m)', type: 'text', defaultValue: 'ft', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060e1a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
    { key: 'waterColor', label: 'Water Color', type: 'color', defaultValue: '#22d3ee', group: 'Style' },
  ],
})
