import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CircularTimerConfig {
  duration: number
  ringColor: string
  trackColor: string
  bgColor: string
  textColor: string
  size: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function lerpColor(color1: string, color2: string, t: number): string {
  const r1 = parseInt(color1.slice(1, 3), 16)
  const g1 = parseInt(color1.slice(3, 5), 16)
  const b1 = parseInt(color1.slice(5, 7), 16)
  const r2 = parseInt(color2.slice(1, 3), 16)
  const g2 = parseInt(color2.slice(3, 5), 16)
  const b2 = parseInt(color2.slice(5, 7), 16)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r},${g},${b})`
}

function SceneCircularTimerComponent({ config, progress, width, height }: MotionGraphicProps<CircularTimerConfig>) {
  const { duration, ringColor, trackColor, bgColor, textColor, size } = config

  const enterProgress = progress < 0.12 ? progress / 0.12 : 1
  const exitProgress = progress >= 0.88 ? (progress - 0.88) / 0.12 : 0
  const holdProgress = progress >= 0.12 && progress < 0.88 ? (progress - 0.12) / 0.76 : progress >= 0.88 ? 1 : 0

  const remaining = Math.max(0, Math.ceil(duration * (1 - holdProgress)))
  const ringFraction = 1 - holdProgress

  // Color transition: green -> yellow -> red
  let currentColor = ringColor
  if (holdProgress < 0.5) {
    currentColor = lerpColor('#22C55E', '#EAB308', holdProgress * 2)
  } else {
    currentColor = lerpColor('#EAB308', '#EF4444', (holdProgress - 0.5) * 2)
  }

  const radius = Math.min(width, height) * (size / 100) * 0.35
  const strokeWidth = radius * 0.1
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - ringFraction)

  // Enter: ring draws in, number scales
  const enterEased = easeOutCubic(enterProgress)
  const ringDrawIn = enterEased
  const numberScale = enterEased
  const numberOpacity = enterEased

  // Exit: fade out
  const exitEased = easeOutCubic(exitProgress)
  const fadeOut = 1 - exitEased
  const scaleOut = 1 - exitEased * 0.3

  // Pulse at low time (last 20%)
  const pulse = holdProgress > 0.8 ? Math.sin(((holdProgress - 0.8) / 0.2) * Math.PI * 8) * 0.05 : 0

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const timeStr = duration >= 60 ? `${minutes}:${String(seconds).padStart(2, '0')}` : String(remaining)

  const svgSize = (radius + strokeWidth) * 2 + 20
  const center = svgSize / 2

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
      <div
        style={{
          position: 'relative',
          width: svgSize,
          height: svgSize,
          transform: `scale(${numberScale * scaleOut + pulse})`,
          opacity: numberOpacity * fadeOut,
        }}
      >
        <svg width={svgSize} height={svgSize}>
          {/* Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
            opacity={0.25}
          />
          {/* Active ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={currentColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={enterProgress < 1 ? circumference * (1 - ringDrawIn) : dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
            style={{ filter: `drop-shadow(0 0 ${strokeWidth}px ${currentColor}60)` }}
          />
        </svg>

        {/* Number */}
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
          <div
            style={{
              fontSize: `clamp(32px, ${radius * 0.7}px, 120px)`,
              fontWeight: 900,
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              color: holdProgress > 0.8 ? currentColor : textColor,
              lineHeight: 1,
              transition: 'color 0.3s',
            }}
          >
            {timeStr}
          </div>
          {duration >= 60 && (
            <div
              style={{
                fontSize: `clamp(10px, ${radius * 0.12}px, 18px)`,
                fontWeight: 600,
                color: textColor,
                opacity: 0.5,
                letterSpacing: 3,
                textTransform: 'uppercase',
                marginTop: radius * 0.06,
              }}
            >
              remaining
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-circular-timer',
  title: 'Circular Timer',
  description:
    'Circular countdown ring that depletes with green-to-red color transition and large centered timer display',
  tags: ['scene', 'countdown', 'timer', 'circular', 'ring', 'svg'],
  category: 'scene-layout',
  component: SceneCircularTimerComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    {
      key: 'duration',
      label: 'Duration (seconds)',
      type: 'number',
      defaultValue: 30,
      min: 5,
      max: 3600,
      group: 'Content',
    },
    { key: 'size', label: 'Size (%)', type: 'number', defaultValue: 70, min: 30, max: 100, group: 'Layout' },
    { key: 'ringColor', label: 'Ring Color', type: 'color', defaultValue: '#3B82F6', group: 'Style' },
    { key: 'trackColor', label: 'Track Color', type: 'color', defaultValue: '#374151', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F172A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
  defaultConfig: {
    duration: 30,
    ringColor: '#3B82F6',
    trackColor: '#374151',
    bgColor: '#0F172A',
    textColor: '#FFFFFF',
    size: 70,
  },
})
