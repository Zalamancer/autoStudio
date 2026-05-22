import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LightboxConfig {
  title: string
  photographer: string
  photoCount: number
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

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneLightboxComponent({ config, progress }: MotionGraphicProps<LightboxConfig>) {
  const { title, photographer, photoCount, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Backdrop dims in
  const backdropOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3)) * 0.7

  // Gallery thumbnails — 3x2 grid
  const thumbs = Array.from({ length: Math.min(6, photoCount) }).map((_, i) => {
    const hue = (i * 55 + 20) % 360
    return { hue, delay: 0.15 + i * 0.08 }
  })

  // Main image scale-in
  const mainScale = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.5)))

  // Active thumbnail index cycles during hold
  const activeThumb = Math.floor(holdProgress * thumbs.length * 2) % thumbs.length

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* Dark overlay backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `rgba(0,0,0,${backdropOpacity})`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '5%',
          opacity: exitOpacity,
          transform: `scale(${1 - exitEased * 0.1})`,
        }}
      >
        {/* Main lightbox frame */}
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(10px, 1.5vw, 16px)',
            padding: 'clamp(16px, 3%, 28px)',
            maxWidth: 420,
            width: '100%',
            transform: `scale(${mainScale})`,
            boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px ${accentColor}20`,
          }}
        >
          {/* Main "photo" display area */}
          <div
            style={{
              width: '100%',
              aspectRatio: '16/10',
              borderRadius: 'clamp(6px, 1vw, 10px)',
              background: `linear-gradient(135deg, hsla(${thumbs[activeThumb]?.hue ?? 200}, 40%, 35%, 1), hsla(${(thumbs[activeThumb]?.hue ?? 200) + 40}, 30%, 25%, 1))`,
              marginBottom: 'clamp(12px, 2vh, 20px)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Photo composition lines */}
            <div style={{ position: 'absolute', left: '33%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'absolute', left: '66%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'absolute', top: '33%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'absolute', top: '66%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            {/* Nav arrows */}
            <div style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 'clamp(14px, 2vw, 22px)', color: 'rgba(255,255,255,0.5)' }}>{'<'}</div>
            <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 'clamp(14px, 2vw, 22px)', color: 'rgba(255,255,255,0.5)' }}>{'>'}</div>
            {/* Counter badge */}
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'rgba(0,0,0,0.5)',
                borderRadius: 12,
                padding: '2px 8px',
                fontSize: 'clamp(9px, 1.2vw, 12px)',
                color: '#FFFFFF',
                fontWeight: 600,
              }}
            >
              {activeThumb + 1}/{photoCount}
            </div>
          </div>

          {/* Title and photographer */}
          <div style={{ marginBottom: 'clamp(10px, 1.5vh, 16px)' }}>
            <div
              style={{
                fontSize: 'clamp(15px, 2.8vw, 22px)',
                fontWeight: 800,
                color: textColor,
                opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.3))),
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 'clamp(11px, 1.6vw, 14px)',
                color: `${textColor}70`,
                fontWeight: 500,
                marginTop: 2,
                opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.3))),
              }}
            >
              by {photographer}
            </div>
          </div>

          {/* Thumbnail strip */}
          <div style={{ display: 'flex', gap: 'clamp(4px, 0.8vw, 8px)' }}>
            {thumbs.map((thumb, i) => {
              const thumbEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - thumb.delay) / 0.25)))
              const isActive = i === activeThumb
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    aspectRatio: '1',
                    borderRadius: 'clamp(3px, 0.5vw, 6px)',
                    background: `hsla(${thumb.hue}, 35%, ${isActive ? 45 : 30}%, 1)`,
                    transform: `scale(${thumbEnter})`,
                    opacity: thumbEnter,
                    border: isActive ? `2px solid ${accentColor}` : '2px solid transparent',
                    boxShadow: isActive ? `0 0 8px ${accentColor}40` : 'none',
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-lightbox',
  title: 'Scene Lightbox',
  description: 'Photo lightbox gallery card with thumbnail strip, navigation arrows, and cycling active photo highlight',
  tags: ['scene', 'photography', 'gallery', 'lightbox', 'portfolio', 'photos'],
  category: 'scenes',
  component: SceneLightboxComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    title: 'Golden Hour Collection',
    photographer: 'Alex Rivera',
    photoCount: 6,
    bgColor: '#0D1117',
    cardColor: '#161B22',
    accentColor: '#F0883E',
    textColor: '#E6EDF3',
  },
  configSchema: [
    { key: 'title', label: 'Gallery Title', type: 'text', defaultValue: 'Golden Hour Collection', group: 'Content' },
    { key: 'photographer', label: 'Photographer', type: 'text', defaultValue: 'Alex Rivera', group: 'Content' },
    { key: 'photoCount', label: 'Photo Count', type: 'number', defaultValue: 6, min: 2, max: 12, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D1117', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#161B22', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#F0883E', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E6EDF3', group: 'Style' },
  ],
})
