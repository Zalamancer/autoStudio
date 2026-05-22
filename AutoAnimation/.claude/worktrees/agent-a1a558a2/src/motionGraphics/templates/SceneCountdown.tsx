import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CountdownConfig {
  from: number
  label: string
  bgColor: string
  textColor: string
  accentColor: string
}

function SceneCountdownComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<CountdownConfig>) {
  const { from, label, bgColor, textColor, accentColor } = config
  const count = Math.max(1, Math.round(from))
  const framesPerNumber = durationInFrames / count
  const currentIndex = Math.min(Math.floor(frame / framesPerNumber), count - 1)
  const localProgress = (frame - currentIndex * framesPerNumber) / framesPerNumber
  const currentNumber = count - currentIndex

  const easeOutBack = (t: number): number => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  }
  const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)

  // Phases: enter (0-0.3), hold (0.3-0.7), exit (0.7-1)
  const enterEnd = 0.3
  const exitStart = 0.7
  let numberScale = 1
  let numberOpacity = 1

  if (localProgress < enterEnd) {
    const t = localProgress / enterEnd
    numberScale = easeOutBack(t)
    numberOpacity = easeOutCubic(t)
  } else if (localProgress > exitStart) {
    const t = (localProgress - exitStart) / (1 - exitStart)
    numberScale = 1 + t * 0.3
    numberOpacity = 1 - easeOutCubic(t)
  }

  // Ring progress
  const ringProgress = easeOutCubic(Math.min(localProgress / exitStart, 1))
  const ringRadius = 120
  const circumference = 2 * Math.PI * ringRadius
  const dashOffset = circumference * (1 - ringProgress)

  // Label
  const overallProgress = frame / durationInFrames
  const labelOpacity = Math.min(1, overallProgress * 4)

  // Background pulse
  const pulse = Math.sin(localProgress * Math.PI) * 0.03

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
        transform: `scale(${1 + pulse})`,
      }}
    >
      {/* Ring */}
      <svg
        width={ringRadius * 2 + 20}
        height={ringRadius * 2 + 20}
        style={{ position: 'absolute' }}
      >
        <circle
          cx={ringRadius + 10}
          cy={ringRadius + 10}
          r={ringRadius}
          fill="none"
          stroke={accentColor}
          strokeWidth={6}
          opacity={0.2}
        />
        <circle
          cx={ringRadius + 10}
          cy={ringRadius + 10}
          r={ringRadius}
          fill="none"
          stroke={accentColor}
          strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${ringRadius + 10} ${ringRadius + 10})`}
        />
      </svg>

      {/* Number */}
      <div
        style={{
          fontSize: 'clamp(80px, 20vw, 200px)',
          fontWeight: 900,
          fontFamily: "'Arial Black', Impact, sans-serif",
          color: textColor,
          transform: `scale(${numberScale})`,
          opacity: numberOpacity,
          textShadow: `0 0 40px ${accentColor}40`,
          lineHeight: 1,
        }}
      >
        {currentNumber}
      </div>

      {/* Label */}
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          fontSize: 'clamp(16px, 3vw, 32px)',
          fontWeight: 600,
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          color: textColor,
          opacity: labelOpacity,
          letterSpacing: 4,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-countdown',
  title: 'Scene Countdown',
  description:
    'Large numbers count down with bounce-in animation and a circular ring progress indicator',
  tags: ['scene', 'countdown', 'timer', 'numbers'],
  category: 'scene-layout',
  component: SceneCountdownComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'from', label: 'Count From', type: 'number', defaultValue: 5, min: 1, max: 60, group: 'Content' },
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'GET READY', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D0D0D', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FF3366', group: 'Style' },
  ],
  defaultConfig: {
    from: 5,
    label: 'GET READY',
    bgColor: '#0D0D0D',
    textColor: '#FFFFFF',
    accentColor: '#FF3366',
  },
})
