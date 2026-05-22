import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NowPlayingConfig {
  songTitle: string
  artistName: string
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneNowPlayingComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<NowPlayingConfig>) {
  const { songTitle, artistName, bgColor, cardColor, accentColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.25
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress =
    progress >= enterEnd && progress < holdEnd
      ? (progress - enterEnd) / (holdEnd - enterEnd)
      : progress >= holdEnd
        ? 1
        : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Card slides up from bottom
  const cardEased = easeOutBack(Math.min(1, enterProgress / 0.7))
  const cardY = (1 - cardEased) * 200
  const cardOpacity = easeOutCubic(Math.min(1, enterProgress / 0.4))

  // Album art gradient rotation during hold
  const gradientAngle = holdProgress * 360

  // Progress bar fills during hold
  const progressBarWidth = holdProgress * 100

  // Title and artist stagger in
  const titleOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.3)))
  const titleX = (1 - titleOpacity) * 20
  const artistOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.45) / 0.3)))
  const artistX = (1 - artistOpacity) * 20

  // Controls fade in
  const controlsOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.3)))

  // "Now Playing" header
  const headerOpacity = easeOutCubic(Math.max(0, Math.min(1, enterProgress / 0.3)))
  const headerY = (1 - headerOpacity) * -15

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitY = exitEased * 200
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.1

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Helvetica Neue', -apple-system, sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Background blur effect */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 30% 40%, ${accentColor}15 0%, transparent 50%),
                       radial-gradient(circle at 70% 60%, ${accentColor}10 0%, transparent 50%)`,
        }}
      />

      {/* Main card */}
      <div
        style={{
          position: 'relative',
          width: 'clamp(280px, 65vw, 420px)',
          padding: 'clamp(20px, 4vw, 36px)',
          background: cardColor,
          borderRadius: 'clamp(16px, 3vw, 24px)',
          transform: `translateY(${cardY + exitY}px) scale(${exitScale})`,
          opacity: cardOpacity * exitOpacity,
          boxShadow: `0 20px 60px rgba(0,0,0,0.3), 0 0 80px ${accentColor}10`,
        }}
      >
        {/* "NOW PLAYING" header */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.8vw, 13px)',
            fontWeight: 600,
            color: accentColor,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: 'clamp(12px, 2.5vw, 20px)',
            opacity: headerOpacity,
            transform: `translateY(${headerY}px)`,
            textAlign: 'center',
          }}
        >
          NOW PLAYING
        </div>

        {/* Album art placeholder */}
        <div
          style={{
            width: '100%',
            paddingBottom: '100%',
            position: 'relative',
            borderRadius: 'clamp(10px, 2vw, 16px)',
            overflow: 'hidden',
            marginBottom: 'clamp(16px, 3vw, 24px)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(${gradientAngle}deg, ${accentColor}, ${accentColor}88, ${accentColor}44, ${accentColor}88, ${accentColor})`,
            }}
          />
          {/* Album art pattern */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Music note icon */}
            <div
              style={{
                fontSize: 'clamp(48px, 10vw, 80px)',
                opacity: 0.3,
                color: '#fff',
              }}
            >
              {'\u266B'}
            </div>
          </div>
        </div>

        {/* Song title */}
        <div
          style={{
            fontSize: 'clamp(18px, 3.5vw, 26px)',
            fontWeight: 700,
            color: textColor,
            opacity: titleOpacity,
            transform: `translateX(${titleX}px)`,
            marginBottom: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {songTitle}
        </div>

        {/* Artist name */}
        <div
          style={{
            fontSize: 'clamp(13px, 2.5vw, 18px)',
            fontWeight: 400,
            color: `${textColor}99`,
            opacity: artistOpacity,
            transform: `translateX(${artistX}px)`,
            marginBottom: 'clamp(16px, 3vw, 24px)',
          }}
        >
          {artistName}
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: '100%',
            height: 'clamp(3px, 0.6vw, 5px)',
            background: `${textColor}15`,
            borderRadius: 3,
            marginBottom: 'clamp(8px, 1.5vw, 12px)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressBarWidth}%`,
              height: '100%',
              background: accentColor,
              borderRadius: 3,
              transition: 'width 0.1s linear',
            }}
          />
        </div>

        {/* Time stamps */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 'clamp(10px, 1.6vw, 12px)',
            color: `${textColor}60`,
            marginBottom: 'clamp(14px, 2.5vw, 22px)',
            opacity: controlsOpacity,
          }}
        >
          <span>{Math.floor(holdProgress * 3)}:{String(Math.floor((holdProgress * 180) % 60)).padStart(2, '0')}</span>
          <span>3:24</span>
        </div>

        {/* Playback controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(20px, 5vw, 40px)',
            opacity: controlsOpacity,
          }}
        >
          {/* Previous */}
          <div
            style={{
              width: 'clamp(16px, 3vw, 24px)',
              height: 'clamp(16px, 3vw, 24px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: `${textColor}99`,
              fontSize: 'clamp(14px, 2.5vw, 20px)',
            }}
          >
            {'\u23EE'}
          </div>

          {/* Play/Pause button */}
          <div
            style={{
              width: 'clamp(44px, 8vw, 56px)',
              height: 'clamp(44px, 8vw, 56px)',
              borderRadius: '50%',
              background: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 16px ${accentColor}50`,
            }}
          >
            {/* Pause icon (two bars) */}
            <div style={{ display: 'flex', gap: 'clamp(3px, 0.6vw, 5px)' }}>
              <div
                style={{
                  width: 'clamp(3px, 0.7vw, 5px)',
                  height: 'clamp(14px, 2.5vw, 20px)',
                  background: '#fff',
                  borderRadius: 2,
                }}
              />
              <div
                style={{
                  width: 'clamp(3px, 0.7vw, 5px)',
                  height: 'clamp(14px, 2.5vw, 20px)',
                  background: '#fff',
                  borderRadius: 2,
                }}
              />
            </div>
          </div>

          {/* Next */}
          <div
            style={{
              width: 'clamp(16px, 3vw, 24px)',
              height: 'clamp(16px, 3vw, 24px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: `${textColor}99`,
              fontSize: 'clamp(14px, 2.5vw, 20px)',
            }}
          >
            {'\u23ED'}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-now-playing',
  title: 'Scene Now Playing',
  description:
    'Now Playing music card with album art gradient, song info, progress bar, and playback controls. Spotify/Apple Music aesthetic.',
  tags: ['scene', 'music', 'now-playing', 'spotify', 'player', 'album', 'streaming'],
  category: 'scene-layout',
  component: SceneNowPlayingComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    songTitle: 'Midnight Drive',
    artistName: 'Neon Waves',
    bgColor: '#0D0D0D',
    cardColor: '#1A1A2E',
    accentColor: '#1DB954',
    textColor: '#FFFFFF',
  },
  configSchema: [
    { key: 'songTitle', label: 'Song Title', type: 'text', defaultValue: 'Midnight Drive', group: 'Content' },
    { key: 'artistName', label: 'Artist Name', type: 'text', defaultValue: 'Neon Waves', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D0D0D', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#1DB954', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
})
