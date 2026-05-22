import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SizeGuideConfig {
  selectedSize: string
  sizeS: string
  sizeM: string
  sizeL: string
  sizeXL: string
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

const SIZES = ['S', 'M', 'L', 'XL']

function SceneSizeGuideComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<SizeGuideConfig>) {
  const { selectedSize, sizeS, sizeM, sizeL, sizeXL, bgColor, cardColor, accentColor, textColor } = config
  const progress = frame / durationInFrames

  const measurements = [sizeS, sizeM, sizeL, sizeXL]

  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Title appears
  const titleProgress = easeOutCubic(Math.min(1, enterProgress / 0.25))

  // Size buttons slide in staggered from bottom
  const getSizeProgress = (idx: number): number => {
    const start = 0.15 + idx * 0.1
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.2)))
  }

  // Selected size glow
  const selectedGlow = elasticOut(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.25)))

  // Measurement text appears
  const measureProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.65) / 0.25)))

  // Helper text
  const helperProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.85) / 0.15)))

  // Hold: selected size glows subtly
  const glowPulse = 6 + Math.sin(holdProgress * Math.PI * 4) * 4

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.15

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
        padding: '6%',
      }}
    >
      <div
        style={{
          background: cardColor,
          borderRadius: 'clamp(14px, 2vw, 22px)',
          padding: 'clamp(24px, 5%, 44px)',
          maxWidth: 400,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(16px, 3vh, 28px)',
          transform: `scale(${exitScale})`,
          opacity: exitOpacity,
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
        }}
      >
        {/* Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 12px)',
            opacity: titleProgress,
            transform: `translateY(${(1 - titleProgress) * -15}px)`,
          }}
        >
          <span style={{ fontSize: 'clamp(18px, 3vw, 26px)' }}>{'📏'}</span>
          <span
            style={{
              fontSize: 'clamp(16px, 2.8vw, 22px)',
              fontWeight: 800,
              color: textColor,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            Size Guide
          </span>
        </div>

        {/* Size options row */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(8px, 1.5vw, 14px)',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          {SIZES.map((size, i) => {
            const sp = getSizeProgress(i)
            const isSelected = size === selectedSize
            const selGlow = isSelected ? selectedGlow : 0
            return (
              <div
                key={i}
                style={{
                  width: 'clamp(52px, 9vw, 72px)',
                  height: 'clamp(52px, 9vw, 72px)',
                  borderRadius: 'clamp(10px, 1.5vw, 14px)',
                  background: isSelected ? accentColor : `${textColor}08`,
                  border: isSelected ? `2px solid ${accentColor}` : `2px solid ${textColor}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `translateY(${(1 - sp) * 40}px) scale(${isSelected ? 1 + selGlow * 0.05 : 1})`,
                  opacity: sp,
                  boxShadow: isSelected ? `0 0 ${glowPulse}px ${accentColor}40` : 'none',
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    fontSize: 'clamp(16px, 2.8vw, 22px)',
                    fontWeight: 800,
                    color: isSelected ? '#FFFFFF' : textColor,
                    letterSpacing: 1,
                  }}
                >
                  {size}
                </span>
              </div>
            )
          })}
        </div>

        {/* Measurement details for selected size */}
        <div
          style={{
            width: '100%',
            background: `${accentColor}08`,
            borderRadius: 'clamp(8px, 1.2vw, 12px)',
            padding: 'clamp(14px, 2.5vh, 24px)',
            opacity: measureProgress,
            transform: `translateY(${(1 - measureProgress) * 15}px)`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(11px, 1.7vw, 14px)',
              fontWeight: 600,
              color: `${textColor}70`,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: 'clamp(8px, 1.5vh, 14px)',
            }}
          >
            Measurements ({selectedSize})
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(6px, 1vh, 10px)',
            }}
          >
            {(() => {
              const selectedIdx = SIZES.indexOf(selectedSize)
              const measurement = measurements[selectedIdx >= 0 ? selectedIdx : 1]
              const parts = measurement.split(',').map(p => p.trim())
              return parts.map((part, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 'clamp(12px, 1.8vw, 15px)', fontWeight: 500, color: `${textColor}CC` }}>
                    {part.split(':')[0] || part}
                  </span>
                  <span style={{ fontSize: 'clamp(12px, 1.8vw, 15px)', fontWeight: 700, color: accentColor }}>
                    {part.split(':')[1] || ''}
                  </span>
                </div>
              ))
            })()}
          </div>
        </div>

        {/* Helper text */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.5vw, 13px)',
            fontWeight: 500,
            color: `${textColor}60`,
            textAlign: 'center',
            opacity: helperProgress,
          }}
        >
          Measurements in inches. When in doubt, size up!
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-size-guide',
  title: 'Scene Size Guide',
  description:
    'Size comparison guide with staggered size buttons, glowing selected size, measurement details, and helpful advice',
  tags: ['scene', 'ecommerce', 'size', 'guide', 'fashion', 'clothing', 'shopping', 'fit'],
  category: 'scene-layout',
  component: SceneSizeGuideComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'selectedSize', label: 'Selected Size', type: 'text', defaultValue: 'M', group: 'Content' },
    { key: 'sizeS', label: 'S Measurements', type: 'text', defaultValue: 'Chest: 34-36, Waist: 28-30, Length: 27', group: 'Content' },
    { key: 'sizeM', label: 'M Measurements', type: 'text', defaultValue: 'Chest: 38-40, Waist: 32-34, Length: 28', group: 'Content' },
    { key: 'sizeL', label: 'L Measurements', type: 'text', defaultValue: 'Chest: 42-44, Waist: 36-38, Length: 29', group: 'Content' },
    { key: 'sizeXL', label: 'XL Measurements', type: 'text', defaultValue: 'Chest: 46-48, Waist: 40-42, Length: 30', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#7C3AED', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F172A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1E293B', group: 'Style' },
  ],
  defaultConfig: {
    selectedSize: 'M',
    sizeS: 'Chest: 34-36, Waist: 28-30, Length: 27',
    sizeM: 'Chest: 38-40, Waist: 32-34, Length: 28',
    sizeL: 'Chest: 42-44, Waist: 36-38, Length: 29',
    sizeXL: 'Chest: 46-48, Waist: 40-42, Length: 30',
    accentColor: '#7C3AED',
    cardColor: '#FFFFFF',
    bgColor: '#0F172A',
    textColor: '#1E293B',
  },
})
