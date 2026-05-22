import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TestimonialCardConfig {
  quote: string
  authorName: string
  authorTitle: string
  rating: number
  cardColor: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneTestimonialCardComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<TestimonialCardConfig>) {
  const { quote, authorName, authorTitle, rating, cardColor, bgColor, textColor, accentColor } = config
  const progress = frame / durationInFrames

  // Phase breakdown
  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Quote marks scale in
  const quoteMarkScale = elasticOut(Math.min(1, enterProgress / 0.3))

  // Word-by-word typing
  const words = quote.split(' ')
  const typingStart = 0.15
  const typingEnd = 0.7
  const typingProgress = Math.max(0, Math.min(1, (enterProgress - typingStart) / (typingEnd - typingStart)))
  const visibleWords = Math.ceil(typingProgress * words.length)

  // Author info fades up
  const authorOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.75) / 0.25)))
  const authorY = (1 - authorOpacity) * 20

  // Stars pop in one by one
  const clampedRating = Math.min(5, Math.max(0, Math.round(rating)))
  const getStarProgress = (idx: number): number => {
    const starStart = 0.8 + idx * 0.04
    return elasticOut(Math.max(0, Math.min(1, (enterProgress - starStart) / 0.15)))
  }

  // Hold: subtle card float
  const floatY = Math.sin(holdProgress * Math.PI * 3) * 3

  // Exit: card slides down
  const exitEased = easeOutCubic(exitProgress)
  const exitY = exitEased * 120
  const exitOpacity = 1 - exitEased

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
        fontFamily: "'Georgia', 'Times New Roman', serif",
        padding: '8%',
      }}
    >
      {/* Card */}
      <div
        style={{
          background: cardColor,
          borderRadius: 'clamp(12px, 2vw, 24px)',
          padding: 'clamp(24px, 5%, 48px)',
          maxWidth: 520,
          width: '100%',
          boxShadow: `0 8px 40px ${bgColor === '#0A0A0F' || bgColor.startsWith('#0') ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.15)'}`,
          transform: `translateY(${floatY + exitY}px)`,
          opacity: exitOpacity,
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(12px, 2vh, 24px)',
        }}
      >
        {/* Opening quote mark */}
        <div
          style={{
            fontSize: 'clamp(40px, 8vw, 72px)',
            fontWeight: 700,
            color: accentColor,
            lineHeight: 0.6,
            transform: `scale(${quoteMarkScale})`,
            transformOrigin: 'left top',
            opacity: 0.6,
          }}
        >
          {'\u201C'}
        </div>

        {/* Quote text */}
        <div
          style={{
            fontSize: 'clamp(14px, 2.5vw, 22px)',
            fontStyle: 'italic',
            color: textColor,
            lineHeight: 1.6,
            minHeight: 'clamp(60px, 12vh, 120px)',
          }}
        >
          {words.map((word, i) => (
            <span
              key={i}
              style={{
                opacity: i < visibleWords ? 1 : 0,
                transition: 'none',
              }}
            >
              {word}{i < words.length - 1 ? ' ' : ''}
            </span>
          ))}
        </div>

        {/* Divider */}
        <div
          style={{
            width: '40px',
            height: 2,
            background: accentColor,
            borderRadius: 1,
            opacity: authorOpacity,
          }}
        />

        {/* Author info */}
        <div
          style={{
            opacity: authorOpacity,
            transform: `translateY(${authorY}px)`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(13px, 2.2vw, 18px)',
              fontWeight: 700,
              color: textColor,
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              fontStyle: 'normal',
            }}
          >
            {authorName}
          </div>
          <div
            style={{
              fontSize: 'clamp(11px, 1.8vw, 14px)',
              color: `${textColor}99`,
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              fontStyle: 'normal',
              marginTop: 4,
            }}
          >
            {authorTitle}
          </div>
        </div>

        {/* Star rating */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(4px, 0.8vw, 8px)',
          }}
        >
          {Array.from({ length: clampedRating }).map((_, i) => (
            <div
              key={i}
              style={{
                fontSize: 'clamp(16px, 2.5vw, 24px)',
                transform: `scale(${getStarProgress(i)})`,
                lineHeight: 1,
              }}
            >
              {'\u2B50'}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-testimonial-card',
  title: 'Scene Testimonial Card',
  description:
    'Customer testimonial card with word-by-word quote typing, author info fade-in, and star rating pop-in',
  tags: ['scene', 'brand', 'testimonial', 'review', 'quote', 'business'],
  category: 'scene-layout',
  component: SceneTestimonialCardComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'quote', label: 'Quote', type: 'text', defaultValue: 'This product completely transformed how we work. The attention to detail is remarkable and the results speak for themselves.', group: 'Content' },
    { key: 'authorName', label: 'Author Name', type: 'text', defaultValue: 'Sarah Johnson', group: 'Content' },
    { key: 'authorTitle', label: 'Author Title', type: 'text', defaultValue: 'CEO, TechVentures Inc.', group: 'Content' },
    { key: 'rating', label: 'Star Rating', type: 'number', defaultValue: 5, min: 1, max: 5, group: 'Content' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A0F', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#6366F1', group: 'Style' },
  ],
  defaultConfig: {
    quote: 'This product completely transformed how we work. The attention to detail is remarkable and the results speak for themselves.',
    authorName: 'Sarah Johnson',
    authorTitle: 'CEO, TechVentures Inc.',
    rating: 5,
    cardColor: '#FFFFFF',
    bgColor: '#0A0A0F',
    textColor: '#1A1A2E',
    accentColor: '#6366F1',
  },
})
