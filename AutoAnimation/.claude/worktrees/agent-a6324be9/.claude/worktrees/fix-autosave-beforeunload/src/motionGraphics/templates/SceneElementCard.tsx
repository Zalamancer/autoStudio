import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ElementCardConfig {
  atomicNumber: string
  symbol: string
  elementName: string
  atomicMass: string
  electronConfig: string
  elementColor: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneElementCardComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<ElementCardConfig>) {
  const { atomicNumber, symbol, elementName, atomicMass, electronConfig, elementColor, bgColor, textColor } = config
  const progress = frame / durationInFrames

  // Element box draws in - border animation (0-0.2)
  const borderProgress = easeOutCubic(Math.min(1, progress / 0.2))

  // Atomic number appears (0.1-0.22)
  const numProgress = easeOutBack(Math.max(0, Math.min(1, (progress - 0.1) / 0.12)))

  // Symbol scales in (0.15-0.3)
  const symbolProgress = easeOutBack(Math.max(0, Math.min(1, (progress - 0.15) / 0.15)))

  // Element name slides up (0.25-0.38)
  const nameProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.25) / 0.13)))

  // Atomic mass fades in (0.32-0.42)
  const massProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.32) / 0.1)))

  // Electron config types in (0.38-0.55)
  const configProgress = Math.max(0, Math.min(1, (progress - 0.38) / 0.17))
  const visibleChars = Math.floor(configProgress * electronConfig.length)

  // Hold: subtle glow pulse (0.5-0.8)
  const holdProgress = progress >= 0.5 && progress < 0.8 ? (progress - 0.5) / 0.3 : 0
  const glowPulse = holdProgress > 0 ? 0.6 + 0.4 * Math.sin(holdProgress * Math.PI * 4) : 0

  // Background molecule dots
  const dots = Array.from({ length: 20 }, (_, i) => ({
    x: ((i * 67 + 23) % 100),
    y: ((i * 43 + 11) % 100),
    size: 2 + ((i * 17) % 4),
  }))

  // Exit: element card slides down and fades (0.85-1.0)
  const exitProgress = progress >= 0.85 ? easeOutCubic((progress - 0.85) / 0.15) : 0
  const exitSlideY = exitProgress * 60
  const exitOpacity = 1 - exitProgress

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
      }}
    >
      {/* Background molecular dots */}
      {dots.map((dot, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: dot.size,
            height: dot.size,
            borderRadius: '50%',
            background: `${elementColor}15`,
          }}
        />
      ))}

      {/* Hexagonal background accent */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          right: '10%',
          width: 'clamp(60px, 15vw, 120px)',
          height: 'clamp(60px, 15vw, 120px)',
          border: `1px solid ${elementColor}12`,
          transform: 'rotate(45deg)',
          opacity: borderProgress,
        }}
      />

      {/* Main element card */}
      <div
        style={{
          width: 'clamp(200px, 50vw, 360px)',
          padding: 'clamp(20px, 5vw, 40px)',
          background: `${bgColor}F0`,
          border: `2px solid ${elementColor}`,
          borderRadius: 'clamp(8px, 1.5vw, 14px)',
          textAlign: 'center',
          opacity: exitOpacity,
          transform: `translateY(${exitSlideY}px)`,
          boxShadow: glowPulse > 0 ? `0 0 ${glowPulse * 25}px ${elementColor}30, inset 0 0 ${glowPulse * 15}px ${elementColor}08` : `0 0 20px ${elementColor}15`,
          clipPath: borderProgress < 1
            ? `polygon(0 0, ${borderProgress * 100}% 0, ${borderProgress * 100}% ${borderProgress * 100}%, 0 ${borderProgress * 100}%)`
            : 'none',
        }}
      >
        {/* Atomic number - top left */}
        <div
          style={{
            position: 'absolute',
            top: 'clamp(8px, 2vw, 16px)',
            left: 'clamp(12px, 3vw, 20px)',
            fontSize: 'clamp(16px, 3.5vw, 28px)',
            fontWeight: 700,
            color: elementColor,
            opacity: numProgress,
            transform: `scale(${numProgress})`,
          }}
        >
          {atomicNumber}
        </div>

        {/* Symbol - large center */}
        <div
          style={{
            fontSize: 'clamp(60px, 16vw, 130px)',
            fontWeight: 900,
            color: textColor,
            lineHeight: 1,
            marginTop: 'clamp(10px, 3vw, 20px)',
            marginBottom: 'clamp(4px, 1vw, 8px)',
            transform: `scale(${symbolProgress})`,
            textShadow: `0 0 15px ${elementColor}40`,
          }}
        >
          {symbol}
        </div>

        {/* Element name */}
        <div
          style={{
            fontSize: 'clamp(18px, 4vw, 32px)',
            fontWeight: 600,
            color: elementColor,
            textTransform: 'uppercase',
            letterSpacing: 'clamp(2px, 0.5vw, 5px)',
            marginBottom: 'clamp(8px, 2vw, 16px)',
            opacity: nameProgress,
            transform: `translateY(${(1 - nameProgress) * 20}px)`,
          }}
        >
          {elementName}
        </div>

        {/* Divider */}
        <div
          style={{
            width: `${nameProgress * 60}%`,
            height: 1,
            background: `${elementColor}60`,
            margin: '0 auto',
            marginBottom: 'clamp(8px, 2vw, 16px)',
          }}
        />

        {/* Atomic mass */}
        <div
          style={{
            fontSize: 'clamp(14px, 3vw, 22px)',
            color: `${textColor}80`,
            marginBottom: 'clamp(4px, 1vw, 8px)',
            opacity: massProgress,
          }}
        >
          {atomicMass} u
        </div>

        {/* Electron configuration */}
        <div
          style={{
            fontSize: 'clamp(11px, 2vw, 16px)',
            color: `${elementColor}90`,
            fontFamily: "'Courier New', monospace",
            letterSpacing: 1,
          }}
        >
          {electronConfig.slice(0, visibleChars)}
          {configProgress > 0 && configProgress < 1 && (
            <span
              style={{
                display: 'inline-block',
                width: 1,
                height: 'clamp(11px, 2vw, 16px)',
                background: elementColor,
                marginLeft: 1,
                verticalAlign: 'text-bottom',
                opacity: Math.sin(progress * 60) > 0 ? 1 : 0,
              }}
            />
          )}
        </div>
      </div>

      {/* Category label */}
      <div
        style={{
          position: 'absolute',
          bottom: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 'clamp(10px, 1.8vw, 14px)',
          color: `${textColor}30`,
          letterSpacing: 'clamp(3px, 0.8vw, 6px)',
          textTransform: 'uppercase',
          opacity: massProgress,
        }}
      >
        Periodic Table
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-element-card',
  title: 'Periodic Element Card',
  description:
    'Periodic table element card with atomic number, symbol, name, mass, and electron configuration with draw-in animation',
  tags: ['scene', 'science', 'chemistry', 'element', 'periodic-table', 'educational'],
  category: 'scene-layout',
  component: SceneElementCardComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'atomicNumber', label: 'Atomic Number', type: 'text', defaultValue: '79', group: 'Content' },
    { key: 'symbol', label: 'Symbol', type: 'text', defaultValue: 'Au', group: 'Content' },
    { key: 'elementName', label: 'Element Name', type: 'text', defaultValue: 'Gold', group: 'Content' },
    { key: 'atomicMass', label: 'Atomic Mass', type: 'text', defaultValue: '196.967', group: 'Content' },
    { key: 'electronConfig', label: 'Electron Config', type: 'text', defaultValue: '[Xe] 4f14 5d10 6s1', group: 'Content' },
    { key: 'elementColor', label: 'Element Color', type: 'color', defaultValue: '#FFD700', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#121218', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8E8E8', group: 'Style' },
  ],
  defaultConfig: {
    atomicNumber: '79',
    symbol: 'Au',
    elementName: 'Gold',
    atomicMass: '196.967',
    electronConfig: '[Xe] 4f14 5d10 6s1',
    elementColor: '#FFD700',
    bgColor: '#121218',
    textColor: '#E8E8E8',
  },
})
