import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TestimonialConfig {
  quote: string
  name: string
  role: string
  rating: number
  bgColor: string
  textColor: string
  accentColor: string
}

function SceneTestimonialComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<TestimonialConfig>) {
  const { quote, name, role, rating, bgColor, textColor, accentColor } = config
  const progress = frame / durationInFrames
  const clampedRating = Math.max(1, Math.min(5, Math.round(rating)))

  const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)
  const easeOutBack = (t: number): number => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  }

  // Stars stagger: 0.05-0.3
  const getStarProgress = (index: number): number => {
    const starStart = 0.05 + index * 0.05
    const starDur = 0.12
    return easeOutBack(Math.max(0, Math.min(1, (progress - starStart) / starDur)))
  }

  // Quotation marks: 0.1-0.25
  const quoteMarkProgress = easeOutCubic(
    Math.max(0, Math.min(1, (progress - 0.1) / 0.15))
  )

  // Quote text: 0.2-0.4
  const quoteProgress = easeOutCubic(
    Math.max(0, Math.min(1, (progress - 0.2) / 0.2))
  )

  // Name and role: 0.35-0.5
  const nameProgress = easeOutCubic(
    Math.max(0, Math.min(1, (progress - 0.35) / 0.15))
  )

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: "'Georgia', 'Times New Roman', serif",
        padding: '8%',
      }}
    >
      {/* Stars */}
      <div
        style={{
          display: 'flex',
          gap: 'clamp(4px, 1vw, 10px)',
          marginBottom: 'clamp(16px, 4vh, 32px)',
        }}
      >
        {Array.from({ length: 5 }, (_, i) => {
          const sp = i < clampedRating ? getStarProgress(i) : 0
          return (
            <div
              key={i}
              style={{
                fontSize: 'clamp(20px, 4vw, 36px)',
                transform: `scale(${sp})`,
                opacity: i < clampedRating ? (sp > 0 ? 1 : 0) : 0.2,
                filter:
                  i < clampedRating
                    ? `drop-shadow(0 0 4px ${accentColor}60)`
                    : 'none',
              }}
            >
              {'\u2B50'}
            </div>
          )
        })}
      </div>

      {/* Quote container */}
      <div
        style={{
          position: 'relative',
          maxWidth: 600,
          textAlign: 'center',
        }}
      >
        {/* Opening quotation mark */}
        <div
          style={{
            position: 'absolute',
            top: -30,
            left: -10,
            fontSize: 'clamp(48px, 10vw, 80px)',
            color: accentColor,
            opacity: quoteMarkProgress * 0.3,
            fontFamily: "'Georgia', serif",
            lineHeight: 1,
            transform: `scale(${quoteMarkProgress})`,
          }}
        >
          {'\u201C'}
        </div>

        {/* Quote text */}
        <div
          style={{
            fontSize: 'clamp(16px, 3vw, 26px)',
            fontWeight: 400,
            fontStyle: 'italic',
            color: textColor,
            lineHeight: 1.6,
            opacity: quoteProgress,
            transform: `translateY(${(1 - quoteProgress) * 20}px)`,
            padding: '0 clamp(20px, 5vw, 40px)',
          }}
        >
          {quote}
        </div>

        {/* Closing quotation mark */}
        <div
          style={{
            position: 'absolute',
            bottom: -50,
            right: -10,
            fontSize: 'clamp(48px, 10vw, 80px)',
            color: accentColor,
            opacity: quoteMarkProgress * 0.3,
            fontFamily: "'Georgia', serif",
            lineHeight: 1,
            transform: `scale(${quoteMarkProgress})`,
          }}
        >
          {'\u201D'}
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          width: `${nameProgress * 40}px`,
          height: 2,
          background: accentColor,
          borderRadius: 1,
          marginTop: 'clamp(20px, 4vh, 36px)',
          marginBottom: 'clamp(12px, 2vh, 20px)',
        }}
      />

      {/* Name */}
      <div
        style={{
          fontSize: 'clamp(16px, 3vw, 24px)',
          fontWeight: 700,
          color: textColor,
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          opacity: nameProgress,
          transform: `translateX(${(1 - nameProgress) * 40}px)`,
          letterSpacing: 1,
        }}
      >
        {name}
      </div>

      {/* Role */}
      <div
        style={{
          fontSize: 'clamp(12px, 2vw, 16px)',
          fontWeight: 400,
          color: `${textColor}99`,
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          opacity: nameProgress,
          transform: `translateX(${(1 - nameProgress) * 40}px)`,
          marginTop: 4,
          letterSpacing: 1,
        }}
      >
        {role}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-testimonial',
  title: 'Scene Testimonial',
  description:
    'Testimonial card with staggered star rating, quote with decorative marks, and sliding name/role',
  tags: ['scene', 'testimonial', 'quote', 'review', 'rating'],
  category: 'scene-layout',
  component: SceneTestimonialComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'quote', label: 'Quote', type: 'text', defaultValue: 'This product completely transformed the way our team works. Absolutely incredible results!', group: 'Content' },
    { key: 'name', label: 'Name', type: 'text', defaultValue: 'Sarah Johnson', group: 'Content' },
    { key: 'role', label: 'Role', type: 'text', defaultValue: 'CEO, TechCorp', group: 'Content' },
    { key: 'rating', label: 'Rating (1-5)', type: 'number', defaultValue: 5, min: 1, max: 5, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FFD700', group: 'Style' },
  ],
  defaultConfig: {
    quote: 'This product completely transformed the way our team works. Absolutely incredible results!',
    name: 'Sarah Johnson',
    role: 'CEO, TechCorp',
    rating: 5,
    bgColor: '#1A1A2E',
    textColor: '#FFFFFF',
    accentColor: '#FFD700',
  },
})
