import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneHorrorMovieCardConfig {
  movieTitle: string
  tagline: string
  rating: string
  director: string
  releaseYear: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function SceneHorrorMovieCardComponent({ config, progress, frame }: MotionGraphicProps<SceneHorrorMovieCardConfig>) {
  const { movieTitle, tagline, rating, director, releaseYear, bgColor, textColor, accentColor } = config
  const f = frame ?? 0

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Glitch scanlines
  const scanlineY = (f * 2) % 100
  const isGlitchFrame = rand(Math.floor(f / 5)) > 0.85
  const glitchShift = isGlitchFrame ? (rand(f * 3) - 0.5) * 8 : 0

  // Title letter-by-letter reveal
  const titleReveal = easeOutCubic(Math.min(1, enterProgress * 1.4))
  const taglineReveal = easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6))
  const detailsReveal = easeOutCubic(Math.max(0, (enterProgress - 0.6) / 0.4))

  // Rating stars glow pulse
  const ratingGlow = 0.7 + Math.sin(f * 0.06) * 0.15

  // Scratches overlay
  const scratches = Array.from({ length: 4 }, (_, i) => {
    const sx = 10 + rand(i * 41) * 80
    const sy = rand(i * 67) * 100
    const angle = -20 + rand(i * 23) * 40
    const len = 30 + rand(i * 31) * 60
    return (
      <div
        key={`scratch-${i}`}
        style={{
          position: 'absolute',
          left: `${sx}%`,
          top: `${sy}%`,
          width: 1,
          height: len,
          background: `rgba(255,255,255,0.03)`,
          transform: `rotate(${angle}deg)`,
        }}
      />
    )
  })

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg, #0a0008 0%, ${bgColor} 50%, #080008 100%)` }} />
      {/* Scratches */}
      {scratches}
      {/* Scanline */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${scanlineY}%`,
          height: 2,
          background: 'rgba(255,255,255,0.03)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8%',
          opacity: exitOpacity,
          transform: `translateX(${glitchShift}px)`,
        }}
      >
        {/* Poster card */}
        <div
          style={{
            width: 'clamp(260px, 70vw, 440px)',
            background: 'rgba(10, 5, 15, 0.8)',
            borderRadius: 'clamp(6px, 1.5vw, 12px)',
            border: `1px solid ${accentColor}33`,
            padding: 'clamp(24px, 6vw, 44px)',
            opacity: easeOutCubic(enterProgress),
            boxShadow: `0 0 40px rgba(0,0,0,0.5), inset 0 0 20px ${accentColor}08`,
          }}
        >
          {/* Year badge */}
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(9px, 1.6vw, 12px)',
              fontWeight: 600,
              color: accentColor,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              marginBottom: 'clamp(8px, 2vw, 14px)',
              opacity: detailsReveal,
            }}
          >
            {releaseYear}
          </div>

          {/* Movie title */}
          <div
            style={{
              fontFamily: "Impact, 'Arial Black', sans-serif",
              fontSize: 'clamp(24px, 6vw, 48px)',
              fontWeight: 900,
              color: textColor,
              textTransform: 'uppercase',
              lineHeight: 1.1,
              marginBottom: 'clamp(8px, 2vw, 14px)',
              opacity: titleReveal,
              transform: `translateX(${(1 - titleReveal) * -30}px)`,
              textShadow: `0 0 20px ${accentColor}44, 0 2px 4px rgba(0,0,0,0.8)`,
            }}
          >
            {movieTitle}
          </div>

          {/* Tagline */}
          <div
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(11px, 2.5vw, 18px)',
              fontStyle: 'italic',
              color: `${textColor}99`,
              marginBottom: 'clamp(16px, 4vw, 28px)',
              lineHeight: 1.5,
              opacity: taglineReveal,
              transform: `translateY(${(1 - taglineReveal) * 10}px)`,
            }}
          >
            &ldquo;{tagline}&rdquo;
          </div>

          {/* Divider */}
          <div style={{ width: '100%', height: 1, background: `${accentColor}22`, marginBottom: 'clamp(12px, 3vw, 20px)', opacity: detailsReveal }} />

          {/* Details row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              opacity: detailsReveal,
              transform: `translateY(${(1 - detailsReveal) * 10}px)`,
            }}
          >
            {/* Director */}
            <div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(8px, 1.4vw, 10px)', color: `${textColor}44`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
                Director
              </div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(11px, 2.2vw, 16px)', fontWeight: 600, color: textColor }}>
                {director}
              </div>
            </div>

            {/* Rating */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(8px, 1.4vw, 10px)', color: `${textColor}44`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
                Rating
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(14px, 3vw, 22px)',
                  fontWeight: 800,
                  color: accentColor,
                  opacity: ratingGlow,
                  textShadow: `0 0 10px ${accentColor}44`,
                }}
              >
                {rating}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse, transparent 30%, rgba(0,0,0,0.5) 100%)', pointerEvents: 'none' }} />
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-horror-movie-card',
  title: 'Horror Movie Card',
  description: 'Horror movie poster card with glitch effects, scanlines, scratches, title reveal, and dark cinematic styling',
  tags: ['scene', 'horror', 'movie', 'poster', 'film', 'dark', 'cinematic', 'review'],
  category: 'scene-layout',
  component: SceneHorrorMovieCardComponent as any,
  defaultConfig: {
    movieTitle: 'The Last Door',
    tagline: 'Some doors should never be opened...',
    rating: '8.7/10',
    director: 'James Hollow',
    releaseYear: '2024',
    bgColor: '#0a0008',
    textColor: '#e8e0e8',
    accentColor: '#CC0000',
  },
  configSchema: [
    { key: 'movieTitle', label: 'Movie Title', type: 'text', defaultValue: 'The Last Door', group: 'Content' },
    { key: 'tagline', label: 'Tagline', type: 'text', defaultValue: 'Some doors should never be opened...', group: 'Content' },
    { key: 'rating', label: 'Rating', type: 'text', defaultValue: '8.7/10', group: 'Content' },
    { key: 'director', label: 'Director', type: 'text', defaultValue: 'James Hollow', group: 'Content' },
    { key: 'releaseYear', label: 'Release Year', type: 'text', defaultValue: '2024', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0008', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e8e0e8', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#CC0000', group: 'Style' },
  ],
})
