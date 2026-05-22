import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneMovieNightConfig {
  movieTitle: string
  genre: string
  rating: string
  snacks: string[]
  time: string
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158; const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneMovieNightComponent({ config, frame, durationInFrames }: MotionGraphicProps<SceneMovieNightConfig>) {
  const { movieTitle, genre, rating, snacks, time, bgColor, cardColor, accentColor, textColor } = config
  const progress = frame / durationInFrames

  const enterProgress = Math.min(1, progress / 0.22)
  const holdProgress = progress >= 0.22 && progress < 0.8 ? (progress - 0.22) / 0.58 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Curtain open effect: two halves slide apart
  const curtainOpen = easeOutCubic(Math.min(1, enterProgress / 0.4))

  // Content reveals after curtain
  const titleReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.25) / 0.35)))
  const genreReveal = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.3)))
  const ratingReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.45) / 0.3)))
  const timeReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.3)))

  // Snacks pop in
  const getSnackProgress = (idx: number) =>
    easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.6 - idx * 0.06) / 0.25)))

  // Spotlight flicker during hold
  const flickerAlpha = holdProgress > 0 ? 0.06 + Math.sin(holdProgress * Math.PI * 20) * 0.02 : 0

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Theater curtain left */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: '50%',
          background: `linear-gradient(90deg, #8B0000, #C41E3A, #8B0000)`,
          transform: `translateX(${-curtainOpen * 100}%)`,
          zIndex: 2,
        }}
      />
      {/* Theater curtain right */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: '50%',
          background: `linear-gradient(90deg, #8B0000, #C41E3A, #8B0000)`,
          transform: `translateX(${curtainOpen * 100}%)`,
          zIndex: 2,
        }}
      />

      {/* Spotlight effect */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 40%, rgba(255,255,200,${flickerAlpha}), transparent 60%)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: '6%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: exitOpacity,
          transform: `scale(${1 - exitEased * 0.1})`,
        }}
      >
        {/* Movie poster placeholder */}
        <div
          style={{
            width: 'clamp(100px, 28vw, 180px)',
            aspectRatio: '2/3',
            background: `linear-gradient(135deg, ${cardColor}, ${accentColor}30)`,
            borderRadius: 'clamp(8px, 1.5vw, 12px)',
            border: `2px solid ${accentColor}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(28px, 6vw, 48px)',
            marginBottom: 'clamp(12px, 2.5vw, 20px)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
            opacity: titleReveal,
            transform: `translateY(${(1 - titleReveal) * 30}px)`,
          }}
        >
          {'🎬'}
        </div>

        {/* Movie title */}
        <div
          style={{
            fontSize: 'clamp(20px, 5vw, 36px)',
            fontWeight: 900,
            color: textColor,
            textAlign: 'center',
            opacity: titleReveal,
            transform: `translateY(${(1 - titleReveal) * 15}px)`,
            marginBottom: 'clamp(4px, 0.8vw, 8px)',
          }}
        >
          {movieTitle}
        </div>

        {/* Genre tag */}
        <div
          style={{
            display: 'inline-block',
            background: `${accentColor}20`,
            color: accentColor,
            fontSize: 'clamp(9px, 1.4vw, 12px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            padding: 'clamp(2px, 0.4vw, 5px) clamp(8px, 1.5vw, 14px)',
            borderRadius: 100,
            border: `1px solid ${accentColor}30`,
            transform: `scale(${genreReveal})`,
            opacity: genreReveal,
            marginBottom: 'clamp(8px, 1.5vw, 14px)',
          }}
        >
          {genre}
        </div>

        {/* Rating & Time row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(12px, 2.5vw, 20px)',
            marginBottom: 'clamp(14px, 3vw, 24px)',
          }}
        >
          <div style={{ textAlign: 'center', opacity: ratingReveal }}>
            <div style={{ fontSize: 'clamp(14px, 2.5vw, 20px)', fontWeight: 900, color: '#FACC15' }}>{'★'} {rating}</div>
          </div>
          <div style={{ width: 1, height: 'clamp(14px, 2.5vw, 20px)', background: `${textColor}30` }} />
          <div style={{ textAlign: 'center', opacity: timeReveal }}>
            <div style={{ fontSize: 'clamp(11px, 1.8vw, 15px)', fontWeight: 600, color: `${textColor}aa` }}>{time}</div>
          </div>
        </div>

        {/* Snacks */}
        <div
          style={{
            background: `${cardColor}`,
            borderRadius: 'clamp(10px, 2vw, 16px)',
            padding: 'clamp(10px, 2vw, 18px)',
            border: `1px solid ${accentColor}15`,
            width: '100%',
            maxWidth: 340,
          }}
        >
          <div style={{ fontSize: 'clamp(8px, 1.2vw, 10px)', fontWeight: 800, color: `${textColor}66`, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 'clamp(6px, 1vw, 10px)' }}>
            Snack Menu
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(4px, 0.8vw, 8px)' }}>
            {snacks.map((snack, i) => {
              const sp = getSnackProgress(i)
              return (
                <div
                  key={i}
                  style={{
                    fontSize: 'clamp(10px, 1.5vw, 13px)',
                    fontWeight: 600,
                    color: textColor,
                    background: `${accentColor}12`,
                    padding: 'clamp(3px, 0.5vw, 5px) clamp(8px, 1.2vw, 12px)',
                    borderRadius: 100,
                    transform: `scale(${sp})`,
                    opacity: sp,
                  }}
                >
                  {snack}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-movie-night',
  title: 'Movie Night Pick',
  description: 'Movie night card with theater curtain open reveal, poster, genre tag, rating, showtime, and snack menu',
  tags: ['scene', 'movie', 'night', 'film', 'cinema', 'snacks', 'entertainment'],
  category: 'scene-layout',
  component: SceneMovieNightComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    movieTitle: 'The Grand Adventure',
    genre: 'Sci-Fi Adventure',
    rating: '8.5',
    snacks: ['Popcorn', 'Nachos', 'Soda', 'Candy'],
    time: '8:00 PM',
    bgColor: '#0A0A12',
    cardColor: '#161622',
    accentColor: '#E11D48',
    textColor: '#F0F0F8',
  },
  configSchema: [
    { key: 'movieTitle', label: 'Movie Title', type: 'text', defaultValue: 'The Grand Adventure', group: 'Content' },
    { key: 'genre', label: 'Genre', type: 'text', defaultValue: 'Sci-Fi Adventure', group: 'Content' },
    { key: 'rating', label: 'Rating', type: 'text', defaultValue: '8.5', group: 'Content' },
    { key: 'snacks', label: 'Snacks', type: 'text-array', defaultValue: ['Popcorn', 'Nachos', 'Soda', 'Candy'], group: 'Content' },
    { key: 'time', label: 'Showtime', type: 'text', defaultValue: '8:00 PM', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A12', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#161622', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#E11D48', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#F0F0F8', group: 'Style' },
  ],
})
