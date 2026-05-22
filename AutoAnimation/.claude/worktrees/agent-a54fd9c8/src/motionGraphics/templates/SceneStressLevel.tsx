import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneStressLevelConfig {
  stressLevel: number
  label: string
  tip: string
  bgColor: string
  textColor: string
  lowColor: string
  highColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutQuart(t: number): number { return 1 - Math.pow(1 - t, 4) }

function lerpColor(a: string, b: string, t: number): string {
  const ah = parseInt(a.replace('#', ''), 16)
  const bh = parseInt(b.replace('#', ''), 16)
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff
  const rr = Math.round(ar + (br - ar) * t)
  const rg = Math.round(ag + (bg - ag) * t)
  const rb = Math.round(ab + (bb - ab) * t)
  return `rgb(${rr},${rg},${rb})`
}

function SceneStressLevelComponent({ config, progress }: MotionGraphicProps<SceneStressLevelConfig>) {
  const { stressLevel, label, tip, bgColor, textColor, lowColor, highColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.1 : 1

  const meterEnter = easeOutQuart(Math.min(1, enterProgress / 0.6))
  const labelEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.5)))
  const tipEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.5)))

  const normalizedStress = stressLevel / 10
  const meterColor = lerpColor(lowColor, highColor, normalizedStress)
  const currentLevel = Math.round(stressLevel * meterEnter * 10) / 10

  const isHolding = progress >= 0.2 && progress < 0.8
  const breathe = isHolding ? Math.sin(holdProgress * Math.PI * 6) * 0.02 : 0

  // Gauge segments
  const segmentCount = 20
  const filledSegments = Math.round(segmentCount * normalizedStress * meterEnter)

  // Wave particles for calming effect
  const waveCount = 5

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Calming waves at bottom */}
      {Array.from({ length: waveCount }, (_, i) => {
        const waveY = 85 + i * 3
        const waveOffset = isHolding ? Math.sin(holdProgress * Math.PI * 4 + i * 0.8) * 2 : 0
        const waveOpacity = (0.03 - i * 0.005) * tipEnter

        return (
          <div
            key={`wave-${i}`}
            style={{
              position: 'absolute',
              left: '-5%',
              right: '-5%',
              top: `${waveY + waveOffset}%`,
              height: 'clamp(20px, 4vw, 40px)',
              borderRadius: '50%',
              background: `${lowColor}`,
              opacity: waveOpacity,
            }}
          />
        )
      })}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(20px, 5vw, 48px)',
          opacity: exitOpacity,
          transform: `scale(${exitScale + breathe})`,
        }}
      >
        {/* Stress label */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.6vw, 14px)',
            fontWeight: 600,
            color: `${textColor}55`,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: 'clamp(8px, 1.5vw, 16px)',
            opacity: labelEnter,
          }}
        >
          Stress Level
        </div>

        {/* Score display */}
        <div
          style={{
            fontSize: 'clamp(48px, 12vw, 90px)',
            fontWeight: 800,
            color: meterColor,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            marginBottom: 'clamp(4px, 0.8vw, 8px)',
            opacity: meterEnter,
            textShadow: `0 0 20px ${meterColor}40`,
          }}
        >
          {currentLevel.toFixed(1)}
        </div>

        {/* Label badge */}
        <div
          style={{
            display: 'inline-block',
            background: `${meterColor}18`,
            border: `1px solid ${meterColor}30`,
            borderRadius: 100,
            padding: 'clamp(3px, 0.6vw, 6px) clamp(12px, 2vw, 20px)',
            fontSize: 'clamp(10px, 1.6vw, 14px)',
            fontWeight: 600,
            color: meterColor,
            marginBottom: 'clamp(20px, 4vw, 36px)',
            opacity: labelEnter,
            transform: `scale(${labelEnter})`,
          }}
        >
          {label}
        </div>

        {/* Segmented meter bar */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(2px, 0.4vw, 4px)',
            width: '80%',
            maxWidth: 400,
            height: 'clamp(16px, 3vw, 28px)',
            marginBottom: 'clamp(24px, 5vw, 44px)',
            opacity: meterEnter,
          }}
        >
          {Array.from({ length: segmentCount }, (_, i) => {
            const segmentProgress = i / segmentCount
            const isFilled = i < filledSegments
            const segColor = lerpColor(lowColor, highColor, segmentProgress)

            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  borderRadius: 'clamp(2px, 0.3vw, 3px)',
                  background: isFilled ? segColor : `${textColor}10`,
                  opacity: isFilled ? 0.8 + (isHolding ? Math.sin(holdProgress * Math.PI * 8 + i * 0.3) * 0.2 : 0) : 1,
                  boxShadow: isFilled ? `0 0 4px ${segColor}40` : 'none',
                }}
              />
            )
          })}
        </div>

        {/* Calming tip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'clamp(8px, 1.5vw, 14px)',
            background: `${textColor}06`,
            border: `1px solid ${textColor}10`,
            borderRadius: 'clamp(8px, 1.5vw, 14px)',
            padding: 'clamp(12px, 2.5vw, 24px)',
            maxWidth: 420,
            width: '85%',
            opacity: tipEnter,
            transform: `translateY(${(1 - tipEnter) * 15}px)`,
          }}
        >
          <div
            style={{
              width: 'clamp(3px, 0.5vw, 4px)',
              height: 'clamp(28px, 5vw, 44px)',
              background: lowColor,
              borderRadius: 2,
              flexShrink: 0,
            }}
          />
          <div>
            <div
              style={{
                fontSize: 'clamp(9px, 1.3vw, 11px)',
                fontWeight: 600,
                color: `${textColor}55`,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 'clamp(2px, 0.4vw, 4px)',
              }}
            >
              Calming Tip
            </div>
            <div
              style={{
                fontSize: 'clamp(12px, 2vw, 17px)',
                fontWeight: 400,
                color: `${textColor}cc`,
                lineHeight: 1.5,
              }}
            >
              {tip}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-stress-level',
  title: 'Stress Level',
  description: 'Stress meter visualization with color-graded segmented bar, score display, calming tip card, and wave animation',
  tags: ['scene', 'stress', 'wellness', 'health', 'meditation', 'mindfulness', 'mental-health', 'calm'],
  category: 'scene-layout',
  component: SceneStressLevelComponent as any,
  defaultConfig: {
    stressLevel: 3.5,
    label: 'Low',
    tip: 'Try a 5-minute breathing exercise to maintain your calm state throughout the day.',
    bgColor: '#0c0e14',
    textColor: '#e0e0e8',
    lowColor: '#34d399',
    highColor: '#f87171',
  },
  configSchema: [
    { key: 'stressLevel', label: 'Stress Level (0-10)', type: 'number', defaultValue: 3.5, min: 0, max: 10, group: 'Content' },
    { key: 'label', label: 'Level Label', type: 'text', defaultValue: 'Low', group: 'Content' },
    { key: 'tip', label: 'Calming Tip', type: 'text', defaultValue: 'Try a 5-minute breathing exercise to maintain your calm state throughout the day.', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0e14', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e0e0e8', group: 'Style' },
    { key: 'lowColor', label: 'Low Stress Color', type: 'color', defaultValue: '#34d399', group: 'Style' },
    { key: 'highColor', label: 'High Stress Color', type: 'color', defaultValue: '#f87171', group: 'Style' },
  ],
})
