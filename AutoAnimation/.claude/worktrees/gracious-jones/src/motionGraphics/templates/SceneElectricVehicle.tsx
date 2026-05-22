import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ElectricVehicleConfig {
  vehicleName: string
  rangeKm: number
  co2Saved: number
  chargePercent: number
  energyCost: string
  treesEquivalent: number
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneElectricVehicleComponent({ config, progress }: MotionGraphicProps<ElectricVehicleConfig>) {
  const { vehicleName, rangeKm, co2Saved, chargePercent, energyCost, treesEquivalent, bgColor, textColor, accentColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Vehicle name slides in
  const nameEnter = easeOutCubic(Math.min(1, enterProgress / 0.35))

  // Battery bar fills
  const batteryProg = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.5)))
  const batteryFill = batteryProg * chargePercent

  // Stats counters
  const statsProg = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.4)))
  const displayRange = Math.round(statsProg * rangeKm)
  const displayCO2 = Math.round(statsProg * co2Saved)

  // Impact cards
  const getCardProg = (idx: number) =>
    easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.5 - idx * 0.1) / 0.35)))

  // Charge pulse
  const chargePulse = progress >= 0.2 && progress < 0.8
    ? 0.6 + Math.sin(holdProgress * Math.PI * 8) * 0.4
    : 0

  // Battery color
  const batteryColor = chargePercent > 60 ? '#4CAF50' : chargePercent > 30 ? '#FFC107' : '#F44336'

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: `linear-gradient(180deg, transparent, ${accentColor}08)`,
        }}
      />

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
          transform: `translateY(${exitEased * 30}px)`,
        }}
      >
        {/* EV icon + name */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 'clamp(12px, 2vh, 20px)',
            opacity: nameEnter,
            transform: `translateY(${(1 - nameEnter) * 15}px)`,
          }}
        >
          <div style={{ fontSize: 'clamp(32px, 8vw, 52px)', marginBottom: '4px' }}>{'🚗'}{'⚡'}</div>
          <div style={{ fontSize: 'clamp(20px, 5vw, 34px)', fontWeight: 900, color: textColor, letterSpacing: '-0.02em' }}>
            {vehicleName}
          </div>
        </div>

        {/* Battery indicator */}
        <div
          style={{
            width: '100%',
            maxWidth: '320px',
            marginBottom: 'clamp(16px, 3vh, 28px)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: `${textColor}88`, fontWeight: 600 }}>
              Battery Level
            </span>
            <span style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: batteryColor, fontWeight: 700 }}>
              {Math.round(batteryFill)}%
            </span>
          </div>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 'clamp(14px, 3vw, 22px)',
              background: `${textColor}12`,
              borderRadius: 'clamp(6px, 1vw, 10px)',
              overflow: 'hidden',
              border: `1px solid ${textColor}15`,
            }}
          >
            <div
              style={{
                width: `${batteryFill}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${batteryColor}cc, ${batteryColor})`,
                borderRadius: 'clamp(5px, 0.9vw, 9px)',
                boxShadow: `0 0 10px ${batteryColor}40`,
                position: 'relative',
              }}
            >
              {/* Charging shimmer */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '30px',
                  height: '100%',
                  background: `linear-gradient(90deg, transparent, rgba(255,255,255,${chargePulse * 0.3}))`,
                  borderRadius: '0 8px 8px 0',
                }}
              />
            </div>
            {/* Battery nub */}
            <div
              style={{
                position: 'absolute',
                right: '-5px',
                top: '25%',
                width: '5px',
                height: '50%',
                background: `${textColor}25`,
                borderRadius: '0 3px 3px 0',
              }}
            />
          </div>
        </div>

        {/* Main stats row */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(16px, 4vw, 32px)',
            marginBottom: 'clamp(14px, 2.5vh, 24px)',
            opacity: statsProg,
            transform: `translateY(${(1 - statsProg) * 12}px)`,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(24px, 6vw, 40px)', fontWeight: 900, color: accentColor, lineHeight: 1 }}>
              {displayRange}
            </div>
            <div style={{ fontSize: 'clamp(9px, 1.3vw, 11px)', color: `${textColor}77`, fontWeight: 600 }}>
              km range
            </div>
          </div>
          <div style={{ width: '1px', background: `${textColor}20` }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(24px, 6vw, 40px)', fontWeight: 900, color: '#66BB6A', lineHeight: 1 }}>
              {displayCO2}
            </div>
            <div style={{ fontSize: 'clamp(9px, 1.3vw, 11px)', color: `${textColor}77`, fontWeight: 600 }}>
              kg CO{'₂'} saved
            </div>
          </div>
        </div>

        {/* Impact cards */}
        <div style={{ display: 'flex', gap: 'clamp(6px, 1.2vw, 12px)', width: '100%', maxWidth: '380px' }}>
          {[
            { icon: '\u{1F4B0}', label: 'Energy Cost', value: energyCost },
            { icon: '\u{1F333}', label: 'Trees Equiv.', value: `${Math.round(getCardProg(1) * treesEquivalent)} trees` },
          ].map((card, i) => {
            const cardProg = getCardProg(i)
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: `${textColor}08`,
                  border: `1px solid ${textColor}15`,
                  borderRadius: 'clamp(8px, 1.5vw, 12px)',
                  padding: 'clamp(10px, 2vw, 16px)',
                  opacity: cardProg,
                  transform: `scale(${cardProg})`,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 'clamp(20px, 4.5vw, 30px)', marginBottom: '4px' }}>{card.icon}</div>
                <div style={{ fontSize: 'clamp(9px, 1.3vw, 11px)', color: `${textColor}77`, fontWeight: 500, marginBottom: '2px' }}>
                  {card.label}
                </div>
                <div style={{ fontSize: 'clamp(14px, 3vw, 20px)', fontWeight: 800, color: textColor }}>
                  {card.value}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-electric-vehicle',
  title: 'Electric Vehicle',
  description: 'EV impact statistics with animated battery gauge, range/CO2 counters, energy cost, and tree equivalence cards.',
  tags: ['scene', 'electric', 'vehicle', 'ev', 'eco', 'sustainability', 'car', 'green'],
  category: 'scene-layout',
  component: SceneElectricVehicleComponent as any,
  defaultConfig: {
    vehicleName: 'Tesla Model 3',
    rangeKm: 358,
    co2Saved: 2840,
    chargePercent: 78,
    energyCost: '$4.20/100km',
    treesEquivalent: 130,
    bgColor: '#0a1520',
    textColor: '#E3F2FD',
    accentColor: '#29B6F6',
  },
  configSchema: [
    { key: 'vehicleName', label: 'Vehicle Name', type: 'text', defaultValue: 'Tesla Model 3', group: 'Content' },
    { key: 'rangeKm', label: 'Range (km)', type: 'number', defaultValue: 358, min: 0, max: 9999, group: 'Content' },
    { key: 'co2Saved', label: 'CO2 Saved (kg)', type: 'number', defaultValue: 2840, min: 0, max: 99999, group: 'Content' },
    { key: 'chargePercent', label: 'Charge %', type: 'number', defaultValue: 78, min: 0, max: 100, group: 'Content' },
    { key: 'energyCost', label: 'Energy Cost', type: 'text', defaultValue: '$4.20/100km', group: 'Content' },
    { key: 'treesEquivalent', label: 'Trees Equivalent', type: 'number', defaultValue: 130, min: 0, max: 9999, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a1520', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E3F2FD', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#29B6F6', group: 'Style' },
  ],
})
