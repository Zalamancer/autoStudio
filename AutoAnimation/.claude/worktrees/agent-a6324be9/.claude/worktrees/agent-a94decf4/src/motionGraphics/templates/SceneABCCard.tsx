import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneABCCardConfig {
  letter: string
  word: string
  emoji: string
  bgColor: string
  cardColor: string
  letterColor: string
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

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneABCCardComponent({ config, progress }: MotionGraphicProps<SceneABCCardConfig>) {
  const { letter, word, emoji, bgColor, cardColor, letterColor, textColor } = config

  const upperLetter = letter.toUpperCase()
  const lowerLetter = letter.toLowerCase()

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const cardY = enterProgress < 1
    ? (1 - easeOutBack(enterProgress)) * 100
    : exitProgress > 0
      ? easeInCubic(exitProgress) * -80
      : 0
  const cardOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : easeOutCubic(enterProgress)

  // Letter bounce animation
  const letterScale = enterProgress < 1
    ? easeOutElastic(Math.max(0, (enterProgress - 0.3) / 0.7))
    : 1 + Math.sin(holdProgress * Math.PI * 6) * 0.05
  const letterRotate = enterProgress < 1
    ? (1 - easeOutCubic(enterProgress)) * 15
    : Math.sin(holdProgress * Math.PI * 4) * 3

  // Emoji bounce during hold
  const emojiBounce = Math.sin(holdProgress * Math.PI * 8) * 8
  const emojiReveal = holdProgress > 0.2 ? easeOutBack(Math.min(1, (holdProgress - 0.2) / 0.3)) : 0

  // Word reveal
  const wordReveal = holdProgress > 0.1 ? easeOutCubic(Math.min(1, (holdProgress - 0.1) / 0.3)) : 0

  // Highlight the first letter of the word
  const firstLetterMatch = word.length > 0 && word[0].toLowerCase() === lowerLetter

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
      {/* Alphabet background watermark */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'clamp(200px, 50vw, 500px)',
          fontWeight: 900,
          color: `${letterColor}08`,
          lineHeight: 1,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {upperLetter}
      </div>

      <div
        style={{
          transform: `translateY(${cardY}px)`,
          opacity: cardOpacity,
          width: '85%',
          maxWidth: '460px',
        }}
      >
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(20px, 4vw, 36px)',
            padding: 'clamp(24px, 6vw, 48px)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
            border: `4px solid ${letterColor}30`,
            textAlign: 'center',
          }}
        >
          {/* ABC badge */}
          <div
            style={{
              display: 'inline-block',
              background: `${letterColor}15`,
              color: letterColor,
              fontSize: 'clamp(9px, 1.8vw, 14px)',
              fontWeight: 700,
              padding: 'clamp(3px, 0.6vw, 6px) clamp(12px, 2.5vw, 22px)',
              borderRadius: '100px',
              marginBottom: 'clamp(14px, 3vw, 28px)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            {'\u{1F524}'} ABC Learning
          </div>

          {/* Big letter display */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'center',
              gap: 'clamp(8px, 2vw, 16px)',
              marginBottom: 'clamp(10px, 2.5vw, 20px)',
              transform: `scale(${letterScale}) rotate(${letterRotate}deg)`,
            }}
          >
            <div
              style={{
                fontSize: 'clamp(60px, 16vw, 130px)',
                fontWeight: 900,
                color: letterColor,
                lineHeight: 1,
                textShadow: `4px 4px 0 ${letterColor}25`,
              }}
            >
              {upperLetter}
            </div>
            <div
              style={{
                fontSize: 'clamp(40px, 10vw, 80px)',
                fontWeight: 700,
                color: `${letterColor}88`,
                lineHeight: 1,
              }}
            >
              {lowerLetter}
            </div>
          </div>

          {/* Divider with dots */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginBottom: 'clamp(14px, 3vw, 24px)',
            }}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  width: i === 2 ? 'clamp(6px, 1.2vw, 10px)' : 'clamp(4px, 0.8vw, 6px)',
                  height: i === 2 ? 'clamp(6px, 1.2vw, 10px)' : 'clamp(4px, 0.8vw, 6px)',
                  borderRadius: '50%',
                  background: letterColor,
                  opacity: 0.3 + (i === 2 ? 0.4 : 0),
                }}
              />
            ))}
          </div>

          {/* Emoji icon */}
          <div
            style={{
              fontSize: 'clamp(40px, 10vw, 80px)',
              marginBottom: 'clamp(8px, 2vw, 16px)',
              transform: `translateY(${emojiBounce}px) scale(${emojiReveal})`,
              opacity: emojiReveal,
            }}
          >
            {emoji}
          </div>

          {/* Word with highlighted first letter */}
          <div
            style={{
              fontSize: 'clamp(24px, 6vw, 48px)',
              fontWeight: 700,
              opacity: wordReveal,
              transform: `translateY(${(1 - wordReveal) * 15}px)`,
            }}
          >
            {firstLetterMatch ? (
              <>
                <span style={{ color: letterColor, textDecoration: 'underline', textDecorationThickness: '3px' }}>
                  {word[0]}
                </span>
                <span style={{ color: textColor }}>{word.slice(1)}</span>
              </>
            ) : (
              <span style={{ color: textColor }}>{word}</span>
            )}
          </div>

          {/* "is for" label */}
          <div
            style={{
              fontSize: 'clamp(11px, 2vw, 16px)',
              fontWeight: 500,
              color: `${textColor}66`,
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              marginTop: 'clamp(4px, 1vw, 8px)',
              opacity: wordReveal,
            }}
          >
            {upperLetter} is for {word}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-abc-card',
  title: 'ABC Card',
  description: 'Alphabet learning flashcard with uppercase/lowercase letter, emoji illustration, and word. Elastic letter bounce and staggered reveals.',
  tags: ['scene', 'kids', 'education', 'alphabet', 'abc', 'letters', 'learning', 'cartoon'],
  category: 'scene-layout',
  component: SceneABCCardComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    letter: 'A',
    word: 'Apple',
    emoji: '\u{1F34E}',
    bgColor: '#FFF0F0',
    cardColor: '#FFFFFF',
    letterColor: '#FF4444',
    textColor: '#2D3436',
  },
  configSchema: [
    { key: 'letter', label: 'Letter', type: 'text', defaultValue: 'A', group: 'Content' },
    { key: 'word', label: 'Word', type: 'text', defaultValue: 'Apple', group: 'Content' },
    { key: 'emoji', label: 'Emoji', type: 'text', defaultValue: '\u{1F34E}', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF0F0', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'letterColor', label: 'Letter Color', type: 'color', defaultValue: '#FF4444', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2D3436', group: 'Style' },
  ],
})
