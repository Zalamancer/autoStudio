import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneFuelGaugeConfig {
  title: string
  level: number
  capacity: string
  range: string
  fuelType: string
  costPerGallon: string
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

function SceneFuelGaugeComponent({ config, progress }: MotionGraphicProps<SceneFuelGaugeConfig>) {
  const { title, level, capacity, range, fuelType, costPerGallon, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.12

  const titleEnter = easeOutBack(Math.min(1, enterProgress / 0.5))
  const gaugeEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.6)))
  const detailsEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.5)))

  // Fuel level fill animation
  const fillLevel = gaugeEnter * level
  const fillColor = level > 50 ? '#44cc66' : level > 25 ? '#ffaa00' : '#ff4444'
  const warningBlink = level <= 25

  // Bubble animation during hold
  const isHolding = progress >= 0.2 && progress < 0.8
  const bubbleOffset = isHolding ? Math.sin(holdProgress * Math.PI * 8) * 2 : 0

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
          padding: 'clamp(16px, 4vw, 40px)',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: 'clamp(11px, 1.8vw, 16px)',
            fontWeight: 800,
            color: `${textColor}70`,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: 'clamp(6px, 1.5vw, 14px)',
            opacity: titleEnter,
            transform: `translateY(${(1 - titleEnter) * -15}px)`,
          }}
        >
          {title}
        </div>

        {/* Fuel gauge tank visual */}
        <div
          style={{
            width: 'clamp(180px, 45vw, 320px)',
            height: 'clamp(120px, 30vw, 200px)',
            borderRadius: 'clamp(12px, 2.5vw, 24px)',
            border: `2px solid ${textColor}15`,
            background: `${textColor}05`,
            position: 'relative',
            overflow: 'hidden',
            marginBottom: 'clamp(14px, 3vw, 28px)',
          }}
        >
          {/* Fuel fill */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${fillLevel}%`,
              background: `linear-gradient(180deg, ${fillColor}90, ${fillColor}60)`,
              borderRadius: '0 0 clamp(10px, 2.3vw, 22px) clamp(10px, 2.3vw, 22px)',
            }}
          >
            {/* Wave effect on top of fuel */}
            <div
              style={{
                position: 'absolute',
                top: -4,
                left: -10,
                right: -10,
                height: 12,
                background: `${fillColor}40`,
                borderRadius: '50%',
                transform: `translateX(${bubbleOffset}px)`,
              }}
            />
          </div>

          {/* Level percentage */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                fontSize: 'clamp(32px, 8vw, 60px)',
                fontWeight: 900,
                color: textColor,
                textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {Math.round(fillLevel)}%
            </div>
          </div>

          {/* E and F markers */}
          <div style={{ position: 'absolute', bottom: 'clamp(4px, 0.8vw, 8px)', left: 'clamp(8px, 1.5vw, 14px)', fontSize: 'clamp(9px, 1.3vw, 12px)', fontWeight: 800, color: '#ff4444', opacity: 0.7 }}>
            E
          </div>
          <div style={{ position: 'absolute', top: 'clamp(4px, 0.8vw, 8px)', left: 'clamp(8px, 1.5vw, 14px)', fontSize: 'clamp(9px, 1.3vw, 12px)', fontWeight: 800, color: '#44cc66', opacity: 0.7 }}>
            F
          </div>

          {/* Tick marks on left side */}
          {[0, 25, 50, 75, 100].map((tick) => (
            <div
              key={tick}
              style={{
                position: 'absolute',
                bottom: `${tick}%`,
                right: 'clamp(6px, 1vw, 10px)',
                width: 'clamp(8px, 1.5vw, 14px)',
                height: 1,
                background: `${textColor}20`,
              }}
            />
          ))}

          {/* Low fuel warning */}
          {warningBlink && (
            <div
              style={{
                position: 'absolute',
                top: 'clamp(6px, 1vw, 10px)',
                right: 'clamp(6px, 1vw, 10px)',
                fontSize: 'clamp(8px, 1.1vw, 10px)',
                fontWeight: 800,
                color: '#ff4444',
                opacity: isHolding ? (Math.sin(holdProgress * Math.PI * 10) > 0 ? 1 : 0.3) : 1,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              LOW
            </div>
          )}
        </div>

        {/* Details row */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(12px, 2.5vw, 24px)',
            opacity: detailsEnter,
            transform: `translateY(${(1 - detailsEnter) * 12}px)`,
          }}
        >
          {[
            { label: 'Fuel Type', value: fuelType },
            { label: 'Capacity', value: capacity },
            { label: 'Range', value: range },
            { label: 'Cost/gal', value: costPerGallon },
          ].map((d, i) => {
            const stagger = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.55 - i * 0.05) / 0.4)))
            return (
              <div key={i} style={{ textAlign: 'center', opacity: stagger }}>
                <div style={{ fontSize: 'clamp(7px, 1vw, 9px)', fontWeight: 600, color: `${textColor}45`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'clamp(2px, 0.3vw, 4px)' }}>
                  {d.label}
                </div>
                <div style={{ fontSize: 'clamp(11px, 1.8vw, 16px)', fontWeight: 800, color: textColor }}>
                  {d.value}
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
  id: 'tpl-scene-fuel-gauge',
  title: 'Fuel Gauge',
  description: 'Animated fuel/battery gauge with liquid fill animation, wave effect, E/F markers, low fuel warning, and vehicle details.',
  tags: ['scene', 'fuel', 'gauge', 'battery', 'tank', 'car', 'auto'],
  category: 'scene-layout',
  component: SceneFuelGaugeComponent as any,
  defaultConfig: {
    title: 'Fuel Level',
    level: 65,
    capacity: '16 gal',
    range: '320 mi',
    fuelType: 'Premium',
    costPerGallon: '$4.29',
    bgColor: '#0a0a14',
    accentColor: '#44cc66',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Fuel Level', group: 'Content' },
    { key: 'level', label: 'Level (%)', type: 'number', defaultValue: 65, min: 0, max: 100, group: 'Content' },
    { key: 'capacity', label: 'Capacity', type: 'text', defaultValue: '16 gal', group: 'Details' },
    { key: 'range', label: 'Range', type: 'text', defaultValue: '320 mi', group: 'Details' },
    { key: 'fuelType', label: 'Fuel Type', type: 'text', defaultValue: 'Premium', group: 'Details' },
    { key: 'costPerGallon', label: 'Cost/Gallon', type: 'text', defaultValue: '$4.29', group: 'Details' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#44cc66', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
