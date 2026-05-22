import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneSleepScoreConfig {
  score: number
  hoursSlept: string
  bedtime: string
  wakeTime: string
  quality: string
  bgColor: string
  textColor: string
  accentColor: string
}

const MOON_PHASES = ['\u{1F311}', '\u{1F312}', '\u{1F313}', '\u{1F314}', '\u{1F315}']

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutQuart(t: number): number { return 1 - Math.pow(1 - t, 4) }

function SceneSleepScoreComponent({ config, progress }: MotionGraphicProps<SceneSleepScoreConfig>) {
  const { score, hoursSlept, bedtime, wakeTime, quality, bgColor, textColor, accentColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.12 : 1

  const scoreEnter = easeOutQuart(Math.min(1, enterProgress / 0.7))
  const detailsEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.5)))
  const moonEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.5)))

  const currentScore = Math.round(score * scoreEnter)
  const isHolding = progress >= 0.2 && progress < 0.8
  const pulse = isHolding ? 1 + Math.sin(holdProgress * Math.PI * 5) * 0.015 : 1

  // Arc for score gauge
  const radius = 90
  const strokeWidth = 10
  const circumference = Math.PI * radius // Half circle
  const scorePercent = score / 100
  const dashOffset = circumference * (1 - scorePercent * scoreEnter)

  // Moon phase based on score
  const moonIndex = Math.min(4, Math.floor((score / 100) * 5))

  // Stars
  const starPositions = Array.from({ length: 12 }, (_, i) => ({
    x: 10 + (i * 37 + i * i * 7) % 80,
    y: 5 + (i * 23 + i * 11) % 30,
    size: 1.5 + (i % 3),
    delay: i * 0.15,
  }))

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Night sky stars */}
      {starPositions.map((star, i) => {
        const twinkle = isHolding ? 0.3 + Math.sin(holdProgress * Math.PI * 10 + i * 2) * 0.3 : 0.3
        const starOpacity = moonEnter * twinkle

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              borderRadius: '50%',
              background: `rgba(255,255,255,${starOpacity})`,
              boxShadow: `0 0 ${star.size * 2}px rgba(255,255,255,${starOpacity * 0.5})`,
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
          padding: 'clamp(16px, 4vw, 40px)',
          opacity: exitOpacity,
          transform: `scale(${exitScale * pulse})`,
        }}
      >
        {/* Moon phase */}
        <div
          style={{
            fontSize: 'clamp(28px, 6vw, 48px)',
            marginBottom: 'clamp(4px, 1vw, 12px)',
            opacity: moonEnter,
            transform: `translateY(${(1 - moonEnter) * -15}px)`,
          }}
        >
          {MOON_PHASES[moonIndex]}
        </div>

        {/* Score gauge */}
        <div
          style={{
            position: 'relative',
            width: 'clamp(180px, 40vw, 280px)',
            height: 'clamp(100px, 22vw, 160px)',
            opacity: scoreEnter,
          }}
        >
          <svg
            viewBox={`0 0 ${(radius + strokeWidth) * 2} ${radius + strokeWidth * 2}`}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Track */}
            <path
              d={`M ${strokeWidth} ${radius + strokeWidth} A ${radius} ${radius} 0 0 1 ${radius * 2 + strokeWidth} ${radius + strokeWidth}`}
              fill="none"
              stroke={`${accentColor}15`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {/* Score arc */}
            <path
              d={`M ${strokeWidth} ${radius + strokeWidth} A ${radius} ${radius} 0 0 1 ${radius * 2 + strokeWidth} ${radius + strokeWidth}`}
              fill="none"
              stroke={accentColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ filter: `drop-shadow(0 0 6px ${accentColor}50)` }}
            />
          </svg>

          {/* Score number */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 'clamp(36px, 9vw, 64px)',
                fontWeight: 800,
                color: textColor,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}
            >
              {currentScore}
            </div>
            <div
              style={{
                fontSize: 'clamp(9px, 1.4vw, 12px)',
                fontWeight: 600,
                color: `${textColor}55`,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
              }}
            >
              Sleep Score
            </div>
          </div>
        </div>

        {/* Quality badge */}
        <div
          style={{
            display: 'inline-block',
            background: `${accentColor}18`,
            border: `1px solid ${accentColor}30`,
            borderRadius: 100,
            padding: 'clamp(4px, 0.8vw, 8px) clamp(12px, 2.5vw, 24px)',
            marginTop: 'clamp(12px, 2.5vw, 24px)',
            marginBottom: 'clamp(16px, 3vw, 32px)',
            fontSize: 'clamp(10px, 1.8vw, 16px)',
            fontWeight: 600,
            color: accentColor,
            opacity: detailsEnter,
            transform: `scale(${detailsEnter})`,
          }}
        >
          {quality}
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(20px, 5vw, 48px)',
            opacity: detailsEnter,
            transform: `translateY(${(1 - detailsEnter) * 10}px)`,
          }}
        >
          {[
            { label: 'Duration', value: hoursSlept },
            { label: 'Bedtime', value: bedtime },
            { label: 'Wake', value: wakeTime },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: 'clamp(16px, 3.5vw, 26px)',
                  fontWeight: 700,
                  color: textColor,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 'clamp(8px, 1.2vw, 11px)',
                  fontWeight: 500,
                  color: `${textColor}55`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginTop: 2,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-sleep-score',
  title: 'Sleep Score',
  description: 'Sleep quality visualization with score gauge, moon phases, twinkling stars, and bedtime stats',
  tags: ['scene', 'sleep', 'wellness', 'health', 'meditation', 'mindfulness', 'tracker', 'night'],
  category: 'scene-layout',
  component: SceneSleepScoreComponent as any,
  defaultConfig: {
    score: 85,
    hoursSlept: '7h 42m',
    bedtime: '10:30 PM',
    wakeTime: '6:12 AM',
    quality: 'Excellent',
    bgColor: '#0a0c18',
    textColor: '#e8e8f0',
    accentColor: '#6366f1',
  },
  configSchema: [
    { key: 'score', label: 'Sleep Score', type: 'number', defaultValue: 85, min: 0, max: 100, group: 'Content' },
    { key: 'hoursSlept', label: 'Hours Slept', type: 'text', defaultValue: '7h 42m', group: 'Content' },
    { key: 'bedtime', label: 'Bedtime', type: 'text', defaultValue: '10:30 PM', group: 'Content' },
    { key: 'wakeTime', label: 'Wake Time', type: 'text', defaultValue: '6:12 AM', group: 'Content' },
    { key: 'quality', label: 'Quality Label', type: 'text', defaultValue: 'Excellent', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0c18', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e8e8f0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#6366f1', group: 'Style' },
  ],
})
