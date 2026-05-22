import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface QuizTimerConfig {
  duration: number
  questionNumber: number
  clockColor: string
  handColor: string
  bgColor: string
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
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneQuizTimerComponent({
  config,
  progress,
  frame,
  width,
  height,
}: MotionGraphicProps<QuizTimerConfig>) {
  const { duration, questionNumber, clockColor, handColor, bgColor } = config

  const enterProgress = progress < 0.12 ? progress / 0.12 : 1
  const exitProgress = progress >= 0.88 ? (progress - 0.88) / 0.12 : 0
  const holdProgress = progress >= 0.12 && progress < 0.88 ? (progress - 0.12) / 0.76 : progress >= 0.88 ? 1 : 0

  // Reserve last 18% for TIME'S UP
  const buzzerPhase = 0.82
  const isTimesUp = holdProgress >= buzzerPhase
  const sweepProgress = Math.min(1, holdProgress / buzzerPhase)
  const remaining = isTimesUp ? 0 : Math.max(0, Math.ceil(duration * (1 - sweepProgress)))

  const radius = Math.min(width, height) * 0.3
  const center = radius + 20

  // Enter: scale bounce
  const enterScale = easeOutBack(enterProgress)
  const enterOpacity = easeOutCubic(enterProgress)

  // Exit: fade
  const exitEased = easeOutCubic(exitProgress)
  const fadeOut = 1 - exitEased

  // Hand angle: full sweep (360 degrees)
  const handAngle = sweepProgress * 360

  // Tick marks and numbers
  const tickMarks = []
  const numbers = []
  const totalTicks = 60
  const numCount = 12

  for (let i = 0; i < totalTicks; i++) {
    const angle = (i / totalTicks) * 360 - 90
    const rad = (angle * Math.PI) / 180
    const isMajor = i % 5 === 0
    const innerR = isMajor ? radius * 0.82 : radius * 0.88
    const outerR = radius * 0.94
    const tickWidth = isMajor ? 2.5 : 1

    // Highlight ticks the hand has passed
    const tickProgress = i / totalTicks
    const isPassed = tickProgress <= sweepProgress
    const tickColor = isPassed && !isTimesUp ? handColor : `${clockColor}60`

    tickMarks.push(
      <line
        key={`tick-${i}`}
        x1={center + Math.cos(rad) * innerR}
        y1={center + Math.sin(rad) * innerR}
        x2={center + Math.cos(rad) * outerR}
        y2={center + Math.sin(rad) * outerR}
        stroke={tickColor}
        strokeWidth={tickWidth}
        strokeLinecap="round"
      />,
    )
  }

  for (let i = 1; i <= numCount; i++) {
    const angle = (i / numCount) * 360 - 90
    const rad = (angle * Math.PI) / 180
    const numR = radius * 0.72
    const x = center + Math.cos(rad) * numR
    const y = center + Math.sin(rad) * numR

    const numProgress = i / numCount
    const isPassed = numProgress <= sweepProgress
    const numColor = isPassed && !isTimesUp ? handColor : clockColor

    numbers.push(
      <text
        key={`num-${i}`}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={radius * 0.12}
        fontWeight={700}
        fontFamily="'Helvetica Neue', Arial, sans-serif"
        fill={numColor}
        opacity={isPassed ? 1 : 0.5}
      >
        {i * 5 <= 60 ? i * 5 : i * 5 - 60}
      </text>,
    )
  }

  // Sweeping hand
  const handRad = ((handAngle - 90) * Math.PI) / 180
  const handLength = radius * 0.6
  const handX = center + Math.cos(handRad) * handLength
  const handY = center + Math.sin(handRad) * handLength

  // Buzzer state
  const buzzerProg = isTimesUp ? (holdProgress - buzzerPhase) / (1 - buzzerPhase) : 0
  const buzzerFlash = isTimesUp ? Math.sin(frame * 0.5) * 0.5 + 0.5 : 0
  const buzzerScale = isTimesUp ? elasticOut(Math.min(1, buzzerProg * 2)) : 0
  const buzzerOpacity = isTimesUp ? easeOutCubic(Math.min(1, buzzerProg * 3)) : 0

  const svgSize = (radius + 20) * 2

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
      }}
    >
      {/* Red flash at buzzer */}
      {isTimesUp && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#FF0000',
            opacity: buzzerFlash * 0.1,
          }}
        />
      )}

      <div
        style={{
          transform: `scale(${enterScale * (1 - exitEased * 0.3)})`,
          opacity: enterOpacity * fadeOut,
        }}
      >
        <svg width={svgSize} height={svgSize}>
          {/* Clock face */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={clockColor}
            strokeWidth={3}
            opacity={0.3}
          />
          <circle
            cx={center}
            cy={center}
            r={radius * 0.98}
            fill="none"
            stroke={clockColor}
            strokeWidth={1}
            opacity={0.15}
          />

          {/* Swept area fill */}
          {!isTimesUp && sweepProgress > 0 && (
            <path
              d={describeArc(center, center, radius * 0.94, -90, -90 + handAngle)}
              fill={`${handColor}15`}
              stroke="none"
            />
          )}

          {/* Tick marks */}
          {tickMarks}

          {/* Numbers */}
          {numbers}

          {/* Center dot */}
          <circle
            cx={center}
            cy={center}
            r={radius * 0.04}
            fill={isTimesUp ? '#FF0000' : handColor}
          />

          {/* Second hand */}
          {!isTimesUp && (
            <line
              x1={center}
              y1={center}
              x2={handX}
              y2={handY}
              stroke={handColor}
              strokeWidth={3}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 4px ${handColor}80)` }}
            />
          )}

          {/* Question number in center */}
          <text
            x={center}
            y={center + radius * 0.25}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={radius * 0.15}
            fontWeight={700}
            fontFamily="'Helvetica Neue', Arial, sans-serif"
            fill={clockColor}
            opacity={0.6}
          >
            Q{questionNumber}
          </text>
        </svg>
      </div>

      {/* Remaining seconds */}
      {!isTimesUp && (
        <div
          style={{
            marginTop: 'clamp(8px, 2vw, 20px)',
            fontSize: 'clamp(14px, 2.5vw, 24px)',
            fontWeight: 700,
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            color: remaining <= 5 ? '#FF4444' : clockColor,
            opacity: enterOpacity * fadeOut,
            letterSpacing: 3,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {remaining}s remaining
        </div>
      )}

      {/* TIME'S UP */}
      {isTimesUp && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: `clamp(28px, 8vw, ${Math.min(width, height) * 0.12}px)`,
              fontWeight: 900,
              fontFamily: "'Arial Black', Impact, sans-serif",
              color: '#FF2222',
              transform: `scale(${buzzerScale})`,
              opacity: buzzerOpacity * fadeOut,
              textShadow: '0 0 30px rgba(255,0,0,0.5)',
              letterSpacing: 4,
            }}
          >
            TIME&apos;S UP!
          </div>
        </div>
      )}
    </div>
  )
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
  const startRad = (startAngle * Math.PI) / 180
  const endRad = (endAngle * Math.PI) / 180
  const startX = x + Math.cos(startRad) * radius
  const startY = y + Math.sin(startRad) * radius
  const endX = x + Math.cos(endRad) * radius
  const endY = y + Math.sin(endRad) * radius
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${x} ${y} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`
}

registerMotionGraphic({
  id: 'tpl-scene-quiz-timer',
  title: 'Quiz Timer',
  description:
    'Trivia show clock face with sweeping second hand, highlighted tick marks, and dramatic TIME\'S UP buzzer',
  tags: ['scene', 'countdown', 'timer', 'quiz', 'trivia', 'clock', 'gameshow'],
  category: 'scene-layout',
  component: SceneQuizTimerComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'duration', label: 'Duration (seconds)', type: 'number', defaultValue: 30, min: 5, max: 60, group: 'Content' },
    { key: 'questionNumber', label: 'Question Number', type: 'number', defaultValue: 1, min: 1, max: 100, group: 'Content' },
    { key: 'clockColor', label: 'Clock Color', type: 'color', defaultValue: '#E2E8F0', group: 'Style' },
    { key: 'handColor', label: 'Hand Color', type: 'color', defaultValue: '#3B82F6', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1E3A5F', group: 'Style' },
  ],
  defaultConfig: {
    duration: 30,
    questionNumber: 1,
    clockColor: '#E2E8F0',
    handColor: '#3B82F6',
    bgColor: '#1E3A5F',
  },
})
