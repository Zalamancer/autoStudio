import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MovieTrailerConfig {
  tagline: string
  movieTitle: string
  releaseDate: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeInOutQuad(t: number): number { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2 }

function SceneMovieTrailerComponent({
  config,
  progress,
}: MotionGraphicProps<MovieTrailerConfig>) {
  const { tagline, movieTitle, releaseDate, bgColor, textColor, accentColor } = config

  const enterEnd = 0.35
  const holdEnd = 0.78
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd
    ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Letterbox bars — always present, slide in from edges
  const letterboxEnter = easeOutCubic(Math.min(1, enterProgress / 0.3))
  const letterboxHeight = letterboxEnter * 12

  // Fade from black
  const fadeFromBlack = 1 - easeOutCubic(Math.min(1, enterProgress / 0.5))

  // Tagline fades in first
  const taglineEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.35)))
  const taglineOpacity = taglineEnter
  const taglineLetterSpacing = 12 - easeOutCubic(taglineEnter) * 6

  // Movie title — dramatic scale + fade in
  const titleDelay = 0.45
  const titleEnter = Math.max(0, Math.min(1, (enterProgress - titleDelay) / (1 - titleDelay)))
  const titleEased = easeOutCubic(titleEnter)
  const titleScale = 0.85 + titleEased * 0.15
  const titleOpacity = titleEased

  // Accent line under title
  const lineDelay = 0.65
  const lineEnter = Math.max(0, Math.min(1, (enterProgress - lineDelay) / (1 - lineDelay)))
  const lineWidth = easeOutCubic(lineEnter) * 100

  // Release date fades in last
  const dateDelay = 0.8
  const dateEnter = Math.max(0, Math.min(1, (enterProgress - dateDelay) / (1 - dateDelay)))
  const dateOpacity = easeOutCubic(dateEnter)
  const dateY = (1 - easeOutCubic(dateEnter)) * 20

  // Hold: subtle glow pulse on title
  const glowIntensity = holdProgress > 0 ? 4 + Math.sin(holdProgress * Math.PI * 3) * 3 : 0

  // Exit: fade to black
  const exitEased = easeInCubic(exitProgress)
  const fadeToBlack = exitEased
  const exitTitleScale = 1 + exitEased * 0.08

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Georgia', 'Times New Roman', serif",
      }}
    >
      {/* Content layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '15% 8%',
          gap: 'clamp(8px, 1.5vw, 16px)',
        }}
      >
        {/* Tagline */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.8vw, 16px)',
            fontWeight: 400,
            color: `${textColor}cc`,
            opacity: taglineOpacity,
            letterSpacing: taglineLetterSpacing,
            textTransform: 'uppercase',
            textAlign: 'center',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          }}
        >
          {tagline}
        </div>

        {/* Spacer */}
        <div style={{ height: 'clamp(12px, 2.5vw, 28px)' }} />

        {/* Movie title */}
        <div
          style={{
            fontSize: 'clamp(28px, 8vw, 72px)',
            fontWeight: 900,
            color: textColor,
            opacity: titleOpacity,
            transform: `scale(${titleScale * exitTitleScale})`,
            textAlign: 'center',
            lineHeight: 1.05,
            letterSpacing: '0.04em',
            textShadow: `0 0 ${glowIntensity}px ${accentColor}88, 0 2px 20px rgba(0,0,0,0.5)`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}
        >
          {movieTitle}
        </div>

        {/* Accent line */}
        <div
          style={{
            width: `${lineWidth}%`,
            maxWidth: 200,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            margin: 'clamp(4px, 1vw, 12px) auto',
          }}
        />

        {/* Release date */}
        <div
          style={{
            fontSize: 'clamp(12px, 2.2vw, 20px)',
            fontWeight: 600,
            color: accentColor,
            opacity: dateOpacity,
            transform: `translateY(${dateY}px)`,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            textAlign: 'center',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          }}
        >
          {releaseDate}
        </div>
      </div>

      {/* Letterbox bars */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: `${letterboxHeight}%`,
          background: '#000000',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${letterboxHeight}%`,
          background: '#000000',
        }}
      />

      {/* Fade from/to black overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#000000',
          opacity: Math.max(fadeFromBlack, fadeToBlack),
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-movie-trailer',
  title: 'Movie Trailer Title Card',
  description: 'Cinematic movie trailer title card with tagline, dramatic title fade-in, letterbox bars, accent glow, and fade through black',
  tags: ['scene', 'movie', 'trailer', 'cinematic', 'title', 'film', 'media', 'dramatic'],
  category: 'scene-layout',
  component: SceneMovieTrailerComponent as any,
  defaultConfig: {
    tagline: 'FROM THE MAKERS OF INCEPTION',
    movieTitle: 'ECHOES',
    releaseDate: 'IN THEATERS DECEMBER 2026',
    bgColor: '#0a0a0a',
    textColor: '#FFFFFF',
    accentColor: '#D4A853',
  },
  configSchema: [
    { key: 'tagline', label: 'Tagline', type: 'text', defaultValue: 'FROM THE MAKERS OF INCEPTION', group: 'Content' },
    { key: 'movieTitle', label: 'Movie Title', type: 'text', defaultValue: 'ECHOES', group: 'Content' },
    { key: 'releaseDate', label: 'Release Date', type: 'text', defaultValue: 'IN THEATERS DECEMBER 2026', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#D4A853', group: 'Style' },
  ],
})
