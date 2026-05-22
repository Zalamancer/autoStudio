import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StrikeRedactConfig extends KineticBaseConfig {
  redactStyle: string
}

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

function easeInQuad(t: number): number {
  return t * t
}

/**
 * Strike-Through Redact — the word appears clean, then a strikethrough line
 * draws across it in real time (left to right), like a word being crossed out
 * in a document edit. The text beneath the strike dims as the line passes.
 * After full strike, a thick redaction bar slides in to obliterate the word.
 * Finally, the redacted version holds. Enter: clean text. Hold: strike draws,
 * then redact bar covers. Exit: bar lifts to reveal the word again, then fades.
 *
 * This is case/style as narrative: the word itself questions its own visibility.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    width,
    height,
  }: WordRenderProps) => {
    const fontSize = Math.min(width * 0.14, height * 0.17, 122)

    // The strikethrough line draws across during first 40% of hold
    const strikeProgress = phase === 'hold'
      ? Math.min(1, holdProgress / 0.4)
      : phase === 'exit' ? 1 : 0

    // Redact bar slides in after strike complete (hold 40-75%)
    const redactProgress = phase === 'hold'
      ? Math.max(0, Math.min(1, (holdProgress - 0.4) / 0.35))
      : phase === 'exit' ? Math.max(0, 1 - exitProgress * 2) : 0

    let textOpacity: number
    let mainOpacity: number = 1

    if (phase === 'enter') {
      mainOpacity = Math.min(1, enterProgress * 2.5)
      textOpacity = 1
    } else if (phase === 'hold') {
      // Dim text as strike line passes
      textOpacity = 1 - strikeProgress * 0.5
      // Further dim under redact bar
      textOpacity = textOpacity * (1 - redactProgress * 0.95)
    } else {
      // Bar lifts, then word fades
      mainOpacity = 1 - easeInQuad(Math.max(0, exitProgress - 0.5) / 0.5)
      textOpacity = exitProgress < 0.5 ? 0.15 + exitProgress * 0.7 : 1
    }

    // Approximate word width for elements
    const approxWordWidth = word.length * fontSize * 0.55

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: mainOpacity,
        }}
      >
        {/* The word */}
        <div
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize,
            fontWeight: 400,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color,
            opacity: textOpacity,
            whiteSpace: 'nowrap',
            lineHeight: 1,
            userSelect: 'none',
            position: 'relative',
          }}
        >
          {word}
        </div>

        {/* Strikethrough line — draws from left */}
        {strikeProgress > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              width: `${strikeProgress * 100}%`,
              height: 2.5,
              background: color,
              transform: 'translateY(-50%)',
              opacity: 0.9,
              transformOrigin: 'left center',
            }}
          />
        )}

        {/* Redact bar — slides from left */}
        {redactProgress > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              width: `${redactProgress * 100}%`,
              height: fontSize * 1.1,
              background: color,
              transform: 'translateY(-50%)',
              opacity: redactProgress * 0.95,
            }}
          />
        )}
      </div>
    )
  },
}

function StrikeRedactComponent(props: MotionGraphicProps<StrikeRedactConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-strike-redact',
  title: 'Strike-Through Redact',
  description:
    'Word appears clean, then a strikethrough draws left to right in real time dimming the text beneath, followed by a full redaction bar obliterating the word. Exit lifts the bar to reveal the word again before fading.',
  tags: ['kinetic', 'typography', 'strikethrough', 'redact', 'case', 'style', 'editorial', 'reveal', 'craft'],
  category: 'captions',
  component: StrikeRedactComponent as any,
  defaultConfig: {
    words: ['EDIT', 'ERASE', 'HIDE', 'GONE'],
    colors: ['#0a0a0a', '#333', '#0a0a0a', '#333'],
    bgColor: '#f8f6f2',
    cycleDuration: 2.8,
    redactStyle: 'bar',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['EDIT', 'ERASE', 'HIDE', 'GONE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#0a0a0a', '#333', '#0a0a0a', '#333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f8f6f2', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.8, min: 1.5, max: 6, group: 'Timing' },
    { key: 'redactStyle', label: 'Redact Style', type: 'select', defaultValue: 'bar', group: 'Animation' },
  ],
})
