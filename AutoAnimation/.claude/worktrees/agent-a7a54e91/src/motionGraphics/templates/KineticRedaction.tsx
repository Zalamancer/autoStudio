import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RedactionConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Typewritten document lines */}
        {Array.from({ length: 14 }).map((_, i) => {
          const lineWidth = 50 + ((i * 37 + 13) % 30)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${10 + i * 5.5}%`,
                left: '12%',
                width: `${lineWidth}%`,
                height: 2,
                background: 'rgba(0,0,0,0.06)',
                borderRadius: 0,
              }}
            />
          )
        })}
        {/* Classification stamp */}
        <div
          style={{
            position: 'absolute',
            top: '3%',
            right: '5%',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(8px, 1.8vw, 13px)',
            fontWeight: 700,
            color: 'rgba(200,0,0,0.12)',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            border: '1.5px solid rgba(200,0,0,0.1)',
            padding: '3px 10px',
            transform: 'rotate(-3deg)',
          }}
        >
          CLASSIFIED
        </div>
        {/* Document date */}
        <div
          style={{
            position: 'absolute',
            top: '3%',
            left: '5%',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(7px, 1.5vw, 11px)',
            color: 'rgba(0,0,0,0.1)',
          }}
        >
          DATE: ██/██/████
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width }: WordRenderProps) => {
    const letters = word.split('')
    const letterCount = letters.length

    // Each letter has its own redaction bar that slides away
    let globalReveal = 0
    let barColor = '#1a1a1a'

    if (phase === 'enter') {
      // Bars are fully covering at start, then slide off left-to-right per letter
      globalReveal = enterProgress
    } else if (phase === 'hold') {
      globalReveal = 1
    } else {
      // On exit, bars slide back over the text
      globalReveal = 1 - exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {letters.map((letter, i) => {
          // Stagger: each letter reveals at a different time
          const letterStart = i / letterCount
          const letterEnd = (i + 1.5) / letterCount
          const letterReveal = Math.max(0, Math.min(1, (globalReveal - letterStart) / (letterEnd - letterStart)))

          // Bar slides off to the right as letter reveals
          const barSlide = letterReveal * 110 // percentage offset

          return (
            <div
              key={i}
              style={{
                position: 'relative',
                display: 'inline-block',
                overflow: 'hidden',
              }}
            >
              {/* The actual letter */}
              <span
                style={{
                  fontFamily: "'Courier New', 'Consolas', monospace",
                  fontSize: 'clamp(36px, 9vw, 130px)',
                  fontWeight: 700,
                  color,
                  opacity: letterReveal,
                  display: 'inline-block',
                  letterSpacing: '0.05em',
                }}
              >
                {letter}
              </span>
              {/* Redaction bar overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: '10%',
                  left: `${barSlide}%`,
                  right: 0,
                  bottom: '10%',
                  background: barColor,
                  opacity: 1 - letterReveal * 0.95,
                  pointerEvents: 'none',
                }}
              />
            </div>
          )
        })}
      </div>
    )
  },
}

function RedactionComponent(props: MotionGraphicProps<RedactionConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-redaction',
  title: 'Redaction',
  description: 'Classified document with black redaction bars that slide away letter by letter to uncover hidden text. Government dossier print style.',
  tags: ['kinetic', 'typography', 'redaction', 'classified', 'editorial', 'print', 'document', 'government'],
  category: 'captions',
  component: RedactionComponent as any,
  defaultConfig: {
    words: ['TRUTH', 'HIDDEN', 'REVEAL', 'SECRET'],
    colors: ['#1A1A1A', '#1A1A1A', '#1A1A1A', '#1A1A1A'],
    bgColor: '#F0ECE2',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TRUTH', 'HIDDEN', 'REVEAL', 'SECRET'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1A1A1A', '#1A1A1A', '#1A1A1A', '#1A1A1A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F0ECE2', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
