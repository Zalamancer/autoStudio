import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneUnboxingConfig {
  productName: string
  tagline: string
  features: string[]
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneUnboxingComponent({ config, frame, durationInFrames }: MotionGraphicProps<SceneUnboxingConfig>) {
  const { productName, tagline, features, bgColor, cardColor, accentColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.25
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Box lid opens upward
  const lidOpen = easeOutCubic(Math.min(1, enterProgress / 0.4))
  const lidRotate = lidOpen * -120

  // Product rises from box
  const productRise = easeOutElastic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.5)))
  const productY = (1 - productRise) * 80

  // Sparkle particles burst on reveal
  const sparklePhase = Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.4))
  const sparkles = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2
    const dist = sparklePhase * 60
    const x = Math.cos(angle) * dist
    const y = Math.sin(angle) * dist
    const alpha = Math.max(0, 1 - sparklePhase * 1.2)
    return { x, y, alpha, size: 4 + (i % 3) * 2 }
  })

  // Feature tags stagger in
  const getFeatureProgress = (idx: number) =>
    easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.5 - idx * 0.08) / 0.3)))

  // Hold: gentle hover
  const hoverY = holdProgress > 0 ? Math.sin(holdProgress * Math.PI * 6) * 4 : 0

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
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Radial glow behind */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          width: '80%',
          height: '80%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${accentColor}18, transparent 65%)`,
          opacity: productRise * exitOpacity,
        }}
      />

      <div
        style={{
          opacity: exitOpacity,
          transform: `translateY(${exitEased * -60}px) scale(${1 - exitEased * 0.1})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '85%',
          maxWidth: 420,
        }}
      >
        {/* Box with lid */}
        <div style={{ position: 'relative', width: '60%', maxWidth: 200, marginBottom: 'clamp(16px, 3vw, 28px)' }}>
          {/* Box body */}
          <div
            style={{
              width: '100%',
              aspectRatio: '1/0.7',
              background: cardColor,
              borderRadius: 'clamp(8px, 1.5vw, 12px)',
              border: `2px solid ${accentColor}40`,
              boxShadow: `0 8px 30px rgba(0,0,0,0.15)`,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Box ribbon */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: '50%',
                width: 'clamp(6px, 1.5vw, 12px)',
                transform: 'translateX(-50%)',
                background: accentColor,
                opacity: 0.6,
              }}
            />
            {/* Product icon rising */}
            <div
              style={{
                position: 'absolute',
                bottom: `${20 + productRise * 10}%`,
                left: '50%',
                transform: `translate(-50%, ${productY}px)`,
                fontSize: 'clamp(28px, 6vw, 52px)',
                opacity: productRise,
              }}
            >
              {'📦'}
            </div>
          </div>

          {/* Lid */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '-4%',
              width: '108%',
              height: '30%',
              background: cardColor,
              borderRadius: 'clamp(8px, 1.5vw, 12px) clamp(8px, 1.5vw, 12px) 0 0',
              border: `2px solid ${accentColor}40`,
              borderBottom: 'none',
              transformOrigin: 'top center',
              transform: `perspective(400px) rotateX(${lidRotate}deg)`,
              boxShadow: '0 -2px 10px rgba(0,0,0,0.08)',
              zIndex: 2,
            }}
          >
            {/* Ribbon bow */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translate(-50%, 50%)',
                width: 'clamp(16px, 3vw, 24px)',
                height: 'clamp(16px, 3vw, 24px)',
                borderRadius: '50%',
                background: accentColor,
              }}
            />
          </div>

          {/* Sparkles */}
          {sparkles.map((s, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '40%',
                left: '50%',
                width: s.size,
                height: s.size,
                borderRadius: '50%',
                background: accentColor,
                transform: `translate(calc(-50% + ${s.x}px), calc(-50% + ${s.y}px))`,
                opacity: s.alpha * exitOpacity,
                boxShadow: `0 0 6px ${accentColor}80`,
              }}
            />
          ))}
        </div>

        {/* Product name */}
        <div
          style={{
            fontSize: 'clamp(20px, 5vw, 36px)',
            fontWeight: 900,
            color: textColor,
            textAlign: 'center',
            opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.3))),
            transform: `translateY(${(1 - easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.3)))) * 20 + hoverY}px)`,
            marginBottom: 'clamp(4px, 1vw, 8px)',
          }}
        >
          {productName}
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 'clamp(11px, 2vw, 16px)',
            fontWeight: 500,
            color: `${textColor}88`,
            textAlign: 'center',
            opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.45) / 0.3))),
            marginBottom: 'clamp(12px, 2.5vw, 20px)',
          }}
        >
          {tagline}
        </div>

        {/* Feature tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(4px, 0.8vw, 8px)', justifyContent: 'center' }}>
          {features.map((feat, i) => {
            const fp = getFeatureProgress(i)
            return (
              <div
                key={i}
                style={{
                  fontSize: 'clamp(9px, 1.5vw, 13px)',
                  fontWeight: 700,
                  color: accentColor,
                  background: `${accentColor}15`,
                  border: `1px solid ${accentColor}30`,
                  padding: 'clamp(3px, 0.5vw, 6px) clamp(8px, 1.2vw, 14px)',
                  borderRadius: 100,
                  transform: `scale(${fp})`,
                  opacity: fp,
                }}
              >
                {feat}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-unboxing',
  title: 'Unboxing Reveal',
  description: 'Product unboxing card with opening lid, product rise, sparkle burst, and feature tags reveal',
  tags: ['scene', 'unboxing', 'product', 'reveal', 'shopping', 'ecommerce'],
  category: 'scene-layout',
  component: SceneUnboxingComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    productName: 'Premium Gadget Pro',
    tagline: 'Unbox the future',
    features: ['Wireless', '48hr Battery', 'Water Resistant', 'Noise Cancel'],
    bgColor: '#0F0F14',
    cardColor: '#1E1E2A',
    accentColor: '#F59E0B',
    textColor: '#FFFFFF',
  },
  configSchema: [
    { key: 'productName', label: 'Product Name', type: 'text', defaultValue: 'Premium Gadget Pro', group: 'Content' },
    { key: 'tagline', label: 'Tagline', type: 'text', defaultValue: 'Unbox the future', group: 'Content' },
    { key: 'features', label: 'Features', type: 'text-array', defaultValue: ['Wireless', '48hr Battery', 'Water Resistant', 'Noise Cancel'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F0F14', group: 'Style' },
    { key: 'cardColor', label: 'Box Color', type: 'color', defaultValue: '#1E1E2A', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#F59E0B', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
})
