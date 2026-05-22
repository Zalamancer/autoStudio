import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneGarageShowroomConfig {
  carName: string
  tagline: string
  price: string
  mileage: string
  transmission: string
  drivetrain: string
  color: string
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

function SceneGarageShowroomComponent({ config, progress }: MotionGraphicProps<SceneGarageShowroomConfig>) {
  const { carName, tagline, price, mileage, transmission, drivetrain, color: carColor, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  const curtainReveal = easeOutCubic(Math.min(1, enterProgress / 0.6))
  const nameEnter = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.5)))
  const detailsEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.5)))
  const priceEnter = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.4)))

  // Spotlight shimmer during hold
  const isHolding = progress >= 0.2 && progress < 0.8
  const spotlightX = isHolding ? 30 + holdProgress * 40 : 50

  const details = [
    { label: 'Mileage', value: mileage },
    { label: 'Transmission', value: transmission },
    { label: 'Drivetrain', value: drivetrain },
    { label: 'Ext. Color', value: carColor },
  ]

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Showroom spotlight */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: `${spotlightX}%`,
          width: '40%',
          height: '120%',
          background: `radial-gradient(ellipse at center top, ${accentColor}08 0%, transparent 60%)`,
          transform: 'translateX(-50%)',
        }}
      />

      {/* Floor reflection line */}
      <div
        style={{
          position: 'absolute',
          bottom: '18%',
          left: '10%',
          right: '10%',
          height: 1,
          background: `linear-gradient(90deg, transparent, ${textColor}15, transparent)`,
          opacity: detailsEnter,
        }}
      />

      {/* Curtain reveal mask */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'clamp(16px, 4vw, 40px) clamp(20px, 5vw, 48px)',
          opacity: exitOpacity,
          clipPath: `inset(0 ${(1 - curtainReveal) * 100}% 0 0)`,
        }}
      >
        {/* Tagline */}
        <div
          style={{
            fontSize: 'clamp(9px, 1.4vw, 12px)',
            fontWeight: 700,
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            marginBottom: 'clamp(6px, 1.5vw, 12px)',
            opacity: nameEnter,
            transform: `translateY(${(1 - nameEnter) * 10}px)`,
          }}
        >
          {tagline}
        </div>

        {/* Car name */}
        <div
          style={{
            fontSize: 'clamp(26px, 6.5vw, 52px)',
            fontWeight: 900,
            color: textColor,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            marginBottom: 'clamp(18px, 4vw, 36px)',
            opacity: nameEnter,
            transform: `translateX(${(1 - nameEnter) * -25}px)`,
          }}
        >
          {carName}
        </div>

        {/* Details grid (2x2) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'clamp(6px, 1.2vw, 12px) clamp(10px, 2vw, 20px)',
            marginBottom: 'clamp(18px, 4vw, 32px)',
            opacity: detailsEnter,
            transform: `translateY(${(1 - detailsEnter) * 15}px)`,
          }}
        >
          {details.map((d, i) => {
            const stagger = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.45 - i * 0.05) / 0.4)))
            return (
              <div
                key={i}
                style={{
                  background: `${textColor}05`,
                  borderRadius: 'clamp(6px, 1vw, 10px)',
                  padding: 'clamp(8px, 1.5vw, 14px) clamp(10px, 2vw, 16px)',
                  borderLeft: `3px solid ${accentColor}40`,
                  opacity: stagger,
                  transform: `translateX(${(1 - stagger) * 20}px)`,
                }}
              >
                <div style={{ fontSize: 'clamp(8px, 1.1vw, 10px)', fontWeight: 600, color: `${textColor}50`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'clamp(2px, 0.3vw, 4px)' }}>
                  {d.label}
                </div>
                <div style={{ fontSize: 'clamp(11px, 1.8vw, 16px)', fontWeight: 800, color: textColor }}>
                  {d.value}
                </div>
              </div>
            )
          })}
        </div>

        {/* Price tag */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1vw, 10px)',
            background: `${accentColor}15`,
            border: `1.5px solid ${accentColor}40`,
            borderRadius: 'clamp(8px, 1.5vw, 14px)',
            padding: 'clamp(10px, 2vw, 18px) clamp(16px, 3vw, 28px)',
            opacity: priceEnter,
            transform: `scale(${0.85 + priceEnter * 0.15})`,
            alignSelf: 'flex-start',
          }}
        >
          <div style={{ fontSize: 'clamp(9px, 1.2vw, 11px)', fontWeight: 600, color: `${textColor}60`, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Starting at
          </div>
          <div style={{ fontSize: 'clamp(20px, 4.5vw, 36px)', fontWeight: 900, color: accentColor, fontVariantNumeric: 'tabular-nums' }}>
            {price}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-garage-showroom',
  title: 'Garage Showroom',
  description: 'Luxury car showcase card with curtain reveal, spotlight shimmer, details grid, and price tag with bounce animation.',
  tags: ['scene', 'car', 'showroom', 'garage', 'dealership', 'luxury', 'auto'],
  category: 'scene-layout',
  component: SceneGarageShowroomComponent as any,
  defaultConfig: {
    carName: 'BMW M4 Competition',
    tagline: 'The Ultimate Driving Machine',
    price: '$74,900',
    mileage: '12,450 mi',
    transmission: '8-Speed Auto',
    drivetrain: 'RWD',
    color: 'Alpine White',
    bgColor: '#0c0c10',
    accentColor: '#1c69d4',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'carName', label: 'Car Name', type: 'text', defaultValue: 'BMW M4 Competition', group: 'Content' },
    { key: 'tagline', label: 'Tagline', type: 'text', defaultValue: 'The Ultimate Driving Machine', group: 'Content' },
    { key: 'price', label: 'Price', type: 'text', defaultValue: '$74,900', group: 'Content' },
    { key: 'mileage', label: 'Mileage', type: 'text', defaultValue: '12,450 mi', group: 'Details' },
    { key: 'transmission', label: 'Transmission', type: 'text', defaultValue: '8-Speed Auto', group: 'Details' },
    { key: 'drivetrain', label: 'Drivetrain', type: 'text', defaultValue: 'RWD', group: 'Details' },
    { key: 'color', label: 'Ext. Color', type: 'text', defaultValue: 'Alpine White', group: 'Details' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0c10', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#1c69d4', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
