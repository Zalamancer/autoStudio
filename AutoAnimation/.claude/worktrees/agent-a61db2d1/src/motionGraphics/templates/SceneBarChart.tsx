import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneBarChartConfig {
  items: string[]
  colors: string[]
  bgColor: string
  textColor: string
  maxValue: number
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function parseItem(s: string): { label: string; value: number } {
  const parts = s.split(':')
  return { label: (parts[0] || '').trim(), value: parseFloat(parts[1] || '0') }
}

function SceneBarChartComponent({ config, progress }: MotionGraphicProps<SceneBarChartConfig>) {
  const { items, colors, bgColor, textColor, maxValue } = config

  const parsed = items.map(parseItem)
  const effectiveMax = maxValue > 0 ? maxValue : Math.max(...parsed.map(p => p.value), 1)

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
          justifyContent: 'center',
          padding: '8% 10%',
          opacity: exitOpacity,
          gap: 'clamp(8px, 2vw, 18px)',
        }}
      >
        {parsed.map((item, i) => {
          const staggerDelay = i * 0.15
          const barEnter = enterProgress < 1
            ? easeOutCubic(Math.max(0, Math.min(1, (enterProgress - staggerDelay) / (1 - staggerDelay * parsed.length / (parsed.length - 1 || 1)))))
            : 1

          // Exit: bars shrink back
          const barExit = exitProgress > 0
            ? 1 - easeInCubic(Math.max(0, Math.min(1, (exitProgress - staggerDelay * 0.5) / (1 - staggerDelay * 0.5))))
            : 1

          const widthPercent = (item.value / effectiveMax) * 100 * barEnter * barExit
          const color = colors[i % colors.length] || '#6366f1'

          // Shimmer during hold
          const isHolding = progress >= 0.25 && progress < 0.8
          const shimmerPos = isHolding ? (holdProgress * 200 - 50) : -50

          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.5vw, 14px)' }}>
              {/* Label */}
              <div
                style={{
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  fontSize: 'clamp(10px, 1.8vw, 18px)',
                  fontWeight: 600,
                  color: textColor,
                  width: 'clamp(50px, 12vw, 120px)',
                  textAlign: 'right',
                  opacity: barEnter,
                  flexShrink: 0,
                }}
              >
                {item.label}
              </div>

              {/* Bar container */}
              <div style={{ flex: 1, position: 'relative', height: 'clamp(20px, 3.5vw, 36px)' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: `${textColor}10`,
                    borderRadius: 6,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: `${widthPercent}%`,
                    background: color,
                    borderRadius: 6,
                    overflow: 'hidden',
                    boxShadow: `0 2px 12px ${color}40`,
                  }}
                >
                  {/* Shimmer highlight */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: `${shimmerPos}%`,
                      width: '30%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                      transition: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Value */}
              <div
                style={{
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  fontSize: 'clamp(10px, 1.8vw, 18px)',
                  fontWeight: 700,
                  color: textColor,
                  width: 'clamp(24px, 5vw, 50px)',
                  opacity: barEnter,
                  flexShrink: 0,
                }}
              >
                {Math.round(item.value * barEnter * barExit)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-bar-chart',
  title: 'Bar Chart',
  description: 'Animated horizontal bar chart with staggered bar growth, shimmer highlights, and value labels',
  tags: ['scene', 'data', 'chart', 'bar', 'comparison', 'stats'],
  category: 'scene-layout',
  component: SceneBarChartComponent as any,
  defaultConfig: {
    items: ['React:85', 'Vue:72', 'Angular:58', 'Svelte:45', 'Solid:38'],
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
    bgColor: '#0f172a',
    textColor: '#e2e8f0',
    maxValue: 100,
  },
  configSchema: [
    { key: 'items', label: 'Items (Label:Value)', type: 'text-array', defaultValue: ['React:85', 'Vue:72', 'Angular:58', 'Svelte:45', 'Solid:38'], group: 'Content' },
    { key: 'colors', label: 'Bar Colors', type: 'text-array', defaultValue: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
    { key: 'maxValue', label: 'Max Value', type: 'number', defaultValue: 100, min: 1, max: 10000, group: 'Content' },
  ],
})
