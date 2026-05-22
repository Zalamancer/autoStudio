import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface VintageLabelConfig {
  brandName: string
  productType: string
  tagline: string
  year: string
  bgColor: string
  labelColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneVintageLabelComponent({
  config,
  frame,
  fps,
  durationInFrames,
}: MotionGraphicProps<VintageLabelConfig>) {
  const { brandName, productType, tagline, year, bgColor, labelColor, textColor, accentColor } = config
  const progress = frame / durationInFrames
  const time = frame / fps

  const enterEnd = 0.28
  const holdEnd = 0.78
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Label fades in with scale
  const labelScale = easeOutCubic(Math.min(1, enterProgress / 0.5))
  const labelOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Brand name drops in
  const brandProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.3)))
  const brandY = (1 - brandProgress) * -20

  // Product type slides up
  const prodProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.3)))
  const prodY = (1 - prodProgress) * 15

  // Tagline fades in
  const taglineOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.25)))

  // Year stamp
  const yearProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.65) / 0.25)))
  const yearScale = yearProgress < 0.5 ? 1.5 - yearProgress : 1 + (1 - yearProgress) * 0.05

  // Hold: subtle aged shimmer
  const holdShimmer = Math.sin(time * 1.5) * 0.02

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
        fontFamily: "'Georgia', 'Times New Roman', serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Woodgrain background texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(120,80,40,0.03) 0px, transparent 2px, rgba(100,60,20,0.02) 4px)',
          pointerEvents: 'none',
        }}
      />

      {/* Label container */}
      <div
        style={{
          position: 'relative',
          width: 'clamp(280px, 68vw, 440px)',
          padding: 'clamp(28px, 5.5vw, 48px) clamp(24px, 4.5vw, 40px)',
          background: labelColor,
          border: `3px solid ${accentColor}`,
          borderRadius: 6,
          textAlign: 'center',
          transform: `scale(${labelScale * exitScale})`,
          opacity: labelOpacity * exitOpacity,
          boxShadow: `0 8px 30px rgba(0,0,0,0.3), inset 0 0 20px rgba(160,120,60,${0.08 + holdShimmer})`,
        }}
      >
        {/* Inner decorative border */}
        <div
          style={{
            position: 'absolute',
            inset: 8,
            border: `1px solid ${accentColor}50`,
            borderRadius: 4,
            pointerEvents: 'none',
          }}
        />
        {/* Second inner border */}
        <div
          style={{
            position: 'absolute',
            inset: 12,
            border: `1px dashed ${accentColor}30`,
            borderRadius: 3,
            pointerEvents: 'none',
          }}
        />

        {/* Top ornamental line */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 'clamp(8px, 1.5vw, 14px)',
            opacity: brandProgress,
          }}
        >
          <div style={{ width: 'clamp(30px, 7vw, 55px)', height: 1, background: `${accentColor}60` }} />
          <div style={{ fontSize: 'clamp(10px, 1.8vw, 14px)', color: accentColor }}>&#9830;</div>
          <div style={{ width: 'clamp(30px, 7vw, 55px)', height: 1, background: `${accentColor}60` }} />
        </div>

        {/* Product type — small label */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.8vw, 14px)',
            fontWeight: 600,
            color: accentColor,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            opacity: prodProgress,
            transform: `translateY(${prodY}px)`,
            marginBottom: 'clamp(6px, 1.2vw, 10px)',
          }}
        >
          {productType}
        </div>

        {/* Brand name — large serif */}
        <div
          style={{
            fontSize: 'clamp(32px, 8vw, 64px)',
            fontWeight: 900,
            color: textColor,
            textTransform: 'uppercase',
            letterSpacing: 4,
            lineHeight: 1,
            opacity: brandProgress,
            transform: `translateY(${brandY}px)`,
            marginBottom: 'clamp(10px, 2vw, 18px)',
            textShadow: `1px 1px 0 ${accentColor}30`,
          }}
        >
          {brandName}
        </div>

        {/* Decorative divider */}
        <div
          style={{
            width: '50%',
            height: 2,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            margin: '0 auto',
            marginBottom: 'clamp(10px, 2vw, 16px)',
            opacity: taglineOpacity,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: 'clamp(11px, 2vw, 16px)',
            fontWeight: 400,
            fontStyle: 'italic',
            color: `${textColor}CC`,
            letterSpacing: '0.1em',
            opacity: taglineOpacity,
            marginBottom: 'clamp(12px, 2.5vw, 20px)',
          }}
        >
          {tagline}
        </div>

        {/* Year badge */}
        <div
          style={{
            display: 'inline-block',
            padding: 'clamp(4px, 0.8vw, 8px) clamp(12px, 2.5vw, 22px)',
            border: `1px solid ${accentColor}`,
            borderRadius: 3,
            fontSize: 'clamp(12px, 2.2vw, 18px)',
            fontWeight: 700,
            color: accentColor,
            letterSpacing: '0.15em',
            transform: `scale(${yearScale})`,
            opacity: yearProgress,
          }}
        >
          EST. {year}
        </div>

        {/* Bottom ornament */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 'clamp(10px, 2vw, 16px)',
            opacity: yearProgress * 0.6,
          }}
        >
          <div style={{ width: 'clamp(20px, 5vw, 40px)', height: 1, background: `${accentColor}40` }} />
          <div style={{ fontSize: 'clamp(8px, 1.4vw, 11px)', color: `${accentColor}80` }}>&#9733;</div>
          <div style={{ width: 'clamp(20px, 5vw, 40px)', height: 1, background: `${accentColor}40` }} />
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-vintage-label',
  title: 'Scene Vintage Label',
  description: 'Vintage product label with ornate borders, serif typography, year badge, decorative flourishes, and aged paper texture',
  tags: ['scene', 'vintage', 'label', 'retro', 'product', 'brand', 'ornate', 'aged'],
  category: 'scene-layout',
  component: SceneVintageLabelComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    brandName: 'HERITAGE',
    productType: 'PREMIUM QUALITY',
    tagline: 'Crafted with tradition since the golden age',
    year: '1928',
    bgColor: '#2C1A0E',
    labelColor: '#F5E6CC',
    textColor: '#3E2723',
    accentColor: '#8B6914',
  },
  configSchema: [
    { key: 'brandName', label: 'Brand Name', type: 'text', defaultValue: 'HERITAGE', group: 'Content' },
    { key: 'productType', label: 'Product Type', type: 'text', defaultValue: 'PREMIUM QUALITY', group: 'Content' },
    { key: 'tagline', label: 'Tagline', type: 'text', defaultValue: 'Crafted with tradition since the golden age', group: 'Content' },
    { key: 'year', label: 'Year', type: 'text', defaultValue: '1928', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2C1A0E', group: 'Style' },
    { key: 'labelColor', label: 'Label Color', type: 'color', defaultValue: '#F5E6CC', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#3E2723', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#8B6914', group: 'Style' },
  ],
})
