import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SponsoredPostConfig {
  brandName: string
  tagline: string
  discountCode: string
  bgColor: string
  accentColor: string
  cardColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneSponsoredPostComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<SponsoredPostConfig>) {
  const { brandName, tagline, discountCode, bgColor, accentColor, cardColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.25
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // "Ad" badge pops
  const adBadge = easeOutBack(Math.min(1, enterProgress / 0.25))

  // Brand logo/name slides in
  const brandSlide = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.3)))

  // Tagline
  const taglineReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.3)))

  // Code reveal with mask
  const codeReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.3)))

  // CTA button
  const ctaProgress = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.75) / 0.2)))

  // Hold: code shimmer
  const shimmerX = (holdProgress * 300) % 200 - 50

  // Hold: CTA pulse
  const ctaPulse = 1 + Math.sin(holdProgress * Math.PI * 6) * 0.04

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.12

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
      {/* Subtle brand color gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: `linear-gradient(180deg, ${accentColor}12 0%, transparent 100%)`,
          opacity: exitOpacity,
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(14px, 2.5vh, 24px)',
          width: '100%',
          maxWidth: 400,
          transform: `scale(${exitScale})`,
          opacity: exitOpacity,
        }}
      >
        {/* Paid partnership / Ad badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            opacity: adBadge,
            transform: `scale(${adBadge})`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(8px, 1.2vw, 10px)',
              fontWeight: 700,
              color: `${textColor}60`,
              letterSpacing: 2,
              textTransform: 'uppercase',
              padding: '3px 8px',
              border: `1px solid ${textColor}20`,
              borderRadius: 4,
            }}
          >
            PAID PARTNERSHIP
          </div>
        </div>

        {/* Brand logo circle + name */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            opacity: brandSlide,
            transform: `translateY(${(1 - brandSlide) * 20}px)`,
          }}
        >
          <div
            style={{
              width: 'clamp(56px, 11vw, 80px)',
              height: 'clamp(56px, 11vw, 80px)',
              borderRadius: 'clamp(14px, 2.5vw, 20px)',
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}90)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(22px, 4.5vw, 34px)',
              fontWeight: 900,
              color: '#FFFFFF',
              boxShadow: `0 8px 24px ${accentColor}30`,
            }}
          >
            {brandName.charAt(0).toUpperCase()}
          </div>
          <div
            style={{
              fontSize: 'clamp(20px, 4vw, 30px)',
              fontWeight: 900,
              color: textColor,
            }}
          >
            {brandName}
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 'clamp(12px, 2.2vw, 17px)',
            fontWeight: 500,
            color: `${textColor}80`,
            textAlign: 'center',
            opacity: taglineReveal,
            transform: `translateY(${(1 - taglineReveal) * 12}px)`,
            maxWidth: '85%',
            lineHeight: 1.5,
          }}
        >
          {tagline}
        </div>

        {/* Discount code card */}
        {discountCode && (
          <div
            style={{
              position: 'relative',
              background: cardColor,
              borderRadius: 'clamp(10px, 1.5vw, 14px)',
              padding: 'clamp(14px, 2.5vh, 22px) clamp(20px, 3.5vw, 32px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              border: `2px dashed ${accentColor}40`,
              opacity: codeReveal,
              transform: `scale(${0.9 + codeReveal * 0.1})`,
              overflow: 'hidden',
              width: '90%',
            }}
          >
            {/* Shimmer */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(105deg, transparent ${shimmerX - 30}%, ${accentColor}08 ${shimmerX}%, transparent ${shimmerX + 30}%)`,
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                fontSize: 'clamp(9px, 1.3vw, 11px)',
                fontWeight: 600,
                color: `${textColor}60`,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              USE CODE
            </div>
            <div
              style={{
                fontSize: 'clamp(22px, 5vw, 36px)',
                fontWeight: 900,
                color: accentColor,
                letterSpacing: 4,
                fontFamily: "'Courier New', monospace",
              }}
            >
              {discountCode}
            </div>
          </div>
        )}

        {/* CTA button */}
        <div
          style={{
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
            borderRadius: 'clamp(10px, 1.5vw, 14px)',
            padding: 'clamp(12px, 2vh, 18px) clamp(28px, 5vw, 44px)',
            fontSize: 'clamp(12px, 2vw, 16px)',
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: 2,
            textTransform: 'uppercase',
            transform: `scale(${ctaProgress * ctaPulse})`,
            boxShadow: `0 4px 20px ${accentColor}40`,
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          SHOP NOW
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-sponsored-post',
  title: 'Scene Sponsored Post',
  description:
    'Sponsored/ad disclosure card with paid partnership badge, brand logo, tagline, dashed discount code box with shimmer, and pulsing CTA.',
  tags: ['scene', 'social-media', 'sponsored', 'ad', 'brand', 'partnership', 'discount', 'creator'],
  category: 'scene-layout',
  component: SceneSponsoredPostComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'brandName', label: 'Brand Name', type: 'text', defaultValue: 'BrandCo', group: 'Content' },
    { key: 'tagline', label: 'Tagline', type: 'text', defaultValue: 'Premium products for creators who demand the best', group: 'Content' },
    { key: 'discountCode', label: 'Discount Code', type: 'text', defaultValue: 'CREATOR20', group: 'Content' },
    { key: 'accentColor', label: 'Brand Color', type: 'color', defaultValue: '#3B82F6', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#161625', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A14', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
  defaultConfig: {
    brandName: 'BrandCo',
    tagline: 'Premium products for creators who demand the best',
    discountCode: 'CREATOR20',
    accentColor: '#3B82F6',
    cardColor: '#161625',
    bgColor: '#0A0A14',
    textColor: '#FFFFFF',
  },
})
