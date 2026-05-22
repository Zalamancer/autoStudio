import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneProgressTransformConfig {
  startLabel: string
  endLabel: string
  startWeight: string
  endWeight: string
  startMeasurement: string
  endMeasurement: string
  motivationalText: string
  bgColor: string
  textColor: string
  accentColor: string
  arrowColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function parseNumeric(s: string): number {
  const match = s.match(/([\d.]+)/)
  return match ? parseFloat(match[1]) : 0
}

function SceneProgressTransformComponent({ config, progress }: MotionGraphicProps<SceneProgressTransformConfig>) {
  const { startLabel, endLabel, startWeight, endWeight, startMeasurement, endMeasurement, motivationalText, bgColor, textColor, accentColor, arrowColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Left (start) enters
  const leftEnter = easeOutCubic(Math.min(1, enterProgress / 0.4))
  // Arrow enters
  const arrowEnter = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.4)))
  // Right (end) enters
  const rightEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.5)))
  // Motivational text
  const motiveEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.3)))

  // Animate weight numbers
  const startNum = parseNumeric(startWeight)
  const endNum = parseNumeric(endWeight)
  const weightSuffix = startWeight.replace(/[\d.]+/, '').trim() || 'lbs'
  const animatedWeight = rightEnter >= 1
    ? endNum
    : startNum + (endNum - startNum) * easeOutCubic(rightEnter)

  // Hold pulse on end stats
  const isHolding = progress >= 0.25 && progress < 0.8
  const endPulse = isHolding ? 1 + Math.sin(holdProgress * Math.PI * 4) * 0.03 : 1

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
          padding: '6% 5%',
          opacity: exitOpacity,
        }}
      >
        {/* Before / After row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(16px, 4vw, 48px)',
            width: '100%',
            maxWidth: '700px',
          }}
        >
          {/* Start column */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              opacity: leftEnter,
              transform: `translateX(${(1 - leftEnter) * -40}px)`,
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: 'clamp(11px, 1.8vw, 16px)',
                fontWeight: 700,
                color: `${textColor}88`,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: 'clamp(6px, 1vw, 12px)',
              }}
            >
              {startLabel}
            </div>
            <div
              style={{
                fontSize: 'clamp(28px, 7vw, 56px)',
                fontWeight: 900,
                color: `${textColor}cc`,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1.1,
              }}
            >
              {startWeight}
            </div>
            <div
              style={{
                fontSize: 'clamp(11px, 1.8vw, 15px)',
                fontWeight: 500,
                color: `${textColor}66`,
                marginTop: '4px',
              }}
            >
              {startMeasurement}
            </div>
          </div>

          {/* Arrow */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              opacity: arrowEnter,
              transform: `scale(${arrowEnter})`,
            }}
          >
            <svg width="clamp(40px, 8vw, 72px)" height="clamp(24px, 4vw, 40px)" viewBox="0 0 72 40" fill="none">
              <path
                d="M4 20h56M48 8l16 12-16 12"
                stroke={arrowColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="200"
                strokeDashoffset={200 * (1 - arrowEnter)}
              />
            </svg>
          </div>

          {/* End column */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              opacity: rightEnter,
              transform: `translateX(${(1 - rightEnter) * 40}px) scale(${endPulse})`,
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: 'clamp(11px, 1.8vw, 16px)',
                fontWeight: 700,
                color: accentColor,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: 'clamp(6px, 1vw, 12px)',
              }}
            >
              {endLabel}
            </div>
            <div
              style={{
                fontSize: 'clamp(28px, 7vw, 56px)',
                fontWeight: 900,
                color: accentColor,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1.1,
                textShadow: `0 0 20px ${accentColor}40`,
              }}
            >
              {Math.round(animatedWeight)}{weightSuffix ? ` ${weightSuffix}` : ''}
            </div>
            <div
              style={{
                fontSize: 'clamp(11px, 1.8vw, 15px)',
                fontWeight: 500,
                color: `${accentColor}aa`,
                marginTop: '4px',
              }}
            >
              {endMeasurement}
            </div>
          </div>
        </div>

        {/* Motivational text */}
        <div
          style={{
            marginTop: 'clamp(24px, 5vw, 48px)',
            fontSize: 'clamp(13px, 2.2vw, 20px)',
            fontWeight: 700,
            color: textColor,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            opacity: motiveEnter,
            transform: `translateY(${(1 - motiveEnter) * 15}px)`,
          }}
        >
          {motivationalText}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-progress-transform',
  title: 'Progress Transform',
  description: 'Before/after transformation with animated weight stats, progress arrow, and motivational text',
  tags: ['scene', 'fitness', 'transformation', 'progress', 'before-after', 'health', 'motivation'],
  category: 'scene-layout',
  component: SceneProgressTransformComponent as any,
  defaultConfig: {
    startLabel: 'Day 1',
    endLabel: 'Day 90',
    startWeight: '210 lbs',
    endWeight: '175 lbs',
    startMeasurement: '32% body fat',
    endMeasurement: '18% body fat',
    motivationalText: 'CONSISTENCY WINS',
    bgColor: '#0f0f0f',
    textColor: '#ffffff',
    accentColor: '#22c55e',
    arrowColor: '#6366f1',
  },
  configSchema: [
    { key: 'startLabel', label: 'Start Label', type: 'text', defaultValue: 'Day 1', group: 'Content' },
    { key: 'endLabel', label: 'End Label', type: 'text', defaultValue: 'Day 90', group: 'Content' },
    { key: 'startWeight', label: 'Start Value', type: 'text', defaultValue: '210 lbs', group: 'Content' },
    { key: 'endWeight', label: 'End Value', type: 'text', defaultValue: '175 lbs', group: 'Content' },
    { key: 'startMeasurement', label: 'Start Detail', type: 'text', defaultValue: '32% body fat', group: 'Content' },
    { key: 'endMeasurement', label: 'End Detail', type: 'text', defaultValue: '18% body fat', group: 'Content' },
    { key: 'motivationalText', label: 'Motivational Text', type: 'text', defaultValue: 'CONSISTENCY WINS', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0f0f', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#22c55e', group: 'Style' },
    { key: 'arrowColor', label: 'Arrow Color', type: 'color', defaultValue: '#6366f1', group: 'Style' },
  ],
})
