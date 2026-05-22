import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneStepCounterConfig {
  steps: number
  goal: number
  distance: string
  caloriesBurned: number
  bgColor: string
  textColor: string
  accentColor: string
  ringColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutQuart(t: number): number { return 1 - Math.pow(1 - t, 4) }

function formatSteps(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}

function SceneStepCounterComponent({ config, progress }: MotionGraphicProps<SceneStepCounterConfig>) {
  const { steps, goal, distance, caloriesBurned, bgColor, textColor, accentColor, ringColor } = config

  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.15 : 1

  // Counter counts up
  const counterEnter = easeOutQuart(Math.min(1, enterProgress / 0.8))
  const currentSteps = Math.round(steps * counterEnter)

  // Ring fills
  const ringEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.7)))
  const percent = Math.min(steps / goal, 1)

  const radius = 105
  const strokeWidth = 12
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - percent * ringEnter)

  // Stats row enters
  const statsEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.5)))

  // Hold pulse
  const isHolding = progress >= 0.3 && progress < 0.8
  const pulse = isHolding ? 1 + Math.sin(holdProgress * Math.PI * 6) * 0.02 : 1
  const glowSize = isHolding ? 8 + Math.sin(holdProgress * Math.PI * 6) * 4 : 8

  // Goal reached check
  const goalReached = steps >= goal

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

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
        {/* Progress ring */}
        <div
          style={{
            position: 'relative',
            width: 'clamp(200px, 44vw, 320px)',
            height: 'clamp(200px, 44vw, 320px)',
            transform: `scale(${pulse})`,
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
              stroke={`${ringColor}18`}
              strokeWidth={strokeWidth}
            />
            {/* Progress */}
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
              style={{ filter: `drop-shadow(0 0 ${glowSize}px ${ringColor}80)` }}
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
            {/* Step icon */}
            <div
              style={{
                fontSize: 'clamp(16px, 3vw, 28px)',
                marginBottom: '4px',
                opacity: counterEnter,
              }}
            >
              {goalReached && counterEnter >= 1 ? '\u2713' : '\u{1F6B6}'}
            </div>

            {/* Step count */}
            <div
              style={{
                fontSize: 'clamp(32px, 8vw, 64px)',
                fontWeight: 900,
                color: goalReached && counterEnter >= 1 ? accentColor : textColor,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}
            >
              {formatSteps(currentSteps)}
            </div>

            {/* Goal label */}
            <div
              style={{
                fontSize: 'clamp(10px, 1.6vw, 14px)',
                fontWeight: 600,
                color: `${textColor}55`,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginTop: '4px',
              }}
            >
              / {formatSteps(goal)} steps
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(24px, 6vw, 56px)',
            marginTop: 'clamp(20px, 4vw, 40px)',
            opacity: statsEnter,
            transform: `translateY(${(1 - statsEnter) * 15}px)`,
          }}
        >
          {/* Distance */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                fontSize: 'clamp(18px, 4vw, 32px)',
                fontWeight: 800,
                color: textColor,
              }}
            >
              {distance}
            </div>
            <div
              style={{
                fontSize: 'clamp(9px, 1.4vw, 12px)',
                fontWeight: 600,
                color: `${textColor}55`,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Distance
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              width: '1px',
              height: 'clamp(28px, 5vw, 44px)',
              background: `${textColor}20`,
            }}
          />

          {/* Calories */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                fontSize: 'clamp(18px, 4vw, 32px)',
                fontWeight: 800,
                color: textColor,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {Math.round(caloriesBurned * statsEnter)}
            </div>
            <div
              style={{
                fontSize: 'clamp(9px, 1.4vw, 12px)',
                fontWeight: 600,
                color: `${textColor}55`,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Calories
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-step-counter',
  title: 'Step Counter',
  description: 'Fitness watch style step counter with counting animation, goal progress ring, distance, and calories',
  tags: ['scene', 'fitness', 'steps', 'walking', 'health', 'tracker', 'data'],
  category: 'scene-layout',
  component: SceneStepCounterComponent as any,
  defaultConfig: {
    steps: 8742,
    goal: 10000,
    distance: '5.2 km',
    caloriesBurned: 324,
    bgColor: '#0a0a0f',
    textColor: '#ffffff',
    accentColor: '#22c55e',
    ringColor: '#22c55e',
  },
  configSchema: [
    { key: 'steps', label: 'Steps', type: 'number', defaultValue: 8742, min: 0, max: 99999, group: 'Content' },
    { key: 'goal', label: 'Goal', type: 'number', defaultValue: 10000, min: 1000, max: 99999, group: 'Content' },
    { key: 'distance', label: 'Distance', type: 'text', defaultValue: '5.2 km', group: 'Content' },
    { key: 'caloriesBurned', label: 'Calories Burned', type: 'number', defaultValue: 324, min: 0, max: 9999, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0f', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#22c55e', group: 'Style' },
    { key: 'ringColor', label: 'Ring Color', type: 'color', defaultValue: '#22c55e', group: 'Style' },
  ],
})
