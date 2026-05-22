import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneMeditationTimerConfig {
  durationMinutes: number
  sessionLabel: string
  breathText: string
  bgColor: string
  textColor: string
  accentColor: string
  ringColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeInOutSine(t: number): number { return -(Math.cos(Math.PI * t) - 1) / 2 }

function formatTime(minutes: number, progress: number): string {
  const totalSeconds = Math.round(minutes * 60 * (1 - progress))
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function SceneMeditationTimerComponent({ config, progress }: MotionGraphicProps<SceneMeditationTimerConfig>) {
  const { durationMinutes, sessionLabel, breathText, bgColor, textColor, accentColor, ringColor } = config

  const enterProgress = progress < 0.15 ? progress / 0.15 : 1
  const holdProgress = progress >= 0.15 && progress < 0.85 ? (progress - 0.15) / 0.7 : progress >= 0.85 ? 1 : 0
  const exitProgress = progress >= 0.85 ? (progress - 0.85) / 0.15 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.12 : 1

  const ringEnter = easeOutCubic(Math.min(1, enterProgress / 0.7))
  const timerEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.6)))
  const labelEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.6)))

  // Breathing circle animation
  const breathCycle = easeInOutSine((Math.sin(holdProgress * Math.PI * 8) + 1) / 2)
  const isHolding = progress >= 0.15 && progress < 0.85

  // Timer ring
  const radius = 100
  const strokeWidth = 6
  const circumference = 2 * Math.PI * radius
  const timerProgress = isHolding ? holdProgress : 0
  const dashOffset = circumference * (1 - timerProgress * ringEnter)

  // Breathing circle radius
  const breathRadius = isHolding ? 30 + breathCycle * 20 : 30

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '60%',
          height: '60%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}08 0%, transparent 70%)`,
          opacity: isHolding ? 0.5 + breathCycle * 0.5 : 0.5,
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
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Session label */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.8vw, 16px)',
            fontWeight: 600,
            color: `${textColor}66`,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: 'clamp(16px, 3vw, 32px)',
            opacity: labelEnter,
            transform: `translateY(${(1 - labelEnter) * 10}px)`,
          }}
        >
          {sessionLabel}
        </div>

        {/* Timer ring */}
        <div
          style={{
            position: 'relative',
            width: 'clamp(200px, 42vw, 300px)',
            height: 'clamp(200px, 42vw, 300px)',
            opacity: ringEnter,
          }}
        >
          <svg
            viewBox={`0 0 ${(radius + strokeWidth) * 2} ${(radius + strokeWidth) * 2}`}
            style={{ width: '100%', height: '100%' }}
          >
            <circle
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              fill="none"
              stroke={`${ringColor}15`}
              strokeWidth={strokeWidth}
            />
            <circle
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              fill="none"
              stroke={ringColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${radius + strokeWidth} ${radius + strokeWidth})`}
              style={{ filter: `drop-shadow(0 0 6px ${ringColor}50)` }}
            />
          </svg>

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
            {/* Breathing circle */}
            <div
              style={{
                width: breathRadius * 2,
                height: breathRadius * 2,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${accentColor}20 0%, ${accentColor}08 60%, transparent 100%)`,
                border: `1px solid ${accentColor}25`,
                margin: '0 auto',
                marginBottom: 'clamp(8px, 1.5vw, 14px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(8px, 1.2vw, 11px)',
                  fontWeight: 500,
                  color: `${accentColor}88`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                {breathText}
              </div>
            </div>

            {/* Timer display */}
            <div
              style={{
                fontSize: 'clamp(28px, 7vw, 56px)',
                fontWeight: 200,
                color: textColor,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: 2,
                opacity: timerEnter,
              }}
            >
              {formatTime(durationMinutes, isHolding ? holdProgress : 0)}
            </div>
          </div>
        </div>

        {/* Duration label */}
        <div
          style={{
            fontSize: 'clamp(11px, 1.6vw, 14px)',
            fontWeight: 500,
            color: `${textColor}44`,
            marginTop: 'clamp(16px, 3vw, 28px)',
            opacity: labelEnter,
          }}
        >
          {durationMinutes} minute session
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-meditation-timer',
  title: 'Meditation Timer',
  description: 'Meditation session timer with breathing circle animation, progress ring, and countdown display',
  tags: ['scene', 'meditation', 'timer', 'breathing', 'mindfulness', 'wellness', 'calm'],
  category: 'scene-layout',
  component: SceneMeditationTimerComponent as any,
  defaultConfig: {
    durationMinutes: 10,
    sessionLabel: 'Morning Meditation',
    breathText: 'breathe',
    bgColor: '#0c1018',
    textColor: '#e8e8e8',
    accentColor: '#7c9eb2',
    ringColor: '#7c9eb2',
  },
  configSchema: [
    { key: 'durationMinutes', label: 'Duration (min)', type: 'number', defaultValue: 10, min: 1, max: 60, group: 'Content' },
    { key: 'sessionLabel', label: 'Session Label', type: 'text', defaultValue: 'Morning Meditation', group: 'Content' },
    { key: 'breathText', label: 'Breath Text', type: 'text', defaultValue: 'breathe', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c1018', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e8e8e8', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#7c9eb2', group: 'Style' },
    { key: 'ringColor', label: 'Ring Color', type: 'color', defaultValue: '#7c9eb2', group: 'Style' },
  ],
})
