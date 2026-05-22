import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneSpellingBeeConfig {
  word: string
  pronunciation: string
  definition: string
  bgColor: string
  cardColor: string
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

function SceneSpellingBeeComponent({ config, progress }: MotionGraphicProps<SceneSpellingBeeConfig>) {
  const { word, pronunciation, definition, bgColor, cardColor, accentColor, textColor } = config
  const letters = word.toUpperCase().split('')

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const cardScale = enterProgress < 1
    ? easeOutBack(enterProgress)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress) * 0.2
      : 1
  const cardOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : easeOutCubic(enterProgress)

  // Letters reveal one by one during hold
  const revealedCount = Math.floor(holdProgress * (letters.length + 2))

  // Bee icon bounce
  const beeBounce = Math.sin(holdProgress * Math.PI * 8) * 5

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
      {/* Honeycomb pattern background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle, ${accentColor}12 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />

      <div
        style={{
          transform: `scale(${cardScale})`,
          opacity: cardOpacity,
          width: '85%',
          maxWidth: '520px',
        }}
      >
        {/* Header badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: 'clamp(12px, 3vw, 24px)',
            opacity: easeOutCubic(Math.min(1, enterProgress * 2)),
          }}
        >
          <div
            style={{
              fontSize: 'clamp(24px, 5vw, 40px)',
              transform: `translateY(${beeBounce}px)`,
            }}
          >
            {'\u{1F41D}'}
          </div>
          <div
            style={{
              background: accentColor,
              color: '#FFFFFF',
              fontSize: 'clamp(10px, 2vw, 16px)',
              fontWeight: 700,
              padding: 'clamp(4px, 1vw, 8px) clamp(12px, 2.5vw, 24px)',
              borderRadius: '100px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Spelling Bee
          </div>
        </div>

        {/* Letter tiles */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'clamp(4px, 1vw, 10px)',
            marginBottom: 'clamp(16px, 4vw, 32px)',
            flexWrap: 'wrap',
          }}
        >
          {letters.map((letter, i) => {
            const isRevealed = i < revealedCount
            const justRevealed = i === revealedCount - 1
            const tileScale = justRevealed ? 1.15 : isRevealed ? 1 : 0.9
            const tileBg = isRevealed ? cardColor : `${textColor}10`

            return (
              <div
                key={i}
                style={{
                  width: 'clamp(36px, 8vw, 64px)',
                  height: 'clamp(42px, 9vw, 72px)',
                  borderRadius: 'clamp(8px, 1.5vw, 14px)',
                  background: tileBg,
                  border: `3px solid ${isRevealed ? accentColor : `${textColor}20`}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'clamp(22px, 5vw, 40px)',
                  fontWeight: 700,
                  color: isRevealed ? accentColor : 'transparent',
                  transform: `scale(${tileScale})`,
                  boxShadow: isRevealed
                    ? `0 4px 12px ${accentColor}30`
                    : '0 2px 6px rgba(0,0,0,0.05)',
                  transition: 'none',
                }}
              >
                {letter}
              </div>
            )
          })}
        </div>

        {/* Pronunciation */}
        <div
          style={{
            textAlign: 'center',
            fontSize: 'clamp(14px, 3vw, 22px)',
            color: `${textColor}88`,
            fontStyle: 'italic',
            fontWeight: 400,
            fontFamily: "'Georgia', serif",
            marginBottom: 'clamp(8px, 2vw, 16px)',
            opacity: holdProgress > 0.4 ? easeOutCubic((holdProgress - 0.4) / 0.3) : 0,
          }}
        >
          {pronunciation}
        </div>

        {/* Definition */}
        <div
          style={{
            textAlign: 'center',
            fontSize: 'clamp(13px, 2.5vw, 20px)',
            color: textColor,
            fontWeight: 500,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            lineHeight: 1.4,
            padding: '0 5%',
            opacity: holdProgress > 0.6 ? easeOutCubic((holdProgress - 0.6) / 0.3) : 0,
            transform: `translateY(${holdProgress > 0.6 ? (1 - easeOutCubic((holdProgress - 0.6) / 0.3)) * 10 : 10}px)`,
          }}
        >
          {definition}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-spelling-bee',
  title: 'Spelling Bee',
  description: 'Spelling practice card with letter tiles that reveal one by one, pronunciation, and definition. Bee themed with honeycomb background.',
  tags: ['scene', 'kids', 'education', 'spelling', 'letters', 'learning', 'cartoon'],
  category: 'scene-layout',
  component: SceneSpellingBeeComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    word: 'BUTTERFLY',
    pronunciation: '/\u02C8b\u028Ct\u0259r\u02CCfla\u026A/',
    definition: 'A beautiful insect with large colorful wings that flies from flower to flower.',
    bgColor: '#FFF9E6',
    cardColor: '#FFFFFF',
    accentColor: '#FFB800',
    textColor: '#2D3436',
  },
  configSchema: [
    { key: 'word', label: 'Word', type: 'text', defaultValue: 'BUTTERFLY', group: 'Content' },
    { key: 'pronunciation', label: 'Pronunciation', type: 'text', defaultValue: '/\u02C8b\u028Ct\u0259r\u02CCfla\u026A/', group: 'Content' },
    { key: 'definition', label: 'Definition', type: 'text', defaultValue: 'A beautiful insect with large colorful wings that flies from flower to flower.', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF9E6', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FFB800', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2D3436', group: 'Style' },
  ],
})
