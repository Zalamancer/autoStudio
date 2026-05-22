import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneQuoteWithAuthorConfig {
  quote: string
  author: string
  bgColor: string
  quoteColor: string
  accentColor: string
  quoteMarkColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

function SceneQuoteWithAuthorComponent({ config, progress }: MotionGraphicProps<SceneQuoteWithAuthorConfig>) {
  const { quote, author, bgColor, quoteColor, accentColor, quoteMarkColor } = config

  // Phase calculations
  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Opening quotation mark enters first (0-40% of enter)
  const quoteMarkEnter = Math.min(1, enterProgress / 0.4)
  const quoteMarkOpacity = exitProgress > 0
    ? easeOutCubic(quoteMarkEnter) * 0.25 * (1 - easeInCubic(exitProgress))
    : easeOutCubic(quoteMarkEnter) * 0.25
  const quoteMarkScale = 0.6 + easeOutCubic(quoteMarkEnter) * 0.4
  const quoteMarkY = (1 - easeOutCubic(quoteMarkEnter)) * 20

  // Word-by-word reveal (20-100% of enter)
  const words = quote.split(/\s+/)
  const totalWords = words.length
  const wordRevealStart = 0.2
  const wordRevealProgress = enterProgress < wordRevealStart
    ? 0
    : (enterProgress - wordRevealStart) / (1 - wordRevealStart)
  const wordsRevealed = Math.floor(easeOutQuad(wordRevealProgress) * totalWords)

  // Author enters after quote (80-100% of enter)
  const authorEnterStart = 0.75
  const authorEnter = enterProgress < authorEnterStart
    ? 0
    : (enterProgress - authorEnterStart) / (1 - authorEnterStart)
  const authorEased = easeOutCubic(authorEnter)
  const authorOpacity = exitProgress > 0
    ? authorEased * (1 - easeInCubic(exitProgress))
    : authorEased
  const authorY = (1 - authorEased) * 15

  // Em-dash width animation
  const dashWidth = authorEased * 40

  // Overall exit
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Closing quote mark
  const closingMarkOpacity = enterProgress >= 1
    ? 0.2 * (exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1)
    : 0

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Subtle decorative lines */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          left: '10%',
          right: '10%',
          height: '1px',
          background: `${accentColor}20`,
          transform: `scaleX(${easeOutCubic(enterProgress)})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '8%',
          left: '10%',
          right: '10%',
          height: '1px',
          background: `${accentColor}20`,
          transform: `scaleX(${easeOutCubic(enterProgress)})`,
        }}
      />

      {/* Large opening quotation mark */}
      <div
        style={{
          position: 'absolute',
          top: '12%',
          left: '8%',
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(100px, 30vw, 350px)',
          fontWeight: 700,
          color: quoteMarkColor,
          opacity: quoteMarkOpacity,
          transform: `scale(${quoteMarkScale}) translateY(${quoteMarkY}px)`,
          lineHeight: 0.8,
          userSelect: 'none',
        }}
      >
        {'\u201C'}
      </div>

      {/* Content container */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '15% 12%',
          opacity: exitOpacity,
        }}
      >
        {/* Quote text */}
        <div
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(18px, 4.5vw, 46px)',
            fontWeight: 400,
            fontStyle: 'italic',
            color: quoteColor,
            lineHeight: 1.7,
            textAlign: 'center',
            maxWidth: '85%',
          }}
        >
          {words.map((word, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: i < wordsRevealed ? 1 : 0,
                transform: i < wordsRevealed ? 'translateY(0)' : 'translateY(10px)',
                marginRight: '0.3em',
              }}
            >
              {word}
            </span>
          ))}
        </div>

        {/* Closing quotation mark (inline after last word) */}
        {closingMarkOpacity > 0 && (
          <div
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(30px, 6vw, 60px)',
              color: quoteMarkColor,
              opacity: closingMarkOpacity,
              marginTop: '-0.5em',
              alignSelf: 'flex-end',
              marginRight: '12%',
              userSelect: 'none',
            }}
          >
            {'\u201D'}
          </div>
        )}

        {/* Em-dash + Author */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '1.5em',
            opacity: authorOpacity,
            transform: `translateY(${authorY}px)`,
          }}
        >
          <div
            style={{
              width: `${dashWidth}px`,
              height: '2px',
              background: accentColor,
              borderRadius: '1px',
            }}
          />
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(12px, 2.5vw, 24px)',
              fontWeight: 500,
              color: accentColor,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            {author}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-quote-with-author',
  title: 'Scene Quote With Author',
  description: 'Elegant quote card with large quotation marks, word-by-word serif text reveal, em-dash and author attribution.',
  tags: ['scene', 'quote', 'author', 'elegant', 'serif', 'classic', 'motivational'],
  category: 'scene-layout',
  component: SceneQuoteWithAuthorComponent as any,
  defaultConfig: {
    quote: 'In the middle of difficulty lies opportunity.',
    author: 'Albert Einstein',
    bgColor: '#1B1B2F',
    quoteColor: '#F0ECE3',
    accentColor: '#C9A96E',
    quoteMarkColor: '#C9A96E',
  },
  configSchema: [
    { key: 'quote', label: 'Quote', type: 'text', defaultValue: 'In the middle of difficulty lies opportunity.', group: 'Content' },
    { key: 'author', label: 'Author', type: 'text', defaultValue: 'Albert Einstein', group: 'Content' },
    { key: 'bgColor', label: 'Background Color', type: 'color', defaultValue: '#1B1B2F', group: 'Style' },
    { key: 'quoteColor', label: 'Quote Color', type: 'color', defaultValue: '#F0ECE3', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#C9A96E', group: 'Style' },
    { key: 'quoteMarkColor', label: 'Quote Mark Color', type: 'color', defaultValue: '#C9A96E', group: 'Style' },
  ],
})
