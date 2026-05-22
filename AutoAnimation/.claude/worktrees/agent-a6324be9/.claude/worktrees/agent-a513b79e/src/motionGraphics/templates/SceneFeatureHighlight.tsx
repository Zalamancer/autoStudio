import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FeatureHighlightConfig {
  icon: string
  featureTitle: string
  description: string
  accentColor: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneFeatureHighlightComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<FeatureHighlightConfig>) {
  const { icon, featureTitle, description, accentColor, bgColor, textColor } = config
  const progress = frame / durationInFrames

  // Phase breakdown
  const enterEnd = 0.25
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Icon bounces in from top
  const iconY = (1 - easeOutBack(Math.min(1, enterProgress / 0.4))) * -60
  const iconOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))
  const iconScale = easeOutBack(Math.min(1, enterProgress / 0.4))

  // Title slides from left
  const titleX = (1 - easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.25) / 0.35)))) * -50
  const titleOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.25) / 0.3)))

  // Description fades in
  const descOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.35)))
  const descY = (1 - descOpacity) * 15

  // Accent underline draws
  const underlineWidth = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.3))) * 100

  // Hold: icon gentle float, underline glow
  const iconFloat = Math.sin(holdProgress * Math.PI * 3) * 4
  const glowIntensity = 0.3 + Math.sin(holdProgress * Math.PI * 4) * 0.15

  // Exit: fade with scale reduction
  const exitEased = easeInCubic(exitProgress)
  const exitScale = 1 - exitEased * 0.15
  const exitOpacity = 1 - exitEased

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8%',
      }}
    >
      {/* Subtle background accent glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          width: '60%',
          height: '60%',
          background: `radial-gradient(circle, ${accentColor}08 0%, transparent 70%)`,
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
        }}
      />

      {/* Content container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(12px, 2.5vh, 24px)',
          maxWidth: 500,
          width: '100%',
          transform: `scale(${exitScale})`,
          opacity: exitOpacity,
        }}
      >
        {/* Icon */}
        <div
          style={{
            fontSize: 'clamp(40px, 8vw, 72px)',
            lineHeight: 1,
            transform: `translateY(${iconY + iconFloat}px) scale(${iconScale})`,
            opacity: iconOpacity,
          }}
        >
          {icon}
        </div>

        {/* Feature title */}
        <div
          style={{
            fontSize: 'clamp(22px, 4.5vw, 42px)',
            fontWeight: 800,
            color: textColor,
            transform: `translateX(${titleX}px)`,
            opacity: titleOpacity,
            textAlign: 'center',
            letterSpacing: 1,
            lineHeight: 1.1,
          }}
        >
          {featureTitle}
        </div>

        {/* Accent underline */}
        <div
          style={{
            width: `${underlineWidth}px`,
            maxWidth: '60%',
            height: 3,
            background: accentColor,
            borderRadius: 2,
            boxShadow: `0 0 ${12 * glowIntensity}px ${accentColor}${Math.round(glowIntensity * 100).toString(16).padStart(2, '0')}`,
          }}
        />

        {/* Description */}
        <div
          style={{
            fontSize: 'clamp(13px, 2.2vw, 20px)',
            fontWeight: 400,
            color: `${textColor}BB`,
            opacity: descOpacity,
            transform: `translateY(${descY}px)`,
            textAlign: 'center',
            lineHeight: 1.6,
            maxWidth: '85%',
          }}
        >
          {description}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-feature-highlight',
  title: 'Scene Feature Highlight',
  description:
    'Feature highlight with bouncing icon, sliding title, glowing accent underline, and fading description',
  tags: ['scene', 'brand', 'feature', 'highlight', 'product', 'business'],
  category: 'scene-layout',
  component: SceneFeatureHighlightComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'icon', label: 'Icon/Emoji', type: 'text', defaultValue: '\u26A1', group: 'Content' },
    { key: 'featureTitle', label: 'Feature Title', type: 'text', defaultValue: 'Lightning Fast', group: 'Content' },
    { key: 'description', label: 'Description', type: 'text', defaultValue: 'Experience blazing fast performance with our optimized engine. Load times under 100ms guaranteed.', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#3B82F6', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F172A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#F1F5F9', group: 'Style' },
  ],
  defaultConfig: {
    icon: '\u26A1',
    featureTitle: 'Lightning Fast',
    description: 'Experience blazing fast performance with our optimized engine. Load times under 100ms guaranteed.',
    accentColor: '#3B82F6',
    bgColor: '#0F172A',
    textColor: '#F1F5F9',
  },
})
