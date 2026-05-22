import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PeriodicElementConfig {
  atomicNumber: string
  symbol: string
  elementName: string
  atomicMass: string
  category: string
  state: string
  discoveredBy: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
function easeInCubic(t: number): number { return t * t * t }

function ScenePeriodicElementComponent({ config, frame, durationInFrames }: MotionGraphicProps<PeriodicElementConfig>) {
  const { atomicNumber, symbol, elementName, atomicMass, category, state, discoveredBy, bgColor, textColor, accentColor } = config
  const progress = frame / durationInFrames

  // Card border draws in (0-0.15)
  const borderDraw = easeOutCubic(Math.min(1, progress / 0.15))

  // Atomic number pops (0.08-0.2)
  const numPop = easeOutBack(Math.max(0, Math.min(1, (progress - 0.08) / 0.12)))

  // Symbol scales (0.12-0.28)
  const symbolScale = easeOutBack(Math.max(0, Math.min(1, (progress - 0.12) / 0.16)))

  // Name slides (0.2-0.32)
  const nameFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.2) / 0.12)))

  // Details stagger (0.28-0.5)
  const massFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.28) / 0.1)))
  const catFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.34) / 0.1)))
  const stateFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.4) / 0.1)))
  const discFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.46) / 0.1)))

  // Glow pulse (0.5-0.8)
  const holdGlow = progress >= 0.5 && progress < 0.8 ? Math.sin(((progress - 0.5) / 0.3) * Math.PI * 5) * 0.4 + 0.6 : 0

  // Electron orbit animation
  const electronAngle = progress * Math.PI * 8

  // Exit (0.85-1.0)
  const exitProg = progress >= 0.85 ? easeInCubic((progress - 0.85) / 0.15) : 0
  const exitOpacity = 1 - exitProg
  const exitScale = 1 - exitProg * 0.2

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: exitOpacity,
        transform: `scale(${exitScale})`,
      }}
    >
      {/* Background hexagonal grid pattern */}
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${((i * 53 + 11) % 90) + 5}%`,
            top: `${((i * 37 + 23) % 90) + 5}%`,
            width: 'clamp(30px, 8vw, 60px)',
            height: 'clamp(30px, 8vw, 60px)',
            border: `1px solid ${accentColor}08`,
            transform: 'rotate(45deg)',
            opacity: borderDraw,
          }}
        />
      ))}

      {/* Electron orbit ring */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '35%',
          width: 'clamp(180px, 45vw, 320px)',
          height: 'clamp(70px, 15vw, 120px)',
          border: `1px solid ${accentColor}15`,
          borderRadius: '50%',
          transform: 'translate(-50%, -50%) rotateX(65deg)',
          opacity: numPop,
        }}
      />

      {/* Orbiting electron */}
      <div
        style={{
          position: 'absolute',
          left: `${50 + Math.cos(electronAngle) * 20}%`,
          top: `${35 + Math.sin(electronAngle) * 6}%`,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: accentColor,
          boxShadow: `0 0 10px ${accentColor}80`,
          transform: 'translate(-50%, -50%)',
          opacity: numPop * 0.7,
        }}
      />

      {/* Main card */}
      <div
        style={{
          width: 'clamp(220px, 55vw, 400px)',
          padding: 'clamp(24px, 6vw, 48px)',
          textAlign: 'center',
          border: `2px solid ${accentColor}`,
          borderRadius: 'clamp(10px, 2vw, 16px)',
          background: `${bgColor}F0`,
          clipPath: borderDraw < 1
            ? `polygon(0 0, ${borderDraw * 100}% 0, ${borderDraw * 100}% ${borderDraw * 100}%, 0 ${borderDraw * 100}%)`
            : 'none',
          boxShadow: holdGlow > 0 ? `0 0 ${holdGlow * 30}px ${accentColor}25, inset 0 0 ${holdGlow * 15}px ${accentColor}06` : `0 0 20px ${accentColor}10`,
          position: 'relative',
        }}
      >
        {/* Atomic number top-left */}
        <div
          style={{
            position: 'absolute',
            top: 'clamp(8px, 2vw, 14px)',
            left: 'clamp(12px, 3vw, 18px)',
            fontSize: 'clamp(18px, 4vw, 32px)',
            fontWeight: 700,
            color: accentColor,
            opacity: numPop,
            transform: `scale(${numPop})`,
          }}
        >
          {atomicNumber}
        </div>

        {/* State badge top-right */}
        <div
          style={{
            position: 'absolute',
            top: 'clamp(10px, 2vw, 16px)',
            right: 'clamp(12px, 3vw, 18px)',
            fontSize: 'clamp(9px, 1.6vw, 13px)',
            fontWeight: 600,
            color: bgColor,
            background: `${accentColor}CC`,
            padding: '2px 8px',
            borderRadius: 10,
            textTransform: 'uppercase',
            opacity: stateFade,
            transform: `scale(${stateFade})`,
          }}
        >
          {state}
        </div>

        {/* Symbol */}
        <div
          style={{
            fontSize: 'clamp(64px, 18vw, 140px)',
            fontWeight: 900,
            color: textColor,
            lineHeight: 1,
            marginTop: 'clamp(16px, 4vw, 28px)',
            marginBottom: 'clamp(4px, 1vw, 8px)',
            transform: `scale(${symbolScale})`,
            textShadow: `0 0 20px ${accentColor}30`,
          }}
        >
          {symbol}
        </div>

        {/* Element name */}
        <div
          style={{
            fontSize: 'clamp(18px, 4.5vw, 34px)',
            fontWeight: 600,
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: 'clamp(2px, 0.6vw, 6px)',
            marginBottom: 'clamp(10px, 2.5vw, 20px)',
            opacity: nameFade,
            transform: `translateY(${(1 - nameFade) * 15}px)`,
          }}
        >
          {elementName}
        </div>

        {/* Divider */}
        <div
          style={{
            width: `${nameFade * 50}%`,
            height: 1,
            background: `${accentColor}50`,
            margin: '0 auto',
            marginBottom: 'clamp(10px, 2.5vw, 20px)',
          }}
        />

        {/* Mass */}
        <div
          style={{
            fontSize: 'clamp(13px, 2.8vw, 22px)',
            color: `${textColor}80`,
            marginBottom: 'clamp(4px, 1vw, 8px)',
            opacity: massFade,
            transform: `translateX(${(1 - massFade) * 20}px)`,
          }}
        >
          <span style={{ color: accentColor, fontWeight: 700, marginRight: 6 }}>MASS</span>
          {atomicMass} u
        </div>

        {/* Category */}
        <div
          style={{
            fontSize: 'clamp(13px, 2.8vw, 22px)',
            color: `${textColor}80`,
            marginBottom: 'clamp(4px, 1vw, 8px)',
            opacity: catFade,
            transform: `translateX(${(1 - catFade) * 20}px)`,
          }}
        >
          <span style={{ color: accentColor, fontWeight: 700, marginRight: 6 }}>TYPE</span>
          {category}
        </div>

        {/* Discovered by */}
        <div
          style={{
            fontSize: 'clamp(11px, 2.2vw, 18px)',
            color: `${textColor}60`,
            fontStyle: 'italic',
            opacity: discFade,
            transform: `translateY(${(1 - discFade) * 10}px)`,
          }}
        >
          Discovered by {discoveredBy}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-periodic-element',
  title: 'Periodic Element',
  description: 'Periodic table element display with atomic data, orbiting electron, category badge, and staggered reveal animations',
  tags: ['scene', 'science', 'chemistry', 'periodic-table', 'element', 'educational'],
  category: 'scene-layout',
  component: ScenePeriodicElementComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'atomicNumber', label: 'Atomic Number', type: 'text', defaultValue: '26', group: 'Content' },
    { key: 'symbol', label: 'Symbol', type: 'text', defaultValue: 'Fe', group: 'Content' },
    { key: 'elementName', label: 'Element Name', type: 'text', defaultValue: 'Iron', group: 'Content' },
    { key: 'atomicMass', label: 'Atomic Mass', type: 'text', defaultValue: '55.845', group: 'Content' },
    { key: 'category', label: 'Category', type: 'text', defaultValue: 'Transition Metal', group: 'Content' },
    { key: 'state', label: 'State', type: 'text', defaultValue: 'Solid', group: 'Content' },
    { key: 'discoveredBy', label: 'Discovered By', type: 'text', defaultValue: 'Ancient civilizations', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FF6B44', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0e1117', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8E8E8', group: 'Style' },
  ],
  defaultConfig: {
    atomicNumber: '26',
    symbol: 'Fe',
    elementName: 'Iron',
    atomicMass: '55.845',
    category: 'Transition Metal',
    state: 'Solid',
    discoveredBy: 'Ancient civilizations',
    accentColor: '#FF6B44',
    bgColor: '#0e1117',
    textColor: '#E8E8E8',
  },
})
