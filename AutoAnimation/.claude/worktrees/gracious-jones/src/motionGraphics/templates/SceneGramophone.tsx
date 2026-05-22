import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GramophoneConfig {
  songTitle: string
  artistName: string
  label: string
  year: string
  bgColor: string
  textColor: string
  accentColor: string
  recordColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c = 1.70158
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneGramophoneComponent({
  config,
  frame,
  fps,
  durationInFrames,
}: MotionGraphicProps<GramophoneConfig>) {
  const { songTitle, artistName, label, year, bgColor, textColor, accentColor, recordColor } = config
  const progress = frame / durationInFrames
  const time = frame / fps

  const enterEnd = 0.28
  const holdEnd = 0.78
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Record appears with scale
  const recordScale = easeOutBack(Math.min(1, enterProgress / 0.4))

  // Record spinning — continuous during hold
  const spinAngle = enterProgress < 1 ? enterProgress * 180 : 180 + holdProgress * 720

  // Song title slides in
  const titleProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.3)))
  const titleX = (1 - titleProgress) * 30

  // Artist name
  const artistProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.45) / 0.25)))
  const artistX = (1 - artistProgress) * 25

  // Label and year
  const labelProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.25)))

  // Needle arm sway during hold
  const needleAngle = holdProgress > 0 ? -15 + Math.sin(time * 0.8) * 2 : -30 + enterProgress * 15

  // Music notes floating
  const noteOpacity = holdProgress > 0 ? Math.sin(time * 2) * 0.3 + 0.4 : 0

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitY = exitEased * 80

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: `linear-gradient(180deg, ${bgColor} 0%, #1A0F05 100%)`,
        fontFamily: "'Georgia', 'Times New Roman', serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Warm ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '60%',
          height: '60%',
          background: `radial-gradient(circle, ${accentColor}08 0%, transparent 60%)`,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          transform: `translateY(${exitY}px)`,
          opacity: exitOpacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(14px, 3vw, 24px)',
        }}
      >
        {/* Vinyl record */}
        <div
          style={{
            position: 'relative',
            width: 'clamp(160px, 38vw, 260px)',
            height: 'clamp(160px, 38vw, 260px)',
            transform: `scale(${recordScale}) rotate(${spinAngle}deg)`,
          }}
        >
          {/* Record disc */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: recordColor,
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            }}
          />
          {/* Groove lines */}
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={`groove-${i}`}
              style={{
                position: 'absolute',
                top: `${12 + i * 5}%`,
                left: `${12 + i * 5}%`,
                right: `${12 + i * 5}%`,
                bottom: `${12 + i * 5}%`,
                borderRadius: '50%',
                border: '0.5px solid rgba(255,255,255,0.04)',
              }}
            />
          ))}
          {/* Center label */}
          <div
            style={{
              position: 'absolute',
              top: '30%',
              left: '30%',
              right: '30%',
              bottom: '30%',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${accentColor} 0%, ${accentColor}DD 70%, ${accentColor}AA 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              boxShadow: `inset 0 0 10px rgba(0,0,0,0.2)`,
            }}
          >
            <div
              style={{
                fontSize: 'clamp(6px, 1.2vw, 9px)',
                fontWeight: 700,
                color: '#1A0F05',
                textTransform: 'uppercase',
                letterSpacing: 1,
                transform: `rotate(${-spinAngle}deg)`,
              }}
            >
              {label}
            </div>
            {/* Center hole */}
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#1A0F05',
                marginTop: 2,
              }}
            />
          </div>
        </div>

        {/* Tonearm / needle */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            right: '22%',
            width: 3,
            height: 'clamp(60px, 14vw, 100px)',
            background: 'linear-gradient(180deg, #8B7355, #5C4033)',
            borderRadius: 2,
            transformOrigin: 'top center',
            transform: `rotate(${needleAngle}deg)`,
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          }}
        >
          {/* Needle tip */}
          <div
            style={{
              position: 'absolute',
              bottom: -3,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#C0C0C0',
            }}
          />
        </div>

        {/* Floating music notes */}
        {Array.from({ length: 3 }, (_, i) => {
          const noteX = -30 + i * 30 + Math.sin(time * 1.5 + i * 2) * 15
          const noteY = -40 - i * 15 + Math.sin(time * 1.2 + i) * 10
          return (
            <div
              key={`note-${i}`}
              style={{
                position: 'absolute',
                top: `${35 + noteY * 0.3}%`,
                left: `${55 + noteX * 0.5}%`,
                fontSize: 'clamp(14px, 3vw, 22px)',
                color: accentColor,
                opacity: noteOpacity * (0.4 + i * 0.2),
                transform: `rotate(${Math.sin(time + i) * 15}deg)`,
              }}
            >
              {i % 2 === 0 ? '\u266B' : '\u266A'}
            </div>
          )
        })}

        {/* Song info */}
        <div style={{ textAlign: 'center' }}>
          {/* Song title */}
          <div
            style={{
              fontSize: 'clamp(20px, 5vw, 36px)',
              fontWeight: 900,
              fontStyle: 'italic',
              color: textColor,
              letterSpacing: 2,
              opacity: titleProgress,
              transform: `translateX(${titleX}px)`,
              marginBottom: 'clamp(4px, 0.8vw, 8px)',
            }}
          >
            {songTitle}
          </div>

          {/* Artist name */}
          <div
            style={{
              fontSize: 'clamp(13px, 2.8vw, 20px)',
              fontWeight: 400,
              color: `${textColor}AA`,
              opacity: artistProgress,
              transform: `translateX(${artistX}px)`,
              marginBottom: 'clamp(6px, 1.2vw, 10px)',
            }}
          >
            {artistName}
          </div>

          {/* Label and year */}
          <div
            style={{
              fontSize: 'clamp(10px, 1.8vw, 13px)',
              fontWeight: 600,
              color: accentColor,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              opacity: labelProgress,
            }}
          >
            {label} &middot; {year}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-gramophone',
  title: 'Scene Gramophone',
  description: 'Vintage gramophone/music player with spinning vinyl record, groove lines, tonearm, floating music notes, and song info',
  tags: ['scene', 'vintage', 'gramophone', 'vinyl', 'music', 'record', 'retro', 'analog'],
  category: 'scene-layout',
  component: SceneGramophoneComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    songTitle: 'Moonlight Serenade',
    artistName: 'Glenn Miller Orchestra',
    label: 'RCA VICTOR',
    year: '1939',
    bgColor: '#1A0F05',
    textColor: '#E8D5B7',
    accentColor: '#C9A84C',
    recordColor: '#1A1A1A',
  },
  configSchema: [
    { key: 'songTitle', label: 'Song Title', type: 'text', defaultValue: 'Moonlight Serenade', group: 'Content' },
    { key: 'artistName', label: 'Artist', type: 'text', defaultValue: 'Glenn Miller Orchestra', group: 'Content' },
    { key: 'label', label: 'Record Label', type: 'text', defaultValue: 'RCA VICTOR', group: 'Content' },
    { key: 'year', label: 'Year', type: 'text', defaultValue: '1939', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A0F05', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8D5B7', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#C9A84C', group: 'Style' },
    { key: 'recordColor', label: 'Record Color', type: 'color', defaultValue: '#1A1A1A', group: 'Style' },
  ],
})
