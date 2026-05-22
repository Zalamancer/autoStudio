import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FanArtShowcaseConfig {
  artistName: string
  artTitle: string
  message: string
  bgColor: string
  accentColor: string
  frameColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function SceneFanArtShowcaseComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<FanArtShowcaseConfig>) {
  const { artistName, artTitle, message, bgColor, accentColor, frameColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // "Fan Art" label
  const labelFade = easeOutCubic(Math.min(1, enterProgress / 0.2))

  // Frame border draws in
  const frameDraw = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.35)))

  // Art placeholder fades in
  const artReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.3)))

  // Artist credit slides up
  const creditSlide = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.25)))

  // Message fades in
  const msgReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.75) / 0.2)))

  // Hold: subtle float
  const floatY = Math.sin(holdProgress * Math.PI * 3) * 5
  const floatRot = Math.sin(holdProgress * Math.PI * 2) * 1

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.15

  // Floating hearts
  const hearts = Array.from({ length: 6 }).map((_, i) => {
    const x = 15 + seededRand(i * 31 + 7) * 70
    const speed = 0.4 + seededRand(i * 53) * 0.6
    const y = ((frame * speed + seededRand(i * 67) * 200) % 130) - 15
    return { x, y, size: 12 + seededRand(i * 19) * 8, opacity: 0.2 + seededRand(i * 41) * 0.3 }
  })

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
        padding: '5%',
      }}
    >
      {/* Floating hearts */}
      {hearts.map((h, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${h.x}%`,
            top: `${h.y}%`,
            fontSize: h.size,
            opacity: h.opacity * exitOpacity,
          }}
        >
          {'💜'}
        </div>
      ))}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(12px, 2.5vh, 22px)',
          transform: `scale(${exitScale}) translateY(${floatY}px) rotate(${floatRot}deg)`,
          opacity: exitOpacity,
        }}
      >
        {/* FAN ART label */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            opacity: labelFade,
          }}
        >
          <span style={{ fontSize: 'clamp(14px, 2.5vw, 20px)' }}>{'🎨'}</span>
          <span
            style={{
              fontSize: 'clamp(10px, 1.6vw, 13px)',
              fontWeight: 800,
              color: accentColor,
              letterSpacing: 4,
              textTransform: 'uppercase',
            }}
          >
            FAN ART SHOWCASE
          </span>
          <span style={{ fontSize: 'clamp(14px, 2.5vw, 20px)' }}>{'🎨'}</span>
        </div>

        {/* Art frame */}
        <div
          style={{
            position: 'relative',
            border: `3px solid ${frameColor}`,
            borderRadius: 'clamp(12px, 2vw, 18px)',
            padding: 'clamp(12px, 2vw, 18px)',
            background: `${frameColor}08`,
            transform: `scale(${frameDraw})`,
          }}
        >
          {/* Art placeholder */}
          <div
            style={{
              width: 'clamp(200px, 50vw, 300px)',
              aspectRatio: '4/3',
              borderRadius: 'clamp(8px, 1.2vw, 12px)',
              background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}08)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: artReveal,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 'clamp(36px, 8vw, 56px)' }}>{'🖼️'}</span>
              <span
                style={{
                  fontSize: 'clamp(14px, 2.5vw, 20px)',
                  fontWeight: 700,
                  color: textColor,
                }}
              >
                {artTitle}
              </span>
            </div>
          </div>

          {/* Corner decorations */}
          {[
            { top: -4, left: -4 },
            { top: -4, right: -4 },
            { bottom: -4, left: -4 },
            { bottom: -4, right: -4 },
          ].map((pos, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                ...pos,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: accentColor,
                opacity: frameDraw * 0.6,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Artist credit */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 12px)',
            opacity: creditSlide,
            transform: `translateY(${(1 - creditSlide) * 15}px)`,
          }}
        >
          <div
            style={{
              width: 'clamp(28px, 5vw, 36px)',
              height: 'clamp(28px, 5vw, 36px)',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${accentColor}80, ${accentColor}40)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(10px, 1.8vw, 14px)',
              fontWeight: 800,
              color: '#FFFFFF',
            }}
          >
            {artistName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div
              style={{
                fontSize: 'clamp(12px, 2vw, 16px)',
                fontWeight: 700,
                color: textColor,
              }}
            >
              by @{artistName}
            </div>
            <div
              style={{
                fontSize: 'clamp(9px, 1.3vw, 11px)',
                color: `${textColor}50`,
                fontWeight: 500,
              }}
            >
              Fan Artist
            </div>
          </div>
        </div>

        {/* Thank you message */}
        <div
          style={{
            fontSize: 'clamp(11px, 1.8vw, 14px)',
            fontWeight: 600,
            color: `${textColor}70`,
            textAlign: 'center',
            opacity: msgReveal,
            maxWidth: '80%',
            fontStyle: 'italic',
          }}
        >
          "{message}"
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-fan-art-showcase',
  title: 'Scene Fan Art Showcase',
  description:
    'Fan art showcase card with decorative frame, floating hearts, artist credit, and gallery-style presentation.',
  tags: ['scene', 'social-media', 'fan-art', 'showcase', 'community', 'creator', 'art'],
  category: 'scene-layout',
  component: SceneFanArtShowcaseComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'artistName', label: 'Artist Name', type: 'text', defaultValue: 'artfan99', group: 'Content' },
    { key: 'artTitle', label: 'Art Title', type: 'text', defaultValue: 'Amazing Fanart', group: 'Content' },
    { key: 'message', label: 'Message', type: 'text', defaultValue: 'This is incredible! Thank you so much!', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#A855F7', group: 'Style' },
    { key: 'frameColor', label: 'Frame Color', type: 'color', defaultValue: '#C084FC', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A14', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
  defaultConfig: {
    artistName: 'artfan99',
    artTitle: 'Amazing Fanart',
    message: 'This is incredible! Thank you so much!',
    accentColor: '#A855F7',
    frameColor: '#C084FC',
    bgColor: '#0A0A14',
    textColor: '#FFFFFF',
  },
})
