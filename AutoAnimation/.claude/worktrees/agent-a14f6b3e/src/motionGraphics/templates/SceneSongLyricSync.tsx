import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneSongLyricSyncConfig {
  line1: string
  line2: string
  line3: string
  line4: string
  line5: string
  songTitle: string
  artistName: string
  bgColor: string
  activeColor: string
  dimColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneSongLyricSyncComponent({ config, progress, frame, fps }: MotionGraphicProps<SceneSongLyricSyncConfig>) {
  const { line1, line2, line3, line4, line5, songTitle, artistName, bgColor, activeColor, dimColor, accentColor } = config
  const time = frame / fps

  const enterProgress = progress < 0.15 ? progress / 0.15 : 1
  const holdProgress = progress >= 0.15 && progress < 0.85 ? (progress - 0.15) / 0.7 : progress >= 0.85 ? 1 : 0
  const exitProgress = progress >= 0.85 ? (progress - 0.85) / 0.15 : 0

  const lines = [line1, line2, line3, line4, line5]
  const activeLineIdx = Math.floor(holdProgress * lines.length)

  // Overall fade in
  const fadeIn = easeOutCubic(Math.min(1, enterProgress / 0.5))

  // Header
  const headerOp = easeOutCubic(Math.max(0, Math.min(1, enterProgress / 0.4)))

  // Progress bar across full duration
  const progressWidth = holdProgress * 100

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Background color pulse
  const bgPulse = 0.02 + 0.01 * Math.sin(time * 2)

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: fadeIn * exitOpacity }}>
      {/* Background accent glow */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 50%, ${accentColor}${Math.round(bgPulse * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)` }} />

      {/* Song info header */}
      <div style={{ position: 'absolute', top: 'clamp(20px, 4vw, 40px)', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', opacity: headerOp }}>
        <div style={{ fontSize: 'clamp(10px, 1.8vw, 14px)', fontWeight: 600, color: accentColor, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>
          LYRICS
        </div>
        <div style={{ fontSize: 'clamp(13px, 2.4vw, 18px)', fontWeight: 700, color: activeColor }}>
          {songTitle}
        </div>
        <div style={{ fontSize: 'clamp(10px, 1.8vw, 14px)', fontWeight: 400, color: dimColor }}>
          {artistName}
        </div>
      </div>

      {/* Lyrics */}
      <div style={{ width: '85%', maxWidth: 500, textAlign: 'center' }}>
        {lines.map((line, i) => {
          const isActive = i === activeLineIdx
          const isPast = i < activeLineIdx
          const isFuture = i > activeLineIdx

          const lineOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3 - i * 0.08) / 0.3)))

          // Active line gets bigger and brighter
          const lineScale = isActive ? 1.08 : 1
          const lineBlur = isFuture ? 1 : 0

          return (
            <div
              key={i}
              style={{
                fontSize: isActive ? 'clamp(20px, 4.5vw, 32px)' : 'clamp(16px, 3.2vw, 24px)',
                fontWeight: isActive ? 800 : 500,
                color: isActive ? activeColor : isPast ? dimColor : `${dimColor}80`,
                padding: 'clamp(8px, 1.8vw, 14px) 0',
                opacity: lineOp,
                transform: `scale(${lineScale})`,
                filter: lineBlur > 0 ? `blur(${lineBlur}px)` : undefined,
                lineHeight: 1.4,
                transition: 'all 0.3s ease',
              }}
            >
              {line}
            </div>
          )
        })}
      </div>

      {/* Progress bar at bottom */}
      <div style={{
        position: 'absolute', bottom: 'clamp(24px, 5vw, 44px)', left: '10%', right: '10%',
        opacity: headerOp,
      }}>
        <div style={{ height: 'clamp(3px, 0.5vw, 4px)', background: `${dimColor}20`, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${progressWidth}%`, height: '100%', background: accentColor, borderRadius: 3 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 'clamp(9px, 1.4vw, 11px)', color: dimColor }}>
          <span>{Math.floor(holdProgress * 3)}:{String(Math.floor((holdProgress * 180) % 60)).padStart(2, '0')}</span>
          <span>3:42</span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-song-lyric-sync',
  title: 'Scene Song Lyric Sync',
  description: 'Synced lyrics display like Spotify with active line highlighting, dimmed past/future lines, progress bar, and song info header.',
  tags: ['scene', 'music', 'lyrics', 'sync', 'spotify', 'karaoke', 'song', 'festival'],
  category: 'scene-layout',
  component: SceneSongLyricSyncComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    line1: 'Lost in the rhythm of the night',
    line2: 'Dancing under neon lights',
    line3: 'Every beat brings us alive',
    line4: 'We are the music and the vibe',
    line5: 'Nothing else matters tonight',
    songTitle: 'Neon Nights',
    artistName: 'Electric Dreams',
    bgColor: '#0A0A0A',
    activeColor: '#FFFFFF',
    dimColor: '#666666',
    accentColor: '#1DB954',
  },
  configSchema: [
    { key: 'line1', label: 'Line 1', type: 'text', defaultValue: 'Lost in the rhythm of the night', group: 'Lyrics' },
    { key: 'line2', label: 'Line 2', type: 'text', defaultValue: 'Dancing under neon lights', group: 'Lyrics' },
    { key: 'line3', label: 'Line 3', type: 'text', defaultValue: 'Every beat brings us alive', group: 'Lyrics' },
    { key: 'line4', label: 'Line 4', type: 'text', defaultValue: 'We are the music and the vibe', group: 'Lyrics' },
    { key: 'line5', label: 'Line 5', type: 'text', defaultValue: 'Nothing else matters tonight', group: 'Lyrics' },
    { key: 'songTitle', label: 'Song Title', type: 'text', defaultValue: 'Neon Nights', group: 'Content' },
    { key: 'artistName', label: 'Artist', type: 'text', defaultValue: 'Electric Dreams', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A0A', group: 'Style' },
    { key: 'activeColor', label: 'Active Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'dimColor', label: 'Dim Color', type: 'color', defaultValue: '#666666', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#1DB954', group: 'Style' },
  ],
})
