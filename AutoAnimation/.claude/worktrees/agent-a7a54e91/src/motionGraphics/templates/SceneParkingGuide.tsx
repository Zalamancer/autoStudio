import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneParkingGuideConfig {
  lotName: string
  address: string
  totalSpots: number
  availableSpots: number
  level1Available: number
  level1Total: number
  level2Available: number
  level2Total: number
  level3Available: number
  level3Total: number
  hourlyRate: string
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

function SceneParkingGuideComponent({ config, progress }: MotionGraphicProps<SceneParkingGuideConfig>) {
  const { lotName, address, totalSpots, availableSpots, level1Available, level1Total, level2Available, level2Total, level3Available, level3Total, hourlyRate, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.12

  const headerEnter = easeOutBack(Math.min(1, enterProgress / 0.5))
  const countEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.5)))
  const levelsEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.5)))

  const displayAvailable = Math.round(countEnter * availableSpots)
  const availPercent = availableSpots / totalSpots
  const statusColor = availPercent > 0.3 ? '#44cc66' : availPercent > 0.1 ? '#ffaa00' : '#ff4444'
  const statusText = availPercent > 0.3 ? 'AVAILABLE' : availPercent > 0.1 ? 'FILLING UP' : 'ALMOST FULL'

  const levels = [
    { label: 'Level 1', available: level1Available, total: level1Total },
    { label: 'Level 2', available: level2Available, total: level2Total },
    { label: 'Level 3', available: level3Available, total: level3Total },
  ]

  // Status indicator pulse
  const isHolding = progress >= 0.2 && progress < 0.8
  const statusPulse = isHolding ? 0.7 + Math.sin(holdProgress * Math.PI * 6) * 0.3 : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'clamp(16px, 4vw, 40px) clamp(20px, 5vw, 48px)',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Header */}
        <div
          style={{
            marginBottom: 'clamp(4px, 1vw, 8px)',
            opacity: headerEnter,
            transform: `translateY(${(1 - headerEnter) * -15}px)`,
          }}
        >
          {/* P badge + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 14px)', marginBottom: 'clamp(4px, 0.8vw, 8px)' }}>
            <div
              style={{
                width: 'clamp(28px, 5vw, 40px)',
                height: 'clamp(28px, 5vw, 40px)',
                background: accentColor,
                borderRadius: 'clamp(4px, 0.8vw, 8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(16px, 3vw, 24px)',
                fontWeight: 900,
                color: bgColor,
                flexShrink: 0,
              }}
            >
              P
            </div>
            <div>
              <div style={{ fontSize: 'clamp(16px, 3.5vw, 28px)', fontWeight: 900, color: textColor }}>
                {lotName}
              </div>
              <div style={{ fontSize: 'clamp(9px, 1.3vw, 11px)', fontWeight: 500, color: `${textColor}50` }}>
                {address}
              </div>
            </div>
          </div>
        </div>

        {/* Main availability count */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(12px, 2.5vw, 22px)',
            margin: 'clamp(10px, 2.5vw, 22px) 0',
            opacity: countEnter,
            transform: `scale(${0.9 + countEnter * 0.1})`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(40px, 10vw, 72px)',
              fontWeight: 900,
              color: statusColor,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
              textShadow: `0 0 16px ${statusColor}30`,
            }}
          >
            {displayAvailable}
          </div>
          <div>
            <div style={{ fontSize: 'clamp(11px, 1.8vw, 16px)', fontWeight: 700, color: `${textColor}80` }}>
              spots available
            </div>
            <div style={{ fontSize: 'clamp(9px, 1.3vw, 12px)', fontWeight: 600, color: `${textColor}50` }}>
              of {totalSpots} total
            </div>
            <div
              style={{
                display: 'inline-block',
                marginTop: 'clamp(3px, 0.5vw, 6px)',
                fontSize: 'clamp(8px, 1.1vw, 10px)',
                fontWeight: 800,
                color: statusColor,
                background: `${statusColor}15`,
                padding: 'clamp(2px, 0.3vw, 3px) clamp(6px, 1vw, 10px)',
                borderRadius: 100,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                opacity: statusPulse,
              }}
            >
              {statusText}
            </div>
          </div>
        </div>

        {/* Level breakdown */}
        {levels.map((lvl, i) => {
          const stagger = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.45 - i * 0.07) / 0.4)))
          const fillPct = levelsEnter * ((lvl.total - lvl.available) / lvl.total) * 100
          const lvlColor = lvl.available / lvl.total > 0.3 ? '#44cc66' : lvl.available / lvl.total > 0.1 ? '#ffaa00' : '#ff4444'
          return (
            <div
              key={i}
              style={{
                marginBottom: 'clamp(8px, 1.5vw, 14px)',
                opacity: stagger,
                transform: `translateX(${(1 - stagger) * 20}px)`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'clamp(2px, 0.4vw, 4px)' }}>
                <span style={{ fontSize: 'clamp(10px, 1.5vw, 13px)', fontWeight: 700, color: `${textColor}80` }}>
                  {lvl.label}
                </span>
                <span style={{ fontSize: 'clamp(10px, 1.5vw, 13px)', fontWeight: 800, color: lvlColor, fontVariantNumeric: 'tabular-nums' }}>
                  {lvl.available}/{lvl.total}
                </span>
              </div>
              <div style={{ height: 'clamp(6px, 1vw, 10px)', background: `${textColor}08`, borderRadius: 6, overflow: 'hidden', display: 'flex' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${fillPct}%`,
                    background: `${textColor}15`,
                    borderRadius: 6,
                  }}
                />
                <div
                  style={{
                    height: '100%',
                    flex: 1,
                    background: `${lvlColor}25`,
                    borderRadius: '0 6px 6px 0',
                  }}
                />
              </div>
            </div>
          )
        })}

        {/* Rate footer */}
        <div
          style={{
            marginTop: 'clamp(8px, 1.5vw, 14px)',
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1vw, 10px)',
            opacity: levelsEnter,
          }}
        >
          <div style={{ width: 'clamp(3px, 0.5vw, 4px)', height: 'clamp(16px, 2.5vw, 24px)', background: accentColor, borderRadius: 2 }} />
          <div style={{ fontSize: 'clamp(10px, 1.6vw, 14px)', fontWeight: 700, color: `${textColor}80` }}>
            {hourlyRate}/hr
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-parking-guide',
  title: 'Parking Guide',
  description: 'Parking lot availability display with spot count, level breakdown bars, status badge, P icon, and hourly rate.',
  tags: ['scene', 'parking', 'guide', 'availability', 'lot', 'car', 'auto'],
  category: 'scene-layout',
  component: SceneParkingGuideComponent as any,
  defaultConfig: {
    lotName: 'Downtown Garage',
    address: '123 Main St, Floor B1-B3',
    totalSpots: 450,
    availableSpots: 127,
    level1Available: 12,
    level1Total: 150,
    level2Available: 45,
    level2Total: 150,
    level3Available: 70,
    level3Total: 150,
    hourlyRate: '$4.50',
    bgColor: '#0a0a14',
    accentColor: '#3388ff',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'lotName', label: 'Lot Name', type: 'text', defaultValue: 'Downtown Garage', group: 'Content' },
    { key: 'address', label: 'Address', type: 'text', defaultValue: '123 Main St, Floor B1-B3', group: 'Content' },
    { key: 'totalSpots', label: 'Total Spots', type: 'number', defaultValue: 450, min: 1, max: 9999, group: 'Capacity' },
    { key: 'availableSpots', label: 'Available Spots', type: 'number', defaultValue: 127, min: 0, max: 9999, group: 'Capacity' },
    { key: 'level1Available', label: 'L1 Available', type: 'number', defaultValue: 12, min: 0, max: 999, group: 'Levels' },
    { key: 'level1Total', label: 'L1 Total', type: 'number', defaultValue: 150, min: 1, max: 999, group: 'Levels' },
    { key: 'level2Available', label: 'L2 Available', type: 'number', defaultValue: 45, min: 0, max: 999, group: 'Levels' },
    { key: 'level2Total', label: 'L2 Total', type: 'number', defaultValue: 150, min: 1, max: 999, group: 'Levels' },
    { key: 'level3Available', label: 'L3 Available', type: 'number', defaultValue: 70, min: 0, max: 999, group: 'Levels' },
    { key: 'level3Total', label: 'L3 Total', type: 'number', defaultValue: 150, min: 1, max: 999, group: 'Levels' },
    { key: 'hourlyRate', label: 'Hourly Rate', type: 'text', defaultValue: '$4.50', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#3388ff', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
