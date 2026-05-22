import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PlaylistCardConfig {
  trackName: string
  artist: string
  albumTitle: string
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

function ScenePlaylistCardComponent({ config, progress }: MotionGraphicProps<PlaylistCardConfig>) {
  const { trackName, artist, albumTitle, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Card slides up
  const cardEnter = easeOutBack(Math.min(1, enterProgress / 0.4))

  // Album art placeholder scales in
  const artEnter = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.3)))

  // Track name
  const nameEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.25) / 0.3)))

  // Artist
  const artistEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.25)))

  // Equalizer bars animate during hold
  const barCount = 5
  const getBarHeight = (index: number): number => {
    if (progress < 0.25) return 0.2
    const phase = holdProgress * Math.PI * 8 + index * 1.3
    return 0.3 + Math.abs(Math.sin(phase)) * 0.7
  }

  // Play button pulses
  const playEnter = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3)))
  const playPulse = progress >= 0.25 && progress < 0.8 ? 1 + Math.sin(holdProgress * Math.PI * 6) * 0.05 : 1

  // Album art rotation
  const artRotation = progress >= 0.25 && progress < 0.8 ? holdProgress * 360 : enterProgress * 90

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8%',
          opacity: exitOpacity,
          transform: `translateY(${exitEased * 50}px)`,
        }}
      >
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(16px, 2.5vw, 28px)',
            padding: 'clamp(20px, 4%, 40px)',
            maxWidth: 440,
            width: '100%',
            boxShadow: `0 12px 40px rgba(0,0,0,0.2)`,
            transform: `translateY(${(1 - cardEnter) * 80}px)`,
            opacity: cardEnter,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'clamp(14px, 2.5vh, 28px)',
          }}
        >
          {/* Album art placeholder (vinyl disc) */}
          <div
            style={{
              width: 'clamp(100px, 25vw, 180px)',
              height: 'clamp(100px, 25vw, 180px)',
              borderRadius: '50%',
              background: `conic-gradient(from ${artRotation}deg, ${accentColor}, ${accentColor}88, ${accentColor}44, ${accentColor}88, ${accentColor})`,
              transform: `scale(${artEnter})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 20px ${accentColor}30`,
            }}
          >
            {/* Center hole */}
            <div
              style={{
                width: '30%',
                height: '30%',
                borderRadius: '50%',
                background: cardColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ width: '40%', height: '40%', borderRadius: '50%', background: accentColor }} />
            </div>
          </div>

          {/* Track name */}
          <div
            style={{
              fontSize: 'clamp(18px, 4.5vw, 32px)',
              fontWeight: 800,
              color: textColor,
              textAlign: 'center',
              opacity: nameEnter,
              transform: `translateY(${(1 - nameEnter) * 15}px)`,
              lineHeight: 1.2,
            }}
          >
            {trackName}
          </div>

          {/* Artist */}
          <div
            style={{
              fontSize: 'clamp(12px, 2.2vw, 18px)',
              fontWeight: 500,
              color: `${textColor}99`,
              opacity: artistEnter,
              transform: `translateY(${(1 - artistEnter) * 10}px)`,
              marginTop: -8,
            }}
          >
            {artist}
          </div>

          {/* Album title badge */}
          <div
            style={{
              fontSize: 'clamp(9px, 1.5vw, 13px)',
              fontWeight: 600,
              color: accentColor,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              background: `${accentColor}15`,
              padding: 'clamp(4px, 0.6vh, 8px) clamp(10px, 1.8vw, 18px)',
              borderRadius: 100,
              opacity: artistEnter,
            }}
          >
            {albumTitle}
          </div>

          {/* Equalizer bars + play button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 2.5vw, 24px)' }}>
            {/* Play button */}
            <div
              style={{
                width: 'clamp(32px, 6vw, 48px)',
                height: 'clamp(32px, 6vw, 48px)',
                borderRadius: '50%',
                background: accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${playEnter * playPulse})`,
                boxShadow: `0 2px 12px ${accentColor}50`,
              }}
            >
              <svg viewBox="0 0 24 24" style={{ width: '50%', height: '50%', marginLeft: '10%' }}>
                <path d="M8 5v14l11-7z" fill={cardColor} />
              </svg>
            </div>

            {/* Equalizer */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'clamp(3px, 0.5vw, 5px)', height: 'clamp(24px, 4vw, 36px)' }}>
              {Array.from({ length: barCount }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 'clamp(4px, 0.8vw, 6px)',
                    height: `${getBarHeight(i) * 100}%`,
                    background: accentColor,
                    borderRadius: 2,
                    opacity: playEnter,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-playlist-card',
  title: 'Playlist Card',
  description: 'Music playlist card with vinyl disc art, track info, animated equalizer bars, and play button',
  tags: ['scene', 'music', 'playlist', 'lifestyle', 'personal', 'audio'],
  category: 'scene-layout',
  component: ScenePlaylistCardComponent as any,
  defaultConfig: {
    trackName: 'Midnight Drive',
    artist: 'The Neon Waves',
    albumTitle: 'After Hours',
    bgColor: '#0f0f1a',
    cardColor: '#1a1a2e',
    accentColor: '#e040fb',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'trackName', label: 'Track Name', type: 'text', defaultValue: 'Midnight Drive', group: 'Content' },
    { key: 'artist', label: 'Artist', type: 'text', defaultValue: 'The Neon Waves', group: 'Content' },
    { key: 'albumTitle', label: 'Album Title', type: 'text', defaultValue: 'After Hours', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0f1a', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#e040fb', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
