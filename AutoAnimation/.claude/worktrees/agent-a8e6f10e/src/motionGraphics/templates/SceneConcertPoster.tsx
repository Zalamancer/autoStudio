import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ConcertPosterConfig {
  artistName: string
  venue: string
  date: string
  tagline: string
  bgColor: string
  textColor: string
  accentColor: string
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

function SceneConcertPosterComponent({
  config,
  frame,
  fps,
  durationInFrames,
}: MotionGraphicProps<ConcertPosterConfig>) {
  const { artistName, venue, date, tagline, bgColor, textColor, accentColor } = config
  const progress = frame / durationInFrames
  const time = frame / fps

  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress =
    progress >= enterEnd && progress < holdEnd
      ? (progress - enterEnd) / (holdEnd - enterEnd)
      : progress >= holdEnd
        ? 1
        : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Poster frame slides in from right with slight rotation
  const posterSlide = easeOutExpo(Math.min(1, enterProgress / 0.5))
  const posterX = (1 - posterSlide) * 120
  const posterRotation = (1 - posterSlide) * 5
  const posterOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Tagline "LIVE IN CONCERT" drops in
  const taglineProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.25)))
  const taglineY = (1 - taglineProgress) * -30

  // Artist name slams in (scale down from large)
  const nameProgress = easeOutExpo(Math.max(0, Math.min(1, (enterProgress - 0.25) / 0.3)))
  const nameScale = 2 - nameProgress
  const nameOpacity = nameProgress

  // Venue slides up
  const venueProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.25)))
  const venueY = (1 - venueProgress) * 25

  // Date slides up
  const dateProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.25)))
  const dateY = (1 - dateProgress) * 25

  // Hold: subtle noise/grunge flicker
  const flickerOpacity = 0.03 + 0.02 * Math.sin(time * 12) * Math.sin(time * 17)

  // Distressed lines (grunge effect)
  const lineCount = 6
  const grungeLinesOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.3)))

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitScale = 1 - exitEased * 0.15
  const exitOpacity = 1 - exitEased
  const exitRotation = exitEased * -3

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Impact', 'Arial Black', 'Helvetica Neue', sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Grunge texture overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 3px,
              rgba(255,255,255,${flickerOpacity}) 3px,
              rgba(255,255,255,${flickerOpacity}) 4px
            )
          `,
          pointerEvents: 'none',
          zIndex: 20,
        }}
      />

      {/* Poster container */}
      <div
        style={{
          position: 'relative',
          width: 'clamp(300px, 70vw, 520px)',
          padding: 'clamp(30px, 6vw, 50px) clamp(24px, 5vw, 40px)',
          border: `3px solid ${accentColor}`,
          transform: `translateX(${posterX}px) rotate(${posterRotation + exitRotation}deg) scale(${exitScale})`,
          opacity: posterOpacity * exitOpacity,
          textAlign: 'center',
        }}
      >
        {/* Inner border */}
        <div
          style={{
            position: 'absolute',
            inset: 'clamp(6px, 1.2vw, 10px)',
            border: `1px solid ${accentColor}50`,
            pointerEvents: 'none',
          }}
        />

        {/* Distressed diagonal lines */}
        {Array.from({ length: lineCount }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${15 + i * 14}%`,
              left: '-5%',
              right: '-5%',
              height: 1,
              background: `${accentColor}15`,
              transform: `rotate(${-2 + (i % 3)}deg)`,
              opacity: grungeLinesOpacity,
            }}
          />
        ))}

        {/* Tagline */}
        <div
          style={{
            fontSize: 'clamp(11px, 2vw, 16px)',
            fontWeight: 600,
            color: accentColor,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            opacity: taglineProgress,
            transform: `translateY(${taglineY}px)`,
            marginBottom: 'clamp(14px, 3vw, 24px)',
            fontFamily: "'Courier New', monospace",
          }}
        >
          {tagline}
        </div>

        {/* Decorative star line */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(8px, 1.5vw, 14px)',
            marginBottom: 'clamp(10px, 2vw, 18px)',
            opacity: taglineProgress,
          }}
        >
          <div style={{ width: 'clamp(30px, 6vw, 50px)', height: 1, background: `${textColor}40` }} />
          <div style={{ fontSize: 'clamp(12px, 2vw, 16px)', color: accentColor }}>{'\u2605'}</div>
          <div style={{ width: 'clamp(30px, 6vw, 50px)', height: 1, background: `${textColor}40` }} />
        </div>

        {/* Artist name - large */}
        <div
          style={{
            fontSize: 'clamp(36px, 10vw, 90px)',
            fontWeight: 900,
            color: textColor,
            textTransform: 'uppercase',
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
            opacity: nameOpacity,
            transform: `scale(${nameScale})`,
            marginBottom: 'clamp(16px, 3vw, 26px)',
            textShadow: `2px 2px 0 ${accentColor}40`,
          }}
        >
          {artistName}
        </div>

        {/* Decorative divider */}
        <div
          style={{
            width: '60%',
            height: 2,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            margin: '0 auto',
            marginBottom: 'clamp(14px, 3vw, 22px)',
            opacity: venueProgress,
          }}
        />

        {/* Venue */}
        <div
          style={{
            fontSize: 'clamp(14px, 2.8vw, 22px)',
            fontWeight: 600,
            color: `${textColor}CC`,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            opacity: venueProgress,
            transform: `translateY(${venueY}px)`,
            marginBottom: 'clamp(6px, 1.2vw, 10px)',
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
          }}
        >
          {venue}
        </div>

        {/* Date */}
        <div
          style={{
            fontSize: 'clamp(16px, 3.2vw, 26px)',
            fontWeight: 700,
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            opacity: dateProgress,
            transform: `translateY(${dateY}px)`,
            fontFamily: "'Courier New', monospace",
          }}
        >
          {date}
        </div>

        {/* Bottom decorative stars */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'clamp(6px, 1.2vw, 10px)',
            marginTop: 'clamp(14px, 3vw, 22px)',
            opacity: dateProgress * 0.6,
            color: accentColor,
            fontSize: 'clamp(8px, 1.5vw, 12px)',
          }}
        >
          {'\u2605'} {'\u2605'} {'\u2605'}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-concert-poster',
  title: 'Scene Concert Poster',
  description:
    'Concert/gig poster with artist name slamming in, venue, date, and grunge texture. Bold typography with rock/punk aesthetic.',
  tags: ['scene', 'music', 'concert', 'poster', 'gig', 'rock', 'punk', 'live', 'event'],
  category: 'scene-layout',
  component: SceneConcertPosterComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    artistName: 'THE MIDNIGHT',
    venue: 'Madison Square Garden',
    date: 'DEC 31, 2026',
    tagline: 'LIVE IN CONCERT',
    bgColor: '#0A0A0A',
    textColor: '#F5F5F0',
    accentColor: '#E63946',
  },
  configSchema: [
    { key: 'artistName', label: 'Artist Name', type: 'text', defaultValue: 'THE MIDNIGHT', group: 'Content' },
    { key: 'venue', label: 'Venue', type: 'text', defaultValue: 'Madison Square Garden', group: 'Content' },
    { key: 'date', label: 'Date', type: 'text', defaultValue: 'DEC 31, 2026', group: 'Content' },
    { key: 'tagline', label: 'Tagline', type: 'text', defaultValue: 'LIVE IN CONCERT', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A0A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#F5F5F0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#E63946', group: 'Style' },
  ],
})
