import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneCarReviewConfig {
  carName: string
  reviewerName: string
  overallRating: number
  performanceRating: number
  comfortRating: number
  valueRating: number
  designRating: number
  verdict: string
  bgColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneCarReviewComponent({ config, progress }: MotionGraphicProps<SceneCarReviewConfig>) {
  const { carName, reviewerName, overallRating, performanceRating, comfortRating, valueRating, designRating, verdict, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.12

  const headerEnter = easeOutBack(Math.min(1, enterProgress / 0.5))
  const ratingEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.25) / 0.5)))
  const barsEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.5)))
  const verdictEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.4)))

  const displayOverall = (ratingEnter * overallRating).toFixed(1)

  // Star generation
  const fullStars = Math.floor(overallRating)
  const hasHalf = overallRating - fullStars >= 0.5

  const categories = [
    { label: 'Performance', value: performanceRating },
    { label: 'Comfort', value: comfortRating },
    { label: 'Value', value: valueRating },
    { label: 'Design', value: designRating },
  ]

  // Rating glow during hold
  const isHolding = progress >= 0.2 && progress < 0.8
  const ratingGlow = isHolding ? 0.3 + Math.sin(holdProgress * Math.PI * 4) * 0.1 : 0.3

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'clamp(16px, 4vw, 40px) clamp(20px, 5vw, 48px)',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Header */}
        <div
          style={{
            marginBottom: 'clamp(4px, 1vw, 8px)',
            opacity: headerEnter,
            transform: `translateY(${(1 - headerEnter) * -15}px)`,
          }}
        >
          <div style={{ fontSize: 'clamp(9px, 1.3vw, 11px)', fontWeight: 600, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 'clamp(2px, 0.4vw, 4px)' }}>
            Car Review
          </div>
          <div style={{ fontSize: 'clamp(20px, 4.5vw, 36px)', fontWeight: 900, color: textColor, letterSpacing: '-0.02em' }}>
            {carName}
          </div>
          <div style={{ fontSize: 'clamp(9px, 1.3vw, 12px)', fontWeight: 500, color: `${textColor}50`, marginTop: 'clamp(2px, 0.3vw, 4px)' }}>
            by {reviewerName}
          </div>
        </div>

        {/* Overall rating circle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(12px, 2.5vw, 22px)',
            margin: 'clamp(10px, 2.5vw, 22px) 0',
            opacity: ratingEnter,
            transform: `scale(${0.85 + ratingEnter * 0.15})`,
          }}
        >
          <div
            style={{
              width: 'clamp(56px, 12vw, 90px)',
              height: 'clamp(56px, 12vw, 90px)',
              borderRadius: '50%',
              background: `${accentColor}15`,
              border: `3px solid ${accentColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 0 20px ${accentColor}${Math.round(ratingGlow * 255).toString(16).padStart(2, '0')}`,
            }}
          >
            <div style={{ fontSize: 'clamp(22px, 5vw, 38px)', fontWeight: 900, color: accentColor, fontVariantNumeric: 'tabular-nums' }}>
              {displayOverall}
            </div>
          </div>

          <div>
            {/* Stars */}
            <div style={{ display: 'flex', gap: 2, marginBottom: 'clamp(4px, 0.8vw, 8px)' }}>
              {Array.from({ length: 5 }, (_, i) => {
                const filled = i < fullStars || (i === fullStars && hasHalf)
                const full = i < fullStars
                return (
                  <div
                    key={i}
                    style={{
                      width: 'clamp(14px, 2.5vw, 22px)',
                      height: 'clamp(14px, 2.5vw, 22px)',
                      fontSize: 'clamp(12px, 2.2vw, 20px)',
                      color: filled ? '#ffd700' : `${textColor}20`,
                      lineHeight: 1,
                    }}
                  >
                    {full ? '\u2605' : filled ? '\u2605' : '\u2606'}
                  </div>
                )
              })}
            </div>
            <div style={{ fontSize: 'clamp(9px, 1.3vw, 12px)', fontWeight: 600, color: `${textColor}60` }}>
              {overallRating} out of 5.0
            </div>
          </div>
        </div>

        {/* Category bars */}
        {categories.map((cat, i) => {
          const stagger = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.45 - i * 0.06) / 0.4)))
          const barWidth = barsEnter * (cat.value / 5) * 100
          return (
            <div
              key={i}
              style={{
                marginBottom: 'clamp(6px, 1.2vw, 12px)',
                opacity: stagger,
                transform: `translateX(${(1 - stagger) * 20}px)`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'clamp(2px, 0.3vw, 3px)' }}>
                <span style={{ fontSize: 'clamp(9px, 1.3vw, 12px)', fontWeight: 600, color: `${textColor}60`, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {cat.label}
                </span>
                <span style={{ fontSize: 'clamp(10px, 1.5vw, 14px)', fontWeight: 800, color: textColor, fontVariantNumeric: 'tabular-nums' }}>
                  {cat.value.toFixed(1)}
                </span>
              </div>
              <div style={{ height: 'clamp(3px, 0.5vw, 5px)', background: `${textColor}08`, borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${barWidth}%`,
                    background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80)`,
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>
          )
        })}

        {/* Verdict */}
        <div
          style={{
            marginTop: 'clamp(8px, 2vw, 16px)',
            padding: 'clamp(10px, 2vw, 18px)',
            background: `${textColor}05`,
            borderLeft: `3px solid ${accentColor}60`,
            borderRadius: '0 clamp(6px, 1vw, 10px) clamp(6px, 1vw, 10px) 0',
            opacity: verdictEnter,
            transform: `translateY(${(1 - verdictEnter) * 10}px)`,
          }}
        >
          <div style={{ fontSize: 'clamp(8px, 1.1vw, 10px)', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 'clamp(3px, 0.5vw, 6px)' }}>
            Verdict
          </div>
          <div style={{ fontSize: 'clamp(11px, 1.8vw, 16px)', fontWeight: 600, color: `${textColor}cc`, lineHeight: 1.4, fontStyle: 'italic' }}>
            "{verdict}"
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-car-review',
  title: 'Car Review',
  description: 'Car review rating card with overall score circle, star rating, category bars, and verdict quote. Score glows on hold.',
  tags: ['scene', 'car', 'review', 'rating', 'auto', 'critique', 'stars'],
  category: 'scene-layout',
  component: SceneCarReviewComponent as any,
  defaultConfig: {
    carName: 'Tesla Model 3',
    reviewerName: 'AutoReview Pro',
    overallRating: 4.2,
    performanceRating: 4.5,
    comfortRating: 4.0,
    valueRating: 3.8,
    designRating: 4.5,
    verdict: 'A compelling EV with sharp handling and impressive range.',
    bgColor: '#0a0a14',
    accentColor: '#3388ff',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'carName', label: 'Car Name', type: 'text', defaultValue: 'Tesla Model 3', group: 'Content' },
    { key: 'reviewerName', label: 'Reviewer', type: 'text', defaultValue: 'AutoReview Pro', group: 'Content' },
    { key: 'overallRating', label: 'Overall (0-5)', type: 'number', defaultValue: 4.2, min: 0, max: 5, group: 'Ratings' },
    { key: 'performanceRating', label: 'Performance (0-5)', type: 'number', defaultValue: 4.5, min: 0, max: 5, group: 'Ratings' },
    { key: 'comfortRating', label: 'Comfort (0-5)', type: 'number', defaultValue: 4.0, min: 0, max: 5, group: 'Ratings' },
    { key: 'valueRating', label: 'Value (0-5)', type: 'number', defaultValue: 3.8, min: 0, max: 5, group: 'Ratings' },
    { key: 'designRating', label: 'Design (0-5)', type: 'number', defaultValue: 4.5, min: 0, max: 5, group: 'Ratings' },
    { key: 'verdict', label: 'Verdict', type: 'text', defaultValue: 'A compelling EV with sharp handling and impressive range.', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#3388ff', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
