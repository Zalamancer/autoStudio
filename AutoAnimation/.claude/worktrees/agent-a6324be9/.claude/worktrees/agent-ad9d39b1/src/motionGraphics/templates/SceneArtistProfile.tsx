import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneArtistProfileConfig {
  artistName: string
  genre: string
  monthlyListeners: string
  topSong: string
  albumCount: number
  tourCity: string
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

function SceneArtistProfileComponent({ config, progress, frame, fps }: MotionGraphicProps<SceneArtistProfileConfig>) {
  const { artistName, genre, monthlyListeners, topSong, albumCount, tourCity, bgColor, cardColor, accentColor, textColor } = config
  const time = frame / fps

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Card entrance
  const cardSlide = easeOutBack(Math.min(1, enterProgress / 0.6))
  const cardOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Avatar pop
  const avatarScale = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.4)))

  // Name/genre
  const nameOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.25) / 0.3)))
  const nameY = (1 - nameOp) * 15

  // Stats
  const statsOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.45) / 0.3)))

  // Details
  const detailsOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.3)))

  // Verified badge wiggle during hold
  const badgeRotate = Math.sin(holdProgress * Math.PI * 4) * 5

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitY = exitEased * 100

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 25%, ${accentColor}12 0%, transparent 50%)` }} />

      <div style={{
        width: 'clamp(280px, 68vw, 440px)',
        background: cardColor,
        borderRadius: 'clamp(16px, 3vw, 24px)',
        padding: 'clamp(24px, 5vw, 40px)',
        transform: `scale(${cardSlide}) translateY(${exitY}px)`,
        opacity: cardOpacity * exitOpacity,
        boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px ${accentColor}15`,
        textAlign: 'center',
      }}>
        {/* Avatar */}
        <div style={{
          width: 'clamp(70px, 14vw, 100px)', height: 'clamp(70px, 14vw, 100px)',
          borderRadius: '50%', margin: '0 auto',
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}66)`,
          transform: `scale(${avatarScale})`,
          boxShadow: `0 8px 24px ${accentColor}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 'clamp(12px, 2.5vw, 20px)', position: 'relative',
          border: `3px solid ${accentColor}40`,
        }}>
          <div style={{ fontSize: 'clamp(28px, 5.5vw, 40px)', color: '#fff', opacity: 0.6 }}>
            {artistName.charAt(0)}
          </div>
          {/* Verified badge */}
          <div style={{
            position: 'absolute', bottom: -2, right: -2,
            width: 'clamp(20px, 4vw, 28px)', height: 'clamp(20px, 4vw, 28px)',
            borderRadius: '50%', background: '#1DA1F2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'clamp(10px, 2vw, 14px)', color: '#fff', fontWeight: 900,
            transform: `rotate(${badgeRotate}deg)`,
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          }}>
            {'\u2713'}
          </div>
        </div>

        {/* Artist name */}
        <div style={{
          fontSize: 'clamp(20px, 4.5vw, 32px)', fontWeight: 800, color: textColor,
          opacity: nameOp, transform: `translateY(${nameY}px)`, marginBottom: 4,
        }}>
          {artistName}
        </div>

        {/* Genre chip */}
        <div style={{
          display: 'inline-block',
          background: `${accentColor}20`, borderRadius: 'clamp(6px, 1.2vw, 10px)',
          padding: 'clamp(3px, 0.6vw, 5px) clamp(10px, 2vw, 16px)',
          fontSize: 'clamp(10px, 1.8vw, 13px)', fontWeight: 600, color: accentColor,
          marginBottom: 'clamp(14px, 3vw, 24px)', opacity: nameOp,
        }}>
          {genre}
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', justifyContent: 'space-around', gap: 'clamp(8px, 1.5vw, 16px)',
          padding: 'clamp(12px, 2.5vw, 20px) 0',
          borderTop: `1px solid ${textColor}10`, borderBottom: `1px solid ${textColor}10`,
          marginBottom: 'clamp(14px, 3vw, 22px)', opacity: statsOp,
        }}>
          {[
            { label: 'Listeners', value: monthlyListeners },
            { label: 'Albums', value: String(albumCount) },
            { label: 'Tour', value: tourCity },
          ].map((stat, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(14px, 2.8vw, 20px)', fontWeight: 800, color: textColor }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 'clamp(9px, 1.4vw, 11px)', fontWeight: 500, color: `${textColor}60`, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Top song */}
        <div style={{ opacity: detailsOp, display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 12px)', padding: 'clamp(8px, 1.5vw, 12px)', background: `${textColor}05`, borderRadius: 10 }}>
          {/* Play button */}
          <div style={{
            width: 'clamp(32px, 6vw, 42px)', height: 'clamp(32px, 6vw, 42px)',
            borderRadius: '50%', background: accentColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <div style={{ width: 0, height: 0, borderLeft: 'clamp(8px, 1.5vw, 12px) solid #fff', borderTop: 'clamp(5px, 1vw, 7px) solid transparent', borderBottom: 'clamp(5px, 1vw, 7px) solid transparent', marginLeft: 2 }} />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 'clamp(9px, 1.4vw, 11px)', fontWeight: 500, color: `${textColor}60`, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              TOP TRACK
            </div>
            <div style={{ fontSize: 'clamp(13px, 2.4vw, 18px)', fontWeight: 600, color: textColor }}>
              {topSong}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-artist-profile',
  title: 'Scene Artist Profile',
  description: 'Artist profile card with avatar, verified badge, stats row, genre chip, and top track with play button. Streaming platform aesthetic.',
  tags: ['scene', 'music', 'artist', 'profile', 'card', 'streaming', 'spotify', 'festival'],
  category: 'scene-layout',
  component: SceneArtistProfileComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    artistName: 'Luna Nova',
    genre: 'Electronic',
    monthlyListeners: '2.4M',
    topSong: 'Cosmic Drift',
    albumCount: 5,
    tourCity: 'NYC',
    bgColor: '#08080C',
    cardColor: '#161622',
    accentColor: '#8B5CF6',
    textColor: '#F0F0F5',
  },
  configSchema: [
    { key: 'artistName', label: 'Artist Name', type: 'text', defaultValue: 'Luna Nova', group: 'Content' },
    { key: 'genre', label: 'Genre', type: 'text', defaultValue: 'Electronic', group: 'Content' },
    { key: 'monthlyListeners', label: 'Monthly Listeners', type: 'text', defaultValue: '2.4M', group: 'Stats' },
    { key: 'topSong', label: 'Top Song', type: 'text', defaultValue: 'Cosmic Drift', group: 'Content' },
    { key: 'albumCount', label: 'Albums', type: 'number', defaultValue: 5, min: 1, max: 99, group: 'Stats' },
    { key: 'tourCity', label: 'Tour City', type: 'text', defaultValue: 'NYC', group: 'Stats' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#08080C', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#161622', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#8B5CF6', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#F0F0F5', group: 'Style' },
  ],
})
