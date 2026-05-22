import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneMovieRatingConfig {
  title: string
  year: string
  genres: string[]
  rating: number
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

function SceneMovieRatingComponent({ config, progress }: MotionGraphicProps<SceneMovieRatingConfig>) {
  const { title, year, genres, rating, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Card reveal
  const cardReveal = easeOutBack(Math.min(1, enterProgress / 0.4))
  const cardSlideY = (1 - cardReveal) * 50

  // Film strip border animation
  const stripOffset = (holdProgress * 100) % 100

  // Star rating fill (staggered)
  const fullStars = Math.floor(rating)
  const partialStar = rating - fullStars
  const stars = Array.from({ length: 5 }, (_, i) => {
    const starDelay = 0.3 + i * 0.08
    const starProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - starDelay) / 0.3)))
    const isFull = i < fullStars
    const isPartial = i === fullStars && partialStar > 0
    return { isFull, isPartial, partialAmount: partialStar, progress: starProgress }
  })

  // Title reveal
  const titleReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.3)))

  // Year + genres
  const metaReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.25) / 0.3)))

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitSlideY = exitEased * 60

  // Subtle float
  const isHolding = progress >= 0.25 && progress < 0.8
  const floatY = isHolding ? Math.sin(holdProgress * Math.PI * 3) * 3 : 0

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Film strip borders (top and bottom) */}
      {[0, 1].map((side) => (
        <div
          key={side}
          style={{
            position: 'absolute',
            [side === 0 ? 'top' : 'bottom']: 0,
            left: 0,
            right: 0,
            height: 'clamp(24px, 4vw, 40px)',
            background: '#111',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            opacity: cardReveal * exitOpacity,
          }}
        >
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              style={{
                width: 'clamp(12px, 2vw, 20px)',
                height: 'clamp(8px, 1.5vw, 14px)',
                background: '#222',
                borderRadius: 2,
                flexShrink: 0,
                marginLeft: `clamp(6px, 1vw, 10px)`,
                transform: `translateX(${-stripOffset}%)`,
              }}
            />
          ))}
        </div>
      ))}

      {/* Card */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10%',
          opacity: exitOpacity,
        }}
      >
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(12px, 2.5vw, 24px)',
            padding: 'clamp(20px, 4vw, 40px)',
            width: '100%',
            maxWidth: 460,
            boxShadow: `0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px ${accentColor}20`,
            transform: `translateY(${cardSlideY + exitSlideY + floatY}px)`,
            opacity: cardReveal,
          }}
        >
          {/* Title */}
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(20px, 4.5vw, 36px)',
              fontWeight: 900,
              color: textColor,
              lineHeight: 1.15,
              opacity: titleReveal,
              transform: `translateY(${(1 - titleReveal) * 10}px)`,
            }}
          >
            {title}
          </div>

          {/* Year + Genres */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(6px, 1.2vw, 12px)',
              marginTop: 'clamp(8px, 1.5vw, 14px)',
              flexWrap: 'wrap',
              opacity: metaReveal,
              transform: `translateY(${(1 - metaReveal) * 8}px)`,
            }}
          >
            {/* Year */}
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(11px, 1.8vw, 15px)',
                fontWeight: 600,
                color: `${textColor}80`,
              }}
            >
              {year}
            </span>

            {/* Dot separator */}
            <span
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: `${textColor}40`,
              }}
            />

            {/* Genre tags */}
            {genres.map((genre, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(9px, 1.4vw, 12px)',
                  fontWeight: 600,
                  color: accentColor,
                  background: `${accentColor}15`,
                  padding: 'clamp(2px, 0.4vw, 4px) clamp(6px, 1vw, 10px)',
                  borderRadius: 'clamp(3px, 0.5vw, 6px)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {genre}
              </span>
            ))}
          </div>

          {/* Divider */}
          <div
            style={{
              width: '100%',
              height: 1,
              background: `${textColor}15`,
              margin: 'clamp(12px, 2.5vw, 22px) 0',
              opacity: metaReveal,
            }}
          />

          {/* Stars + rating number */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(8px, 1.5vw, 14px)',
            }}
          >
            {/* Stars */}
            <div style={{ display: 'flex', gap: 'clamp(2px, 0.5vw, 6px)' }}>
              {stars.map((star, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 'clamp(18px, 3.5vw, 30px)',
                    transform: `scale(${star.progress})`,
                    opacity: star.progress,
                    position: 'relative',
                    lineHeight: 1,
                  }}
                >
                  {/* Empty star */}
                  <span style={{ opacity: 0.2 }}>{'\u2605'}</span>
                  {/* Filled star overlay */}
                  {(star.isFull || star.isPartial) && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        overflow: 'hidden',
                        width: star.isFull ? '100%' : `${star.partialAmount * 100}%`,
                        color: accentColor,
                      }}
                    >
                      {'\u2605'}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Numeric rating */}
            <div
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(16px, 3vw, 26px)',
                fontWeight: 900,
                color: accentColor,
                opacity: stars[stars.length - 1]?.progress || 0,
              }}
            >
              {rating.toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-movie-rating',
  title: 'Movie Rating',
  description: 'Movie/show rating card with title, year, genre tags, star rating, film strip border aesthetic',
  tags: ['scene', 'entertainment', 'movie', 'rating', 'review', 'stars', 'film'],
  category: 'scene-layout',
  component: SceneMovieRatingComponent as any,
  defaultConfig: {
    title: 'The Dark Knight',
    year: '2008',
    genres: ['Action', 'Crime', 'Drama'],
    rating: 4.5,
    bgColor: '#0a0a14',
    cardColor: '#1a1a2e',
    accentColor: '#fbbf24',
    textColor: '#e2e8f0',
  },
  configSchema: [
    { key: 'title', label: 'Movie Title', type: 'text', defaultValue: 'The Dark Knight', group: 'Content' },
    { key: 'year', label: 'Year', type: 'text', defaultValue: '2008', group: 'Content' },
    { key: 'genres', label: 'Genres', type: 'text-array', defaultValue: ['Action', 'Crime', 'Drama'], group: 'Content' },
    { key: 'rating', label: 'Rating (0-5)', type: 'number', defaultValue: 4.5, min: 0, max: 5, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    { key: 'accentColor', label: 'Star / Accent', type: 'color', defaultValue: '#fbbf24', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
})
