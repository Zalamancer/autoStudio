import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneMemoryCardConfig {
  caption: string
  date: string
  location: string
  mood: string
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
  overlayColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158; const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneMemoryCardComponent({ config, frame, durationInFrames }: MotionGraphicProps<SceneMemoryCardConfig>) {
  const { caption, date, location, mood, bgColor, cardColor, accentColor, textColor, overlayColor } = config
  const progress = frame / durationInFrames
  const fps = 30
  const timeS = frame / fps

  const enterProgress = Math.min(1, progress / 0.25)
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Polaroid card drops in with slight tilt
  const cardDrop = easeOutBack(Math.min(1, enterProgress / 0.5))
  const cardY = (1 - cardDrop) * -200
  const cardRotate = (1 - cardDrop) * 8

  // Photo develops (opacity/blur)
  const photoDevelop = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.5)))

  // Vintage film grain overlay
  const grainAlpha = 0.04 + Math.sin(timeS * 12) * 0.01

  // Caption reveals like handwriting
  const captionReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.35)))

  // Date & location
  const dateReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.25)))
  const locationReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.65) / 0.25)))
  const moodReveal = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.75) / 0.2)))

  // Subtle Ken Burns on photo during hold
  const zoomScale = 1 + holdProgress * 0.06
  const panX = Math.sin(holdProgress * Math.PI * 2) * 2
  const panY = Math.cos(holdProgress * Math.PI * 1.5) * 1.5

  // Vignette corners
  const vignetteProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.4)))

  // Film sprocket holes
  const sprocketHoles = Array.from({ length: 4 }, (_, i) => ({
    y: 15 + i * 22,
  }))

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
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Film strip edges */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 'clamp(16px, 3vw, 28px)',
          background: `${textColor}08`,
          opacity: exitOpacity,
        }}
      >
        {sprocketHoles.map((h, i) => (
          <div
            key={`l-${i}`}
            style={{
              position: 'absolute',
              left: '50%',
              top: `${h.y}%`,
              transform: 'translate(-50%, -50%)',
              width: 'clamp(6px, 1vw, 10px)',
              height: 'clamp(8px, 1.4vw, 14px)',
              borderRadius: 2,
              background: bgColor,
            }}
          />
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 'clamp(16px, 3vw, 28px)',
          background: `${textColor}08`,
          opacity: exitOpacity,
        }}
      >
        {sprocketHoles.map((h, i) => (
          <div
            key={`r-${i}`}
            style={{
              position: 'absolute',
              left: '50%',
              top: `${h.y}%`,
              transform: 'translate(-50%, -50%)',
              width: 'clamp(6px, 1vw, 10px)',
              height: 'clamp(8px, 1.4vw, 14px)',
              borderRadius: 2,
              background: bgColor,
            }}
          />
        ))}
      </div>

      <div
        style={{
          width: '78%',
          maxWidth: 380,
          transform: `translateY(${cardY + exitEased * 150}px) rotate(${cardRotate + exitEased * -5}deg)`,
          opacity: cardDrop * exitOpacity,
        }}
      >
        {/* Polaroid card */}
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(4px, 0.8vw, 8px)',
            padding: 'clamp(8px, 1.5vw, 14px)',
            paddingBottom: 'clamp(30px, 7vw, 60px)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          {/* Photo area */}
          <div
            style={{
              width: '100%',
              aspectRatio: '1',
              background: `linear-gradient(135deg, ${overlayColor}30, ${accentColor}20, ${overlayColor}25)`,
              borderRadius: 'clamp(2px, 0.4vw, 4px)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Photo placeholder with Ken Burns */}
            <div
              style={{
                position: 'absolute',
                inset: '-5%',
                background: `linear-gradient(135deg, ${accentColor}25, ${overlayColor}35, ${accentColor}20)`,
                transform: `scale(${zoomScale}) translate(${panX}%, ${panY}%)`,
                opacity: photoDevelop,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ fontSize: 'clamp(40px, 10vw, 72px)', opacity: 0.6 }}>{'📷'}</div>
            </div>

            {/* Film grain */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 1px,
                  rgba(0,0,0,${grainAlpha}) 1px,
                  rgba(0,0,0,${grainAlpha}) 2px
                )`,
                pointerEvents: 'none',
              }}
            />

            {/* Vignette */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle, transparent 50%, rgba(0,0,0,0.25) 100%)',
                opacity: vignetteProgress * 0.6,
                pointerEvents: 'none',
              }}
            />

            {/* Light leak */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '40%',
                height: '30%',
                background: `linear-gradient(225deg, ${accentColor}15, transparent)`,
                opacity: photoDevelop * 0.5,
                pointerEvents: 'none',
              }}
            />

            {/* Mood tag */}
            <div
              style={{
                position: 'absolute',
                bottom: 'clamp(6px, 1.2vw, 10px)',
                right: 'clamp(6px, 1.2vw, 10px)',
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)',
                color: '#fff',
                fontSize: 'clamp(9px, 1.4vw, 12px)',
                fontWeight: 600,
                padding: 'clamp(2px, 0.4vw, 4px) clamp(6px, 1vw, 10px)',
                borderRadius: 100,
                transform: `scale(${moodReveal})`,
                opacity: moodReveal,
              }}
            >
              {mood}
            </div>
          </div>
        </div>

        {/* Caption area (on white Polaroid space) */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 'clamp(6px, 1.2vw, 10px) clamp(14px, 2.5vw, 20px) clamp(10px, 2vw, 16px)',
          }}
        >
          {/* Handwriting caption */}
          <div
            style={{
              fontFamily: "'Georgia', 'Palatino', serif",
              fontSize: 'clamp(12px, 2.2vw, 18px)',
              fontWeight: 500,
              fontStyle: 'italic',
              color: textColor,
              opacity: captionReveal,
              transform: `translateY(${(1 - captionReveal) * 8}px)`,
              marginBottom: 'clamp(2px, 0.5vw, 4px)',
            }}
          >
            {caption}
          </div>

          {/* Date & Location */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: 'clamp(8px, 1.3vw, 11px)',
                fontWeight: 500,
                color: `${textColor}66`,
                opacity: dateReveal,
              }}
            >
              {date}
            </span>
            <span
              style={{
                fontSize: 'clamp(8px, 1.3vw, 11px)',
                fontWeight: 500,
                color: accentColor,
                opacity: locationReveal,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              {'📍'} {location}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-memory-card',
  title: 'Memory Photo Card',
  description: 'Polaroid-style memory card with photo develop effect, film grain, Ken Burns zoom, vignette, film strip edges, and handwritten caption',
  tags: ['scene', 'memory', 'photo', 'polaroid', 'vintage', 'nostalgia', 'flashback'],
  category: 'scene-layout',
  component: SceneMemoryCardComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    caption: 'That golden hour feeling...',
    date: 'Summer 2025',
    location: 'Santorini',
    mood: 'Peaceful',
    bgColor: '#1A1814',
    cardColor: '#FAF8F0',
    accentColor: '#D4956A',
    textColor: '#3D3428',
    overlayColor: '#E8C9A0',
  },
  configSchema: [
    { key: 'caption', label: 'Caption', type: 'text', defaultValue: 'That golden hour feeling...', group: 'Content' },
    { key: 'date', label: 'Date', type: 'text', defaultValue: 'Summer 2025', group: 'Content' },
    { key: 'location', label: 'Location', type: 'text', defaultValue: 'Santorini', group: 'Content' },
    { key: 'mood', label: 'Mood Tag', type: 'text', defaultValue: 'Peaceful', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1814', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FAF8F0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#D4956A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#3D3428', group: 'Style' },
    { key: 'overlayColor', label: 'Photo Overlay', type: 'color', defaultValue: '#E8C9A0', group: 'Style' },
  ],
})
