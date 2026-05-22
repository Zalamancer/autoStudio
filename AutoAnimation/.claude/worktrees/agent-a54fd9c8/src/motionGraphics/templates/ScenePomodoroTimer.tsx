import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PomodoroConfig {
  workMinutes: number
  breakMinutes: number
  workColor: string
  breakColor: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin(((t - 0.075) * (2 * Math.PI)) / 0.3) + 1
}

function ScenePomodoroTimerComponent({ config, progress, width, height }: MotionGraphicProps<PomodoroConfig>) {
  const { workMinutes, breakMinutes, workColor, breakColor, bgColor, textColor } = config

  const enterProgress = progress < 0.1 ? progress / 0.1 : 1
  const exitProgress = progress >= 0.88 ? (progress - 0.88) / 0.12 : 0
  const holdProgress = progress >= 0.1 && progress < 0.88 ? (progress - 0.1) / 0.78 : progress >= 0.88 ? 1 : 0

  const totalMinutes = workMinutes + breakMinutes
  const workFraction = workMinutes / totalMinutes
  const breakFraction = breakMinutes / totalMinutes

  // Reserve last 15% of hold for "Session Complete"
  const completePhase = 0.85
  const isComplete = holdProgress >= completePhase
  const timerProgress = Math.min(1, holdProgress / completePhase)

  const isWorkPhase = timerProgress <= workFraction
  const phaseProgress = isWorkPhase ? timerProgress / workFraction : (timerProgress - workFraction) / breakFraction

  // Current time remaining in this phase
  const phaseMinutes = isWorkPhase ? workMinutes : breakMinutes
  const totalSecondsInPhase = phaseMinutes * 60
  const remainingSeconds = isComplete ? 0 : Math.max(0, Math.ceil(totalSecondsInPhase * (1 - phaseProgress)))
  const mins = Math.floor(remainingSeconds / 60)
  const secs = remainingSeconds % 60
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  // Phase transition color
  const currentColor = isComplete ? '#22C55E' : isWorkPhase ? workColor : breakColor
  const phaseLabel = isComplete ? 'Session Complete' : isWorkPhase ? 'FOCUS TIME' : 'BREAK TIME'

  // Ring
  const ringFraction = isComplete ? 0 : 1 - phaseProgress
  const radius = Math.min(width, height) * 0.28
  const strokeWidth = radius * 0.08
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - ringFraction)

  // Enter
  const enterEased = easeOutCubic(enterProgress)
  const enterScale = easeOutBack(enterProgress)
  const textFade = easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7))

  // Circle draw-in on enter
  const drawIn = enterProgress < 1 ? circumference * (1 - enterEased) : dashOffset

  // Exit
  const exitEased = easeOutCubic(exitProgress)
  const fadeOut = 1 - exitEased

  // Complete state
  const completeProg = isComplete ? (holdProgress - completePhase) / (1 - completePhase) : 0
  const completeScale = isComplete ? elasticOut(Math.min(1, completeProg * 2)) : 1
  const completeOpacity = isComplete ? easeOutCubic(Math.min(1, completeProg * 2)) : 1

  // Phase transition flash
  const transitionFlash =
    !isWorkPhase && timerProgress - workFraction < 0.05 ? 1 - (timerProgress - workFraction) / 0.05 : 0

  const svgSize = (radius + strokeWidth) * 2 + 30
  const svgCenter = svgSize / 2

  // Tomato leaf decorations (subtle nod to pomodoro)
  const leafSize = radius * 0.15

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* Phase transition flash */}
      {transitionFlash > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: breakColor,
            opacity: transitionFlash * 0.15,
          }}
        />
      )}

      <div
        style={{
          position: 'relative',
          transform: `scale(${enterScale * (1 - exitEased * 0.2) * completeScale})`,
          opacity: enterEased * fadeOut,
        }}
      >
        <svg width={svgSize} height={svgSize}>
          {/* Track */}
          <circle
            cx={svgCenter}
            cy={svgCenter}
            r={radius}
            fill="none"
            stroke={`${currentColor}18`}
            strokeWidth={strokeWidth}
          />
          {/* Active ring */}
          <circle
            cx={svgCenter}
            cy={svgCenter}
            r={radius}
            fill="none"
            stroke={currentColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={enterProgress < 1 ? drawIn : dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${svgCenter} ${svgCenter})`}
            style={{ filter: `drop-shadow(0 0 ${strokeWidth * 0.8}px ${currentColor}50)` }}
          />
          {/* Tomato leaf at top */}
          <ellipse
            cx={svgCenter - leafSize * 0.6}
            cy={svgCenter - radius - strokeWidth * 0.5 - leafSize * 0.3}
            rx={leafSize}
            ry={leafSize * 0.4}
            fill={isWorkPhase ? '#22C55E' : '#4ADE80'}
            opacity={0.6}
            transform={`rotate(-30 ${svgCenter - leafSize * 0.6} ${svgCenter - radius - strokeWidth * 0.5 - leafSize * 0.3})`}
          />
          <ellipse
            cx={svgCenter + leafSize * 0.6}
            cy={svgCenter - radius - strokeWidth * 0.5 - leafSize * 0.3}
            rx={leafSize}
            ry={leafSize * 0.4}
            fill={isWorkPhase ? '#22C55E' : '#4ADE80'}
            opacity={0.6}
            transform={`rotate(30 ${svgCenter + leafSize * 0.6} ${svgCenter - radius - strokeWidth * 0.5 - leafSize * 0.3})`}
          />
        </svg>

        {/* Center content */}
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
          {/* Time */}
          {!isComplete && (
            <div
              style={{
                fontSize: `clamp(28px, ${radius * 0.5}px, 72px)`,
                fontWeight: 900,
                color: textColor,
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
                opacity: textFade * completeOpacity,
              }}
            >
              {timeStr}
            </div>
          )}

          {/* Checkmark for complete */}
          {isComplete && (
            <div
              style={{
                fontSize: `clamp(32px, ${radius * 0.5}px, 72px)`,
                color: '#22C55E',
                lineHeight: 1,
                opacity: completeOpacity,
              }}
            >
              &#10003;
            </div>
          )}
        </div>
      </div>

      {/* Phase label */}
      <div
        style={{
          marginTop: 'clamp(12px, 3vw, 28px)',
          fontSize: 'clamp(14px, 2.5vw, 24px)',
          fontWeight: 700,
          color: currentColor,
          letterSpacing: 4,
          textTransform: 'uppercase',
          opacity: textFade * fadeOut * completeOpacity,
          transform: `translateY(${(1 - textFade) * 15}px)`,
        }}
      >
        {phaseLabel}
      </div>

      {/* Session info */}
      <div
        style={{
          marginTop: 'clamp(4px, 1vw, 10px)',
          fontSize: 'clamp(10px, 1.5vw, 14px)',
          fontWeight: 500,
          color: `${textColor}60`,
          opacity: textFade * fadeOut,
          letterSpacing: 2,
        }}
      >
        {workMinutes}min work / {breakMinutes}min break
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-pomodoro-timer',
  title: 'Pomodoro Timer',
  description:
    'Pomodoro-style work/break circular timer with tomato leaf accents, phase transitions, and session complete state',
  tags: ['scene', 'countdown', 'timer', 'pomodoro', 'focus', 'productivity', 'work'],
  category: 'scene-layout',
  component: ScenePomodoroTimerComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'workMinutes', label: 'Work Minutes', type: 'number', defaultValue: 25, min: 1, max: 90, group: 'Content' },
    { key: 'breakMinutes', label: 'Break Minutes', type: 'number', defaultValue: 5, min: 1, max: 30, group: 'Content' },
    { key: 'workColor', label: 'Work Color', type: 'color', defaultValue: '#EF4444', group: 'Style' },
    { key: 'breakColor', label: 'Break Color', type: 'color', defaultValue: '#22C55E', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
  defaultConfig: {
    workMinutes: 25,
    breakMinutes: 5,
    workColor: '#EF4444',
    breakColor: '#22C55E',
    bgColor: '#1A1A2E',
    textColor: '#FFFFFF',
  },
})
