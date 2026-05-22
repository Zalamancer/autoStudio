import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneHauntedHouseConfig {
  locationName: string
  yearBuilt: string
  historyNote: string
  hauntingType: string
  dangerRating: number
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function SceneHauntedHouseComponent({ config, progress, frame }: MotionGraphicProps<SceneHauntedHouseConfig>) {
  const { locationName, yearBuilt, historyNote, hauntingType, dangerRating, bgColor, textColor, accentColor } = config
  const f = frame ?? 0

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Window flicker: random window lights up
  const windowFlicker = Math.floor(f / 15) % 3
  const windowOpacity = (f % 15 < 3) ? 0.15 : 0.02

  // Fog drift
  const fogX = Math.sin(f * 0.015) * 20
  const fogOpacity = 0.1 + Math.sin(f * 0.03) * 0.04

  const cardEnter = easeOutCubic(enterProgress)
  const detailEnter = easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7))
  const statsEnter = easeOutCubic(Math.max(0, (enterProgress - 0.6) / 0.4))

  // Danger rating skulls
  const maxSkulls = 5
  const filledSkulls = Math.min(maxSkulls, Math.round(dangerRating))

  // House silhouette using divs
  const houseHeight = 100

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Sky gradient */}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, #0a0812 0%, #141020 40%, ${bgColor} 100%)` }} />

      {/* Moon */}
      <div
        style={{
          position: 'absolute',
          top: '6%',
          left: '20%',
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #eee8cc, #ccc8aa 50%, transparent)',
          opacity: cardEnter * 0.4,
          boxShadow: '0 0 30px rgba(200, 200, 150, 0.1)',
        }}
      />

      {/* House silhouette */}
      <div
        style={{
          position: 'absolute',
          bottom: '38%',
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: cardEnter * 0.25,
        }}
      >
        {/* Main house body */}
        <div style={{ width: 120, height: houseHeight, background: '#0a0808', position: 'relative' }}>
          {/* Roof */}
          <div
            style={{
              position: 'absolute',
              top: -40,
              left: -10,
              width: 0,
              height: 0,
              borderLeft: '70px solid transparent',
              borderRight: '70px solid transparent',
              borderBottom: '40px solid #0a0808',
            }}
          />
          {/* Windows */}
          {[{ left: 15, top: 20 }, { left: 70, top: 20 }, { left: 15, top: 55 }, { left: 70, top: 55 }].map((pos, i) => (
            <div
              key={`win-${i}`}
              style={{
                position: 'absolute',
                left: pos.left,
                top: pos.top,
                width: 28,
                height: 22,
                background: windowFlicker === i ? `rgba(200, 150, 50, ${windowOpacity * 3})` : `rgba(200, 150, 50, ${windowOpacity})`,
                border: '1px solid rgba(100, 80, 40, 0.1)',
              }}
            />
          ))}
          {/* Door */}
          <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 20, height: 35, background: '#060404', border: '1px solid rgba(80, 60, 40, 0.08)' }} />
        </div>
      </div>

      {/* Fog */}
      <div
        style={{
          position: 'absolute',
          left: `${30 + fogX}%`,
          bottom: '30%',
          width: '100%',
          height: '20%',
          background: `radial-gradient(ellipse, rgba(60, 50, 70, ${fogOpacity}), transparent 50%)`,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '6%',
          paddingBottom: '8%',
          opacity: exitOpacity,
        }}
      >
        {/* Info card */}
        <div
          style={{
            width: 'clamp(280px, 75vw, 460px)',
            background: 'rgba(8, 6, 12, 0.88)',
            borderRadius: 'clamp(8px, 2vw, 14px)',
            border: `1px solid ${accentColor}22`,
            padding: 'clamp(18px, 4.5vw, 32px)',
            opacity: cardEnter,
            boxShadow: `0 0 30px rgba(0,0,0,0.4)`,
          }}
        >
          {/* Year badge */}
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(8px, 1.4vw, 10px)', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 'clamp(4px, 1vw, 8px)', opacity: detailEnter }}>
            Est. {yearBuilt}
          </div>

          {/* Location name */}
          <div
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(20px, 5vw, 34px)',
              fontWeight: 700,
              color: textColor,
              marginBottom: 'clamp(6px, 1.5vw, 10px)',
              opacity: detailEnter,
              transform: `translateX(${(1 - detailEnter) * -15}px)`,
              textShadow: `0 0 15px ${accentColor}22`,
            }}
          >
            {locationName}
          </div>

          {/* Haunting type */}
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(10px, 2vw, 14px)',
              color: accentColor,
              marginBottom: 'clamp(10px, 2.5vw, 18px)',
              opacity: detailEnter * 0.8,
            }}
          >
            {hauntingType}
          </div>

          {/* History note */}
          <div
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(11px, 2.2vw, 16px)',
              color: `${textColor}88`,
              lineHeight: 1.6,
              marginBottom: 'clamp(14px, 3.5vw, 22px)',
              borderLeft: `2px solid ${accentColor}33`,
              paddingLeft: 'clamp(10px, 2.5vw, 16px)',
              opacity: statsEnter,
            }}
          >
            {historyNote}
          </div>

          {/* Danger rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.5vw, 10px)', opacity: statsEnter }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(8px, 1.4vw, 10px)', color: `${textColor}55`, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Danger</span>
            <div style={{ display: 'flex', gap: 3 }}>
              {Array.from({ length: maxSkulls }, (_, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 'clamp(10px, 2vw, 14px)',
                    opacity: i < filledSkulls ? 0.9 : 0.15,
                    filter: i < filledSkulls ? `drop-shadow(0 0 3px ${accentColor})` : 'none',
                  }}
                >
                  {'\u2620'}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-haunted-house',
  title: 'Haunted House Tour',
  description: 'Haunted location tour card with house silhouette, flickering windows, fog, danger rating with skulls, and history',
  tags: ['scene', 'horror', 'haunted', 'house', 'location', 'ghost', 'tour', 'creepy'],
  category: 'scene-layout',
  component: SceneHauntedHouseComponent as any,
  defaultConfig: {
    locationName: 'Ravenscroft Manor',
    yearBuilt: '1847',
    historyNote: 'Former residence of the Blackwell family. All seven members vanished on the night of October 13th, 1902. Their belongings remain untouched.',
    hauntingType: 'Poltergeist Activity / Shadow Figures',
    dangerRating: 4,
    bgColor: '#08060a',
    textColor: '#d0c8d8',
    accentColor: '#8855aa',
  },
  configSchema: [
    { key: 'locationName', label: 'Location Name', type: 'text', defaultValue: 'Ravenscroft Manor', group: 'Content' },
    { key: 'yearBuilt', label: 'Year Built', type: 'text', defaultValue: '1847', group: 'Content' },
    { key: 'historyNote', label: 'History Note', type: 'text', defaultValue: 'Former residence of the Blackwell family...', group: 'Content' },
    { key: 'hauntingType', label: 'Haunting Type', type: 'text', defaultValue: 'Poltergeist Activity / Shadow Figures', group: 'Content' },
    { key: 'dangerRating', label: 'Danger Rating (1-5)', type: 'number', defaultValue: 4, min: 1, max: 5, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#08060a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#d0c8d8', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#8855aa', group: 'Style' },
  ],
})
