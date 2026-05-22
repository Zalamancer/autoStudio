import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneMotivationalCounterConfig {
  currentDay: number
  totalDays: number
  goalText: string
  bgColor: string
  textColor: string
  accentColor: string
  ringColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function SceneMotivationalCounterComponent({ config, progress }: MotionGraphicProps<SceneMotivationalCounterConfig>) {
  const { currentDay, totalDays, goalText, bgColor, textColor, accentColor, ringColor } = config

  // Phase calculations
  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Ring draw animation
  const ringRadius = 90
  const circumference = 2 * Math.PI * ringRadius
  const dayFraction = currentDay / totalDays
  const ringDrawProgress = easeOutQuart(Math.min(1, enterProgress * 1.3))
  const ringOffset = circumference * (1 - dayFraction * ringDrawProgress)

  // Counter animation — count up from 0 to currentDay
  const counterProgress = easeOutQuart(Math.min(1, enterProgress * 1.2))
  const displayDay = Math.round(currentDay * counterProgress)

  // Goal text fade in
  const goalDelay = 0.5
  const goalEnter = enterProgress < goalDelay ? 0 : (enterProgress - goalDelay) / (1 - goalDelay)
  const goalOpacity = easeOutCubic(goalEnter)
  const goalY = (1 - easeOutCubic(goalEnter)) * 20

  // Hold: subtle ring glow pulse
  const isHolding = progress >= 0.25 && progress < 0.8
  const glowIntensity = isHolding ? 0.4 + Math.sin(holdProgress * Math.PI * 4) * 0.15 : 0.4

  // Exit
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const exitScale = exitProgress > 0 ? 1 - easeInCubic(exitProgress) * 0.15 : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Circular progress ring */}
        <div style={{ position: 'relative', width: 220, height: 220 }}>
          <svg
            width="220"
            height="220"
            viewBox="0 0 220 220"
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            {/* Background ring */}
            <circle
              cx="110"
              cy="110"
              r={ringRadius}
              fill="none"
              stroke={`${ringColor}20`}
              strokeWidth="6"
            />
            {/* Progress ring */}
            <circle
              cx="110"
              cy="110"
              r={ringRadius}
              fill="none"
              stroke={ringColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={ringOffset}
              transform="rotate(-90 110 110)"
              style={{
                filter: `drop-shadow(0 0 ${glowIntensity * 20}px ${ringColor}88)`,
              }}
            />
          </svg>

          {/* Day counter inside ring */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(10px, 2vw, 14px)',
                fontWeight: 500,
                color: `${textColor}99`,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              Day
            </div>
            <div
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(36px, 10vw, 72px)',
                fontWeight: 800,
                color: accentColor,
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {displayDay}
            </div>
            <div
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(10px, 2vw, 16px)',
                fontWeight: 400,
                color: `${textColor}80`,
                marginTop: 4,
              }}
            >
              of {totalDays}
            </div>
          </div>
        </div>

        {/* Goal text */}
        <div
          style={{
            marginTop: '2em',
            opacity: goalOpacity * (exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1),
            transform: `translateY(${goalY}px)`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(14px, 3vw, 28px)',
            fontWeight: 600,
            color: textColor,
            textAlign: 'center',
            letterSpacing: '0.04em',
            maxWidth: '80%',
          }}
        >
          {goalText}
        </div>

        {/* Encouraging subtitle */}
        <div
          style={{
            marginTop: '0.5em',
            opacity: goalOpacity * 0.6 * (exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1),
            transform: `translateY(${goalY * 0.5}px)`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(10px, 2vw, 16px)',
            fontWeight: 400,
            color: `${textColor}88`,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Keep going!
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-motivational-counter',
  title: 'Scene Motivational Counter',
  description: '"Day X of 365" progress counter with circular ring that draws in and number that counts up. Encouraging tone.',
  tags: ['scene', 'counter', 'progress', 'motivational', 'ring', 'goal', 'streak'],
  category: 'scene-layout',
  component: SceneMotivationalCounterComponent as any,
  defaultConfig: {
    currentDay: 47,
    totalDays: 365,
    goalText: 'Building Every Single Day',
    bgColor: '#0F172A',
    textColor: '#E2E8F0',
    accentColor: '#38BDF8',
    ringColor: '#38BDF8',
  },
  configSchema: [
    { key: 'currentDay', label: 'Current Day', type: 'number', defaultValue: 47, min: 1, max: 9999, group: 'Content' },
    { key: 'totalDays', label: 'Total Days', type: 'number', defaultValue: 365, min: 1, max: 9999, group: 'Content' },
    { key: 'goalText', label: 'Goal Text', type: 'text', defaultValue: 'Building Every Single Day', group: 'Content' },
    { key: 'bgColor', label: 'Background Color', type: 'color', defaultValue: '#0F172A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E2E8F0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#38BDF8', group: 'Style' },
    { key: 'ringColor', label: 'Ring Color', type: 'color', defaultValue: '#38BDF8', group: 'Style' },
  ],
})
