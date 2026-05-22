import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LensCardConfig {
  lensName: string
  focalLength: string
  maxAperture: string
  mount: string
  weight: string
  elements: string
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

function SceneLensCardComponent({ config, progress }: MotionGraphicProps<LensCardConfig>) {
  const { lensName, focalLength, maxAperture, mount, weight, elements, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  const cardScale = easeOutBack(Math.min(1, enterProgress / 0.5))

  // Lens barrel rotation
  const barrelRotation = easeOutCubic(Math.min(1, enterProgress / 0.6)) * 120
  const holdRotation = Math.sin(holdProgress * Math.PI * 2) * 5

  // Aperture value parsing for visual
  const apertureNum = parseFloat(maxAperture.replace('f/', '')) || 1.4
  const apertureSize = Math.max(15, 55 - apertureNum * 5)

  const specs = [
    { label: 'Focal Length', value: focalLength },
    { label: 'Max Aperture', value: maxAperture },
    { label: 'Mount', value: mount },
    { label: 'Weight', value: weight },
    { label: 'Elements', value: elements },
  ]

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
          background: cardColor,
          borderRadius: 'clamp(14px, 2vw, 22px)',
          padding: 'clamp(20px, 4%, 36px)',
          maxWidth: 400,
          width: '100%',
          opacity: exitOpacity,
          transform: `scale(${cardScale}) translateY(${exitEased * -50}px)`,
          boxShadow: '0 16px 48px rgba(0,0,0,0.25)',
        }}
      >
        {/* Lens barrel illustration */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 'clamp(16px, 3vh, 28px)',
          }}
        >
          <div
            style={{
              width: 'clamp(80px, 16vw, 120px)',
              height: 'clamp(80px, 16vw, 120px)',
              borderRadius: '50%',
              background: `conic-gradient(from ${barrelRotation + holdRotation}deg, #333 0deg, #555 30deg, #333 60deg, #555 90deg, #333 120deg, #555 150deg, #333 180deg, #555 210deg, #333 240deg, #555 270deg, #333 300deg, #555 330deg, #333 360deg)`,
              border: `3px solid ${textColor}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 24px rgba(0,0,0,0.4), inset 0 2px 8px rgba(255,255,255,0.05)`,
              position: 'relative',
            }}
          >
            {/* Outer ring markings */}
            <div
              style={{
                position: 'absolute',
                inset: 4,
                borderRadius: '50%',
                border: `1px solid ${textColor}10`,
              }}
            />
            {/* Inner glass element */}
            <div
              style={{
                width: '60%',
                height: '60%',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #1a1a3a 0%, #0a0a1a 60%, #000 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #222',
              }}
            >
              {/* Aperture opening */}
              <div
                style={{
                  width: `${apertureSize * easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.4)))}%`,
                  height: `${apertureSize * easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.4)))}%`,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${accentColor}30, ${accentColor}10)`,
                  border: `1px solid ${accentColor}40`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Lens name */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 'clamp(4px, 0.6vh, 8px)',
            opacity: easeOutCubic(Math.min(1, enterProgress / 0.3)),
          }}
        >
          <div style={{ fontSize: 'clamp(16px, 3vw, 24px)', fontWeight: 900, color: textColor, lineHeight: 1.2 }}>{lensName}</div>
        </div>

        {/* Focal length badge */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 'clamp(14px, 2.5vh, 24px)',
            opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.3))),
          }}
        >
          <span
            style={{
              background: `${accentColor}20`,
              color: accentColor,
              fontSize: 'clamp(11px, 1.8vw, 15px)',
              fontWeight: 700,
              padding: '4px 14px',
              borderRadius: 20,
            }}
          >
            {focalLength}
          </span>
        </div>

        {/* Specs list */}
        {specs.map((spec, i) => {
          const rowProg = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2 - i * 0.08) / 0.3)))
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'clamp(6px, 1vh, 10px) 0',
                borderBottom: i < specs.length - 1 ? `1px solid ${textColor}08` : 'none',
                opacity: rowProg,
                transform: `translateX(${(1 - rowProg) * 20}px)`,
              }}
            >
              <span style={{ fontSize: 'clamp(10px, 1.5vw, 13px)', fontWeight: 500, color: `${textColor}60` }}>{spec.label}</span>
              <span style={{ fontSize: 'clamp(12px, 2vw, 16px)', fontWeight: 700, color: textColor }}>{spec.value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-lens-card',
  title: 'Scene Lens Card',
  description: 'Camera lens specification card with rotating barrel illustration, aperture visualization, and specs list',
  tags: ['scene', 'photography', 'lens', 'camera', 'gear', 'specs', 'equipment'],
  category: 'scenes',
  component: SceneLensCardComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    lensName: 'Canon RF 50mm',
    focalLength: '50mm',
    maxAperture: 'f/1.2',
    mount: 'RF Mount',
    weight: '950g',
    elements: '15 / 9 groups',
    bgColor: '#111318',
    cardColor: '#1A1D24',
    accentColor: '#C9372C',
    textColor: '#E0E4EB',
  },
  configSchema: [
    { key: 'lensName', label: 'Lens Name', type: 'text', defaultValue: 'Canon RF 50mm', group: 'Content' },
    { key: 'focalLength', label: 'Focal Length', type: 'text', defaultValue: '50mm', group: 'Content' },
    { key: 'maxAperture', label: 'Max Aperture', type: 'text', defaultValue: 'f/1.2', group: 'Content' },
    { key: 'mount', label: 'Mount Type', type: 'text', defaultValue: 'RF Mount', group: 'Content' },
    { key: 'weight', label: 'Weight', type: 'text', defaultValue: '950g', group: 'Content' },
    { key: 'elements', label: 'Elements / Groups', type: 'text', defaultValue: '15 / 9 groups', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111318', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1A1D24', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#C9372C', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E0E4EB', group: 'Style' },
  ],
})
