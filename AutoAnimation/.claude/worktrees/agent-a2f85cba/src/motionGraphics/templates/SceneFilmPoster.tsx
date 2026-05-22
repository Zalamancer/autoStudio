import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FilmPosterConfig {
  title: string
  director: string
  tagline: string
  year: string
  bgColor: string
  textColor: string
  accentColor: string
  posterColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneFilmPosterComponent({
  config,
  frame,
  fps,
  durationInFrames,
}: MotionGraphicProps<FilmPosterConfig>) {
  const { title, director, tagline, year, bgColor, textColor, accentColor, posterColor } = config
  const progress = frame / durationInFrames
  const time = frame / fps

  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Poster card slides in with rotation
  const posterSlide = easeOutExpo(Math.min(1, enterProgress / 0.5))
  const posterX = (1 - posterSlide) * 100
  const posterRotate = (1 - posterSlide) * 4
  const posterOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Title slams in
  const titleProgress = easeOutExpo(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.3)))
  const titleScale = 1.8 - titleProgress * 0.8

  // Director name slides up
  const directorProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.25)))
  const directorY = (1 - directorProgress) * 20

  // Tagline fades
  const taglineProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.25)))

  // Year badge
  const yearProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.2)))

  // Film grain flicker
  const grainOpacity = 0.03 + Math.sin(time * 11) * 0.01

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.1

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
      {/* Film grain overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,240,200,${grainOpacity}) 2px, rgba(255,240,200,${grainOpacity}) 3px)`,
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />

      {/* Poster card */}
      <div
        style={{
          position: 'relative',
          width: 'clamp(280px, 68vw, 440px)',
          padding: 'clamp(30px, 6vw, 50px) clamp(24px, 5vw, 40px)',
          background: posterColor,
          border: `3px solid ${accentColor}`,
          transform: `translateX(${posterX}px) rotate(${posterRotate}deg) scale(${exitScale})`,
          opacity: posterOpacity * exitOpacity,
          textAlign: 'center',
          boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
        }}
      >
        {/* Inner border */}
        <div
          style={{
            position: 'absolute',
            inset: 'clamp(8px, 1.5vw, 14px)',
            border: `1px solid ${accentColor}40`,
            pointerEvents: 'none',
          }}
        />

        {/* Film strip decoration — top */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'clamp(4px, 1vw, 8px)',
            marginBottom: 'clamp(16px, 3vw, 26px)',
            opacity: posterOpacity,
          }}
        >
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={`sprocket-${i}`}
              style={{
                width: 'clamp(8px, 1.5vw, 12px)',
                height: 'clamp(6px, 1vw, 8px)',
                borderRadius: 2,
                background: `${accentColor}30`,
              }}
            />
          ))}
        </div>

        {/* "A FILM BY" label */}
        <div
          style={{
            fontSize: 'clamp(9px, 1.5vw, 12px)',
            fontWeight: 600,
            color: accentColor,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            marginBottom: 'clamp(4px, 0.8vw, 8px)',
            opacity: directorProgress,
          }}
        >
          A FILM BY
        </div>

        {/* Director name */}
        <div
          style={{
            fontSize: 'clamp(14px, 3vw, 22px)',
            fontWeight: 600,
            color: `${textColor}CC`,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: 'clamp(18px, 3.5vw, 30px)',
            opacity: directorProgress,
            transform: `translateY(${directorY}px)`,
          }}
        >
          {director}
        </div>

        {/* Ornamental divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 'clamp(14px, 3vw, 24px)',
            opacity: titleProgress,
          }}
        >
          <div style={{ width: 'clamp(30px, 6vw, 50px)', height: 1, background: `${accentColor}50` }} />
          <div style={{ fontSize: 8, color: `${accentColor}80` }}>&#9670;</div>
          <div style={{ width: 'clamp(30px, 6vw, 50px)', height: 1, background: `${accentColor}50` }} />
        </div>

        {/* Film title — large */}
        <div
          style={{
            fontSize: 'clamp(34px, 9vw, 72px)',
            fontWeight: 900,
            color: textColor,
            textTransform: 'uppercase',
            lineHeight: 0.95,
            letterSpacing: 2,
            transform: `scale(${titleScale})`,
            opacity: titleProgress,
            marginBottom: 'clamp(14px, 3vw, 24px)',
            textShadow: `2px 2px 0 ${accentColor}20`,
          }}
        >
          {title}
        </div>

        {/* Tagline — italic */}
        <div
          style={{
            fontSize: 'clamp(11px, 2vw, 16px)',
            fontStyle: 'italic',
            color: `${textColor}AA`,
            letterSpacing: '0.05em',
            opacity: taglineProgress,
            marginBottom: 'clamp(18px, 3.5vw, 30px)',
          }}
        >
          &ldquo;{tagline}&rdquo;
        </div>

        {/* Year */}
        <div
          style={{
            display: 'inline-block',
            padding: 'clamp(4px, 0.8vw, 8px) clamp(16px, 3vw, 28px)',
            border: `2px solid ${accentColor}`,
            fontSize: 'clamp(14px, 2.5vw, 20px)',
            fontWeight: 700,
            color: accentColor,
            letterSpacing: '0.2em',
            opacity: yearProgress,
          }}
        >
          {year}
        </div>

        {/* Film strip decoration — bottom */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'clamp(4px, 1vw, 8px)',
            marginTop: 'clamp(16px, 3vw, 26px)',
            opacity: yearProgress * 0.6,
          }}
        >
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={`sprocket-b-${i}`}
              style={{
                width: 'clamp(8px, 1.5vw, 12px)',
                height: 'clamp(6px, 1vw, 8px)',
                borderRadius: 2,
                background: `${accentColor}30`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-film-poster',
  title: 'Scene Film Poster',
  description: 'Classic film poster with director credit, dramatic title slam, tagline, year badge, film strip sprockets, and aged grain',
  tags: ['scene', 'film', 'poster', 'cinema', 'vintage', 'movie', 'classic', 'retro'],
  category: 'scene-layout',
  component: SceneFilmPosterComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    title: 'CASABLANCA',
    director: 'MICHAEL CURTIZ',
    tagline: 'A story of love and sacrifice in a world at war',
    year: 'MCMXLII',
    bgColor: '#0A0804',
    posterColor: '#1C1410',
    textColor: '#F5E6CC',
    accentColor: '#C9A84C',
  },
  configSchema: [
    { key: 'title', label: 'Film Title', type: 'text', defaultValue: 'CASABLANCA', group: 'Content' },
    { key: 'director', label: 'Director', type: 'text', defaultValue: 'MICHAEL CURTIZ', group: 'Content' },
    { key: 'tagline', label: 'Tagline', type: 'text', defaultValue: 'A story of love and sacrifice in a world at war', group: 'Content' },
    { key: 'year', label: 'Year', type: 'text', defaultValue: 'MCMXLII', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0804', group: 'Style' },
    { key: 'posterColor', label: 'Poster Color', type: 'color', defaultValue: '#1C1410', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#F5E6CC', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#C9A84C', group: 'Style' },
  ],
})
