import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneBookCoverConfig {
  bookTitle: string
  authorName: string
  genre: string
  rating: number
  bgColor: string
  coverColor: string
  textColor: string
  accentColor: string
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

function SceneBookCoverComponent({ config, progress }: MotionGraphicProps<SceneBookCoverConfig>) {
  const { bookTitle, authorName, genre, rating, bgColor, coverColor, textColor, accentColor } =
    config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress =
    progress >= 0.25 && progress < 0.8
      ? (progress - 0.25) / 0.55
      : progress >= 0.8
        ? 1
        : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Book flips open with 3D perspective
  const bookFlip = easeOutBack(Math.min(1, enterProgress / 0.7))
  const bookRotateY = (1 - bookFlip) * 70

  // Staggered reveals
  const titleReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.5)))
  const authorReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.4)))
  const genreReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.35)))
  const starsReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.65) / 0.3)))

  // Hold: gentle float
  const floatY = holdProgress > 0 ? Math.sin(holdProgress * Math.PI * 4) * 4 : 0

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.15

  const fullStars = Math.floor(rating)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Georgia', 'Palatino Linotype', serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6%',
      }}
    >
      {/* Warm radial glow */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          height: '60%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}10, transparent 70%)`,
        }}
      />

      <div
        style={{
          display: 'flex',
          gap: 'clamp(16px, 4vw, 36px)',
          alignItems: 'center',
          opacity: exitOpacity,
          transform: `scale(${exitScale}) translateY(${floatY}px)`,
          maxWidth: 540,
          width: '100%',
        }}
      >
        {/* Book cover */}
        <div
          style={{
            minWidth: 'clamp(80px, 22vw, 160px)',
            aspectRatio: '2/3',
            background: `linear-gradient(135deg, ${coverColor}, ${coverColor}dd)`,
            borderRadius: 'clamp(4px, 0.8vw, 8px)',
            boxShadow: `6px 6px 20px rgba(0,0,0,0.4), inset -2px 0 6px rgba(255,255,255,0.1)`,
            transform: `perspective(600px) rotateY(${bookRotateY}deg)`,
            transformOrigin: 'left center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(8px, 2vw, 16px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Spine edge */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 'clamp(4px, 0.8vw, 8px)',
              background: `linear-gradient(180deg, ${accentColor}60, ${accentColor}30)`,
            }}
          />
          {/* Cover title */}
          <div
            style={{
              fontSize: 'clamp(10px, 2.5vw, 18px)',
              fontWeight: 700,
              color: '#f5f0e8',
              textAlign: 'center',
              lineHeight: 1.2,
              textShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }}
          >
            {bookTitle}
          </div>
          {/* Cover ornament */}
          <div
            style={{
              width: '40%',
              height: 1,
              background: 'rgba(245,240,232,0.3)',
              margin: 'clamp(4px, 1vw, 8px) 0',
            }}
          />
          <div
            style={{
              fontSize: 'clamp(7px, 1.4vw, 11px)',
              color: 'rgba(245,240,232,0.7)',
              textAlign: 'center',
            }}
          >
            {authorName}
          </div>
        </div>

        {/* Book info */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 1.5vw, 14px)' }}>
          {/* Genre badge */}
          <div
            style={{
              display: 'inline-block',
              alignSelf: 'flex-start',
              background: `${accentColor}20`,
              color: accentColor,
              fontSize: 'clamp(8px, 1.4vw, 12px)',
              fontWeight: 700,
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: 'clamp(3px, 0.5vw, 6px) clamp(8px, 1.5vw, 14px)',
              borderRadius: 100,
              border: `1px solid ${accentColor}30`,
              opacity: genreReveal,
              transform: `scale(${genreReveal})`,
            }}
          >
            {genre}
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 'clamp(20px, 5vw, 36px)',
              fontWeight: 700,
              color: textColor,
              lineHeight: 1.15,
              opacity: titleReveal,
              transform: `translateY(${(1 - titleReveal) * 15}px)`,
            }}
          >
            {bookTitle}
          </div>

          {/* Author */}
          <div
            style={{
              fontSize: 'clamp(12px, 2.2vw, 18px)',
              fontWeight: 400,
              fontStyle: 'italic',
              color: `${textColor}88`,
              opacity: authorReveal,
              transform: `translateY(${(1 - authorReveal) * 10}px)`,
            }}
          >
            by {authorName}
          </div>

          {/* Star rating */}
          <div
            style={{
              display: 'flex',
              gap: 3,
              alignItems: 'center',
              opacity: starsReveal,
              transform: `translateY(${(1 - starsReveal) * 8}px)`,
            }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  fontSize: 'clamp(12px, 2vw, 18px)',
                  color: i < fullStars ? '#FACC15' : `${textColor}25`,
                }}
              >
                {'\u2605'}
              </div>
            ))}
            <span
              style={{
                fontSize: 'clamp(10px, 1.6vw, 14px)',
                color: `${textColor}60`,
                marginLeft: 4,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-book-cover',
  title: 'Book Cover',
  description:
    'Book cover display card with 3D flip-open animation, genre badge, star rating, and author info. Warm literary tones.',
  tags: ['scene', 'book', 'cover', 'reading', 'review', 'literary', 'literature'],
  category: 'scene-layout',
  component: SceneBookCoverComponent as any,
  defaultConfig: {
    bookTitle: 'The Great Gatsby',
    authorName: 'F. Scott Fitzgerald',
    genre: 'Classic Fiction',
    rating: 4.5,
    bgColor: '#1a150e',
    coverColor: '#2d5a47',
    textColor: '#f5edd6',
    accentColor: '#C9A96E',
  },
  configSchema: [
    { key: 'bookTitle', label: 'Book Title', type: 'text', defaultValue: 'The Great Gatsby', group: 'Content' },
    { key: 'authorName', label: 'Author', type: 'text', defaultValue: 'F. Scott Fitzgerald', group: 'Content' },
    { key: 'genre', label: 'Genre', type: 'text', defaultValue: 'Classic Fiction', group: 'Content' },
    { key: 'rating', label: 'Rating (1-5)', type: 'number', defaultValue: 4.5, min: 1, max: 5, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a150e', group: 'Style' },
    { key: 'coverColor', label: 'Cover Color', type: 'color', defaultValue: '#2d5a47', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f5edd6', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#C9A96E', group: 'Style' },
  ],
})
