import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneBodyMeasureConfig {
  title: string
  measurements: string[]
  values: string[]
  changes: string[]
  period: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneBodyMeasureComponent({ config, progress }: MotionGraphicProps<SceneBodyMeasureConfig>) {
  const { title, measurements, values, changes, period, bgColor, textColor, accentColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.1 : 1

  const headerEnter = easeOutCubic(Math.min(1, enterProgress / 0.4))

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Body silhouette outline hint */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '30%',
          height: '70%',
          borderRadius: '50% 50% 30% 30% / 30% 30% 40% 40%',
          border: `1px solid ${textColor}06`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '6%',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Header */}
        <div
          style={{
            marginBottom: 'clamp(6px, 1.2vw, 12px)',
            opacity: headerEnter,
            transform: `translateY(${(1 - headerEnter) * -20}px)`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div
              style={{
                fontSize: 'clamp(20px, 5vw, 40px)',
                fontWeight: 900,
                color: textColor,
                letterSpacing: '-0.02em',
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 'clamp(10px, 1.6vw, 14px)',
                fontWeight: 600,
                color: `${textColor}55`,
                opacity: headerEnter,
              }}
            >
              {period}
            </div>
          </div>
          <div
            style={{
              width: `${headerEnter * 100}%`,
              height: '2px',
              background: `linear-gradient(90deg, ${accentColor}, transparent)`,
              marginTop: 'clamp(6px, 1vw, 10px)',
            }}
          />
        </div>

        {/* Measurement rows */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'clamp(6px, 1.3vw, 14px)' }}>
          {measurements.map((measurement, i) => {
            const itemDelay = 0.2 + i * 0.08
            const itemEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - itemDelay) / 0.4)))
            const changeVal = changes[i] || '0'
            const isPositive = changeVal.startsWith('+')
            const isNegative = changeVal.startsWith('-')
            const changeColor = isNegative ? '#22c55e' : isPositive ? '#ef4444' : `${textColor}66`

            // Bar width animation
            const barWidth = 40 + (i * 7) % 35
            const barProgress = itemEnter * barWidth

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(8px, 1.5vw, 16px)',
                  padding: 'clamp(8px, 1.5vw, 14px) clamp(10px, 2vw, 18px)',
                  background: `${textColor}05`,
                  borderRadius: 'clamp(6px, 1.2vw, 10px)',
                  border: `1px solid ${textColor}08`,
                  opacity: itemEnter,
                  transform: `translateX(${(1 - itemEnter) * 30}px)`,
                }}
              >
                {/* Measurement dot */}
                <div
                  style={{
                    width: 'clamp(8px, 1.5vw, 12px)',
                    height: 'clamp(8px, 1.5vw, 12px)',
                    borderRadius: '50%',
                    background: accentColor,
                    flexShrink: 0,
                  }}
                />

                {/* Label */}
                <div style={{ flex: '0 0 clamp(60px, 14vw, 120px)' }}>
                  <div style={{ fontSize: 'clamp(11px, 2vw, 16px)', fontWeight: 700, color: textColor }}>
                    {measurement}
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ flex: 1, height: 'clamp(4px, 0.8vw, 6px)', background: `${textColor}10`, borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${barProgress}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80)`,
                      borderRadius: '3px',
                    }}
                  />
                </div>

                {/* Value */}
                <div
                  style={{
                    fontSize: 'clamp(13px, 2.2vw, 18px)',
                    fontWeight: 800,
                    color: textColor,
                    fontVariantNumeric: 'tabular-nums',
                    textAlign: 'right',
                    flex: '0 0 clamp(40px, 8vw, 70px)',
                  }}
                >
                  {values[i] || '--'}
                </div>

                {/* Change */}
                <div
                  style={{
                    fontSize: 'clamp(10px, 1.6vw, 14px)',
                    fontWeight: 700,
                    color: changeColor,
                    fontVariantNumeric: 'tabular-nums',
                    textAlign: 'right',
                    flex: '0 0 clamp(35px, 7vw, 55px)',
                  }}
                >
                  {changeVal}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-body-measure',
  title: 'Body Measurements',
  description: 'Body measurement tracker with animated progress bars, current values, and change indicators. Rows stagger in with colored bars.',
  tags: ['scene', 'body', 'measurement', 'fitness', 'tracker', 'gym', 'progress', 'health'],
  category: 'scene-layout',
  component: SceneBodyMeasureComponent as any,
  defaultConfig: {
    title: 'Body Stats',
    measurements: ['Chest', 'Waist', 'Arms', 'Thighs', 'Shoulders'],
    values: ['42"', '32"', '15.5"', '24"', '48"'],
    changes: ['+0.5"', '-1.5"', '+0.3"', '+0.2"', '+0.4"'],
    period: '4 Week Progress',
    bgColor: '#0a0a0a',
    textColor: '#ffffff',
    accentColor: '#FF4433',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Body Stats', group: 'Content' },
    { key: 'measurements', label: 'Measurements', type: 'text-array', defaultValue: ['Chest', 'Waist', 'Arms', 'Thighs', 'Shoulders'], group: 'Content' },
    { key: 'values', label: 'Values', type: 'text-array', defaultValue: ['42"', '32"', '15.5"', '24"', '48"'], group: 'Content' },
    { key: 'changes', label: 'Changes', type: 'text-array', defaultValue: ['+0.5"', '-1.5"', '+0.3"', '+0.2"', '+0.4"'], group: 'Content' },
    { key: 'period', label: 'Period', type: 'text', defaultValue: '4 Week Progress', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FF4433', group: 'Style' },
  ],
})
