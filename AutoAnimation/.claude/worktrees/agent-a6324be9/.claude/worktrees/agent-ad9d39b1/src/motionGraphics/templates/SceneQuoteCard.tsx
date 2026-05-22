import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneQuoteCardConfig {
  quote: string
  author: string
  bgColor: string
  quoteColor: string
  accentColor: string
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

function SceneQuoteCardComponent({ config, progress }: MotionGraphicProps<SceneQuoteCardConfig>) {
  const { quote, author, bgColor, quoteColor, accentColor } = config

  // Phase calculations
  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const exitProgress = progress >= 0.75 ? (progress - 0.75) / 0.25 : 0

  // Quotation mark fade in
  const quoteMarkOpacity = enterProgress < 1
    ? easeOutCubic(Math.min(1, enterProgress * 2)) * 0.15
    : exitProgress > 0
      ? 0.15 * (1 - easeInCubic(exitProgress))
      : 0.15
  const quoteMarkScale = enterProgress < 1
    ? 0.5 + easeOutCubic(Math.min(1, enterProgress * 2)) * 0.5
    : 1

  // Word-by-word reveal with clip-path
  const words = quote.split(/\s+/)
  const totalWords = words.length
  // Words reveal during enter phase
  const wordsRevealed = enterProgress < 1
    ? Math.floor(easeOutQuad(enterProgress) * totalWords)
    : totalWords

  // Author slides up after quote completes
  const authorDelay = 0.7
  const authorEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - authorDelay) / (1 - authorDelay))
    : 1
  const authorOpacity = authorEnter < 1
    ? easeOutCubic(authorEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1
  const authorY = authorEnter < 1
    ? 20 * (1 - easeOutCubic(authorEnter))
    : exitProgress > 0
      ? -15 * easeInCubic(exitProgress)
      : 0

  // Overall exit fade
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Large decorative quotation mark */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '8%',
          fontFamily: 'Georgia, serif',
          fontSize: 'clamp(80px, 25vw, 300px)',
          fontWeight: 700,
          color: accentColor,
          opacity: quoteMarkOpacity,
          transform: `scale(${quoteMarkScale})`,
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        {'\u201C'}
      </div>

      {/* Quote content container */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '12% 10%',
          opacity: exitOpacity,
        }}
      >
        {/* Quote text with word-by-word reveal */}
        <div
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(16px, 4vw, 42px)',
            fontWeight: 400,
            color: quoteColor,
            lineHeight: 1.6,
            textAlign: 'center',
            maxWidth: '85%',
            fontStyle: 'italic',
          }}
        >
          {words.map((word, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: i < wordsRevealed ? 1 : 0,
                transform: i < wordsRevealed ? 'translateY(0)' : 'translateY(8px)',
                transition: 'none',
                marginRight: '0.3em',
              }}
            >
              {word}
            </span>
          ))}
        </div>

        {/* Accent divider */}
        <div
          style={{
            width: '60px',
            height: '2px',
            background: accentColor,
            margin: '1.5em 0',
            opacity: authorOpacity,
            transform: `scaleX(${authorEnter < 1 ? easeOutCubic(authorEnter) : 1})`,
          }}
        />

        {/* Author */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(12px, 2.5vw, 22px)',
            fontWeight: 500,
            color: accentColor,
            opacity: authorOpacity,
            transform: `translateY(${authorY}px)`,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          {author}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-quote-card',
  title: 'Scene Quote Card',
  description: 'Elegant quote card with word-by-word text reveal, decorative quotation mark, and author attribution',
  tags: ['scene', 'quote', 'card', 'text', 'reveal', 'layout'],
  category: 'scene-layout',
  component: SceneQuoteCardComponent as any,
  defaultConfig: {
    quote: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
    bgColor: '#1c1c2e',
    quoteColor: '#f0f0f0',
    accentColor: '#c9a96e',
  },
  configSchema: [
    { key: 'quote', label: 'Quote', type: 'text', defaultValue: 'The only way to do great work is to love what you do.', group: 'Content' },
    { key: 'author', label: 'Author', type: 'text', defaultValue: 'Steve Jobs', group: 'Content' },
    { key: 'bgColor', label: 'Background Color', type: 'color', defaultValue: '#1c1c2e', group: 'Style' },
    { key: 'quoteColor', label: 'Quote Color', type: 'color', defaultValue: '#f0f0f0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#c9a96e', group: 'Style' },
  ],
})
