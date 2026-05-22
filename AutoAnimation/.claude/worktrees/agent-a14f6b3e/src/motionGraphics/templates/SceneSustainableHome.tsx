import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SustainableHomeConfig {
  title: string
  energyRating: string
  solarKW: number
  waterSaved: number
  co2Reduced: number
  features: string[]
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneSustainableHomeComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<SustainableHomeConfig>) {
  const { title, energyRating, solarKW, waterSaved, co2Reduced, features, bgColor, cardColor, accentColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.28
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // House icon grows
  const houseProgress = easeOutBack(Math.min(1, enterProgress / 0.4))
  // Title
  const titleProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.3)))
  // Energy rating
  const ratingProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.25)))
  // Stats
  const getStatProgress = (idx: number) => {
    const delay = 0.45 + idx * 0.1
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - delay) / 0.3)))
  }
  // Features
  const featureProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.75) / 0.2)))

  // Hold: counting + pulse
  const countProgress = easeOutCubic(Math.min(1, holdProgress / 0.35))
  const leafPulse = 1 + Math.sin(holdProgress * Math.PI * 4) * 0.06

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  const ecoStats = [
    { icon: '☀️', label: 'SOLAR', value: `${(solarKW * countProgress).toFixed(1)}`, suffix: 'kW' },
    { icon: '💧', label: 'WATER SAVED', value: `${Math.round(waterSaved * countProgress)}`, suffix: '%' },
    { icon: '🌿', label: 'CO2 REDUCED', value: `${Math.round(co2Reduced * countProgress)}`, suffix: 'tons/yr' },
  ]

  // Energy rating colors (A+ = dark green, G = red)
  const ratingColors: Record<string, string> = {
    'A+': '#059669', 'A': '#10B981', 'B': '#84CC16', 'C': '#EAB308',
    'D': '#F97316', 'E': '#EF4444', 'F': '#DC2626', 'G': '#991B1B',
  }
  const ratingColor = ratingColors[energyRating] || '#10B981'

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: '5%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(10px, 2vh, 18px)',
          width: '100%',
          maxWidth: 400,
          opacity: exitOpacity,
        }}
      >
        {/* Eco house icon */}
        <div
          style={{
            fontSize: 'clamp(40px, 9vw, 68px)',
            transform: `scale(${houseProgress * leafPulse})`,
          }}
        >
          {'🏡'}
        </div>

        {/* Title */}
        <div
          style={{
            textAlign: 'center',
            opacity: titleProgress,
            transform: `translateY(${(1 - titleProgress) * 10}px)`,
          }}
        >
          <div style={{ fontSize: 'clamp(9px, 1.4vw, 11px)', fontWeight: 700, color: accentColor, letterSpacing: 3, textTransform: 'uppercase' }}>
            ECO HOME
          </div>
          <div style={{ fontSize: 'clamp(20px, 4.5vw, 34px)', fontWeight: 800, color: textColor, marginTop: 4, lineHeight: 1.1 }}>
            {title}
          </div>
        </div>

        {/* Energy rating bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 14px)',
            opacity: ratingProgress,
            transform: `translateY(${(1 - ratingProgress) * 8}px)`,
          }}
        >
          <span style={{ fontSize: 'clamp(10px, 1.5vw, 13px)', fontWeight: 600, color: `${textColor}60` }}>
            Energy Rating
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            {['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G'].map((r, i) => {
              const isActive = r === energyRating
              const rc = ratingColors[r] || '#999'
              return (
                <div
                  key={r}
                  style={{
                    width: isActive ? 'clamp(28px, 5vw, 40px)' : 'clamp(8px, 1.5vw, 14px)',
                    height: 'clamp(16px, 3vh, 24px)',
                    borderRadius: 4,
                    background: isActive ? rc : `${rc}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'clamp(7px, 1vw, 10px)',
                    fontWeight: 800,
                    color: isActive ? '#FFFFFF' : 'transparent',
                  }}
                >
                  {r}
                </div>
              )
            })}
          </div>
        </div>

        {/* Eco stats */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(8px, 1.5vw, 14px)',
            width: '100%',
          }}
        >
          {ecoStats.map((stat, i) => {
            const p = getStatProgress(i)
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: cardColor,
                  borderRadius: 'clamp(10px, 1.5vw, 14px)',
                  padding: 'clamp(10px, 2vh, 16px)',
                  textAlign: 'center',
                  opacity: p,
                  transform: `translateY(${(1 - p) * 15}px)`,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ fontSize: 'clamp(16px, 3vw, 24px)', marginBottom: 4 }}>{stat.icon}</div>
                <div style={{ fontSize: 'clamp(18px, 3.5vw, 28px)', fontWeight: 900, color: accentColor, lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 'clamp(8px, 1.1vw, 10px)', fontWeight: 500, color: `${textColor}50`, marginTop: 1 }}>
                  {stat.suffix}
                </div>
                <div style={{ fontSize: 'clamp(7px, 0.9vw, 8px)', fontWeight: 700, color: `${textColor}35`, letterSpacing: 1, marginTop: 4 }}>
                  {stat.label}
                </div>
              </div>
            )
          })}
        </div>

        {/* Green features */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'clamp(4px, 0.8vw, 8px)',
            justifyContent: 'center',
            opacity: featureProgress,
            transform: `translateY(${(1 - featureProgress) * 8}px)`,
          }}
        >
          {features.map((feat, i) => (
            <div
              key={i}
              style={{
                padding: 'clamp(4px, 0.6vh, 6px) clamp(10px, 1.8vw, 14px)',
                borderRadius: 20,
                background: `${accentColor}10`,
                fontSize: 'clamp(9px, 1.3vw, 11px)',
                fontWeight: 600,
                color: accentColor,
              }}
            >
              {feat}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-sustainable-home',
  title: 'Scene Sustainable Home',
  description: 'Eco-home features visualization with energy rating scale, solar/water/CO2 stats, green feature tags, and pulsing animations',
  tags: ['scene', 'sustainable', 'eco', 'green', 'architecture', 'solar', 'energy', 'home'],
  category: 'scene-layout',
  component: SceneSustainableHomeComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Net-Zero Energy Home', group: 'Content' },
    { key: 'energyRating', label: 'Energy Rating', type: 'text', defaultValue: 'A+', group: 'Content' },
    { key: 'solarKW', label: 'Solar (kW)', type: 'number', defaultValue: 12.5, min: 0, max: 1000, group: 'Content' },
    { key: 'waterSaved', label: 'Water Saved %', type: 'number', defaultValue: 65, min: 0, max: 100, group: 'Content' },
    { key: 'co2Reduced', label: 'CO2 Reduced (tons/yr)', type: 'number', defaultValue: 8, min: 0, max: 1000, group: 'Content' },
    { key: 'features', label: 'Eco Features', type: 'text-array', defaultValue: ['Solar Panels', 'Rainwater Harvest', 'Triple Glazing', 'Heat Pump', 'Green Roof'], group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#059669', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F0FAF4', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1E293B', group: 'Style' },
  ],
  defaultConfig: {
    title: 'Net-Zero Energy Home',
    energyRating: 'A+',
    solarKW: 12.5,
    waterSaved: 65,
    co2Reduced: 8,
    features: ['Solar Panels', 'Rainwater Harvest', 'Triple Glazing', 'Heat Pump', 'Green Roof'],
    accentColor: '#059669',
    cardColor: '#FFFFFF',
    bgColor: '#F0FAF4',
    textColor: '#1E293B',
  },
})
