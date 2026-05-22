import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScenePercentageBarConfig {
  percentage: number
  label: string
  description: string
  fillColor: string
  trackColor: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function ScenePercentageBarComponent({ config, progress }: MotionGraphicProps<ScenePercentageBarConfig>) {
  const { percentage, label, description, fillColor, trackColor, bgColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Bar fill animation
  const fillEased = easeOutCubic(enterProgress)
  const currentFill = percentage * fillEased
  const displayPercent = Math.round(currentFill)

  // Label enters first
  const labelEnter = easeOutCubic(Math.min(1, enterProgress / 0.4))

  // Description fades in after bar
  const descDelay = 0.5
  const descEnter = enterProgress < 1 ? easeOutCubic(Math.max(0, (enterProgress - descDelay) / (1 - descDelay))) : 1

  // Hold: shimmer sweep
  const isHolding = progress >= 0.25 && progress < 0.8
  const shimmerPos = isHolding ? ((holdProgress * 3) % 1) * 200 - 50 : -50

  // Exit: fill drains, text fades
  const exitEased = easeInCubic(exitProgress)
  const exitFillMult = exitProgress > 0 ? 1 - exitEased : 1
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  const barHeight = 'clamp(24px, 4vw, 44px)'

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
          padding: '10% 12%',
          opacity: exitOpacity,
        }}
      >
        {/* Label */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(14px, 2.5vw, 26px)',
            fontWeight: 700,
            color: textColor,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            opacity: labelEnter,
            marginBottom: 'clamp(12px, 2.5vw, 28px)',
            transform: `translateY(${10 * (1 - labelEnter)}px)`,
          }}
        >
          {label}
        </div>

        {/* Bar container */}
        <div style={{ width: '100%', maxWidth: 600, position: 'relative' }}>
          {/* Track */}
          <div
            style={{
              width: '100%',
              height: barHeight,
              borderRadius: 999,
              background: trackColor,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Fill */}
            <div
              style={{
                height: '100%',
                width: `${currentFill * exitFillMult}%`,
                background: fillColor,
                borderRadius: 999,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: `0 2px 16px ${fillColor}50`,
                transition: 'none',
              }}
            >
              {/* Shimmer */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: `${shimmerPos}%`,
                  width: '40%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                }}
              />
              {/* Gloss */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '45%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.2), transparent)',
                  borderRadius: '999px 999px 0 0',
                }}
              />
            </div>
          </div>

          {/* Percentage label following fill edge */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: `${Math.min(currentFill * exitFillMult, 95)}%`,
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(11px, 1.8vw, 18px)',
              fontWeight: 800,
              color: currentFill > 15 ? '#FFFFFF' : textColor,
              opacity: fillEased,
              textShadow: currentFill > 15 ? '0 1px 3px rgba(0,0,0,0.4)' : 'none',
            }}
          >
            {displayPercent}%
          </div>
        </div>

        {/* Large percentage display */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(36px, 9vw, 80px)',
            fontWeight: 900,
            color: fillColor,
            lineHeight: 1.1,
            marginTop: 'clamp(14px, 3vw, 32px)',
            opacity: fillEased * exitFillMult,
          }}
        >
          {displayPercent}<span style={{ fontSize: '0.5em', opacity: 0.7 }}>%</span>
        </div>

        {/* Description */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(11px, 1.8vw, 18px)',
            fontWeight: 400,
            color: `${textColor}B0`,
            opacity: descEnter,
            marginTop: 'clamp(6px, 1vw, 14px)',
            transform: `translateY(${8 * (1 - descEnter)}px)`,
            textAlign: 'center',
            maxWidth: 500,
          }}
        >
          {description}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-percentage-bar',
  title: 'Percentage Bar',
  description: 'Horizontal percentage bar with animated fill, shimmer sweep, counting label, and description text',
  tags: ['scene', 'data', 'percentage', 'bar', 'progress', 'fill'],
  category: 'scene-layout',
  component: ScenePercentageBarComponent as any,
  defaultConfig: {
    percentage: 73,
    label: 'User Satisfaction',
    description: 'Based on 12,000+ survey responses this quarter',
    fillColor: '#10b981',
    trackColor: '#1e293b',
    bgColor: '#0f172a',
    textColor: '#e2e8f0',
  },
  configSchema: [
    { key: 'percentage', label: 'Percentage', type: 'number', defaultValue: 73, min: 0, max: 100, group: 'Content' },
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'User Satisfaction', group: 'Content' },
    { key: 'description', label: 'Description', type: 'text', defaultValue: 'Based on 12,000+ survey responses this quarter', group: 'Content' },
    { key: 'fillColor', label: 'Fill Color', type: 'color', defaultValue: '#10b981', group: 'Style' },
    { key: 'trackColor', label: 'Track Color', type: 'color', defaultValue: '#1e293b', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
})
