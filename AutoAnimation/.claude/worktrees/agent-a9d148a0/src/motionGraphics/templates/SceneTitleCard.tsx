import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneTitleCardConfig {
  title: string
  subtitle: string
  bgColor: string
  textColor: string
  accentColor: string
  layout: 'center' | 'left' | 'bottom'
}

function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneTitleCardComponent({ config, progress }: MotionGraphicProps<SceneTitleCardConfig>) {
  const { title, subtitle, bgColor, textColor, accentColor, layout } = config

  // Phase calculations
  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Title animation: elastic slide from left
  const titleX = enterProgress < 1
    ? -100 + elasticOut(enterProgress) * 100
    : exitProgress > 0
      ? -easeInCubic(exitProgress) * 100
      : 0
  const titleOpacity = enterProgress < 1
    ? Math.min(1, enterProgress * 2.5)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Subtitle animation: fade in with delay
  const subtitleDelay = 0.3
  const subtitleEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - subtitleDelay) / (1 - subtitleDelay))
    : 1
  const subtitleOpacity = subtitleEnter < 1
    ? easeOutCubic(subtitleEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1
  const subtitleY = subtitleEnter < 1
    ? 20 * (1 - easeOutCubic(subtitleEnter))
    : exitProgress > 0
      ? 20 * easeInCubic(exitProgress)
      : 0

  // Accent line draw-in
  const lineWidth = enterProgress < 1
    ? easeOutCubic(Math.max(0, (enterProgress - 0.15) / 0.85)) * 100
    : exitProgress > 0
      ? 100 * (1 - easeInCubic(exitProgress))
      : 100

  // Background gradient shift during hold
  const gradientAngle = 135 + holdProgress * 30

  // Layout positioning
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    padding: '8%',
    ...(layout === 'center' && {
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center' as const,
    }),
    ...(layout === 'left' && {
      justifyContent: 'center',
      alignItems: 'flex-start',
      textAlign: 'left' as const,
    }),
    ...(layout === 'bottom' && {
      justifyContent: 'flex-end',
      alignItems: 'flex-start',
      textAlign: 'left' as const,
      paddingBottom: '15%',
    }),
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background with gradient shift */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(${gradientAngle}deg, ${bgColor}, ${bgColor}ee, ${bgColor}cc)`,
        }}
      />

      <div style={containerStyle}>
        {/* Title */}
        <div
          style={{
            transform: `translateX(${titleX}%)`,
            opacity: titleOpacity,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(28px, 7vw, 80px)',
            fontWeight: 800,
            color: textColor,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            marginBottom: '0.3em',
          }}
        >
          {title}
        </div>

        {/* Accent line */}
        <div
          style={{
            width: `${lineWidth}%`,
            maxWidth: layout === 'center' ? '200px' : '120px',
            height: '4px',
            background: accentColor,
            borderRadius: '2px',
            marginBottom: '0.8em',
            ...(layout === 'center' && { margin: '0 auto 0.8em auto' }),
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            transform: `translateY(${subtitleY}px)`,
            opacity: subtitleOpacity,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(14px, 3vw, 32px)',
            fontWeight: 400,
            color: textColor,
            letterSpacing: '0.02em',
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-title-card',
  title: 'Scene Title Card',
  description: 'Elegant title card with elastic slide-in title, accent line, and delayed subtitle reveal',
  tags: ['scene', 'title', 'card', 'intro', 'layout'],
  category: 'scene-layout',
  component: SceneTitleCardComponent as any,
  defaultConfig: {
    title: 'Your Title Here',
    subtitle: 'A compelling subtitle goes here',
    bgColor: '#1a1a2e',
    textColor: '#ffffff',
    accentColor: '#e94560',
    layout: 'center',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Your Title Here', group: 'Content' },
    { key: 'subtitle', label: 'Subtitle', type: 'text', defaultValue: 'A compelling subtitle goes here', group: 'Content' },
    { key: 'bgColor', label: 'Background Color', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#e94560', group: 'Style' },
    { key: 'layout', label: 'Layout', type: 'select', defaultValue: 'center', options: ['center', 'left', 'bottom'], group: 'Layout' },
  ],
})
