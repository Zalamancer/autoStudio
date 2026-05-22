import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneStoryTimeConfig {
  title: string
  storyText: string
  pageNumber: number
  bgColor: string
  pageColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneStoryTimeComponent({ config, progress }: MotionGraphicProps<SceneStoryTimeConfig>) {
  const { title, storyText, pageNumber, bgColor, pageColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Page turn effect: rotate from left edge
  const pageRotateY = enterProgress < 1
    ? (1 - easeOutCubic(enterProgress)) * -90
    : exitProgress > 0
      ? easeInCubic(exitProgress) * 90
      : 0

  const pageOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : easeOutCubic(Math.min(1, enterProgress * 1.5))

  // Text reveal: words appear during hold
  const words = storyText.split(' ')
  const revealedWords = Math.floor(holdProgress * (words.length + 2))

  // Sparkle stars that twinkle during reading
  const starTwinkle = Math.sin(holdProgress * Math.PI * 10)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
      }}
    >
      {/* Starry background pattern */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${8 + (i * 23) % 90}%`,
            top: `${5 + (i * 17) % 85}%`,
            fontSize: `${8 + (i % 3) * 4}px`,
            color: accentColor,
            opacity: 0.12 + (starTwinkle + 1) * 0.04 * ((i % 3) === 0 ? 1 : 0),
          }}
        >
          {'\u2726'}
        </div>
      ))}

      {/* Book / Page */}
      <div
        style={{
          perspective: '1200px',
          width: '85%',
          maxWidth: '500px',
        }}
      >
        <div
          style={{
            background: pageColor,
            borderRadius: 'clamp(12px, 2.5vw, 24px)',
            padding: 'clamp(24px, 5vw, 48px)',
            boxShadow: `
              0 8px 32px rgba(0,0,0,0.1),
              0 2px 8px rgba(0,0,0,0.05),
              inset -3px 0 8px rgba(0,0,0,0.03)
            `,
            border: `2px solid ${accentColor}25`,
            transform: `rotateY(${pageRotateY}deg)`,
            transformOrigin: 'left center',
            opacity: pageOpacity,
            position: 'relative',
          }}
        >
          {/* Page number */}
          <div
            style={{
              position: 'absolute',
              top: 'clamp(8px, 2vw, 16px)',
              right: 'clamp(12px, 2.5vw, 20px)',
              fontSize: 'clamp(10px, 2vw, 16px)',
              color: `${textColor}50`,
              fontFamily: "'Georgia', serif",
              fontStyle: 'italic',
            }}
          >
            Page {pageNumber}
          </div>

          {/* Story time badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: `${accentColor}15`,
              color: accentColor,
              fontSize: 'clamp(9px, 1.8vw, 14px)',
              fontWeight: 700,
              padding: 'clamp(3px, 0.6vw, 6px) clamp(10px, 2vw, 18px)',
              borderRadius: '100px',
              marginBottom: 'clamp(12px, 3vw, 24px)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {'\u{1F4D6}'} Story Time
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 'clamp(22px, 5.5vw, 42px)',
              fontWeight: 700,
              color: textColor,
              lineHeight: 1.2,
              marginBottom: 'clamp(12px, 3vw, 24px)',
              opacity: easeOutCubic(Math.min(1, enterProgress * 1.5)),
              transform: `translateY(${(1 - easeOutCubic(Math.min(1, enterProgress * 1.5))) * 15}px)`,
            }}
          >
            {title}
          </div>

          {/* Decorative divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: 'clamp(12px, 3vw, 24px)',
              opacity: easeOutCubic(Math.min(1, enterProgress * 2)),
            }}
          >
            <div style={{ flex: 1, height: '2px', background: `${accentColor}30` }} />
            <div style={{ fontSize: 'clamp(10px, 2vw, 16px)', color: accentColor }}>
              {'\u2726'}
            </div>
            <div style={{ flex: 1, height: '2px', background: `${accentColor}30` }} />
          </div>

          {/* Story text with word-by-word reveal */}
          <div
            style={{
              fontSize: 'clamp(14px, 3vw, 22px)',
              fontWeight: 400,
              color: textColor,
              fontFamily: "'Georgia', 'Times New Roman', serif",
              lineHeight: 1.8,
              letterSpacing: '0.01em',
            }}
          >
            {words.map((w, i) => (
              <span
                key={i}
                style={{
                  opacity: i < revealedWords ? 1 : 0.12,
                  color: i < revealedWords ? textColor : `${textColor}30`,
                  fontWeight: i === revealedWords - 1 ? 600 : 400,
                  transition: 'none',
                }}
              >
                {w}{' '}
              </span>
            ))}
          </div>

          {/* Bottom decorative element */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '4px',
              marginTop: 'clamp(16px, 3vw, 28px)',
              opacity: holdProgress > 0.8 ? easeOutCubic((holdProgress - 0.8) / 0.2) : 0,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 'clamp(4px, 0.8vw, 6px)',
                  height: 'clamp(4px, 0.8vw, 6px)',
                  borderRadius: '50%',
                  background: accentColor,
                  opacity: 0.4 + i * 0.2,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-story-time',
  title: 'Story Time',
  description: 'Storybook page with word-by-word text reveal, page turn animation, and starry decorations. Perfect for reading stories aloud.',
  tags: ['scene', 'kids', 'education', 'story', 'book', 'reading', 'cartoon', 'bedtime'],
  category: 'scene-layout',
  component: SceneStoryTimeComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    title: 'The Little Star',
    storyText: 'Once upon a time, there was a tiny star who dreamed of shining the brightest in the whole night sky.',
    pageNumber: 1,
    bgColor: '#2C1654',
    pageColor: '#FFFEF5',
    accentColor: '#FFB800',
    textColor: '#2D3436',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'The Little Star', group: 'Content' },
    { key: 'storyText', label: 'Story Text', type: 'text', defaultValue: 'Once upon a time, there was a tiny star who dreamed of shining the brightest in the whole night sky.', group: 'Content' },
    { key: 'pageNumber', label: 'Page Number', type: 'number', defaultValue: 1, min: 1, max: 100, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2C1654', group: 'Style' },
    { key: 'pageColor', label: 'Page Color', type: 'color', defaultValue: '#FFFEF5', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FFB800', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2D3436', group: 'Style' },
  ],
})
