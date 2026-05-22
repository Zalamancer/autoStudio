import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneTrafficUpdateConfig {
  title: string
  route1Name: string
  route1Status: string
  route1Time: string
  route2Name: string
  route2Status: string
  route2Time: string
  route3Name: string
  route3Status: string
  route3Time: string
  route4Name: string
  route4Status: string
  route4Time: string
  lastUpdated: string
  bgColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneTrafficUpdateComponent({ config, progress }: MotionGraphicProps<SceneTrafficUpdateConfig>) {
  const { title, route1Name, route1Status, route1Time, route2Name, route2Status, route2Time, route3Name, route3Status, route3Time, route4Name, route4Status, route4Time, lastUpdated, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  const headerEnter = easeOutBack(Math.min(1, enterProgress / 0.5))

  const statusColors: Record<string, string> = {
    'Clear': '#44cc66',
    'Moderate': '#ffaa00',
    'Heavy': '#ff6633',
    'Gridlock': '#ff2222',
    'Closed': '#888888',
  }

  const statusIcons: Record<string, string> = {
    'Clear': '\u2713',
    'Moderate': '\u25B2',
    'Heavy': '\u25CF',
    'Gridlock': '\u2716',
    'Closed': '\u2014',
  }

  const routes = [
    { name: route1Name, status: route1Status, time: route1Time },
    { name: route2Name, status: route2Status, time: route2Time },
    { name: route3Name, status: route3Status, time: route3Time },
    { name: route4Name, status: route4Status, time: route4Time },
  ]

  // Live dot pulse
  const isHolding = progress >= 0.2 && progress < 0.8
  const livePulse = isHolding ? Math.sin(holdProgress * Math.PI * 8) > 0 : true

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Top status bar gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 'clamp(3px, 0.6vw, 5px)',
          background: `linear-gradient(90deg, #44cc66, #ffaa00, #ff6633, #ff2222)`,
          opacity: 0.7,
          transform: `scaleX(${easeOutCubic(enterProgress)})`,
          transformOrigin: 'left',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'clamp(16px, 4vw, 40px) clamp(20px, 5vw, 48px)',
          opacity: exitOpacity,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'clamp(14px, 3vw, 28px)',
            opacity: headerEnter,
            transform: `translateY(${(1 - headerEnter) * -15}px)`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 14px)' }}>
            {/* Live indicator */}
            <div
              style={{
                width: 'clamp(8px, 1.2vw, 12px)',
                height: 'clamp(8px, 1.2vw, 12px)',
                borderRadius: '50%',
                background: '#ff2222',
                opacity: livePulse ? 1 : 0.3,
                boxShadow: '0 0 8px rgba(255,34,34,0.5)',
              }}
            />
            <div style={{ fontSize: 'clamp(16px, 3.5vw, 28px)', fontWeight: 900, color: textColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {title}
            </div>
          </div>
          <div style={{ fontSize: 'clamp(8px, 1.2vw, 11px)', fontWeight: 500, color: `${textColor}40` }}>
            {lastUpdated}
          </div>
        </div>

        {/* Route cards */}
        {routes.map((route, i) => {
          const rowEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.25 - i * 0.08) / 0.45)))
          const color = statusColors[route.status] || `${textColor}80`
          const icon = statusIcons[route.status] || ''
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(10px, 2vw, 18px)',
                padding: 'clamp(10px, 2vw, 18px) clamp(12px, 2.5vw, 22px)',
                marginBottom: 'clamp(4px, 0.8vw, 8px)',
                background: `${textColor}04`,
                borderRadius: 'clamp(8px, 1.5vw, 12px)',
                borderLeft: `4px solid ${color}`,
                opacity: rowEnter,
                transform: `translateX(${(1 - rowEnter) * 35}px)`,
              }}
            >
              {/* Status icon */}
              <div
                style={{
                  width: 'clamp(28px, 5vw, 40px)',
                  height: 'clamp(28px, 5vw, 40px)',
                  borderRadius: '50%',
                  background: `${color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'clamp(12px, 2vw, 18px)',
                  color,
                  fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                {icon}
              </div>

              {/* Route info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'clamp(12px, 2vw, 17px)', fontWeight: 700, color: textColor }}>
                  {route.name}
                </div>
                <div
                  style={{
                    display: 'inline-block',
                    fontSize: 'clamp(8px, 1.1vw, 10px)',
                    fontWeight: 700,
                    color,
                    background: `${color}12`,
                    padding: 'clamp(1px, 0.2vw, 2px) clamp(5px, 0.8vw, 8px)',
                    borderRadius: 100,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginTop: 'clamp(2px, 0.3vw, 3px)',
                  }}
                >
                  {route.status}
                </div>
              </div>

              {/* ETA */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 'clamp(14px, 2.5vw, 22px)', fontWeight: 900, color: textColor, fontVariantNumeric: 'tabular-nums' }}>
                  {route.time}
                </div>
                <div style={{ fontSize: 'clamp(7px, 1vw, 9px)', fontWeight: 500, color: `${textColor}40`, textTransform: 'uppercase' }}>
                  est. time
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-traffic-update',
  title: 'Traffic Update',
  description: 'Traffic condition status display with color-coded routes, status badges, ETA times, live indicator, and gradient status bar.',
  tags: ['scene', 'traffic', 'update', 'commute', 'road', 'car', 'auto', 'navigation'],
  category: 'scene-layout',
  component: SceneTrafficUpdateComponent as any,
  defaultConfig: {
    title: 'Traffic Update',
    route1Name: 'I-405 Northbound',
    route1Status: 'Heavy',
    route1Time: '42 min',
    route2Name: 'US-101 Southbound',
    route2Status: 'Moderate',
    route2Time: '28 min',
    route3Name: 'Pacific Coast Hwy',
    route3Status: 'Clear',
    route3Time: '15 min',
    route4Name: 'I-10 Eastbound',
    route4Status: 'Gridlock',
    route4Time: '55 min',
    lastUpdated: 'Updated 2m ago',
    bgColor: '#0a0a14',
    accentColor: '#3388ff',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Traffic Update', group: 'Content' },
    { key: 'route1Name', label: 'Route 1', type: 'text', defaultValue: 'I-405 Northbound', group: 'Route 1' },
    { key: 'route1Status', label: 'Status 1', type: 'text', defaultValue: 'Heavy', group: 'Route 1' },
    { key: 'route1Time', label: 'Time 1', type: 'text', defaultValue: '42 min', group: 'Route 1' },
    { key: 'route2Name', label: 'Route 2', type: 'text', defaultValue: 'US-101 Southbound', group: 'Route 2' },
    { key: 'route2Status', label: 'Status 2', type: 'text', defaultValue: 'Moderate', group: 'Route 2' },
    { key: 'route2Time', label: 'Time 2', type: 'text', defaultValue: '28 min', group: 'Route 2' },
    { key: 'route3Name', label: 'Route 3', type: 'text', defaultValue: 'Pacific Coast Hwy', group: 'Route 3' },
    { key: 'route3Status', label: 'Status 3', type: 'text', defaultValue: 'Clear', group: 'Route 3' },
    { key: 'route3Time', label: 'Time 3', type: 'text', defaultValue: '15 min', group: 'Route 3' },
    { key: 'route4Name', label: 'Route 4', type: 'text', defaultValue: 'I-10 Eastbound', group: 'Route 4' },
    { key: 'route4Status', label: 'Status 4', type: 'text', defaultValue: 'Gridlock', group: 'Route 4' },
    { key: 'route4Time', label: 'Time 4', type: 'text', defaultValue: '55 min', group: 'Route 4' },
    { key: 'lastUpdated', label: 'Last Updated', type: 'text', defaultValue: 'Updated 2m ago', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#3388ff', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
