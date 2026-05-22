import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneProgressRingConfig {
  percentage: number
  label: string
  ringColor: string
  trackColor: string
  bgColor: string
  size: number
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneProgressRingComponent({ config, progress }: MotionGraphicProps<SceneProgressRingConfig>) {
  const { percentage, label, ringColor, trackColor, bgColor, size } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const ringEased = easeOutCubic(enterProgress)
  const currentPercent = percentage * ringEased
  const displayPercent = Math.round(currentPercent)

  // Ring SVG values
  const radius = 100
  const strokeWidth = 14
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - currentPercent / 100)

  // Hold: glow pulse
  const isHolding = progress >= 0.25 && progress < 0.8
  const glowIntensity = isHolding ? 8 + Math.sin(holdProgress * Math.PI * 6) * 6 : 8
  const glowOpacity = isHolding ? 0.5 + Math.sin(holdProgress * Math.PI * 6) * 0.3 : 0.5

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.25 : 1

  // Label
  const labelDelay = 0.4
  const labelEnter = enterProgress < 1 ? easeOutCubic(Math.max(0, (enterProgress - labelDelay) / (1 - labelDelay))) : 1

  const svgSize = `clamp(140px, ${size}vw, 300px)`

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Ring */}
        <div style={{ position: 'relative', width: svgSize, height: svgSize }}>
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
              stroke={trackColor}
              strokeWidth={strokeWidth}
              opacity={0.3}
            />
            {/* Progress arc */}
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
              style={{ filter: `drop-shadow(0 0 ${glowIntensity}px ${ringColor}${Math.round(glowOpacity * 255).toString(16).padStart(2, '0')})` }}
            />
          </svg>

          {/* Percentage number */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(28px, 7vw, 64px)',
              fontWeight: 900,
              color: '#FFFFFF',
              opacity: easeOutCubic(enterProgress),
            }}
          >
            {displayPercent}<span style={{ fontSize: '0.5em', opacity: 0.7 }}>%</span>
          </div>
        </div>

        {/* Label */}
        {label && (
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(12px, 2.2vw, 24px)',
              fontWeight: 600,
              color: '#e2e8f0',
              opacity: labelEnter * 0.85,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginTop: 'clamp(10px, 2vw, 24px)',
              transform: `translateY(${8 * (1 - labelEnter)}px)`,
            }}
          >
            {label}
          </div>
        )}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-progress-ring',
  title: 'Progress Ring',
  description: 'Circular progress ring with animated fill, counting percentage, glow pulse, and label',
  tags: ['scene', 'data', 'progress', 'ring', 'circular', 'percentage'],
  category: 'scene-layout',
  component: SceneProgressRingComponent as any,
  defaultConfig: {
    percentage: 78,
    label: 'Completed',
    ringColor: '#3b82f6',
    trackColor: '#334155',
    bgColor: '#0f172a',
    size: 30,
  },
  configSchema: [
    { key: 'percentage', label: 'Percentage', type: 'number', defaultValue: 78, min: 0, max: 100, group: 'Content' },
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Completed', group: 'Content' },
    { key: 'ringColor', label: 'Ring Color', type: 'color', defaultValue: '#3b82f6', group: 'Style' },
    { key: 'trackColor', label: 'Track Color', type: 'color', defaultValue: '#334155', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'size', label: 'Ring Size (vw)', type: 'number', defaultValue: 30, min: 15, max: 50, group: 'Layout' },
  ],
})
