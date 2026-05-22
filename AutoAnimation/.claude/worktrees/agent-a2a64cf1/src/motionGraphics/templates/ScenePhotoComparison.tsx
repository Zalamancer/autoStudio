import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PhotoComparisonConfig {
  beforeLabel: string
  afterLabel: string
  editType: string
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
  beforeHue: number
  afterHue: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function ScenePhotoComparisonComponent({ config, progress }: MotionGraphicProps<PhotoComparisonConfig>) {
  const { beforeLabel, afterLabel, editType, bgColor, cardColor, accentColor, textColor, beforeHue, afterHue } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Slider position — starts left, sweeps to reveal "after"
  const sliderEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.5)))
  // During hold, slider sweeps back and forth
  const sliderHold = holdProgress > 0 ? 0.5 + Math.sin(holdProgress * Math.PI * 3) * 0.35 : 0
  const sliderPos = enterProgress < 1
    ? sliderEnter * 0.5
    : exitProgress > 0
      ? 0.5 - exitEased * 0.3
      : sliderHold > 0
        ? sliderHold
        : 0.5

  // Card scale
  const cardScale = easeOutCubic(Math.min(1, enterProgress / 0.4))

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: '5%',
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: '100%',
          opacity: exitOpacity,
          transform: `scale(${cardScale}) translateY(${exitEased * -40}px)`,
        }}
      >
        {/* Edit type badge */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 'clamp(10px, 1.5vh, 16px)',
            opacity: easeOutCubic(Math.min(1, enterProgress / 0.3)),
          }}
        >
          <span
            style={{
              background: `${accentColor}20`,
              color: accentColor,
              fontSize: 'clamp(10px, 1.4vw, 13px)',
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: 20,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            {editType}
          </span>
        </div>

        {/* Comparison frame */}
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(10px, 1.5vw, 16px)',
            padding: 'clamp(10px, 2%, 18px)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
          }}
        >
          {/* Photo comparison area */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16/10',
              borderRadius: 'clamp(6px, 1vw, 10px)',
              overflow: 'hidden',
            }}
          >
            {/* Before (full width) */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(135deg, hsla(${beforeHue}, 25%, 35%, 1), hsla(${beforeHue}, 20%, 25%, 1))`,
                filter: 'saturate(0.5) brightness(0.8)',
              }}
            >
              {/* Faux landscape elements */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: `hsla(${beforeHue}, 15%, 20%, 0.6)` }} />
              <div style={{ position: 'absolute', top: '15%', right: '20%', width: '15%', height: '15%', borderRadius: '50%', background: `hsla(${beforeHue + 30}, 20%, 50%, 0.4)` }} />
            </div>

            {/* After (clipped by slider) */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                clipPath: `inset(0 ${(1 - sliderPos) * 100}% 0 0)`,
                background: `linear-gradient(135deg, hsla(${afterHue}, 55%, 45%, 1), hsla(${afterHue}, 45%, 30%, 1))`,
                filter: 'saturate(1.2) brightness(1.1) contrast(1.1)',
              }}
            >
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: `hsla(${afterHue}, 30%, 25%, 0.6)` }} />
              <div style={{ position: 'absolute', top: '15%', right: '20%', width: '15%', height: '15%', borderRadius: '50%', background: `hsla(${afterHue + 30}, 50%, 60%, 0.5)` }} />
            </div>

            {/* Slider line */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${sliderPos * 100}%`,
                width: 3,
                background: '#FFFFFF',
                transform: 'translateX(-50%)',
                boxShadow: '0 0 8px rgba(0,0,0,0.4)',
              }}
            >
              {/* Slider handle */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 'clamp(24px, 4vw, 36px)',
                  height: 'clamp(24px, 4vw, 36px)',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                }}
              >
                <div style={{ width: 2, height: 10, background: '#666', borderRadius: 1 }} />
                <div style={{ width: 2, height: 10, background: '#666', borderRadius: 1 }} />
              </div>
            </div>

            {/* Before / After labels */}
            <div
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                background: 'rgba(0,0,0,0.5)',
                color: '#FFFFFF',
                fontSize: 'clamp(9px, 1.2vw, 12px)',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 4,
                letterSpacing: 1,
              }}
            >
              {beforeLabel}
            </div>
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: `${accentColor}CC`,
                color: '#FFFFFF',
                fontSize: 'clamp(9px, 1.2vw, 12px)',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 4,
                letterSpacing: 1,
              }}
            >
              {afterLabel}
            </div>
          </div>

          {/* Bottom controls */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 'clamp(16px, 3vw, 28px)',
              marginTop: 'clamp(10px, 1.5vh, 16px)',
              opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3))),
            }}
          >
            {['Exposure', 'Contrast', 'Saturation'].map((label, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(9px, 1.2vw, 11px)', color: `${textColor}50`, fontWeight: 500, marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 'clamp(12px, 2vw, 16px)', fontWeight: 800, color: accentColor }}>+{(i + 1) * 12}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-photo-comparison',
  title: 'Scene Photo Comparison',
  description: 'Before/after photo edit comparison with animated slider reveal, edit type badge, and adjustment values',
  tags: ['scene', 'photography', 'comparison', 'before-after', 'editing', 'retouching'],
  category: 'scenes',
  component: ScenePhotoComparisonComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    beforeLabel: 'BEFORE',
    afterLabel: 'AFTER',
    editType: 'Color Grading',
    bgColor: '#0D1117',
    cardColor: '#1C2128',
    accentColor: '#7C3AED',
    textColor: '#E6EDF3',
    beforeHue: 30,
    afterHue: 200,
  },
  configSchema: [
    { key: 'beforeLabel', label: 'Before Label', type: 'text', defaultValue: 'BEFORE', group: 'Content' },
    { key: 'afterLabel', label: 'After Label', type: 'text', defaultValue: 'AFTER', group: 'Content' },
    { key: 'editType', label: 'Edit Type', type: 'text', defaultValue: 'Color Grading', group: 'Content' },
    { key: 'beforeHue', label: 'Before Hue', type: 'number', defaultValue: 30, min: 0, max: 360, group: 'Content' },
    { key: 'afterHue', label: 'After Hue', type: 'number', defaultValue: 200, min: 0, max: 360, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D1117', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1C2128', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#7C3AED', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E6EDF3', group: 'Style' },
  ],
})
