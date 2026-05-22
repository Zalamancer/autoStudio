import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ProductRevealConfig {
  productName: string
  tagline: string
  price: string
  accentColor: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneProductRevealComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<ProductRevealConfig>) {
  const { productName, tagline, price, accentColor, bgColor, textColor } = config
  const progress = frame / durationInFrames

  // Phase breakdown
  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Curtain wipe: two halves slide apart
  const curtainEased = easeOutCubic(enterProgress)
  const curtainOffset = curtainEased * 55 // percentage

  // Product name opacity (after curtain starts opening)
  const nameOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.5)))

  // Spotlight radial gradient follows progress
  const spotlightX = 30 + holdProgress * 40
  const spotlightY = 40 + Math.sin(holdProgress * Math.PI * 2) * 5
  const spotlightSize = 30 + enterProgress * 20

  // Tagline fades in after name
  const taglineOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.4)))
  const taglineY = (1 - taglineOpacity) * 20

  // Price fades in last
  const priceOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.75) / 0.25)))
  const priceY = (1 - priceOpacity) * 15

  // Shimmer sweep across text
  const shimmerCycle = holdProgress * 2 // repeats during hold
  const shimmerX = ((shimmerCycle % 1) * 200) - 50 // -50 to 150%

  // Exit: fade with blur
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitBlur = exitEased * 12

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        filter: exitProgress > 0 ? `blur(${exitBlur}px)` : undefined,
        opacity: exitOpacity,
      }}
    >
      {/* Spotlight background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at ${spotlightX}% ${spotlightY}%, ${accentColor}18 0%, transparent ${spotlightSize}%)`,
        }}
      />

      {/* Curtain left */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '50%',
          height: '100%',
          background: accentColor,
          transform: `translateX(-${curtainOffset}%)`,
          zIndex: 2,
        }}
      />
      {/* Curtain right */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '50%',
          height: '100%',
          background: accentColor,
          transform: `translateX(${curtainOffset}%)`,
          zIndex: 2,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
          padding: '8%',
        }}
      >
        {/* Product name */}
        <div
          style={{
            position: 'relative',
            fontSize: 'clamp(28px, 6vw, 64px)',
            fontWeight: 900,
            color: textColor,
            opacity: nameOpacity,
            letterSpacing: 4,
            textTransform: 'uppercase',
            textAlign: 'center',
            lineHeight: 1.1,
          }}
        >
          {productName}
          {/* Shimmer overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(105deg, transparent ${shimmerX - 15}%, ${accentColor}40 ${shimmerX}%, transparent ${shimmerX + 15}%)`,
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Accent line */}
        <div
          style={{
            width: `${nameOpacity * 80}px`,
            height: 2,
            background: accentColor,
            margin: 'clamp(12px, 2vh, 24px) 0',
            borderRadius: 1,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: 'clamp(14px, 2.5vw, 24px)',
            fontWeight: 400,
            color: textColor,
            opacity: taglineOpacity * 0.8,
            transform: `translateY(${taglineY}px)`,
            letterSpacing: 2,
            textAlign: 'center',
          }}
        >
          {tagline}
        </div>

        {/* Price */}
        <div
          style={{
            fontSize: 'clamp(20px, 4vw, 40px)',
            fontWeight: 700,
            color: accentColor,
            opacity: priceOpacity,
            transform: `translateY(${priceY}px)`,
            marginTop: 'clamp(16px, 3vh, 32px)',
          }}
        >
          {price}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-product-reveal',
  title: 'Scene Product Reveal',
  description:
    'Product showcase with dramatic curtain reveal, spotlight effect, shimmer sweep, and price/tagline fade-in',
  tags: ['scene', 'brand', 'product', 'reveal', 'showcase', 'business'],
  category: 'scene-layout',
  component: SceneProductRevealComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'productName', label: 'Product Name', type: 'text', defaultValue: 'AirPods Pro', group: 'Content' },
    { key: 'tagline', label: 'Tagline', type: 'text', defaultValue: 'Immersive Sound', group: 'Content' },
    { key: 'price', label: 'Price', type: 'text', defaultValue: '$249', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#D4A853', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A0F', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
  defaultConfig: {
    productName: 'AirPods Pro',
    tagline: 'Immersive Sound',
    price: '$249',
    accentColor: '#D4A853',
    bgColor: '#0A0A0F',
    textColor: '#FFFFFF',
  },
})
