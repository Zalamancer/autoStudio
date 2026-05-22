import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneEVChargingStatusConfig {
  vehicleName: string
  chargeLevel: number
  chargeRate: string
  estimatedFull: string
  rangeAdded: string
  totalRange: string
  stationName: string
  connectorType: string
  costPerKwh: string
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

function SceneEVChargingStatusComponent({ config, progress }: MotionGraphicProps<SceneEVChargingStatusConfig>) {
  const { vehicleName, chargeLevel, chargeRate, estimatedFull, rangeAdded, totalRange, stationName, connectorType, costPerKwh, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.12

  const headerEnter = easeOutBack(Math.min(1, enterProgress / 0.5))
  const batteryEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.6)))
  const detailsEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.5)))
  const stationEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.4)))

  const displayLevel = Math.round(batteryEnter * chargeLevel)
  const isCharging = chargeLevel < 100
  const chargeColor = chargeLevel > 80 ? '#44cc66' : chargeLevel > 30 ? accentColor : '#ffaa00'

  // Charging pulse animation
  const isHolding = progress >= 0.2 && progress < 0.8
  const chargePulse = isHolding && isCharging ? 0.6 + Math.sin(holdProgress * Math.PI * 10) * 0.4 : 1

  // Battery segments
  const segmentCount = 10
  const filledSegments = Math.round((displayLevel / 100) * segmentCount)

  const stats = [
    { label: 'Charge Rate', value: chargeRate },
    { label: 'Est. Full', value: estimatedFull },
    { label: 'Range Added', value: rangeAdded },
    { label: 'Total Range', value: totalRange },
  ]

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Subtle charging energy lines */}
      {isCharging && isHolding && (
        <>
          {Array.from({ length: 5 }, (_, i) => {
            const y = 20 + i * 15
            const alpha = Math.sin(holdProgress * Math.PI * 6 + i * 1.2) * 0.03 + 0.02
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: `${y}%`,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: `linear-gradient(90deg, transparent, ${accentColor}${Math.round(alpha * 255).toString(16).padStart(2, '0')}, transparent)`,
                }}
              />
            )
          })}
        </>
      )}

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
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 'clamp(8px, 2vw, 16px)',
            opacity: headerEnter,
            transform: `translateY(${(1 - headerEnter) * -15}px)`,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1vw, 10px)', marginBottom: 'clamp(2px, 0.4vw, 4px)' }}>
              {/* Lightning bolt */}
              <div style={{ fontSize: 'clamp(14px, 2.5vw, 22px)', color: isCharging ? accentColor : '#44cc66', opacity: chargePulse }}>
                {'\u26A1'}
              </div>
              <div style={{ fontSize: 'clamp(9px, 1.3vw, 11px)', fontWeight: 700, color: isCharging ? accentColor : '#44cc66', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                {isCharging ? 'Charging' : 'Fully Charged'}
              </div>
            </div>
            <div style={{ fontSize: 'clamp(18px, 4vw, 32px)', fontWeight: 900, color: textColor, letterSpacing: '-0.02em' }}>
              {vehicleName}
            </div>
          </div>
        </div>

        {/* Battery visual */}
        <div
          style={{
            margin: 'clamp(8px, 2vw, 16px) 0',
            opacity: batteryEnter,
            transform: `scale(${0.9 + batteryEnter * 0.1})`,
          }}
        >
          {/* Battery outline */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(2px, 0.4vw, 4px)',
            }}
          >
            <div
              style={{
                flex: 1,
                height: 'clamp(36px, 8vw, 56px)',
                borderRadius: 'clamp(6px, 1.2vw, 10px)',
                border: `2px solid ${textColor}15`,
                padding: 'clamp(3px, 0.5vw, 5px)',
                display: 'flex',
                gap: 'clamp(2px, 0.3vw, 3px)',
                overflow: 'hidden',
              }}
            >
              {Array.from({ length: segmentCount }, (_, i) => {
                const filled = i < filledSegments
                const isCurrentSegment = i === filledSegments - 1 && isCharging
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      borderRadius: 'clamp(2px, 0.4vw, 4px)',
                      background: filled
                        ? `linear-gradient(180deg, ${chargeColor}, ${chargeColor}80)`
                        : `${textColor}06`,
                      opacity: isCurrentSegment ? chargePulse : 1,
                      boxShadow: filled ? `0 0 4px ${chargeColor}20` : 'none',
                    }}
                  />
                )
              })}
            </div>
            {/* Battery tip */}
            <div
              style={{
                width: 'clamp(4px, 0.8vw, 7px)',
                height: 'clamp(16px, 3.5vw, 26px)',
                background: `${textColor}15`,
                borderRadius: '0 3px 3px 0',
              }}
            />
          </div>
          {/* Percentage */}
          <div
            style={{
              textAlign: 'center',
              marginTop: 'clamp(6px, 1.2vw, 10px)',
              fontSize: 'clamp(28px, 7vw, 52px)',
              fontWeight: 900,
              color: chargeColor,
              fontVariantNumeric: 'tabular-nums',
              textShadow: `0 0 16px ${chargeColor}30`,
            }}
          >
            {displayLevel}%
          </div>
        </div>

        {/* Stats grid (2x2) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'clamp(6px, 1.2vw, 12px)',
            marginBottom: 'clamp(12px, 2.5vw, 22px)',
            opacity: detailsEnter,
            transform: `translateY(${(1 - detailsEnter) * 12}px)`,
          }}
        >
          {stats.map((stat, i) => {
            const stagger = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.45 - i * 0.05) / 0.4)))
            return (
              <div
                key={i}
                style={{
                  background: `${textColor}05`,
                  borderRadius: 'clamp(6px, 1vw, 10px)',
                  padding: 'clamp(8px, 1.5vw, 14px) clamp(10px, 2vw, 16px)',
                  opacity: stagger,
                  transform: `translateY(${(1 - stagger) * 8}px)`,
                }}
              >
                <div style={{ fontSize: 'clamp(8px, 1.1vw, 10px)', fontWeight: 600, color: `${textColor}45`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'clamp(2px, 0.3vw, 4px)' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 'clamp(13px, 2.2vw, 20px)', fontWeight: 800, color: textColor, fontVariantNumeric: 'tabular-nums' }}>
                  {stat.value}
                </div>
              </div>
            )
          })}
        </div>

        {/* Station info footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'clamp(8px, 1.5vw, 14px) clamp(10px, 2vw, 18px)',
            background: `${textColor}04`,
            borderRadius: 'clamp(6px, 1vw, 10px)',
            opacity: stationEnter,
            transform: `translateY(${(1 - stationEnter) * 8}px)`,
          }}
        >
          <div>
            <div style={{ fontSize: 'clamp(10px, 1.6vw, 14px)', fontWeight: 700, color: `${textColor}80` }}>
              {stationName}
            </div>
            <div style={{ fontSize: 'clamp(8px, 1.1vw, 10px)', fontWeight: 500, color: `${textColor}40`, marginTop: 1 }}>
              {connectorType}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 'clamp(12px, 2vw, 18px)', fontWeight: 800, color: accentColor, fontVariantNumeric: 'tabular-nums' }}>
              {costPerKwh}
            </div>
            <div style={{ fontSize: 'clamp(7px, 1vw, 9px)', fontWeight: 500, color: `${textColor}40` }}>
              per kWh
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-ev-charging-status',
  title: 'EV Charging Status',
  description: 'EV charging dashboard with segmented battery bar, charge percentage, rate stats, station info, and pulsing charge animation.',
  tags: ['scene', 'ev', 'charging', 'electric', 'battery', 'tesla', 'auto', 'green'],
  category: 'scene-layout',
  component: SceneEVChargingStatusComponent as any,
  defaultConfig: {
    vehicleName: 'Tesla Model Y',
    chargeLevel: 72,
    chargeRate: '150 kW',
    estimatedFull: '28 min',
    rangeAdded: '+180 mi',
    totalRange: '285 mi',
    stationName: 'Tesla Supercharger',
    connectorType: 'NACS Connector',
    costPerKwh: '$0.35',
    bgColor: '#0a0a14',
    accentColor: '#22cc88',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'vehicleName', label: 'Vehicle', type: 'text', defaultValue: 'Tesla Model Y', group: 'Content' },
    { key: 'chargeLevel', label: 'Charge Level (%)', type: 'number', defaultValue: 72, min: 0, max: 100, group: 'Content' },
    { key: 'chargeRate', label: 'Charge Rate', type: 'text', defaultValue: '150 kW', group: 'Charging' },
    { key: 'estimatedFull', label: 'Est. Full', type: 'text', defaultValue: '28 min', group: 'Charging' },
    { key: 'rangeAdded', label: 'Range Added', type: 'text', defaultValue: '+180 mi', group: 'Charging' },
    { key: 'totalRange', label: 'Total Range', type: 'text', defaultValue: '285 mi', group: 'Charging' },
    { key: 'stationName', label: 'Station Name', type: 'text', defaultValue: 'Tesla Supercharger', group: 'Station' },
    { key: 'connectorType', label: 'Connector', type: 'text', defaultValue: 'NACS Connector', group: 'Station' },
    { key: 'costPerKwh', label: 'Cost/kWh', type: 'text', defaultValue: '$0.35', group: 'Station' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#22cc88', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
