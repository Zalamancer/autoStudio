import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneSoundBathConfig {
  title: string
  frequency: string
  instrument: string
  duration: string
  bgColor: string
  textColor: string
  waveColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeInOutSine(t: number): number { return -(Math.cos(Math.PI * t) - 1) / 2 }

function SceneSoundBathComponent({ config, progress }: MotionGraphicProps<SceneSoundBathConfig>) {
  const { title, frequency, instrument, duration, bgColor, textColor, waveColor, accentColor } = config

  const enterProgress = progress < 0.15 ? progress / 0.15 : 1
  const holdProgress = progress >= 0.15 && progress < 0.85 ? (progress - 0.15) / 0.7 : progress >= 0.85 ? 1 : 0
  const exitProgress = progress >= 0.85 ? (progress - 0.85) / 0.15 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.1 : 1

  const titleEnter = easeOutCubic(Math.min(1, enterProgress / 0.4))
  const waveEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.5)))
  const detailEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.5)))

  const isHolding = progress >= 0.15 && progress < 0.85

  // Frequency waves
  const waveCount = 7
  const waveSegments = 60

  // Resonance rings
  const ringCount = 4

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Deep ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          width: '70%',
          height: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${waveColor}06 0%, transparent 70%)`,
          opacity: waveEnter,
        }}
      />

      {/* Resonance rings */}
      {Array.from({ length: ringCount }, (_, i) => {
        const baseSize = 100 + i * 80
        const pulse = isHolding ? easeInOutSine((Math.sin(holdProgress * Math.PI * 4 + i * 0.6) + 1) / 2) : 0.5
        const ringSize = baseSize + pulse * 30
        const ringOpacity = (0.06 - i * 0.012) * waveEnter

        return (
          <div
            key={`ring-${i}`}
            style={{
              position: 'absolute',
              top: '45%',
              left: '50%',
              width: ringSize,
              height: ringSize,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              border: `1px solid ${waveColor}`,
              opacity: ringOpacity,
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
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Instrument label */}
        <div
          style={{
            fontSize: 'clamp(9px, 1.4vw, 12px)',
            fontWeight: 600,
            color: `${textColor}44`,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: 'clamp(8px, 1.5vw, 14px)',
            opacity: detailEnter,
          }}
        >
          {instrument}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 'clamp(22px, 5.5vw, 42px)',
            fontWeight: 700,
            color: textColor,
            textAlign: 'center',
            marginBottom: 'clamp(4px, 0.8vw, 8px)',
            opacity: titleEnter,
            transform: `translateY(${(1 - titleEnter) * 15}px)`,
          }}
        >
          {title}
        </div>

        {/* Frequency badge */}
        <div
          style={{
            display: 'inline-block',
            background: `${accentColor}12`,
            border: `1px solid ${accentColor}25`,
            borderRadius: 100,
            padding: 'clamp(3px, 0.5vw, 5px) clamp(12px, 2vw, 20px)',
            fontSize: 'clamp(12px, 2vw, 18px)',
            fontWeight: 600,
            color: accentColor,
            marginBottom: 'clamp(24px, 5vw, 44px)',
            opacity: detailEnter,
            transform: `scale(${detailEnter})`,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {frequency}
        </div>

        {/* Wave visualization */}
        <div
          style={{
            width: '90%',
            maxWidth: 500,
            height: 'clamp(100px, 22vw, 180px)',
            position: 'relative',
            opacity: waveEnter,
          }}
        >
          <svg
            viewBox="0 0 500 180"
            preserveAspectRatio="none"
            style={{ width: '100%', height: '100%' }}
          >
            {Array.from({ length: waveCount }, (_, waveIdx) => {
              const waveY = 90 + (waveIdx - 3) * 12
              const waveAmplitude = isHolding
                ? (15 + Math.sin(holdProgress * Math.PI * 3 + waveIdx * 0.5) * 10)
                : 8
              const waveFreq = 2 + waveIdx * 0.4
              const phaseShift = isHolding ? holdProgress * Math.PI * 8 + waveIdx * 0.8 : waveIdx * 0.5
              const waveOpacity = 0.15 - Math.abs(waveIdx - 3) * 0.02

              const points: string[] = []
              for (let s = 0; s <= waveSegments; s++) {
                const x = (s / waveSegments) * 500
                const normalX = s / waveSegments
                const envelope = Math.sin(normalX * Math.PI)
                const y = waveY + Math.sin(normalX * waveFreq * Math.PI * 2 + phaseShift) * waveAmplitude * envelope * waveEnter
                points.push(`${x},${y}`)
              }

              return (
                <polyline
                  key={waveIdx}
                  points={points.join(' ')}
                  fill="none"
                  stroke={waveColor}
                  strokeWidth={1.5}
                  opacity={waveOpacity}
                  strokeLinecap="round"
                />
              )
            })}
          </svg>
        </div>

        {/* Duration */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1vw, 10px)',
            marginTop: 'clamp(16px, 3vw, 28px)',
            opacity: detailEnter,
            transform: `translateY(${(1 - detailEnter) * 8}px)`,
          }}
        >
          {/* Play icon */}
          <svg viewBox="0 0 24 24" width="clamp(14px, 2.5vw, 20px)" height="clamp(14px, 2.5vw, 20px)">
            <circle cx="12" cy="12" r="10" fill="none" stroke={`${textColor}44`} strokeWidth="1.5" />
            <polygon points="10,8 16,12 10,16" fill={`${textColor}66`} />
          </svg>
          <span
            style={{
              fontSize: 'clamp(12px, 2vw, 17px)',
              fontWeight: 500,
              color: `${textColor}66`,
            }}
          >
            {duration}
          </span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-sound-bath',
  title: 'Sound Bath',
  description: 'Sound healing visualization with animated frequency waves, resonance rings, instrument label, and frequency badge',
  tags: ['scene', 'sound-bath', 'healing', 'meditation', 'frequency', 'mindfulness', 'wellness', 'audio'],
  category: 'scene-layout',
  component: SceneSoundBathComponent as any,
  defaultConfig: {
    title: 'Tibetan Bowl Session',
    frequency: '432 Hz',
    instrument: 'Singing Bowl',
    duration: '15 min',
    bgColor: '#0a0c14',
    textColor: '#e0e0e8',
    waveColor: '#818cf8',
    accentColor: '#a78bfa',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Tibetan Bowl Session', group: 'Content' },
    { key: 'frequency', label: 'Frequency', type: 'text', defaultValue: '432 Hz', group: 'Content' },
    { key: 'instrument', label: 'Instrument', type: 'text', defaultValue: 'Singing Bowl', group: 'Content' },
    { key: 'duration', label: 'Duration', type: 'text', defaultValue: '15 min', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0c14', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e0e0e8', group: 'Style' },
    { key: 'waveColor', label: 'Wave Color', type: 'color', defaultValue: '#818cf8', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#a78bfa', group: 'Style' },
  ],
})
