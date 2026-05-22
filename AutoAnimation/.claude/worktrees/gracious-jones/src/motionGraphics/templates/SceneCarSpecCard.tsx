import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneCarSpecCardConfig {
  carName: string
  year: number
  horsepower: number
  torque: number
  zeroToSixty: string
  topSpeed: number
  engine: string
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

function SceneCarSpecCardComponent({ config, progress }: MotionGraphicProps<SceneCarSpecCardConfig>) {
  const { carName, year, horsepower, torque, zeroToSixty, topSpeed, engine, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const cardScale = easeOutBack(Math.min(1, enterProgress / 0.7))
  const cardOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.15

  const titleEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.5)))
  const statsEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.5)))

  // Count-up for numbers during enter
  const displayHP = Math.round(horsepower * statsEnter)
  const displayTorque = Math.round(torque * statsEnter)
  const displayTopSpeed = Math.round(topSpeed * statsEnter)

  // Hold: power bar pulse
  const isHolding = progress >= 0.2 && progress < 0.8
  const barPulse = isHolding ? 1 + Math.sin(holdProgress * Math.PI * 6) * 0.02 : 1

  const specs = [
    { label: 'HORSEPOWER', value: `${displayHP} HP`, bar: Math.min(horsepower / 1000, 1), color: '#ff4444' },
    { label: 'TORQUE', value: `${displayTorque} lb-ft`, bar: Math.min(torque / 800, 1), color: '#ffaa00' },
    { label: '0-60 MPH', value: `${zeroToSixty}s`, bar: Math.max(0, 1 - parseFloat(zeroToSixty) / 10), color: '#00cc66' },
    { label: 'TOP SPEED', value: `${displayTopSpeed} mph`, bar: Math.min(topSpeed / 250, 1), color: '#3388ff' },
  ]

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      {/* Racing accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${statsEnter * 100}%`,
          height: 3,
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}40)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6%',
          transform: `scale(${cardScale * exitScale})`,
          opacity: cardOpacity * exitOpacity,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 460,
            background: `${textColor}06`,
            border: `1.5px solid ${accentColor}30`,
            borderRadius: 'clamp(10px, 2vw, 18px)',
            padding: 'clamp(18px, 4vw, 36px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Carbon fiber accent corner */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '30%',
              height: '30%',
              opacity: 0.04,
              background: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.2) 2px, rgba(255,255,255,0.2) 4px)',
            }}
          />

          {/* Year badge */}
          <div
            style={{
              display: 'inline-block',
              background: accentColor,
              color: bgColor,
              fontSize: 'clamp(9px, 1.5vw, 13px)',
              fontWeight: 800,
              padding: 'clamp(2px, 0.5vw, 5px) clamp(8px, 1.5vw, 14px)',
              borderRadius: 100,
              marginBottom: 'clamp(8px, 2vw, 16px)',
              opacity: titleEnter,
              transform: `scale(${titleEnter})`,
              letterSpacing: '0.1em',
            }}
          >
            {year}
          </div>

          {/* Car name */}
          <div
            style={{
              fontSize: 'clamp(22px, 5.5vw, 44px)',
              fontWeight: 900,
              color: textColor,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              marginBottom: 'clamp(4px, 1vw, 8px)',
              opacity: titleEnter,
              transform: `translateY(${(1 - titleEnter) * 15}px)`,
            }}
          >
            {carName}
          </div>

          {/* Engine */}
          <div
            style={{
              fontSize: 'clamp(10px, 1.8vw, 15px)',
              fontWeight: 600,
              color: `${textColor}60`,
              marginBottom: 'clamp(14px, 3vw, 28px)',
              opacity: titleEnter,
              letterSpacing: '0.05em',
            }}
          >
            {engine}
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: `linear-gradient(90deg, ${accentColor}50, transparent)`,
              marginBottom: 'clamp(14px, 3vw, 24px)',
              transform: `scaleX(${statsEnter})`,
              transformOrigin: 'left',
            }}
          />

          {/* Spec bars */}
          {specs.map((spec, i) => {
            const stagger = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4 - i * 0.06) / 0.4)))
            return (
              <div
                key={i}
                style={{
                  marginBottom: 'clamp(8px, 1.5vw, 14px)',
                  opacity: stagger,
                  transform: `translateX(${(1 - stagger) * 25}px) scaleX(${barPulse})`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'clamp(2px, 0.4vw, 4px)' }}>
                  <span style={{ fontSize: 'clamp(8px, 1.3vw, 11px)', fontWeight: 700, color: `${textColor}60`, letterSpacing: '0.1em' }}>
                    {spec.label}
                  </span>
                  <span style={{ fontSize: 'clamp(11px, 1.8vw, 16px)', fontWeight: 900, color: textColor, fontVariantNumeric: 'tabular-nums' }}>
                    {spec.value}
                  </span>
                </div>
                <div style={{ height: 'clamp(3px, 0.6vw, 5px)', background: `${textColor}0a`, borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${spec.bar * statsEnter * 100}%`,
                      background: `linear-gradient(90deg, ${spec.color}, ${spec.color}80)`,
                      borderRadius: 4,
                      boxShadow: `0 0 8px ${spec.color}30`,
                    }}
                  />
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
  id: 'tpl-scene-car-spec-card',
  title: 'Car Spec Card',
  description: 'Car specification card showing HP, torque, 0-60, top speed with animated count-up numbers and color-coded performance bars.',
  tags: ['scene', 'car', 'specs', 'horsepower', 'racing', 'auto', 'motorsport'],
  category: 'scene-layout',
  component: SceneCarSpecCardComponent as any,
  defaultConfig: {
    carName: 'PORSCHE 911 GT3',
    year: 2024,
    horsepower: 502,
    torque: 346,
    zeroToSixty: '3.2',
    topSpeed: 197,
    engine: '4.0L Flat-6 Naturally Aspirated',
    bgColor: '#0a0a14',
    accentColor: '#ff3333',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'carName', label: 'Car Name', type: 'text', defaultValue: 'PORSCHE 911 GT3', group: 'Content' },
    { key: 'year', label: 'Year', type: 'number', defaultValue: 2024, min: 1900, max: 2030, group: 'Content' },
    { key: 'horsepower', label: 'Horsepower', type: 'number', defaultValue: 502, min: 0, max: 2000, group: 'Specs' },
    { key: 'torque', label: 'Torque (lb-ft)', type: 'number', defaultValue: 346, min: 0, max: 2000, group: 'Specs' },
    { key: 'zeroToSixty', label: '0-60 (seconds)', type: 'text', defaultValue: '3.2', group: 'Specs' },
    { key: 'topSpeed', label: 'Top Speed (mph)', type: 'number', defaultValue: 197, min: 0, max: 350, group: 'Specs' },
    { key: 'engine', label: 'Engine', type: 'text', defaultValue: '4.0L Flat-6 Naturally Aspirated', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#ff3333', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
