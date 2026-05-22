import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScenePetFactConfig {
  fact: string
  source: string
  emoji: string
  bgColor: string
  cardColor: string
  badgeColor: string
  textColor: string
  sourceColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function ScenePetFactComponent({ config, progress }: MotionGraphicProps<ScenePetFactConfig>) {
  const { fact, source, emoji, bgColor, cardColor, badgeColor, textColor, sourceColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Paw badge pops in with elastic bounce
  const badgeScale = easeOutElastic(Math.min(1, enterProgress / 0.5))

  // Fact text types in character by character
  const typeProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.7)))
  const visibleChars = Math.floor(fact.length * typeProgress)
  const displayedFact = fact.substring(0, visibleChars)

  // Cursor blink during typing
  const showCursor = typeProgress < 1 && enterProgress > 0.3
  const cursorVisible = showCursor && Math.sin(progress * Math.PI * 20) > 0

  // Source fades in after text
  const sourceReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.85) / 0.15)))

  // Subtle bob during hold
  const bobY = progress >= 0.2 && progress < 0.8 ? Math.sin(holdProgress * Math.PI * 3) * 2 : 0

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Decorative paw prints in corners */}
      {[
        { x: 6, y: 6, rot: -25 },
        { x: 94, y: 6, rot: 25 },
        { x: 6, y: 94, rot: -15 },
        { x: 94, y: 94, rot: 15 },
      ].map((p, i) => {
        const deco = Math.max(0, Math.min(1, (enterProgress - 0.1 - i * 0.08) / 0.3))
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              transform: `translate(-50%, -50%) rotate(${p.rot}deg) scale(${easeOutCubic(deco)})`,
              opacity: deco * exitOpacity * 0.15,
              fontSize: 'clamp(18px, 4vw, 36px)',
            }}
          >
            🐾
          </div>
        )
      })}

      {/* Main card */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${exitEased * 150 + bobY}px))`,
          opacity: exitOpacity,
          width: '85%',
          maxWidth: 440,
        }}
      >
        {/* Badge */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 'clamp(10px, 2vw, 18px)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'clamp(6px, 1vw, 10px)',
              background: badgeColor,
              padding: 'clamp(6px, 1vw, 10px) clamp(14px, 2.5vw, 22px)',
              borderRadius: 'clamp(16px, 3vw, 28px)',
              transform: `scale(${badgeScale})`,
              boxShadow: `0 4px 16px ${badgeColor}40`,
            }}
          >
            <span style={{ fontSize: 'clamp(14px, 2.5vw, 22px)' }}>🐾</span>
            <span
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(11px, 1.8vw, 16px)',
                fontWeight: 800,
                color: '#FFFFFF',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              PET FACT
            </span>
          </div>
        </div>

        {/* Fact card */}
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(12px, 2.5vw, 20px)',
            padding: 'clamp(20px, 4vw, 36px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            transform: `scale(${easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.4)))})`,
            opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.3))),
          }}
        >
          {/* Emoji */}
          <div
            style={{
              fontSize: 'clamp(28px, 6vw, 48px)',
              textAlign: 'center',
              marginBottom: 'clamp(10px, 2vw, 16px)',
              transform: `scale(${easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.25) / 0.3)))})`,
            }}
          >
            {emoji}
          </div>

          {/* Fact text */}
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(13px, 2.4vw, 20px)',
              fontWeight: 600,
              color: textColor,
              textAlign: 'center',
              lineHeight: 1.5,
              minHeight: 'clamp(40px, 8vw, 70px)',
            }}
          >
            {displayedFact}
            {cursorVisible && (
              <span style={{ color: badgeColor, fontWeight: 400 }}>|</span>
            )}
          </div>

          {/* Source */}
          <div
            style={{
              marginTop: 'clamp(12px, 2vw, 20px)',
              textAlign: 'center',
              opacity: sourceReveal,
              transform: `translateY(${(1 - sourceReveal) * 8}px)`,
            }}
          >
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(8px, 1.2vw, 11px)',
                fontWeight: 500,
                color: sourceColor,
                fontStyle: 'italic',
              }}
            >
              Source: {source}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-pet-fact',
  title: 'Pet Fact Card',
  description: 'Fun animal fact card with paw badge that pops in, fact text that types in character by character, emoji, and source citation.',
  tags: ['scene', 'pet', 'animal', 'fact', 'educational', 'cute', 'paw'],
  category: 'scene-layout',
  component: ScenePetFactComponent as any,
  defaultConfig: {
    fact: 'Dogs can understand up to 250 words and gestures, making them as intelligent as a 2-year-old child!',
    source: 'American Kennel Club',
    emoji: '\uD83D\uDC36',
    bgColor: '#F0FDF4',
    cardColor: '#FFFFFF',
    badgeColor: '#16A34A',
    textColor: '#1F2937',
    sourceColor: '#6B7280',
  },
  configSchema: [
    { key: 'fact', label: 'Fun Fact', type: 'text', defaultValue: 'Dogs can understand up to 250 words and gestures, making them as intelligent as a 2-year-old child!', group: 'Content' },
    { key: 'source', label: 'Source', type: 'text', defaultValue: 'American Kennel Club', group: 'Content' },
    { key: 'emoji', label: 'Animal Emoji', type: 'text', defaultValue: '\uD83D\uDC36', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F0FDF4', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'badgeColor', label: 'Badge Color', type: 'color', defaultValue: '#16A34A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1F2937', group: 'Style' },
    { key: 'sourceColor', label: 'Source Color', type: 'color', defaultValue: '#6B7280', group: 'Style' },
  ],
})
