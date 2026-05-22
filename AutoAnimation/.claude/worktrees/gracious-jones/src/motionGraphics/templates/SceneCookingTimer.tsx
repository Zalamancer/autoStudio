import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CookingTimerConfig {
  dishName: string
  totalMinutes: number
  bgColor: string
  ringColor: string
  accentColor: string
  textColor: string
  doneText: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneCookingTimerComponent({ config, progress }: MotionGraphicProps<CookingTimerConfig>) {
  const { dishName, totalMinutes, bgColor, ringColor, accentColor, textColor, doneText } = config

  const enterProgress = progress < 0.15 ? progress / 0.15 : 1
  const holdProgress = progress >= 0.15 && progress < 0.82 ? (progress - 0.15) / 0.67 : progress >= 0.82 ? 1 : 0
  const exitProgress = progress >= 0.82 ? (progress - 0.82) / 0.18 : 0

  const exitEased = easeInCubic(exitProgress)

  // Timer appears with scale
  const timerEnter = elasticOut(Math.min(1, enterProgress / 0.6))

  // Label fades in
  const labelEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.4)))

  // During hold, timer counts down
  const remainingFraction = 1 - holdProgress
  const remainingSeconds = Math.max(0, Math.round(totalMinutes * 60 * remainingFraction))
  const displayMin = Math.floor(remainingSeconds / 60)
  const displaySec = remainingSeconds % 60

  // SVG ring progress
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const ringOffset = circumference * holdProgress

  // Color shifts at low time (below 20%)
  const isLowTime = remainingFraction < 0.2
  const urgentPulse = isLowTime ? 1 + Math.sin(holdProgress * Math.PI * 20) * 0.04 : 1

  // Ring color transitions to warning
  const currentRingColor = isLowTime ? '#E53E3E' : ringColor

  // Done state
  const isDone = holdProgress >= 1
  const doneScale = isDone ? elasticOut(Math.min(1, exitProgress / 0.3)) : 0

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Subtle radial background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 45%, ${accentColor}10 0%, transparent 60%)`,
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
          opacity: exitProgress > 0.5 ? 1 - easeInCubic((exitProgress - 0.5) / 0.5) : 1,
        }}
      >
        {/* Dish name */}
        <div
          style={{
            fontSize: 'clamp(14px, 2.5vw, 20px)',
            fontWeight: 700,
            color: `${textColor}99`,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: 'clamp(20px, 3vh, 36px)',
            opacity: labelEnter,
            transform: `translateY(${(1 - labelEnter) * 15}px)`,
          }}
        >
          {dishName}
        </div>

        {/* Timer ring */}
        <div
          style={{
            position: 'relative',
            width: 'clamp(180px, 40vw, 280px)',
            height: 'clamp(180px, 40vw, 280px)',
            transform: `scale(${timerEnter * urgentPulse})`,
          }}
        >
          <svg
            viewBox="0 0 200 200"
            style={{
              width: '100%',
              height: '100%',
              transform: 'rotate(-90deg)',
            }}
          >
            {/* Background ring */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={`${textColor}12`}
              strokeWidth="8"
            />
            {/* Progress ring */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={currentRingColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={ringOffset}
            />
          </svg>

          {/* Time display */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {!isDone ? (
              <>
                <div
                  style={{
                    fontSize: 'clamp(36px, 8vw, 60px)',
                    fontWeight: 900,
                    color: isLowTime ? '#E53E3E' : textColor,
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {String(displayMin).padStart(2, '0')}:{String(displaySec).padStart(2, '0')}
                </div>
                <div
                  style={{
                    fontSize: 'clamp(10px, 1.6vw, 14px)',
                    fontWeight: 600,
                    color: `${textColor}66`,
                    marginTop: 'clamp(4px, 0.6vh, 8px)',
                  }}
                >
                  {totalMinutes} min total
                </div>
              </>
            ) : (
              <div
                style={{
                  transform: `scale(${doneScale})`,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 'clamp(36px, 8vw, 56px)',
                    marginBottom: 4,
                  }}
                >
                  {'\u{1F373}'}
                </div>
                <div
                  style={{
                    fontSize: 'clamp(20px, 4.5vw, 34px)',
                    fontWeight: 900,
                    color: accentColor,
                  }}
                >
                  {doneText}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom status */}
        <div
          style={{
            marginTop: 'clamp(20px, 3vh, 36px)',
            fontSize: 'clamp(12px, 2vw, 17px)',
            fontWeight: 600,
            color: isLowTime && !isDone ? '#E53E3E' : `${textColor}66`,
            opacity: labelEnter,
          }}
        >
          {isDone ? 'Timer complete' : isLowTime ? 'Almost ready!' : 'Cooking in progress...'}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-cooking-timer',
  title: 'Cooking Timer',
  description: 'Kitchen timer with SVG ring countdown, time display, color shift at low time, and celebration on completion',
  tags: ['scene', 'food', 'cooking', 'timer', 'kitchen', 'countdown'],
  category: 'scene-layout',
  component: SceneCookingTimerComponent as any,
  defaultConfig: {
    dishName: 'Roasted Chicken',
    totalMinutes: 45,
    bgColor: '#FFF8F0',
    ringColor: '#E8751A',
    accentColor: '#D4652B',
    textColor: '#2D1810',
    doneText: 'DONE!',
  },
  configSchema: [
    { key: 'dishName', label: 'Dish Name', type: 'text', defaultValue: 'Roasted Chicken', group: 'Content' },
    { key: 'totalMinutes', label: 'Total Minutes', type: 'number', defaultValue: 45, min: 1, max: 999, group: 'Content' },
    { key: 'doneText', label: 'Done Text', type: 'text', defaultValue: 'DONE!', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF8F0', group: 'Style' },
    { key: 'ringColor', label: 'Ring Color', type: 'color', defaultValue: '#E8751A', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#D4652B', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2D1810', group: 'Style' },
  ],
})
