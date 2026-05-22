import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneSetlistCardConfig {
  bandName: string
  venue: string
  song1: string
  song2: string
  song3: string
  song4: string
  song5: string
  song6: string
  bgColor: string
  paperColor: string
  inkColor: string
  checkColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneSetlistCardComponent({ config, progress, frame, fps }: MotionGraphicProps<SceneSetlistCardConfig>) {
  const { bandName, venue, song1, song2, song3, song4, song5, song6, bgColor, paperColor, inkColor, checkColor } = config
  const time = frame / fps

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Paper slides in with slight rotation
  const paperSlide = easeOutBack(Math.min(1, enterProgress / 0.6))
  const paperRotation = (1 - paperSlide) * 8 - 1.5
  const paperOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  const songs = [song1, song2, song3, song4, song5, song6]
  const currentSongIdx = Math.floor(holdProgress * songs.length)

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitY = exitEased * 120

  // Tape strip positions
  const tapeAngle = -3 + Math.sin(time * 0.5) * 0.5

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Courier New', 'Fira Code', monospace", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Stage floor texture */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 80%, rgba(60,40,20,0.15) 0%, transparent 60%)` }} />

      {/* Setlist paper */}
      <div style={{
        width: 'clamp(260px, 60vw, 400px)',
        background: paperColor,
        borderRadius: 4,
        padding: 'clamp(24px, 5vw, 40px) clamp(20px, 4vw, 32px)',
        transform: `rotate(${paperRotation}deg) translateY(${exitY}px) scale(${paperSlide})`,
        opacity: paperOpacity * exitOpacity,
        boxShadow: '0 8px 30px rgba(0,0,0,0.3), 4px 4px 0 rgba(0,0,0,0.08)',
        position: 'relative',
      }}>
        {/* Tape strip at top */}
        <div style={{
          position: 'absolute', top: -8, left: '30%', width: 'clamp(60px, 14vw, 100px)', height: 'clamp(16px, 3vw, 24px)',
          background: 'rgba(200,180,140,0.6)', borderRadius: 2,
          transform: `rotate(${tapeAngle}deg)`,
        }} />

        {/* Band name header */}
        <div style={{
          fontSize: 'clamp(20px, 5vw, 36px)', fontWeight: 900, color: inkColor,
          textTransform: 'uppercase', textAlign: 'center', letterSpacing: '-0.02em',
          marginBottom: 4, opacity: easeOutCubic(Math.max(0, Math.min(1, enterProgress / 0.4))),
          textDecoration: 'underline', textDecorationThickness: 2, textUnderlineOffset: 6,
        }}>
          {bandName}
        </div>

        {/* Venue */}
        <div style={{
          fontSize: 'clamp(10px, 1.8vw, 14px)', color: `${inkColor}80`, textAlign: 'center',
          marginBottom: 'clamp(16px, 3vw, 28px)',
          opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.3))),
          letterSpacing: '0.05em',
        }}>
          @ {venue}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: `${inkColor}20`, marginBottom: 'clamp(10px, 2vw, 16px)' }} />

        {/* Songs */}
        {songs.map((song, i) => {
          const songOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35 - i * 0.07) / 0.3)))
          const isChecked = i < currentSongIdx
          const isCurrent = i === currentSongIdx

          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 14px)',
              padding: 'clamp(6px, 1.2vw, 10px) 0', opacity: songOp,
              transform: `translateX(${(1 - songOp) * 15}px)`,
              borderBottom: i < songs.length - 1 ? `1px dashed ${inkColor}10` : undefined,
            }}>
              {/* Checkbox */}
              <div style={{
                width: 'clamp(16px, 3vw, 22px)', height: 'clamp(16px, 3vw, 22px)',
                border: `2px solid ${isChecked ? checkColor : `${inkColor}30`}`,
                borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isChecked ? `${checkColor}15` : 'transparent', flexShrink: 0,
              }}>
                {isChecked && (
                  <div style={{ fontSize: 'clamp(10px, 1.8vw, 14px)', color: checkColor, fontWeight: 900 }}>
                    {'\u2713'}
                  </div>
                )}
              </div>

              {/* Song number + name */}
              <div style={{
                fontSize: 'clamp(13px, 2.4vw, 18px)',
                fontWeight: isCurrent ? 700 : 400,
                color: isChecked ? `${inkColor}50` : isCurrent ? checkColor : inkColor,
                textDecoration: isChecked ? 'line-through' : 'none',
                flex: 1,
              }}>
                {i + 1}. {song}
              </div>

              {/* Now playing indicator */}
              {isCurrent && (
                <div style={{
                  fontSize: 'clamp(8px, 1.4vw, 11px)', color: checkColor,
                  fontWeight: 700, letterSpacing: '0.1em',
                }}>
                  NOW
                </div>
              )}
            </div>
          )
        })}

        {/* Bottom note */}
        <div style={{
          marginTop: 'clamp(12px, 2.5vw, 20px)', fontSize: 'clamp(9px, 1.5vw, 12px)',
          color: `${inkColor}40`, textAlign: 'center', fontStyle: 'italic',
          opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.3))),
        }}>
          + encore
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-setlist-card',
  title: 'Scene Setlist Card',
  description: 'Concert setlist on paper with animated checkmarks, now-playing indicator, tape strip, and handwritten feel. Backstage aesthetic.',
  tags: ['scene', 'music', 'setlist', 'concert', 'live', 'backstage', 'paper', 'festival'],
  category: 'scene-layout',
  component: SceneSetlistCardComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    bandName: 'THE MIDNIGHT',
    venue: 'Red Rocks',
    song1: 'Sunset',
    song2: 'Los Angeles',
    song3: 'Crystalline',
    song4: 'River of Darkness',
    song5: 'Nocturnal',
    song6: 'Days of Thunder',
    bgColor: '#1A1410',
    paperColor: '#F5F0E6',
    inkColor: '#2C2418',
    checkColor: '#E63946',
  },
  configSchema: [
    { key: 'bandName', label: 'Band Name', type: 'text', defaultValue: 'THE MIDNIGHT', group: 'Content' },
    { key: 'venue', label: 'Venue', type: 'text', defaultValue: 'Red Rocks', group: 'Content' },
    { key: 'song1', label: 'Song 1', type: 'text', defaultValue: 'Sunset', group: 'Songs' },
    { key: 'song2', label: 'Song 2', type: 'text', defaultValue: 'Los Angeles', group: 'Songs' },
    { key: 'song3', label: 'Song 3', type: 'text', defaultValue: 'Crystalline', group: 'Songs' },
    { key: 'song4', label: 'Song 4', type: 'text', defaultValue: 'River of Darkness', group: 'Songs' },
    { key: 'song5', label: 'Song 5', type: 'text', defaultValue: 'Nocturnal', group: 'Songs' },
    { key: 'song6', label: 'Song 6', type: 'text', defaultValue: 'Days of Thunder', group: 'Songs' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1410', group: 'Style' },
    { key: 'paperColor', label: 'Paper', type: 'color', defaultValue: '#F5F0E6', group: 'Style' },
    { key: 'inkColor', label: 'Ink Color', type: 'color', defaultValue: '#2C2418', group: 'Style' },
    { key: 'checkColor', label: 'Check Color', type: 'color', defaultValue: '#E63946', group: 'Style' },
  ],
})
