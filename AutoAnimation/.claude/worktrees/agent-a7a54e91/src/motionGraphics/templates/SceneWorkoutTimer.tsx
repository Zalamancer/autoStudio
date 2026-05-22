import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneWorkoutTimerConfig {
  workSeconds: number
  restSeconds: number
  totalRounds: number
  workColor: string
  restColor: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneWorkoutTimerComponent({ config, progress }: MotionGraphicProps<SceneWorkoutTimerConfig>) {
  const { workSeconds, restSeconds, totalRounds, workColor, restColor, bgColor, textColor } = config

  const enterProgress = progress < 0.15 ? progress / 0.15 : 1
  const holdProgress = progress >= 0.15 && progress < 0.8 ? (progress - 0.15) / 0.65 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Determine if in WORK or REST phase based on hold progress
  const roundDuration = workSeconds + restSeconds
  const totalDuration = roundDuration * totalRounds
  const currentTime = holdProgress * totalDuration
  const currentRound = Math.min(Math.floor(currentTime / roundDuration) + 1, totalRounds)
  const timeInRound = currentTime % roundDuration
  const isWork = timeInRound < workSeconds
  const phaseTime = isWork ? workSeconds - timeInRound : restSeconds - (timeInRound - workSeconds)
  const displayTime = Math.max(0, Math.ceil(phaseTime))

  const activeColor = isWork ? workColor : restColor
  const phaseLabel = isWork ? 'WORK' : 'REST'

  // Ring progress for current phase
  const phaseTotal = isWork ? workSeconds : restSeconds
  const phaseProgress = 1 - (phaseTime / phaseTotal)
  const radius = 110
  const strokeWidth = 10
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - phaseProgress)

  // Enter animation
  const titleEnter = easeOutCubic(Math.min(1, enterProgress / 0.4))
  const timerEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.6)))
  const roundEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.5)))

  // Timer pulse on phase change
  const isHolding = progress >= 0.15 && progress < 0.8
  const pulse = isHolding && displayTime <= 3 ? 1 + Math.sin(holdProgress * Math.PI * 30) * 0.04 : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Colored glow behind timer */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '60%',
          height: '60%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${activeColor}18, transparent 70%)`,
          transition: 'background 0.3s',
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
          padding: '6%',
          opacity: exitOpacity,
        }}
      >
        {/* Phase label */}
        <div
          style={{
            fontSize: 'clamp(18px, 4vw, 36px)',
            fontWeight: 900,
            color: activeColor,
            letterSpacing: '0.2em',
            marginBottom: 'clamp(16px, 3vw, 32px)',
            opacity: titleEnter,
            transform: `translateY(${(1 - titleEnter) * -20}px)`,
          }}
        >
          {phaseLabel}
        </div>

        {/* Timer ring */}
        <div
          style={{
            position: 'relative',
            width: 'clamp(180px, 40vw, 320px)',
            height: 'clamp(180px, 40vw, 320px)',
            opacity: timerEnter,
            transform: `scale(${timerEnter * pulse})`,
          }}
        >
          <svg
            viewBox={`0 0 ${(radius + strokeWidth) * 2} ${(radius + strokeWidth) * 2}`}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Track */}
            <circle
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              fill="none"
              stroke={`${textColor}15`}
              strokeWidth={strokeWidth}
            />
            {/* Progress arc */}
            <circle
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              fill="none"
              stroke={activeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${radius + strokeWidth} ${radius + strokeWidth})`}
              style={{ filter: `drop-shadow(0 0 8px ${activeColor}80)` }}
            />
          </svg>

          {/* Countdown number */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 'clamp(48px, 12vw, 96px)',
                fontWeight: 900,
                color: textColor,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}
            >
              {displayTime}
            </div>
            <div
              style={{
                fontSize: 'clamp(10px, 1.8vw, 16px)',
                fontWeight: 600,
                color: `${textColor}66`,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginTop: '4px',
              }}
            >
              seconds
            </div>
          </div>
        </div>

        {/* Round counter */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1vw, 12px)',
            marginTop: 'clamp(20px, 4vw, 40px)',
            opacity: roundEnter,
            transform: `translateY(${(1 - roundEnter) * 15}px)`,
          }}
        >
          <span
            style={{
              fontSize: 'clamp(12px, 2vw, 18px)',
              fontWeight: 600,
              color: `${textColor}88`,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Round
          </span>
          <span
            style={{
              fontSize: 'clamp(20px, 4vw, 32px)',
              fontWeight: 900,
              color: textColor,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {currentRound}
          </span>
          <span
            style={{
              fontSize: 'clamp(14px, 2.5vw, 22px)',
              fontWeight: 600,
              color: `${textColor}44`,
            }}
          >
            / {totalRounds}
          </span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-workout-timer',
  title: 'Workout Timer',
  description: 'HIIT/Tabata countdown timer with work/rest phases, color-coded ring, and round counter',
  tags: ['scene', 'fitness', 'timer', 'HIIT', 'tabata', 'workout', 'health'],
  category: 'scene-layout',
  component: SceneWorkoutTimerComponent as any,
  defaultConfig: {
    workSeconds: 40,
    restSeconds: 20,
    totalRounds: 8,
    workColor: '#22c55e',
    restColor: '#ef4444',
    bgColor: '#0a0a0a',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'workSeconds', label: 'Work (seconds)', type: 'number', defaultValue: 40, min: 5, max: 300, group: 'Content' },
    { key: 'restSeconds', label: 'Rest (seconds)', type: 'number', defaultValue: 20, min: 5, max: 300, group: 'Content' },
    { key: 'totalRounds', label: 'Total Rounds', type: 'number', defaultValue: 8, min: 1, max: 20, group: 'Content' },
    { key: 'workColor', label: 'Work Color', type: 'color', defaultValue: '#22c55e', group: 'Style' },
    { key: 'restColor', label: 'Rest Color', type: 'color', defaultValue: '#ef4444', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
