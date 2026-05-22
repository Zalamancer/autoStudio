import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FilmRollConfig {
  rollTitle: string
  photographer: string
  filmStock: string
  frameCount: number
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

/** Deterministic pseudo-random */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function SceneFilmRollComponent({ config, progress }: MotionGraphicProps<FilmRollConfig>) {
  const { rollTitle, photographer, filmStock, frameCount, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Contact sheet grid — 4 columns x 3 rows (max 12 frames)
  const cols = 4
  const rows = Math.ceil(Math.min(frameCount, 12) / cols)
  const totalFrames = Math.min(frameCount, cols * rows)

  // Highlighted frame cycles during hold
  const activeFrame = Math.floor(holdProgress * totalFrames * 2) % totalFrames

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: '4%',
      }}
    >
      <div
        style={{
          background: cardColor,
          borderRadius: 'clamp(10px, 1.5vw, 16px)',
          padding: 'clamp(14px, 2.5%, 24px)',
          maxWidth: 440,
          width: '100%',
          opacity: exitOpacity,
          transform: `translateY(${(1 - easeOutCubic(Math.min(1, enterProgress / 0.4))) * 80 + exitEased * -50}px)`,
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'clamp(10px, 1.5vh, 16px)',
            opacity: easeOutCubic(Math.min(1, enterProgress / 0.3)),
          }}
        >
          <div>
            <div style={{ fontSize: 'clamp(14px, 2.5vw, 20px)', fontWeight: 800, color: textColor }}>{rollTitle}</div>
            <div style={{ fontSize: 'clamp(10px, 1.4vw, 13px)', color: `${textColor}60`, fontWeight: 500 }}>{photographer}</div>
          </div>
          <div
            style={{
              background: `${accentColor}15`,
              color: accentColor,
              fontSize: 'clamp(9px, 1.2vw, 12px)',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 8,
              fontFamily: "'Courier New', monospace",
            }}
          >
            {filmStock}
          </div>
        </div>

        {/* Film border top */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0 4px',
            marginBottom: 3,
          }}
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 'clamp(8px, 1.5vw, 14px)',
                height: 'clamp(5px, 0.8vw, 8px)',
                borderRadius: 1,
                background: `${textColor}15`,
              }}
            />
          ))}
        </div>

        {/* Contact sheet grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 'clamp(3px, 0.5vw, 6px)',
            background: '#111',
            padding: 'clamp(3px, 0.5vw, 6px)',
            borderRadius: 4,
          }}
        >
          {Array.from({ length: totalFrames }).map((_, i) => {
            const row = Math.floor(i / cols)
            const col = i % cols
            const frameDelay = 0.15 + (row * cols + col) * 0.04
            const frameProg = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - frameDelay) / 0.3)))
            const isActive = i === activeFrame
            const hue = rand(i * 73 + 11) * 360
            const lightness = 25 + rand(i * 31 + 7) * 20

            return (
              <div
                key={i}
                style={{
                  aspectRatio: '3/2',
                  borderRadius: 2,
                  background: `hsla(${hue}, 20%, ${lightness}%, ${frameProg})`,
                  border: isActive ? `2px solid ${accentColor}` : '1px solid #333',
                  opacity: frameProg,
                  transform: `scale(${frameProg})`,
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: isActive ? `0 0 8px ${accentColor}30` : 'none',
                }}
              >
                {/* Frame number */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 3,
                    fontSize: 'clamp(6px, 0.9vw, 9px)',
                    color: 'rgba(255,255,255,0.5)',
                    fontFamily: "'Courier New', monospace",
                    fontWeight: 600,
                  }}
                >
                  {i + 1}
                </div>
                {/* Selected indicator */}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: 3,
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: accentColor,
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Film border bottom */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0 4px',
            marginTop: 3,
          }}
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 'clamp(8px, 1.5vw, 14px)',
                height: 'clamp(5px, 0.8vw, 8px)',
                borderRadius: 1,
                background: `${textColor}15`,
              }}
            />
          ))}
        </div>

        {/* Footer info */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 'clamp(8px, 1.2vh, 14px)',
            opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3))),
          }}
        >
          <span style={{ fontSize: 'clamp(9px, 1.2vw, 11px)', color: `${textColor}40`, fontFamily: "'Courier New', monospace" }}>
            {totalFrames} frames
          </span>
          <span style={{ fontSize: 'clamp(9px, 1.2vw, 11px)', color: `${textColor}40`, fontFamily: "'Courier New', monospace" }}>
            CONTACT SHEET
          </span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-film-roll',
  title: 'Scene Film Roll',
  description: 'Film roll contact sheet layout with sprocket holes, frame numbers, cycling highlight, and film stock label',
  tags: ['scene', 'photography', 'film', 'contact-sheet', 'analog', 'vintage', 'roll'],
  category: 'scenes',
  component: SceneFilmRollComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    rollTitle: 'Roll #047',
    photographer: 'Sarah Chen',
    filmStock: 'Portra 400',
    frameCount: 12,
    bgColor: '#0F1419',
    cardColor: '#1C2128',
    accentColor: '#E8593E',
    textColor: '#E6EDF3',
  },
  configSchema: [
    { key: 'rollTitle', label: 'Roll Title', type: 'text', defaultValue: 'Roll #047', group: 'Content' },
    { key: 'photographer', label: 'Photographer', type: 'text', defaultValue: 'Sarah Chen', group: 'Content' },
    { key: 'filmStock', label: 'Film Stock', type: 'text', defaultValue: 'Portra 400', group: 'Content' },
    { key: 'frameCount', label: 'Frame Count', type: 'number', defaultValue: 12, min: 4, max: 12, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F1419', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1C2128', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#E8593E', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E6EDF3', group: 'Style' },
  ],
})
