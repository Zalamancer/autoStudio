import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RetroAdConfig {
  headline: string
  productName: string
  tagline: string
  price: string
  bgColor: string
  cardColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c = 1.70158
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneRetroAdComponent({
  config,
  frame,
  fps,
  durationInFrames,
}: MotionGraphicProps<RetroAdConfig>) {
  const { headline, productName, tagline, price, bgColor, cardColor, textColor, accentColor } = config
  const progress = frame / durationInFrames
  const time = frame / fps

  const enterEnd = 0.3
  const holdEnd = 0.78
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Poster slams in from bottom
  const posterSlide = easeOutBack(Math.min(1, enterProgress / 0.5))
  const posterY = (1 - posterSlide) * 150
  const posterOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Headline drops down
  const headlineProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.3)))
  const headlineY = (1 - headlineProgress) * -30

  // Product name scales in
  const nameProgress = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.3)))
  const nameScale = nameProgress

  // Tagline slides in
  const tagProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.25)))

  // Price badge pops
  const priceProgress = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.65) / 0.25)))
  const priceScale = priceProgress

  // Hold: price badge pulses
  const pricePulse = 1 + Math.sin(holdProgress * Math.PI * 5) * 0.03

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitY = exitEased * -100

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
      {/* Halftone dot pattern background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(180,140,80,0.04) 1px, transparent 1px)',
          backgroundSize: '8px 8px',
          pointerEvents: 'none',
        }}
      />

      {/* Ad poster card */}
      <div
        style={{
          position: 'relative',
          width: 'clamp(290px, 70vw, 460px)',
          padding: 'clamp(26px, 5vw, 44px)',
          background: cardColor,
          border: `4px solid ${accentColor}`,
          transform: `translateY(${posterY + exitY}px)`,
          opacity: posterOpacity * exitOpacity,
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
        }}
      >
        {/* Corner accent blocks */}
        {[
          { top: -4, left: -4 },
          { top: -4, right: -4 },
          { bottom: -4, left: -4 },
          { bottom: -4, right: -4 },
        ].map((pos, i) => (
          <div
            key={`corner-${i}`}
            style={{
              position: 'absolute',
              ...pos,
              width: 14,
              height: 14,
              background: accentColor,
            } as any}
          />
        ))}

        {/* Headline banner */}
        <div
          style={{
            background: accentColor,
            color: cardColor,
            fontSize: 'clamp(10px, 1.8vw, 15px)',
            fontWeight: 800,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            padding: 'clamp(6px, 1.2vw, 10px) clamp(12px, 2.5vw, 22px)',
            marginBottom: 'clamp(16px, 3vw, 26px)',
            opacity: headlineProgress,
            transform: `translateY(${headlineY}px)`,
          }}
        >
          {headline}
        </div>

        {/* Starburst decoration */}
        <div
          style={{
            position: 'absolute',
            top: 'clamp(60px, 14%, 90px)',
            right: 'clamp(10px, 3%, 20px)',
            width: 'clamp(40px, 9vw, 65px)',
            height: 'clamp(40px, 9vw, 65px)',
            borderRadius: '50%',
            background: accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${priceScale * pricePulse}) rotate(${time * 20}deg)`,
            boxShadow: `0 2px 10px ${accentColor}40`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(10px, 1.8vw, 15px)',
              fontWeight: 900,
              color: cardColor,
              transform: `rotate(${-time * 20}deg)`,
              textAlign: 'center',
              lineHeight: 1.1,
            }}
          >
            {price}
          </div>
        </div>

        {/* Product illustration placeholder */}
        <div
          style={{
            width: 'clamp(80px, 20vw, 140px)',
            height: 'clamp(80px, 20vw, 140px)',
            margin: '0 auto',
            marginBottom: 'clamp(14px, 3vw, 24px)',
            borderRadius: '50%',
            border: `3px solid ${accentColor}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${accentColor}08`,
            transform: `scale(${nameScale})`,
          }}
        >
          <div style={{ fontSize: 'clamp(30px, 7vw, 50px)' }}>&#9733;</div>
        </div>

        {/* Product name */}
        <div
          style={{
            fontSize: 'clamp(28px, 7vw, 52px)',
            fontWeight: 900,
            color: textColor,
            textTransform: 'uppercase',
            letterSpacing: 3,
            lineHeight: 1.05,
            transform: `scale(${nameScale})`,
            marginBottom: 'clamp(10px, 2vw, 18px)',
          }}
        >
          {productName}
        </div>

        {/* Divider */}
        <div
          style={{
            width: '40%',
            height: 2,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            margin: '0 auto',
            marginBottom: 'clamp(10px, 2vw, 16px)',
            opacity: tagProgress,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: 'clamp(12px, 2.2vw, 17px)',
            fontStyle: 'italic',
            color: `${textColor}BB`,
            opacity: tagProgress,
            letterSpacing: '0.05em',
            marginBottom: 'clamp(14px, 3vw, 22px)',
          }}
        >
          {tagline}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: `2px solid ${accentColor}40`,
            paddingTop: 'clamp(8px, 1.5vw, 14px)',
            fontSize: 'clamp(9px, 1.5vw, 12px)',
            fontWeight: 600,
            color: `${textColor}80`,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            opacity: tagProgress * 0.7,
          }}
        >
          SATISFACTION GUARANTEED
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-retro-ad',
  title: 'Scene Retro Ad',
  description: 'Retro advertisement poster with bold headline banner, starburst price badge, halftone dots, and vintage typography',
  tags: ['scene', 'retro', 'ad', 'advertisement', 'vintage', 'poster', 'product', '1950s'],
  category: 'scene-layout',
  component: SceneRetroAdComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    headline: 'AMAZING NEW DISCOVERY',
    productName: 'WONDER TONIC',
    tagline: 'The finest quality you can trust',
    price: 'ONLY\n$2.99',
    bgColor: '#2C1A0E',
    cardColor: '#FFF8E7',
    textColor: '#2C1A0E',
    accentColor: '#B8432F',
  },
  configSchema: [
    { key: 'headline', label: 'Headline', type: 'text', defaultValue: 'AMAZING NEW DISCOVERY', group: 'Content' },
    { key: 'productName', label: 'Product Name', type: 'text', defaultValue: 'WONDER TONIC', group: 'Content' },
    { key: 'tagline', label: 'Tagline', type: 'text', defaultValue: 'The finest quality you can trust', group: 'Content' },
    { key: 'price', label: 'Price Text', type: 'text', defaultValue: 'ONLY\n$2.99', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2C1A0E', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFF8E7', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2C1A0E', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#B8432F', group: 'Style' },
  ],
})
