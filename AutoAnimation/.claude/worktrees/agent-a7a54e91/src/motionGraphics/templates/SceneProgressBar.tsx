import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ProgressBarConfig {
  label: string
  percentage: number
  bgColor: string
  barColor: string
  textColor: string
  style: 'bar' | 'circle' | 'semicircle'
}

function SceneProgressBarComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<ProgressBarConfig>) {
  const { label, percentage, bgColor, barColor, textColor, style } = config
  const progress = frame / durationInFrames

  const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4)
  const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)

  // Fill progress: 0.1-0.75
  const fillStart = 0.1
  const fillEnd = 0.75
  const fillProgress = easeOutQuart(
    Math.max(0, Math.min(1, (progress - fillStart) / (fillEnd - fillStart)))
  )
  const currentPercentage = Math.round(fillProgress * percentage)

  // Label: 0-0.15
  const labelProgress = easeOutCubic(Math.min(1, progress / 0.15))

  // Number: 0.05-0.2
  const numberProgress = easeOutCubic(
    Math.max(0, Math.min(1, (progress - 0.05) / 0.15))
  )

  if (style === 'circle') {
    const radius = 100
    const strokeWidth = 12
    const circumference = 2 * Math.PI * radius
    const dashOffset = circumference * (1 - (fillProgress * percentage) / 100)

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
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
        }}
      >
        <svg width={radius * 2 + strokeWidth * 2} height={radius * 2 + strokeWidth * 2}>
          {/* Background circle */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            fill="none"
            stroke={`${barColor}20`}
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            fill="none"
            stroke={barColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${radius + strokeWidth} ${radius + strokeWidth})`}
            style={{ filter: `drop-shadow(0 0 8px ${barColor}80)` }}
          />
        </svg>
        {/* Percentage text */}
        <div
          style={{
            position: 'absolute',
            fontSize: 'clamp(36px, 8vw, 72px)',
            fontWeight: 900,
            color: textColor,
            opacity: numberProgress,
          }}
        >
          {currentPercentage}%
        </div>
        {/* Label */}
        <div
          style={{
            marginTop: 24,
            fontSize: 'clamp(16px, 3vw, 28px)',
            fontWeight: 600,
            color: textColor,
            opacity: labelProgress,
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </div>
      </div>
    )
  }

  if (style === 'semicircle') {
    const radius = 110
    const strokeWidth = 14
    // Semicircle: only bottom half arc (180 degrees)
    const semiCircumference = Math.PI * radius
    const dashOffset = semiCircumference * (1 - (fillProgress * percentage) / 100)

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
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
        }}
      >
        <svg
          width={radius * 2 + strokeWidth * 2}
          height={radius + strokeWidth * 2 + 20}
          style={{ overflow: 'visible' }}
        >
          {/* Background arc */}
          <path
            d={`M ${strokeWidth} ${radius + strokeWidth} A ${radius} ${radius} 0 0 1 ${radius * 2 + strokeWidth} ${radius + strokeWidth}`}
            fill="none"
            stroke={`${barColor}20`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <path
            d={`M ${strokeWidth} ${radius + strokeWidth} A ${radius} ${radius} 0 0 1 ${radius * 2 + strokeWidth} ${radius + strokeWidth}`}
            fill="none"
            stroke={barColor}
            strokeWidth={strokeWidth}
            strokeDasharray={semiCircumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${barColor}80)` }}
          />
        </svg>
        {/* Percentage text centered in gauge */}
        <div
          style={{
            position: 'absolute',
            fontSize: 'clamp(40px, 9vw, 80px)',
            fontWeight: 900,
            color: textColor,
            opacity: numberProgress,
            marginTop: -20,
          }}
        >
          {currentPercentage}%
        </div>
        {/* Label */}
        <div
          style={{
            marginTop: 8,
            fontSize: 'clamp(16px, 3vw, 28px)',
            fontWeight: 600,
            color: textColor,
            opacity: labelProgress,
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </div>
      </div>
    )
  }

  // Default: bar style
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
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: '10%',
      }}
    >
      {/* Label */}
      <div
        style={{
          fontSize: 'clamp(18px, 3.5vw, 32px)',
          fontWeight: 700,
          color: textColor,
          opacity: labelProgress,
          marginBottom: 24,
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>

      {/* Bar container */}
      <div
        style={{
          width: '100%',
          maxWidth: 500,
          height: 'clamp(20px, 4vw, 40px)',
          borderRadius: 999,
          background: `${barColor}15`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Fill */}
        <div
          style={{
            height: '100%',
            width: `${fillProgress * percentage}%`,
            background: `linear-gradient(90deg, ${barColor}, ${barColor}CC)`,
            borderRadius: 999,
            boxShadow: `0 0 20px ${barColor}60`,
            position: 'relative',
          }}
        >
          {/* Shimmer effect */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.3), transparent)',
              borderRadius: '999px 999px 0 0',
            }}
          />
        </div>
      </div>

      {/* Percentage */}
      <div
        style={{
          fontSize: 'clamp(28px, 6vw, 56px)',
          fontWeight: 900,
          color: textColor,
          opacity: numberProgress,
          marginTop: 20,
        }}
      >
        {currentPercentage}%
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-progress-bar',
  title: 'Scene Progress Bar',
  description:
    'Animated progress indicator with bar, circle, or semicircle gauge styles and counting number',
  tags: ['scene', 'progress', 'gauge', 'stats', 'percentage'],
  category: 'scene-layout',
  component: SceneProgressBarComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'COMPLETION', group: 'Content' },
    { key: 'percentage', label: 'Percentage', type: 'number', defaultValue: 85, min: 0, max: 100, group: 'Content' },
    { key: 'style', label: 'Style', type: 'select', defaultValue: 'bar', options: ['bar', 'circle', 'semicircle'], group: 'Layout' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A1A', group: 'Style' },
    { key: 'barColor', label: 'Bar Color', type: 'color', defaultValue: '#10B981', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
  defaultConfig: {
    label: 'COMPLETION',
    percentage: 85,
    bgColor: '#0A0A1A',
    barColor: '#10B981',
    textColor: '#FFFFFF',
    style: 'bar' as const,
  },
})
