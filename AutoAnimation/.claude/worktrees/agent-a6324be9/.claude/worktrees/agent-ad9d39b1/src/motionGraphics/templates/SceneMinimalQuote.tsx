import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneMinimalQuoteConfig {
  quote: string
  author: string
  bgColor: string
  textColor: string
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

function SceneMinimalQuoteComponent({ config, progress }: MotionGraphicProps<SceneMinimalQuoteConfig>) {
  const { quote, author, bgColor, textColor, quoteMarkColor } = config

  // Phase calculations
  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Quote marks fade in early
  const quoteMarkEnter = Math.min(1, enterProgress * 2.5)
  const quoteMarkOpacity = exitProgress > 0
    ? easeOutCubic(quoteMarkEnter) * 0.12 * (1 - easeInCubic(exitProgress))
    : easeOutCubic(quoteMarkEnter) * 0.12

  // Word-by-word reveal
  const words = quote.split(/\s+/)
  const totalWords = words.length
  const wordsRevealed = enterProgress < 1
    ? Math.floor(easeOutQuad(enterProgress) * totalWords)
    : totalWords

  // Author appears after quote
  const authorDelay = 0.65
  const authorEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - authorDelay) / (1 - authorDelay))
    : 1
  const authorOpacity = exitProgress > 0
    ? easeOutCubic(authorEnter) * (1 - easeInCubic(exitProgress))
    : easeOutCubic(authorEnter)
  const authorY = authorEnter < 1
    ? 15 * (1 - easeOutCubic(authorEnter))
    : 0

  // Overall exit
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Large decorative open quote */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '10%',
          fontFamily: 'Georgia, serif',
          fontSize: 'clamp(60px, 20vw, 240px)',
          fontWeight: 400,
          color: quoteMarkColor,
          opacity: quoteMarkOpacity,
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        {'\u201C'}
      </div>

      {/* Large decorative close quote */}
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          right: '10%',
          fontFamily: 'Georgia, serif',
          fontSize: 'clamp(60px, 20vw, 240px)',
          fontWeight: 400,
          color: quoteMarkColor,
          opacity: quoteMarkOpacity,
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        {'\u201D'}
      </div>

      {/* Quote content */}
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
        {/* Quote text — word by word */}
        <div
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(14px, 3.5vw, 36px)',
            fontWeight: 400,
            color: textColor,
            lineHeight: 1.8,
            textAlign: 'center',
            maxWidth: '80%',
            fontStyle: 'italic',
          }}
        >
          {words.map((word, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: i < wordsRevealed ? 1 : 0,
                transform: i < wordsRevealed ? 'translateY(0)' : 'translateY(6px)',
                transition: 'none',
                marginRight: '0.3em',
              }}
            >
              {word}
            </span>
          ))}
        </div>

        {/* Thin divider */}
        <div
          style={{
            width: '40px',
            height: '1px',
            background: textColor,
            margin: '2em 0 1.5em',
            opacity: authorOpacity * 0.4,
          }}
        />

        {/* Author */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(10px, 2vw, 18px)',
            fontWeight: 400,
            color: textColor,
            opacity: authorOpacity * 0.6,
            transform: `translateY(${authorY}px)`,
            letterSpacing: '0.15em',
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
  id: 'tpl-scene-minimal-quote',
  title: 'Scene Minimal Quote',
  description: 'Ultra-clean quote layout with large decorative quote marks, word-by-word text reveal, and minimal author attribution',
  tags: ['scene', 'quote', 'minimal', 'clean', 'whitespace', 'editorial'],
  category: 'scene-layout',
  component: SceneMinimalQuoteComponent as any,
  defaultConfig: {
    quote: 'Less is more. Simplicity is the ultimate sophistication.',
    author: 'Leonardo da Vinci',
    bgColor: '#FFFFFF',
    textColor: '#333333',
    quoteMarkColor: '#333333',
  },
  configSchema: [
    { key: 'quote', label: 'Quote', type: 'text', defaultValue: 'Less is more. Simplicity is the ultimate sophistication.', group: 'Content' },
    { key: 'author', label: 'Author', type: 'text', defaultValue: 'Leonardo da Vinci', group: 'Content' },
    { key: 'bgColor', label: 'Background Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#333333', group: 'Style' },
    { key: 'quoteMarkColor', label: 'Quote Mark Color', type: 'color', defaultValue: '#333333', group: 'Style' },
  ],
})
