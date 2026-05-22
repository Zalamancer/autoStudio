import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FeatureShowcaseConfig {
  title: string
  features: string[]
  bgColor: string
  accentColor: string
  textColor: string
}

function SceneFeatureShowcaseComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<FeatureShowcaseConfig>) {
  const { title, features, bgColor, accentColor, textColor } = config
  const progress = frame / durationInFrames

  const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)
  const easeOutQuint = (t: number): number => 1 - Math.pow(1 - t, 5)

  const parsedFeatures = features.map((f) => {
    const parts = f.split('|')
    return {
      icon: parts[0] || '\u2B50',
      text: parts[1] || parts[0] || 'Feature',
    }
  })

  // Title: slides in from top 0-0.15
  const titleProgress = easeOutCubic(Math.min(1, progress / 0.15))

  // Feature stagger: 0.1-0.6
  const getFeatureProgress = (index: number): number => {
    const staggerDelay = 0.08
    const featureStart = 0.12 + index * staggerDelay
    const featureDur = 0.2
    return easeOutCubic(
      Math.max(0, Math.min(1, (progress - featureStart) / featureDur))
    )
  }

  // Highlight sweep: 0.55-0.75
  const sweepStart = 0.55
  const sweepEnd = 0.75
  const sweepProgress = Math.max(0, Math.min(1, (progress - sweepStart) / (sweepEnd - sweepStart)))
  const sweepPosition = easeOutQuint(sweepProgress) * 120 - 10 // -10% to 110%

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: '6% 8%',
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: 'clamp(22px, 4.5vw, 42px)',
          fontWeight: 800,
          color: textColor,
          opacity: titleProgress,
          transform: `translateY(${(1 - titleProgress) * -40}px)`,
          textTransform: 'uppercase',
          letterSpacing: 3,
          marginBottom: '6%',
          textAlign: 'center',
        }}
      >
        {title}
      </div>

      {/* Decorative line under title */}
      <div
        style={{
          width: `${titleProgress * 60}px`,
          height: 3,
          background: accentColor,
          borderRadius: 2,
          marginBottom: '5%',
        }}
      />

      {/* Features list */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(10px, 2.5vh, 20px)',
          width: '100%',
          maxWidth: 500,
        }}
      >
        {parsedFeatures.map((feature, i) => {
          const fp = getFeatureProgress(i)
          // Highlight sweep overlay
          const featureY = (i / Math.max(parsedFeatures.length - 1, 1)) * 100
          const distFromSweep = Math.abs(featureY - sweepPosition)
          const highlightIntensity =
            sweepProgress > 0 && sweepProgress < 1
              ? Math.max(0, 1 - distFromSweep / 25)
              : 0

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(12px, 2.5vw, 20px)',
                padding: 'clamp(10px, 2%, 18px) clamp(14px, 3%, 22px)',
                background: `${accentColor}${Math.round((0.06 + highlightIntensity * 0.12) * 255)
                  .toString(16)
                  .padStart(2, '0')}`,
                borderRadius: 12,
                borderLeft: `3px solid ${accentColor}`,
                opacity: fp,
                transform: `translateY(${(1 - fp) * 30}px)`,
              }}
            >
              {/* Icon */}
              <div
                style={{
                  fontSize: 'clamp(22px, 4vw, 34px)',
                  lineHeight: 1,
                  flexShrink: 0,
                  transform: `scale(${fp})`,
                }}
              >
                {feature.icon}
              </div>

              {/* Text */}
              <div
                style={{
                  fontSize: 'clamp(14px, 2.5vw, 20px)',
                  fontWeight: 600,
                  color: textColor,
                  lineHeight: 1.3,
                }}
              >
                {feature.text}
              </div>

              {/* Highlight glow overlay */}
              {highlightIntensity > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    borderRadius: 12,
                    boxShadow: `inset 0 0 20px ${accentColor}${Math.round(highlightIntensity * 30)
                      .toString(16)
                      .padStart(2, '0')}`,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-feature-showcase',
  title: 'Scene Feature Showcase',
  description:
    'Feature list with title, staggered slide-in items with icons, and a highlight sweep effect',
  tags: ['scene', 'features', 'showcase', 'list', 'product'],
  category: 'scene-layout',
  component: SceneFeatureShowcaseComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'WHY CHOOSE US', group: 'Content' },
    {
      key: 'features',
      label: 'Features (icon|text)',
      type: 'text-array',
      defaultValue: [
        '\u26A1|Lightning Fast Performance',
        '\uD83D\uDD12|Enterprise-Grade Security',
        '\uD83C\uDF0D|Global CDN Network',
        '\uD83D\uDCCA|Real-Time Analytics',
      ],
      group: 'Content',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F172A', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#3B82F6', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#F1F5F9', group: 'Style' },
  ],
  defaultConfig: {
    title: 'WHY CHOOSE US',
    features: [
      '\u26A1|Lightning Fast Performance',
      '\uD83D\uDD12|Enterprise-Grade Security',
      '\uD83C\uDF0D|Global CDN Network',
      '\uD83D\uDCCA|Real-Time Analytics',
    ],
    bgColor: '#0F172A',
    accentColor: '#3B82F6',
    textColor: '#F1F5F9',
  },
})
