import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneBreathingExerciseConfig {
  inhaleSeconds: number
  holdSeconds: number
  exhaleSeconds: number
  technique: string
  bgColor: string
  textColor: string
  circleColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeInOutSine(t: number): number { return -(Math.cos(Math.PI * t) - 1) / 2 }

function SceneBreathingExerciseComponent({ config, progress }: MotionGraphicProps<SceneBreathingExerciseConfig>) {
  const { inhaleSeconds, holdSeconds, exhaleSeconds, technique, bgColor, textColor, circleColor } = config

  const enterProgress = progress < 0.12 ? progress / 0.12 : 1
  const holdProgress = progress >= 0.12 && progress < 0.88 ? (progress - 0.12) / 0.76 : progress >= 0.88 ? 1 : 0
  const exitProgress = progress >= 0.88 ? (progress - 0.88) / 0.12 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  const contentEnter = easeOutCubic(enterProgress)
  const isHolding = progress >= 0.12 && progress < 0.88

  // Breathing cycle during hold
  const totalCycle = inhaleSeconds + holdSeconds + exhaleSeconds
  const cycleProgress = isHolding ? (holdProgress * totalCycle * 3) % totalCycle : 0
  let phase: 'inhale' | 'hold' | 'exhale' = 'inhale'
  let phaseProgress = 0

  if (cycleProgress < inhaleSeconds) {
    phase = 'inhale'
    phaseProgress = cycleProgress / inhaleSeconds
  } else if (cycleProgress < inhaleSeconds + holdSeconds) {
    phase = 'hold'
    phaseProgress = (cycleProgress - inhaleSeconds) / holdSeconds
  } else {
    phase = 'exhale'
    phaseProgress = (cycleProgress - inhaleSeconds - holdSeconds) / exhaleSeconds
  }

  // Circle expansion
  let circleScale = 0.5
  if (phase === 'inhale') {
    circleScale = 0.5 + easeInOutSine(phaseProgress) * 0.5
  } else if (phase === 'hold') {
    circleScale = 1.0
  } else {
    circleScale = 1.0 - easeInOutSine(phaseProgress) * 0.5
  }

  if (!isHolding) circleScale = 0.5 + contentEnter * 0.25

  const phaseLabel = phase === 'inhale' ? 'Inhale' : phase === 'hold' ? 'Hold' : 'Exhale'
  const phaseTime = phase === 'inhale' ? inhaleSeconds : phase === 'hold' ? holdSeconds : exhaleSeconds
  const countdown = Math.ceil(phaseTime * (1 - phaseProgress))

  // Ring layers
  const ringCount = 3

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Ambient gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 45%, ${circleColor}08 0%, transparent 60%)`,
          opacity: circleScale,
        }}
      />

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
        }}
      >
        {/* Technique label */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.6vw, 14px)',
            fontWeight: 600,
            color: `${textColor}55`,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: 'clamp(20px, 4vw, 40px)',
            opacity: contentEnter,
            transform: `translateY(${(1 - contentEnter) * 10}px)`,
          }}
        >
          {technique}
        </div>

        {/* Breathing circle */}
        <div
          style={{
            position: 'relative',
            width: 'clamp(180px, 40vw, 280px)',
            height: 'clamp(180px, 40vw, 280px)',
          }}
        >
          {/* Outer rings */}
          {Array.from({ length: ringCount }, (_, i) => {
            const ringScale = circleScale * (1 + (i + 1) * 0.12)
            const ringOpacity = (0.15 - i * 0.04) * contentEnter

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '100%',
                  height: '100%',
                  transform: `translate(-50%, -50%) scale(${ringScale})`,
                  borderRadius: '50%',
                  border: `1px solid ${circleColor}`,
                  opacity: ringOpacity,
                }}
              />
            )
          })}

          {/* Main circle */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '100%',
              height: '100%',
              transform: `translate(-50%, -50%) scale(${circleScale * contentEnter})`,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${circleColor}18 0%, ${circleColor}08 50%, transparent 70%)`,
              border: `2px solid ${circleColor}40`,
              boxShadow: `0 0 ${circleScale * 20}px ${circleColor}20`,
            }}
          />

          {/* Center content */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            {/* Phase label */}
            <div
              style={{
                fontSize: 'clamp(18px, 4vw, 32px)',
                fontWeight: 300,
                color: textColor,
                letterSpacing: 3,
                textTransform: 'uppercase',
                opacity: isHolding ? 1 : contentEnter,
              }}
            >
              {isHolding ? phaseLabel : 'Ready'}
            </div>

            {/* Countdown */}
            {isHolding && (
              <div
                style={{
                  fontSize: 'clamp(32px, 8vw, 60px)',
                  fontWeight: 200,
                  color: circleColor,
                  fontVariantNumeric: 'tabular-nums',
                  marginTop: 'clamp(4px, 0.8vw, 8px)',
                }}
              >
                {countdown}
              </div>
            )}
          </div>
        </div>

        {/* Timing info */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(16px, 4vw, 36px)',
            marginTop: 'clamp(24px, 5vw, 48px)',
            opacity: contentEnter,
            transform: `translateY(${(1 - contentEnter) * 10}px)`,
          }}
        >
          {[
            { label: 'Inhale', value: `${inhaleSeconds}s`, active: isHolding && phase === 'inhale' },
            { label: 'Hold', value: `${holdSeconds}s`, active: isHolding && phase === 'hold' },
            { label: 'Exhale', value: `${exhaleSeconds}s`, active: isHolding && phase === 'exhale' },
          ].map((item) => (
            <div key={item.label} style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: 'clamp(16px, 3.5vw, 28px)',
                  fontWeight: item.active ? 700 : 300,
                  color: item.active ? circleColor : `${textColor}88`,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {item.value}
              </div>
              <div
                style={{
                  fontSize: 'clamp(8px, 1.2vw, 11px)',
                  fontWeight: 500,
                  color: item.active ? circleColor : `${textColor}44`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginTop: 2,
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-breathing-exercise',
  title: 'Breathing Exercise',
  description: 'Animated breathing guide with expanding circle, inhale/hold/exhale phases, countdown timer, and technique label',
  tags: ['scene', 'breathing', 'meditation', 'exercise', 'mindfulness', 'wellness', 'calm', 'health'],
  category: 'scene-layout',
  component: SceneBreathingExerciseComponent as any,
  defaultConfig: {
    inhaleSeconds: 4,
    holdSeconds: 4,
    exhaleSeconds: 4,
    technique: '4-4-4 Box Breathing',
    bgColor: '#0a0f18',
    textColor: '#e0e0e0',
    circleColor: '#5b8fa8',
  },
  configSchema: [
    { key: 'inhaleSeconds', label: 'Inhale (seconds)', type: 'number', defaultValue: 4, min: 1, max: 12, group: 'Content' },
    { key: 'holdSeconds', label: 'Hold (seconds)', type: 'number', defaultValue: 4, min: 0, max: 12, group: 'Content' },
    { key: 'exhaleSeconds', label: 'Exhale (seconds)', type: 'number', defaultValue: 4, min: 1, max: 12, group: 'Content' },
    { key: 'technique', label: 'Technique Name', type: 'text', defaultValue: '4-4-4 Box Breathing', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0f18', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e0e0e0', group: 'Style' },
    { key: 'circleColor', label: 'Circle Color', type: 'color', defaultValue: '#5b8fa8', group: 'Style' },
  ],
})
