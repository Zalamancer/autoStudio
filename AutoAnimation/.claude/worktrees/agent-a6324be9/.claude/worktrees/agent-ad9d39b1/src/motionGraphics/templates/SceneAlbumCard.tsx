import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneAlbumCardConfig {
  albumTitle: string
  artistName: string
  track1: string
  track2: string
  track3: string
  track4: string
  track5: string
  releaseYear: string
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

function SceneAlbumCardComponent({ config, progress }: MotionGraphicProps<SceneAlbumCardConfig>) {
  const { albumTitle, artistName, track1, track2, track3, track4, track5, releaseYear, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const cardScale = easeOutBack(Math.min(1, enterProgress / 0.6))
  const cardOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Album art gradient rotation
  const gradAngle = holdProgress * 360

  // Title stagger
  const titleOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.3)))
  const artistOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.3)))

  const tracks = [track1, track2, track3, track4, track5]

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitY = exitEased * 100

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 30%, ${accentColor}12 0%, transparent 60%)` }} />

      {/* Card */}
      <div style={{
        width: 'clamp(280px, 65vw, 440px)',
        background: cardColor,
        borderRadius: 'clamp(14px, 3vw, 22px)',
        overflow: 'hidden',
        transform: `scale(${cardScale}) translateY(${exitY}px)`,
        opacity: cardOpacity * exitOpacity,
        boxShadow: `0 16px 50px rgba(0,0,0,0.4), 0 0 60px ${accentColor}08`,
      }}>
        {/* Album art */}
        <div style={{ width: '100%', paddingBottom: '100%', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(${gradAngle}deg, ${accentColor}, ${accentColor}88, ${accentColor}44, ${accentColor}AA)`,
          }} />
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'clamp(48px, 10vw, 80px)', opacity: 0.2, color: '#fff',
          }}>
            {'\u266B'}
          </div>
          {/* Year badge */}
          <div style={{
            position: 'absolute', top: 'clamp(10px, 2vw, 16px)', right: 'clamp(10px, 2vw, 16px)',
            background: 'rgba(0,0,0,0.6)', borderRadius: 'clamp(4px, 0.8vw, 8px)',
            padding: 'clamp(3px, 0.6vw, 5px) clamp(8px, 1.6vw, 12px)',
            fontSize: 'clamp(10px, 1.8vw, 13px)', fontWeight: 700, color: '#fff',
            opacity: artistOp, backdropFilter: 'blur(8px)',
          }}>
            {releaseYear}
          </div>
        </div>

        {/* Info section */}
        <div style={{ padding: 'clamp(16px, 3vw, 28px)' }}>
          {/* Album title */}
          <div style={{
            fontSize: 'clamp(18px, 3.5vw, 26px)', fontWeight: 800, color: textColor,
            opacity: titleOp, marginBottom: 4, lineHeight: 1.2,
          }}>
            {albumTitle}
          </div>
          {/* Artist */}
          <div style={{
            fontSize: 'clamp(12px, 2.2vw, 16px)', fontWeight: 500, color: `${textColor}80`,
            opacity: artistOp, marginBottom: 'clamp(12px, 2.5vw, 20px)',
          }}>
            {artistName}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: `${textColor}15`, marginBottom: 'clamp(10px, 2vw, 16px)' }} />

          {/* Track listing */}
          {tracks.map((track, i) => {
            const trackOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.45 - i * 0.06) / 0.3)))
            const isPlaying = Math.floor(holdProgress * 5) === i
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 12px)',
                padding: 'clamp(5px, 1vw, 8px) 0', opacity: trackOp,
                transform: `translateX(${(1 - trackOp) * 20}px)`,
              }}>
                <div style={{
                  fontSize: 'clamp(10px, 1.6vw, 13px)', fontWeight: 600,
                  color: isPlaying ? accentColor : `${textColor}40`, width: 'clamp(16px, 3vw, 22px)',
                  textAlign: 'right', fontFamily: "'Courier New', monospace",
                }}>
                  {isPlaying ? '\u25B6' : `${i + 1}.`}
                </div>
                <div style={{
                  fontSize: 'clamp(12px, 2vw, 15px)', fontWeight: isPlaying ? 600 : 400,
                  color: isPlaying ? accentColor : `${textColor}CC`, flex: 1,
                }}>
                  {track}
                </div>
                <div style={{
                  fontSize: 'clamp(9px, 1.4vw, 11px)', color: `${textColor}40`,
                  fontFamily: "'Courier New', monospace",
                }}>
                  {Math.floor(2 + Math.random() * 2)}:{String(Math.floor(Math.random() * 60)).padStart(2, '0')}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-album-card',
  title: 'Scene Album Card',
  description: 'Album art card with track listing, artist name, release year, and animated now-playing indicator. Streaming music aesthetic.',
  tags: ['scene', 'music', 'album', 'tracklist', 'card', 'streaming', 'spotify', 'festival'],
  category: 'scene-layout',
  component: SceneAlbumCardComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    albumTitle: 'Neon Horizons',
    artistName: 'Synthwave Collective',
    track1: 'Electric Sunrise',
    track2: 'Neon Highway',
    track3: 'After Midnight',
    track4: 'Chrome Dreams',
    track5: 'Last Dance',
    releaseYear: '2026',
    bgColor: '#0A0A0A',
    cardColor: '#1A1A2E',
    accentColor: '#1DB954',
    textColor: '#FFFFFF',
  },
  configSchema: [
    { key: 'albumTitle', label: 'Album Title', type: 'text', defaultValue: 'Neon Horizons', group: 'Content' },
    { key: 'artistName', label: 'Artist', type: 'text', defaultValue: 'Synthwave Collective', group: 'Content' },
    { key: 'track1', label: 'Track 1', type: 'text', defaultValue: 'Electric Sunrise', group: 'Tracks' },
    { key: 'track2', label: 'Track 2', type: 'text', defaultValue: 'Neon Highway', group: 'Tracks' },
    { key: 'track3', label: 'Track 3', type: 'text', defaultValue: 'After Midnight', group: 'Tracks' },
    { key: 'track4', label: 'Track 4', type: 'text', defaultValue: 'Chrome Dreams', group: 'Tracks' },
    { key: 'track5', label: 'Track 5', type: 'text', defaultValue: 'Last Dance', group: 'Tracks' },
    { key: 'releaseYear', label: 'Year', type: 'text', defaultValue: '2026', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A0A', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#1DB954', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
})
