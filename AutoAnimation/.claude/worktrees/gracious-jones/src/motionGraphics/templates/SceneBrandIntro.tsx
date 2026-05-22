import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BrandIntroConfig {
  brandName: string
  tagline: string
  brandColor: string
  accentColor: string
  bgColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneBrandIntroComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<BrandIntroConfig>) {
  const { brandName, tagline, brandColor, accentColor, bgColor } = config
  const progress = frame / durationInFrames

  // Phase breakdown
  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  const letters = brandName.split('')

  // Each letter pops in with elastic scale, staggered
  const getLetterProgress = (idx: number): number => {
    const stagger = 0.06
    const letterStart = idx * stagger
    const letterDur = 0.4
    return elasticOut(Math.max(0, Math.min(1, (enterProgress - letterStart) / letterDur)))
  }

  // All letters landed?
  const allLettersLanded = enterProgress > letters.length * 0.06 + 0.4

  // Tagline slides up after letters land
  const taglineStart = Math.min(0.7, letters.length * 0.06 + 0.3)
  const taglineOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - taglineStart) / 0.25)))
  const taglineY = (1 - taglineOpacity) * 25

  // Accent line draws between name and tagline
  const lineStart = taglineStart - 0.05
  const lineWidth = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - lineStart) / 0.2))) * 100

  // Hold: letters micro-float at different phases
  const getLetterFloat = (idx: number): number => {
    return Math.sin(holdProgress * Math.PI * 3 + idx * 0.8) * 2
  }

  // Exit: letters scatter outward
  const exitEased = easeInCubic(exitProgress)
  const getLetterExitX = (idx: number): number => {
    const center = (letters.length - 1) / 2
    const offset = idx - center
    return exitEased * offset * 40
  }
  const getLetterExitY = (idx: number): number => {
    return exitEased * (idx % 2 === 0 ? -60 : 60)
  }
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
      {/* Subtle radial background glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, ${brandColor}10 0%, transparent 60%)`,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(8px, 1.5vh, 16px)',
          opacity: exitOpacity,
        }}
      >
        {/* Brand name letters */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {letters.map((letter, i) => {
            const lp = getLetterProgress(i)
            const floatY = allLettersLanded ? getLetterFloat(i) : 0
            const exitX = getLetterExitX(i)
            const exitY = getLetterExitY(i)

            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  fontSize: 'clamp(36px, 8vw, 80px)',
                  fontWeight: 900,
                  color: brandColor,
                  letterSpacing: 'clamp(4px, 1vw, 12px)',
                  lineHeight: 1,
                  transform: `scale(${lp}) translateY(${floatY + exitY}px) translateX(${exitX}px)`,
                  opacity: lp > 0.01 ? 1 : 0,
                }}
              >
                {letter}
              </span>
            )
          })}
        </div>

        {/* Accent line */}
        <div
          style={{
            width: `${lineWidth}px`,
            maxWidth: '50%',
            height: 2,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            borderRadius: 1,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: 'clamp(13px, 2.5vw, 22px)',
            fontWeight: 400,
            color: `${brandColor}CC`,
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            letterSpacing: 3,
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          {tagline}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-brand-intro',
  title: 'Scene Brand Intro',
  description:
    'Brand introduction with staggered elastic letter pop-in, accent line draw, tagline slide, and scatter exit',
  tags: ['scene', 'brand', 'intro', 'logo', 'identity', 'business'],
  category: 'scene-layout',
  component: SceneBrandIntroComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'brandName', label: 'Brand Name', type: 'text', defaultValue: 'ACME', group: 'Content' },
    { key: 'tagline', label: 'Tagline', type: 'text', defaultValue: 'Building the future', group: 'Content' },
    { key: 'brandColor', label: 'Brand Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#6366F1', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A14', group: 'Style' },
  ],
  defaultConfig: {
    brandName: 'ACME',
    tagline: 'Building the future',
    brandColor: '#FFFFFF',
    accentColor: '#6366F1',
    bgColor: '#0A0A14',
  },
})
