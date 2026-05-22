import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BookReviewConfig {
  bookTitle: string
  author: string
  rating: number
  review: string
  bgColor: string
  spineColor: string
  cardColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneBookReviewComponent({ config, progress }: MotionGraphicProps<BookReviewConfig>) {
  const { bookTitle, author, rating, review, bgColor, spineColor, cardColor, textColor, accentColor } = config
  const clampedRating = Math.min(5, Math.max(0, Math.round(rating)))

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Book slides in from left (spine aesthetic)
  const bookEnter = easeOutCubic(Math.min(1, enterProgress / 0.4))
  const bookX = (1 - bookEnter) * -80

  // Title enters
  const titleEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.3)))

  // Author fades up
  const authorEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.25)))

  // Stars pop in one by one
  const getStarProgress = (idx: number): number => {
    const starStart = 0.5 + idx * 0.06
    return elasticOut(Math.max(0, Math.min(1, (enterProgress - starStart) / 0.2)))
  }

  // Review text
  const reviewEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.3)))

  // Hold: subtle book "breathing"
  const breathScale = 1 + Math.sin(holdProgress * Math.PI * 4) * 0.008

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      {/* Subtle paper texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, ${textColor}04 39px, ${textColor}04 40px)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6% 8%',
          gap: 'clamp(16px, 3vw, 32px)',
          opacity: exitOpacity,
          transform: `translateX(${exitEased * -60}px) scale(${breathScale})`,
        }}
      >
        {/* Book spine / cover */}
        <div
          style={{
            width: 'clamp(60px, 14vw, 120px)',
            minHeight: 'clamp(160px, 40vh, 320px)',
            background: spineColor,
            borderRadius: 'clamp(4px, 0.6vw, 8px)',
            boxShadow: `4px 4px 20px rgba(0,0,0,0.3), inset -2px 0 4px rgba(0,0,0,0.2)`,
            transform: `translateX(${bookX}px)`,
            opacity: bookEnter,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(12px, 2vh, 24px) clamp(6px, 1vw, 12px)',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          {/* Spine decoration lines */}
          <div style={{ position: 'absolute', top: 'clamp(8px, 1.5vh, 16px)', left: '15%', right: '15%', height: 2, background: `${textColor}30` }} />
          <div style={{ position: 'absolute', bottom: 'clamp(8px, 1.5vh, 16px)', left: '15%', right: '15%', height: 2, background: `${textColor}30` }} />

          {/* Vertical title on spine */}
          <div
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              transform: 'rotate(180deg)',
              fontSize: 'clamp(10px, 1.8vw, 16px)',
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxHeight: '70%',
            }}
          >
            {bookTitle}
          </div>
        </div>

        {/* Review content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(8px, 1.5vh, 16px)',
            flex: 1,
            maxWidth: 340,
          }}
        >
          {/* Book title */}
          <div
            style={{
              fontSize: 'clamp(20px, 5vw, 38px)',
              fontWeight: 900,
              color: textColor,
              lineHeight: 1.15,
              opacity: titleEnter,
              transform: `translateX(${(1 - titleEnter) * 20}px)`,
            }}
          >
            {bookTitle}
          </div>

          {/* Author */}
          <div
            style={{
              fontSize: 'clamp(12px, 2.2vw, 18px)',
              fontWeight: 500,
              color: `${textColor}99`,
              opacity: authorEnter,
              transform: `translateY(${(1 - authorEnter) * 10}px)`,
            }}
          >
            by {author}
          </div>

          {/* Star rating */}
          <div style={{ display: 'flex', gap: 'clamp(3px, 0.6vw, 6px)' }}>
            {Array.from({ length: 5 }).map((_, i) => {
              const filled = i < clampedRating
              const starProg = getStarProgress(i)
              return (
                <svg
                  key={i}
                  viewBox="0 0 24 24"
                  style={{
                    width: 'clamp(18px, 3.5vw, 28px)',
                    height: 'clamp(18px, 3.5vw, 28px)',
                    transform: `scale(${starProg})`,
                  }}
                >
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    fill={filled ? accentColor : 'none'}
                    stroke={accentColor}
                    strokeWidth="1.5"
                  />
                </svg>
              )
            })}
          </div>

          {/* Divider */}
          <div
            style={{
              width: 'clamp(30px, 6vw, 50px)',
              height: 2,
              background: accentColor,
              opacity: reviewEnter,
              transform: `scaleX(${reviewEnter})`,
              transformOrigin: 'left',
            }}
          />

          {/* One-line review */}
          <div
            style={{
              fontSize: 'clamp(12px, 2.2vw, 19px)',
              fontWeight: 400,
              color: `${textColor}cc`,
              fontStyle: 'italic',
              lineHeight: 1.5,
              opacity: reviewEnter,
              transform: `translateY(${(1 - reviewEnter) * 12}px)`,
            }}
          >
            &ldquo;{review}&rdquo;
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-book-review',
  title: 'Book Review',
  description: 'Book review card with spine aesthetic, star rating pop-in, and one-line review reveal',
  tags: ['scene', 'book', 'review', 'reading', 'lifestyle', 'personal'],
  category: 'scene-layout',
  component: SceneBookReviewComponent as any,
  defaultConfig: {
    bookTitle: 'Atomic Habits',
    author: 'James Clear',
    rating: 5,
    review: 'A must-read that will change the way you think about progress and goals.',
    bgColor: '#1c1917',
    spineColor: '#7c3aed',
    cardColor: '#292524',
    textColor: '#fafaf9',
    accentColor: '#fbbf24',
  },
  configSchema: [
    { key: 'bookTitle', label: 'Book Title', type: 'text', defaultValue: 'Atomic Habits', group: 'Content' },
    { key: 'author', label: 'Author', type: 'text', defaultValue: 'James Clear', group: 'Content' },
    { key: 'rating', label: 'Rating (1-5)', type: 'number', defaultValue: 5, min: 1, max: 5, group: 'Content' },
    { key: 'review', label: 'Review', type: 'text', defaultValue: 'A must-read that will change the way you think about progress and goals.', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1c1917', group: 'Style' },
    { key: 'spineColor', label: 'Spine Color', type: 'color', defaultValue: '#7c3aed', group: 'Style' },
    { key: 'accentColor', label: 'Star / Accent', type: 'color', defaultValue: '#fbbf24', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#fafaf9', group: 'Style' },
  ],
})
