import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneFunnelChartConfig {
  stages: string[]
  colors: string[]
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function parseStage(s: string): { label: string; value: number } {
  const parts = s.split(':')
  return { label: (parts[0] || '').trim(), value: parseFloat(parts[1] || '0') }
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return Math.round(n).toLocaleString('en-US')
}

function SceneFunnelChartComponent({ config, progress }: MotionGraphicProps<SceneFunnelChartConfig>) {
  const { stages, colors, bgColor, textColor } = config

  const parsed = stages.map(parseStage)
  const maxVal = Math.max(...parsed.map(s => s.value), 1)

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6% 10%',
          gap: 'clamp(4px, 1vw, 10px)',
          opacity: exitOpacity,
        }}
      >
        {parsed.map((stage, i) => {
          const stagger = i * 0.12
          const layerEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger * parsed.length / Math.max(parsed.length - 1, 1)))))

          // Exit: shrink from bottom up (reverse stagger)
          const reverseIdx = parsed.length - 1 - i
          const layerExit = exitProgress > 0
            ? easeInCubic(Math.max(0, Math.min(1, (exitProgress - reverseIdx * 0.08) / (1 - reverseIdx * 0.08))))
            : 0

          const widthPercent = (stage.value / maxVal) * 100
          const animatedWidth = widthPercent * layerEnter * (1 - layerExit)
          const color = colors[i % colors.length] || '#6366f1'

          // Hold: subtle pulse
          const isHolding = progress >= 0.25 && progress < 0.8
          const pulse = isHolding ? 1 + Math.sin(holdProgress * Math.PI * 3 + i * 0.8) * 0.015 : 1

          // Animated value
          const displayVal = formatNumber(stage.value * layerEnter * (1 - layerExit))

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                maxWidth: 600,
                gap: 'clamp(6px, 1.5vw, 16px)',
                opacity: layerEnter * (1 - layerExit),
              }}
            >
              {/* Label */}
              <div
                style={{
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  fontSize: 'clamp(10px, 1.5vw, 15px)',
                  fontWeight: 500,
                  color: textColor,
                  width: 'clamp(60px, 12vw, 100px)',
                  textAlign: 'right',
                  flexShrink: 0,
                  opacity: 0.8,
                }}
              >
                {stage.label}
              </div>

              {/* Trapezoid bar */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <div
                  style={{
                    width: `${animatedWidth}%`,
                    minWidth: animatedWidth > 0 ? 'clamp(30px, 5vw, 60px)' : 0,
                    height: 'clamp(28px, 4.5vw, 48px)',
                    background: color,
                    borderRadius: 6,
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: `0 2px 12px ${color}30`,
                    transform: `scaleX(${pulse})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Gloss */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '40%',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.15), transparent)',
                      borderRadius: '6px 6px 0 0',
                    }}
                  />
                </div>
              </div>

              {/* Value */}
              <div
                style={{
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  fontSize: 'clamp(12px, 2vw, 20px)',
                  fontWeight: 700,
                  color,
                  width: 'clamp(40px, 8vw, 70px)',
                  flexShrink: 0,
                }}
              >
                {displayVal}
              </div>
            </div>
          )
        })}

        {/* Conversion arrow indicators between layers */}
        {parsed.length > 1 && parsed.slice(0, -1).map((_, i) => {
          const rate = parsed[i + 1] ? Math.round((parsed[i + 1].value / parsed[i].value) * 100) : 0
          const arrowEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - (i + 1) * 0.12 - 0.1) / 0.3)))
          return (
            <div key={`arrow-${i}`} style={{ position: 'absolute', display: 'none' }}>
              {/* Hidden but keeps rate calculation for potential future use */}
              {rate}%
            </div>
          )
        })}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-funnel-chart',
  title: 'Funnel Chart',
  description: 'Animated funnel/pipeline visualization with staggered layers, proportional widths, and value labels',
  tags: ['scene', 'data', 'funnel', 'pipeline', 'conversion', 'stages'],
  category: 'scene-layout',
  component: SceneFunnelChartComponent as any,
  defaultConfig: {
    stages: ['Visitors:10000', 'Leads:3000', 'Trials:800', 'Customers:200'],
    colors: ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'],
    bgColor: '#0f172a',
    textColor: '#e2e8f0',
  },
  configSchema: [
    { key: 'stages', label: 'Stages (Label:Value)', type: 'text-array', defaultValue: ['Visitors:10000', 'Leads:3000', 'Trials:800', 'Customers:200'], group: 'Content' },
    { key: 'colors', label: 'Stage Colors', type: 'text-array', defaultValue: ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
})
