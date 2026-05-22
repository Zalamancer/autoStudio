import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneHologramDisplayConfig {
  title: string
  dataLabel1: string
  dataValue1: string
  dataLabel2: string
  dataValue2: string
  dataLabel3: string
  dataValue3: string
  statusText: string
  bgColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneHologramDisplayComponent({ config, progress }: MotionGraphicProps<SceneHologramDisplayConfig>) {
  const { title, dataLabel1, dataValue1, dataLabel2, dataValue2, dataLabel3, dataValue3, statusText, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const frame = Math.floor(progress * 300)
  const flicker = Math.sin(frame * 0.3) > 0.88 ? 0.7 : 1
  const scanY = ((frame * 1.5) % 120) - 10

  // Hologram materialization
  const holoOpacity = easeOutCubic(enterProgress) * flicker
  const scaleY = 0.6 + easeOutCubic(enterProgress) * 0.4
  const chromaShift = (1 - enterProgress) * 3

  // Rotating hex ring data points
  const hexPoints = Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * Math.PI * 2 + holdProgress * Math.PI * 2
    const radius = 38
    const x = 50 + Math.cos(angle) * radius
    const y = 50 + Math.sin(angle) * radius
    const dotOpacity = easeOutCubic(Math.max(0, (enterProgress - 0.4 - i * 0.05) / 0.5))

    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: accentColor,
          opacity: dotOpacity * 0.3,
          boxShadow: `0 0 6px ${accentColor}40`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />
    )
  })

  const dataItems = [
    { label: dataLabel1, value: dataValue1 },
    { label: dataLabel2, value: dataValue2 },
    { label: dataLabel3, value: dataValue3 },
  ]

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Holographic scan lines */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,180,255,0.015) 3px, rgba(0,180,255,0.015) 4px)',
        pointerEvents: 'none',
      }} />

      {/* Rotating hex ring */}
      {hexPoints}

      {/* Central hologram bloom */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 55%, ${accentColor}06, transparent 50%)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '8%',
        opacity: exitOpacity,
      }}>
        <div style={{
          width: 'clamp(260px, 70vw, 440px)',
          background: `linear-gradient(180deg, ${accentColor}08, ${accentColor}03)`,
          border: `1px solid ${accentColor}20`,
          borderRadius: 'clamp(8px, 2vw, 16px)',
          padding: 'clamp(16px, 4vw, 32px)',
          opacity: holoOpacity,
          transform: `scaleY(${scaleY})`,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `0 0 60px ${accentColor}08, inset 0 0 30px ${accentColor}05`,
        }}>
          {/* Scan line */}
          <div style={{
            position: 'absolute',
            left: 0, right: 0,
            top: `${scanY}%`,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${accentColor}20, transparent)`,
            pointerEvents: 'none',
          }} />

          {/* Cyan ghost offset */}
          <div style={{
            position: 'absolute', inset: 0,
            padding: 'inherit',
            transform: `translateX(${-chromaShift}px)`,
            opacity: chromaShift > 0.5 ? 0.15 : 0,
            pointerEvents: 'none',
          }}>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(16px, 4vw, 28px)', fontWeight: 700, color: '#00FFFF' }}>
              {title}
            </div>
          </div>

          {/* Title */}
          <div style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(16px, 4vw, 28px)',
            fontWeight: 700,
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: 4,
            textAlign: 'center',
            marginBottom: 'clamp(6px, 1.5vw, 12px)',
            textShadow: `0 0 12px ${accentColor}50`,
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.1) / 0.9)),
          }}>
            {title}
          </div>

          {/* Status badge */}
          <div style={{
            textAlign: 'center',
            marginBottom: 'clamp(14px, 3vw, 24px)',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.2) / 0.8)),
          }}>
            <span style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(8px, 1.4vw, 10px)',
              color: `${textColor}50`,
              background: `${accentColor}10`,
              padding: '2px 10px',
              borderRadius: 10,
              border: `1px solid ${accentColor}15`,
              letterSpacing: 2,
            }}>
              {statusText}
            </span>
          </div>

          {/* Data items */}
          {dataItems.map((item, i) => {
            const stagger = easeOutCubic(Math.max(0, (enterProgress - 0.3 - i * 0.1) / 0.5))
            return (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'clamp(6px, 1.2vw, 10px) 0',
                borderBottom: i < 2 ? `1px solid ${accentColor}10` : 'none',
                opacity: stagger,
                transform: `translateY(${(1 - stagger) * 15}px)`,
              }}>
                <div style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(9px, 1.5vw, 11px)',
                  color: `${textColor}50`,
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                }}>
                  {item.label}
                </div>
                <div style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(14px, 3vw, 22px)',
                  fontWeight: 700,
                  color: textColor,
                  textShadow: `0 0 8px ${accentColor}30`,
                }}>
                  {item.value}
                </div>
              </div>
            )
          })}

          {/* Bottom projection line */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: '10%', right: '10%',
            height: 2,
            background: `linear-gradient(90deg, transparent, ${accentColor}30, transparent)`,
            boxShadow: `0 0 10px ${accentColor}20`,
          }} />
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-hologram-display',
  title: 'Hologram Data Display',
  description: 'Holographic data projection with scan lines, chromatic aberration, rotating hex ring, and flickering transparency',
  tags: ['scene', 'hologram', 'futuristic', 'data', 'projection', 'sci-fi', 'cyberpunk'],
  category: 'scene-layout',
  component: SceneHologramDisplayComponent as any,
  defaultConfig: {
    title: 'SYSTEM DATA',
    dataLabel1: 'FREQUENCY',
    dataValue1: '847.2 MHz',
    dataLabel2: 'AMPLITUDE',
    dataValue2: '0.94 dB',
    dataLabel3: 'LATENCY',
    dataValue3: '2.1 ms',
    statusText: 'HOLOGRAM ACTIVE',
    bgColor: '#040810',
    accentColor: '#00BBFF',
    textColor: '#d0e0f0',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'SYSTEM DATA', group: 'Content' },
    { key: 'dataLabel1', label: 'Data Label 1', type: 'text', defaultValue: 'FREQUENCY', group: 'Content' },
    { key: 'dataValue1', label: 'Data Value 1', type: 'text', defaultValue: '847.2 MHz', group: 'Content' },
    { key: 'dataLabel2', label: 'Data Label 2', type: 'text', defaultValue: 'AMPLITUDE', group: 'Content' },
    { key: 'dataValue2', label: 'Data Value 2', type: 'text', defaultValue: '0.94 dB', group: 'Content' },
    { key: 'dataLabel3', label: 'Data Label 3', type: 'text', defaultValue: 'LATENCY', group: 'Content' },
    { key: 'dataValue3', label: 'Data Value 3', type: 'text', defaultValue: '2.1 ms', group: 'Content' },
    { key: 'statusText', label: 'Status', type: 'text', defaultValue: 'HOLOGRAM ACTIVE', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#040810', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#00BBFF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#d0e0f0', group: 'Style' },
  ],
})
