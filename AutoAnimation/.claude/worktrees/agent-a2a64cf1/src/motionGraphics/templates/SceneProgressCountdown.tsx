import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ProgressCountdownConfig {
  label: string
  duration: number
  barColor: string
  trackColor: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
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

function SceneProgressCountdownComponent({
  config,
  progress,
  width,
}: MotionGraphicProps<ProgressCountdownConfig>) {
  const { label, duration, barColor, trackColor, bgColor, textColor } = config

  const enterProgress = progress < 0.12 ? progress / 0.12 : 1
  const exitProgress = progress >= 0.88 ? (progress - 0.88) / 0.12 : 0
  const holdProgress = progress >= 0.12 && progress < 0.88 ? (progress - 0.12) / 0.76 : progress >= 0.88 ? 1 : 0

  const remaining = Math.max(0, Math.ceil(duration * (1 - holdProgress)))
  const barFraction = 1 - holdProgress

  // Color shift: green -> yellow -> red
  let currentBarColor = barColor
  if (holdProgress < 0.5) {
    currentBarColor = lerpColor('#22C55E', '#EAB308', holdProgress * 2)
  } else {
    currentBarColor = lerpColor('#EAB308', '#EF4444', (holdProgress - 0.5) * 2)
  }

  // Enter animations
  const enterEased = easeOutCubic(enterProgress)
  const barSlideIn = enterEased
  const textFadeIn = easeOutQuart(Math.max(0, (enterProgress - 0.3) / 0.7))

  // Exit animations
  const exitEased = easeOutCubic(exitProgress)
  const barCollapse = 1 - exitEased
  const textFadeOut = 1 - exitEased

  // Pulse at low time
  const isLow = holdProgress > 0.8
  const pulseIntensity = isLow
    ? 0.5 + Math.sin((holdProgress - 0.8) / 0.2 * Math.PI * 10) * 0.5
    : 0

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const timeStr = duration >= 60
    ? `${minutes}:${String(seconds).padStart(2, '0')}`
    : `0:${String(remaining).padStart(2, '0')}`

  const barMaxWidth = Math.min(width * 0.7, 600)
  const barHeight = Math.max(16, Math.min(width * 0.04, 36))

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
      {/* Label */}
      <div
        style={{
          fontSize: 'clamp(14px, 2.5vw, 24px)',
          fontWeight: 700,
          color: textColor,
          letterSpacing: 4,
          textTransform: 'uppercase',
          opacity: textFadeIn * textFadeOut,
          transform: `translateY(${(1 - textFadeIn) * 20}px)`,
          marginBottom: 'clamp(12px, 2vw, 24px)',
        }}
      >
        {label}
      </div>

      {/* Bar container */}
      <div
        style={{
          width: barMaxWidth * barSlideIn * barCollapse,
          height: barHeight,
          borderRadius: barHeight,
          background: trackColor,
          overflow: 'hidden',
          position: 'relative',
          opacity: enterEased * (1 - exitEased),
        }}
      >
        {/* Fill bar */}
        <div
          style={{
            height: '100%',
            width: `${barFraction * 100}%`,
            background: `linear-gradient(90deg, ${currentBarColor}, ${currentBarColor}DD)`,
            borderRadius: barHeight,
            boxShadow: isLow
              ? `0 0 ${20 + pulseIntensity * 20}px ${currentBarColor}${Math.round(pulseIntensity * 100).toString(16).padStart(2, '0')}`
              : `0 0 12px ${currentBarColor}40`,
            position: 'relative',
            transition: 'box-shadow 0.1s',
          }}
        >
          {/* Shimmer */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '45%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.25), transparent)',
              borderRadius: `${barHeight}px ${barHeight}px 0 0`,
            }}
          />
        </div>
      </div>

      {/* Time remaining */}
      <div
        style={{
          fontSize: 'clamp(28px, 6vw, 64px)',
          fontWeight: 900,
          color: isLow ? currentBarColor : textColor,
          opacity: textFadeIn * textFadeOut,
          transform: `translateY(${(1 - textFadeIn) * 20}px) scale(${1 + pulseIntensity * 0.08})`,
          marginTop: 'clamp(12px, 2vw, 24px)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {timeStr}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-progress-countdown',
  title: 'Progress Bar Countdown',
  description:
    'Horizontal progress bar that depletes with time, shifting from green to red with pulsing urgency at low time',
  tags: ['scene', 'countdown', 'timer', 'progress', 'bar', 'horizontal'],
  category: 'scene-layout',
  component: SceneProgressCountdownComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Time Remaining', group: 'Content' },
    { key: 'duration', label: 'Duration (seconds)', type: 'number', defaultValue: 60, min: 5, max: 3600, group: 'Content' },
    { key: 'barColor', label: 'Bar Color', type: 'color', defaultValue: '#22C55E', group: 'Style' },
    { key: 'trackColor', label: 'Track Color', type: 'color', defaultValue: '#1E293B', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F172A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
  defaultConfig: {
    label: 'Time Remaining',
    duration: 60,
    barColor: '#22C55E',
    trackColor: '#1E293B',
    bgColor: '#0F172A',
    textColor: '#FFFFFF',
  },
})
