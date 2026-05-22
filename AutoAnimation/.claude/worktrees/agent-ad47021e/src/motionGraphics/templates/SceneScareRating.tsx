import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneScareRatingConfig {
  itemName: string
  scareLevel: number
  category: string
  description: string
  verdict: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneScareRatingComponent({ config, progress, frame }: MotionGraphicProps<SceneScareRatingConfig>) {
  const { itemName, scareLevel, category, description, verdict, bgColor, textColor, accentColor } = config
  const f = frame ?? 0

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Scare meter fill animation
  const meterFill = easeOutCubic(Math.min(1, enterProgress * 1.3)) * (scareLevel / 10)

  // Meter color based on level
  const getMeterColor = (level: number) => {
    if (level < 3) return '#44AA44'
    if (level < 5) return '#AAAA44'
    if (level < 7) return '#DD8800'
    if (level < 9) return '#DD4400'
    return accentColor
  }
  const meterColor = getMeterColor(scareLevel)

  // Pulse for high scare levels
  const highScalePulse = scareLevel >= 8 ? 0.8 + Math.sin(f * 0.08) * 0.15 : 1

  // Screen shake for extreme scare
  const shakeX = scareLevel >= 9 && holdProgress > 0 ? Math.sin(f * 0.3) * 2 : 0
  const shakeY = scareLevel >= 9 && holdProgress > 0 ? Math.cos(f * 0.4) * 1.5 : 0

  const cardEnter = easeOutCubic(enterProgress)
  const titleEnter = easeOutBack(Math.min(1, enterProgress * 1.4))
  const detailEnter = easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6))
  const verdictEnter = easeOutCubic(Math.max(0, (enterProgress - 0.7) / 0.3))

  // Scare level label
  const getScareLabel = (level: number) => {
    if (level <= 2) return 'Mild'
    if (level <= 4) return 'Unsettling'
    if (level <= 6) return 'Frightening'
    if (level <= 8) return 'Terrifying'
    return 'NIGHTMARE'
  }

  const totalSegments = 10

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      {/* Glow for high levels */}
      {scareLevel >= 7 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse, ${accentColor}06, transparent 60%)`,
            opacity: highScalePulse,
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '7%',
          opacity: exitOpacity,
          transform: `translate(${shakeX}px, ${shakeY}px)`,
        }}
      >
        {/* Category badge */}
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(8px, 1.5vw, 11px)',
            fontWeight: 700,
            color: meterColor,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            marginBottom: 'clamp(6px, 1.5vw, 10px)',
            opacity: detailEnter,
          }}
        >
          {category}
        </div>

        {/* Card */}
        <div
          style={{
            width: 'clamp(280px, 75vw, 460px)',
            background: 'rgba(10, 8, 14, 0.85)',
            borderRadius: 'clamp(10px, 2.5vw, 18px)',
            border: `1px solid ${meterColor}22`,
            padding: 'clamp(22px, 5.5vw, 40px)',
            opacity: cardEnter,
            boxShadow: `0 0 25px rgba(0,0,0,0.4)`,
          }}
        >
          {/* Item name */}
          <div
            style={{
              fontFamily: "Impact, 'Arial Black', sans-serif",
              fontSize: 'clamp(20px, 5vw, 36px)',
              fontWeight: 900,
              color: textColor,
              textTransform: 'uppercase',
              lineHeight: 1.1,
              marginBottom: 'clamp(6px, 1.5vw, 10px)',
              opacity: titleEnter,
              transform: `scale(${titleEnter})`,
              transformOrigin: 'left center',
            }}
          >
            {itemName}
          </div>

          {/* Description */}
          <div
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(11px, 2.2vw, 16px)',
              color: `${textColor}88`,
              lineHeight: 1.5,
              marginBottom: 'clamp(18px, 4.5vw, 30px)',
              opacity: detailEnter,
            }}
          >
            {description}
          </div>

          {/* Scare meter */}
          <div style={{ marginBottom: 'clamp(8px, 2vw, 14px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'clamp(6px, 1.5vw, 10px)' }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(9px, 1.6vw, 12px)', color: `${textColor}55`, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Scare Level</span>
              <span style={{ fontFamily: "'SF Mono', monospace", fontSize: 'clamp(14px, 3vw, 22px)', fontWeight: 800, color: meterColor, textShadow: `0 0 10px ${meterColor}33`, opacity: highScalePulse }}>
                {scareLevel}/10
              </span>
            </div>

            {/* Segmented meter */}
            <div style={{ display: 'flex', gap: 'clamp(2px, 0.5vw, 4px)' }}>
              {Array.from({ length: totalSegments }, (_, i) => {
                const segmentFill = meterFill * totalSegments
                const isFilled = i < segmentFill
                const segColor = getMeterColor(i + 1)
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: 'clamp(8px, 2vw, 14px)',
                      borderRadius: 2,
                      background: isFilled ? segColor : 'rgba(255,255,255,0.05)',
                      opacity: isFilled ? (scareLevel >= 8 ? highScalePulse : 0.9) : 0.3,
                      boxShadow: isFilled ? `0 0 6px ${segColor}33` : 'none',
                    }}
                  />
                )
              })}
            </div>

            {/* Label */}
            <div
              style={{
                textAlign: 'center',
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(10px, 2vw, 14px)',
                fontWeight: 700,
                color: meterColor,
                marginTop: 'clamp(6px, 1.5vw, 10px)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                opacity: detailEnter * highScalePulse,
              }}
            >
              {getScareLabel(scareLevel)}
            </div>
          </div>

          {/* Verdict */}
          <div
            style={{
              borderTop: `1px solid ${textColor}11`,
              paddingTop: 'clamp(12px, 3vw, 20px)',
              opacity: verdictEnter,
              transform: `translateY(${(1 - verdictEnter) * 8}px)`,
            }}
          >
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(8px, 1.4vw, 10px)', color: `${textColor}44`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Verdict</div>
            <div style={{ fontFamily: "'Georgia', serif", fontSize: 'clamp(12px, 2.5vw, 18px)', color: textColor, fontStyle: 'italic', lineHeight: 1.5 }}>
              {verdict}
            </div>
          </div>
        </div>
      </div>

      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse, transparent 40%, rgba(0,0,0,0.4) 100%)', pointerEvents: 'none' }} />
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-scare-rating',
  title: 'Scare Level Rating',
  description: 'Scare level rating display with animated segmented meter, color-coded severity, screen shake for extreme levels, and verdict',
  tags: ['scene', 'horror', 'scare', 'rating', 'meter', 'review', 'dark', 'level'],
  category: 'scene-layout',
  component: SceneScareRatingComponent as any,
  defaultConfig: {
    itemName: 'The Conjuring',
    scareLevel: 8,
    category: 'Horror Movie',
    description: 'Based on real-life paranormal investigators Ed and Lorraine Warren. Atmospheric dread that builds to genuine terror.',
    verdict: 'Not for the faint of heart. Watch with lights on and someone brave beside you.',
    bgColor: '#080608',
    textColor: '#d8d0e0',
    accentColor: '#CC0000',
  },
  configSchema: [
    { key: 'itemName', label: 'Item Name', type: 'text', defaultValue: 'The Conjuring', group: 'Content' },
    { key: 'scareLevel', label: 'Scare Level (1-10)', type: 'number', defaultValue: 8, min: 1, max: 10, group: 'Content' },
    { key: 'category', label: 'Category', type: 'text', defaultValue: 'Horror Movie', group: 'Content' },
    { key: 'description', label: 'Description', type: 'text', defaultValue: 'Based on real-life paranormal investigators...', group: 'Content' },
    { key: 'verdict', label: 'Verdict', type: 'text', defaultValue: 'Not for the faint of heart...', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080608', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#d8d0e0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#CC0000', group: 'Style' },
  ],
})
