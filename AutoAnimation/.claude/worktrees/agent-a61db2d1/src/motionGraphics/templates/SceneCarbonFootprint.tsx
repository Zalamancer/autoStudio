import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CarbonFootprintConfig {
  co2Amount: number
  unit: string
  treesNeeded: number
  tip1: string
  tip2: string
  tip3: string
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneCarbonFootprintComponent({ config, progress }: MotionGraphicProps<CarbonFootprintConfig>) {
  const { co2Amount, unit, treesNeeded, tip1, tip2, tip3, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Footprint icon scales in
  const iconEnter = easeOutCubic(Math.min(1, enterProgress / 0.3))
  const iconScale = iconEnter

  // CO2 number counts up
  const numProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.5)))
  const displayCO2 = Math.round(numProgress * co2Amount)

  // Trees comparison fades in
  const treeEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.3)))

  // Tips reveal staggered
  const tips = [tip1, tip2, tip3].filter(Boolean)
  const getTipProgress = (index: number): number => {
    const start = 0.55 + index * 0.12
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.25)))
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
      }}
    >
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
          transform: `translateY(${exitEased * 40}px)`,
        }}
      >
        {/* Footprint icon */}
        <div
          style={{
            fontSize: 'clamp(40px, 10vw, 72px)',
            transform: `scale(${iconScale})`,
            marginBottom: 'clamp(8px, 1.5vh, 16px)',
            filter: `drop-shadow(0 4px 12px ${accentColor}40)`,
          }}
        >
          👣
        </div>

        {/* CO2 amount */}
        <div
          style={{
            fontSize: 'clamp(48px, 12vw, 96px)',
            fontWeight: 900,
            color: textColor,
            lineHeight: 1,
            letterSpacing: -2,
          }}
        >
          {displayCO2}
          <span style={{ fontSize: '0.35em', fontWeight: 600, marginLeft: 4, color: `${textColor}99` }}>
            {unit}
          </span>
        </div>

        <div
          style={{
            fontSize: 'clamp(12px, 2vw, 16px)',
            fontWeight: 600,
            color: `${textColor}88`,
            textTransform: 'uppercase',
            letterSpacing: 3,
            marginTop: 4,
            marginBottom: 'clamp(12px, 2vh, 24px)',
          }}
        >
          Carbon Footprint
        </div>

        {/* Trees comparison card */}
        <div
          style={{
            background: cardColor,
            borderRadius: 12,
            padding: 'clamp(12px, 2%, 20px) clamp(16px, 3%, 28px)',
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 14px)',
            opacity: treeEnter,
            transform: `translateY(${(1 - treeEnter) * 20}px)`,
            boxShadow: `0 4px 20px ${accentColor}20`,
            marginBottom: 'clamp(14px, 2.5vh, 28px)',
          }}
        >
          <span style={{ fontSize: 'clamp(24px, 5vw, 36px)' }}>🌳</span>
          <div>
            <div style={{ fontSize: 'clamp(11px, 1.6vw, 14px)', color: `${textColor}88`, fontWeight: 500 }}>
              Equivalent to
            </div>
            <div style={{ fontSize: 'clamp(18px, 4vw, 28px)', fontWeight: 800, color: accentColor }}>
              {Math.round(numProgress * treesNeeded)} trees needed
            </div>
          </div>
        </div>

        {/* Reduction tips */}
        <div
          style={{
            width: '100%',
            maxWidth: 380,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(10px, 1.5vw, 13px)',
              fontWeight: 700,
              color: accentColor,
              textTransform: 'uppercase',
              letterSpacing: 2,
              marginBottom: 'clamp(6px, 1vh, 10px)',
              opacity: tips.length > 0 ? getTipProgress(0) : 0,
            }}
          >
            Reduce Your Impact
          </div>
          {tips.map((tip, i) => {
            const tipProg = getTipProgress(i)
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(6px, 1vw, 10px)',
                  marginBottom: 'clamp(6px, 0.8vh, 10px)',
                  opacity: tipProg,
                  transform: `translateX(${(1 - tipProg) * 30}px)`,
                }}
              >
                <div
                  style={{
                    width: 'clamp(6px, 1vw, 8px)',
                    height: 'clamp(6px, 1vw, 8px)',
                    borderRadius: '50%',
                    background: accentColor,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 'clamp(12px, 2vw, 16px)', color: textColor, fontWeight: 500 }}>
                  {tip}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-carbon-footprint',
  title: 'Carbon Footprint',
  description: 'CO2 footprint display with counting number, tree equivalence comparison, and reduction tips with staggered reveal',
  tags: ['scene', 'sustainability', 'eco', 'environment', 'carbon', 'data'],
  category: 'scene-layout',
  component: SceneCarbonFootprintComponent as any,
  defaultConfig: {
    co2Amount: 4200,
    unit: 'kg CO₂/yr',
    treesNeeded: 192,
    tip1: 'Switch to renewable energy',
    tip2: 'Reduce meat consumption',
    tip3: 'Use public transport',
    bgColor: '#0D1F0D',
    cardColor: '#1A3A1A',
    accentColor: '#4CAF50',
    textColor: '#E8F5E9',
  },
  configSchema: [
    { key: 'co2Amount', label: 'CO₂ Amount', type: 'number', defaultValue: 4200, min: 0, max: 99999, group: 'Content' },
    { key: 'unit', label: 'Unit', type: 'text', defaultValue: 'kg CO₂/yr', group: 'Content' },
    { key: 'treesNeeded', label: 'Trees Needed', type: 'number', defaultValue: 192, min: 0, max: 9999, group: 'Content' },
    { key: 'tip1', label: 'Tip 1', type: 'text', defaultValue: 'Switch to renewable energy', group: 'Content' },
    { key: 'tip2', label: 'Tip 2', type: 'text', defaultValue: 'Reduce meat consumption', group: 'Content' },
    { key: 'tip3', label: 'Tip 3', type: 'text', defaultValue: 'Use public transport', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D1F0D', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1A3A1A', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#4CAF50', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8F5E9', group: 'Style' },
  ],
})
