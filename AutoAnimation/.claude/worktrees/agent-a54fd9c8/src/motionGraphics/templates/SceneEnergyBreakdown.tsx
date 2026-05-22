import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EnergyBreakdownConfig {
  solarPercent: number
  windPercent: number
  hydroPercent: number
  fossilPercent: number
  totalKwh: number
  bgColor: string
  textColor: string
  cardColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

const sources = [
  { key: 'solar', label: 'Solar', icon: '\u2600\uFE0F', color: '#FFB74D' },
  { key: 'wind', label: 'Wind', icon: '\u{1F4A8}', color: '#4FC3F7' },
  { key: 'hydro', label: 'Hydro', icon: '\u{1F4A7}', color: '#4DD0E1' },
  { key: 'fossil', label: 'Fossil', icon: '\u{1F525}', color: '#EF5350' },
]

function SceneEnergyBreakdownComponent({ config, progress }: MotionGraphicProps<EnergyBreakdownConfig>) {
  const { solarPercent, windPercent, hydroPercent, fossilPercent, totalKwh, bgColor, textColor, cardColor } = config
  const percents = [solarPercent, windPercent, hydroPercent, fossilPercent]

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Title
  const titleEnter = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Donut chart animation
  const chartEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.5)))

  // Total kWh counter
  const counterProg = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.5)))
  const displayKwh = Math.round(counterProg * totalKwh)

  // Source cards
  const getCardProgress = (idx: number) =>
    easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4 - idx * 0.08) / 0.35)))

  // Renewable percentage
  const renewablePercent = solarPercent + windPercent + hydroPercent
  const renewableEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.3)))

  // Donut segments
  let cumulativeAngle = 0
  const segments = percents.map((pct, i) => {
    const startAngle = cumulativeAngle
    const sweepAngle = (pct / 100) * 360 * chartEnter
    cumulativeAngle += sweepAngle
    return { startAngle, sweepAngle, color: sources[i].color }
  })

  // Pulse on hold
  const chartPulse = progress >= 0.25 && progress < 0.8
    ? 1 + Math.sin(holdProgress * Math.PI * 5) * 0.015
    : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '5%',
          opacity: exitOpacity,
          transform: `scale(${exitProgress > 0 ? 1 - exitEased * 0.1 : 1})`,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.6vw, 13px)',
            fontWeight: 700,
            color: '#66BB6A',
            textTransform: 'uppercase',
            letterSpacing: 3,
            marginBottom: 'clamp(10px, 2vh, 20px)',
            opacity: titleEnter,
            transform: `translateY(${(1 - titleEnter) * 10}px)`,
          }}
        >
          \u26A1 Energy Breakdown
        </div>

        {/* Donut chart */}
        <div
          style={{
            position: 'relative',
            width: 'clamp(130px, 30vw, 190px)',
            height: 'clamp(130px, 30vw, 190px)',
            marginBottom: 'clamp(14px, 2.5vh, 24px)',
            transform: `scale(${chartPulse})`,
          }}
        >
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
            {segments.map((seg, i) => {
              if (seg.sweepAngle <= 0) return null
              const r = 38
              const startRad = ((seg.startAngle - 90) * Math.PI) / 180
              const endRad = ((seg.startAngle + seg.sweepAngle - 90) * Math.PI) / 180
              const x1 = 50 + r * Math.cos(startRad)
              const y1 = 50 + r * Math.sin(startRad)
              const x2 = 50 + r * Math.cos(endRad)
              const y2 = 50 + r * Math.sin(endRad)
              const largeArc = seg.sweepAngle > 180 ? 1 : 0
              const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`
              return (
                <path
                  key={i}
                  d={d}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="10"
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 4px ${seg.color}40)` }}
                />
              )
            })}
          </svg>
          {/* Center text */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: 'clamp(22px, 5.5vw, 36px)', fontWeight: 900, color: textColor, lineHeight: 1 }}>
              {displayKwh}
            </div>
            <div style={{ fontSize: 'clamp(9px, 1.3vw, 11px)', color: `${textColor}77`, fontWeight: 600 }}>
              kWh today
            </div>
          </div>
        </div>

        {/* Source cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(6px, 1vw, 10px)', width: '100%', maxWidth: '380px' }}>
          {sources.map((src, i) => {
            const cardProg = getCardProgress(i)
            return (
              <div
                key={i}
                style={{
                  background: cardColor,
                  borderRadius: 'clamp(6px, 1vw, 10px)',
                  padding: 'clamp(8px, 1.5vw, 14px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(6px, 1vw, 10px)',
                  opacity: cardProg,
                  transform: `translateY(${(1 - cardProg) * 12}px)`,
                  borderLeft: `3px solid ${src.color}`,
                }}
              >
                <span style={{ fontSize: 'clamp(16px, 3.5vw, 24px)' }}>{src.icon}</span>
                <div>
                  <div style={{ fontSize: 'clamp(9px, 1.4vw, 11px)', color: `${textColor}88`, fontWeight: 500 }}>
                    {src.label}
                  </div>
                  <div style={{ fontSize: 'clamp(16px, 3.5vw, 24px)', fontWeight: 800, color: src.color }}>
                    {Math.round(cardProg * percents[i])}%
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Renewable summary */}
        <div
          style={{
            marginTop: 'clamp(10px, 2vh, 18px)',
            fontSize: 'clamp(12px, 2vw, 16px)',
            fontWeight: 700,
            color: '#66BB6A',
            opacity: renewableEnter,
            transform: `translateY(${(1 - renewableEnter) * 10}px)`,
          }}
        >
          {Math.round(renewableEnter * renewablePercent)}% Renewable
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-energy-breakdown',
  title: 'Energy Breakdown',
  description: 'Energy source breakdown chart with animated donut graph, source cards with icons, and renewable percentage summary.',
  tags: ['scene', 'energy', 'renewable', 'solar', 'wind', 'eco', 'sustainability', 'chart'],
  category: 'scene-layout',
  component: SceneEnergyBreakdownComponent as any,
  defaultConfig: {
    solarPercent: 35,
    windPercent: 25,
    hydroPercent: 18,
    fossilPercent: 22,
    totalKwh: 48,
    bgColor: '#0D1A0D',
    textColor: '#E8F5E9',
    cardColor: '#1A2E1A',
  },
  configSchema: [
    { key: 'solarPercent', label: 'Solar %', type: 'number', defaultValue: 35, min: 0, max: 100, group: 'Content' },
    { key: 'windPercent', label: 'Wind %', type: 'number', defaultValue: 25, min: 0, max: 100, group: 'Content' },
    { key: 'hydroPercent', label: 'Hydro %', type: 'number', defaultValue: 18, min: 0, max: 100, group: 'Content' },
    { key: 'fossilPercent', label: 'Fossil %', type: 'number', defaultValue: 22, min: 0, max: 100, group: 'Content' },
    { key: 'totalKwh', label: 'Total kWh', type: 'number', defaultValue: 48, min: 0, max: 9999, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D1A0D', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8F5E9', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1A2E1A', group: 'Style' },
  ],
})
