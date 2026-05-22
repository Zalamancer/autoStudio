import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WordSpacingSnapConfig extends KineticBaseConfig {}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInOutExpo(t: number): number {
  if (t === 0 || t === 1) return t
  return t < 0.5
    ? Math.pow(2, 20 * t - 10) / 2
    : (2 - Math.pow(2, -20 * t + 10)) / 2
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

/**
 * Word Spacing Snap — the word is treated as multiple "words" split by spaces,
 * and the word-spacing property (plus simulated word breaks) is animated from
 * ultra-tight (negative) to a wide cinematic space, then snaps to typographic
 * normal. A phrase entered as a single string gets split at spaces; single words
 * show a two-part split at the midpoint with word-spacing animated.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Center hairline */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '20%',
          bottom: '20%',
          width: 1,
          background: 'rgba(255,255,255,0.04)',
          transform: 'translateX(-0.5px)',
        }}
      />
    </div>
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
    // Split at spaces, or split single word at midpoint to create two parts
    const parts = word.includes(' ')
      ? word.split(' ').filter(Boolean)
      : [word.slice(0, Math.ceil(word.length / 2)), word.slice(Math.ceil(word.length / 2))]

    const fontSize = Math.min(width * 0.13, height * 0.16, 110)

    // Word spacing: how far apart the two chunks are
    // negative = overlapping, 0 = touching, large = wide apart
    let wordSpacingPx: number
    let opacity: number
    let fontWeight: number
    let letterSpacingEm: number

    if (phase === 'enter') {
      if (enterProgress < 0.3) {
        // Start ultra-tight: chunks overlap
        const t = enterProgress / 0.3
        wordSpacingPx = -fontSize * 0.5 * (1 - t) // from -0.5em to 0
        opacity = t
        fontWeight = 300
        letterSpacingEm = -0.05
      } else {
        // Spring apart with overshoot
        const t = easeOutBack(Math.min(1, (enterProgress - 0.3) / 0.7))
        // 0 → peak ~2.5em → settle ~0.3em
        wordSpacingPx = t * fontSize * 1.2
        opacity = 1
        fontWeight = Math.round(300 + (enterProgress - 0.3) / 0.7 * 500)
        letterSpacingEm = -0.05 + (enterProgress - 0.3) / 0.7 * 0.08
      }
    } else if (phase === 'hold') {
      // Gentle oscillation of word spacing — breathes
      const osc = Math.sin(holdProgress * Math.PI * 2) * fontSize * 0.08
      wordSpacingPx = fontSize * 0.3 + osc
      opacity = 1
      fontWeight = 700
      letterSpacingEm = 0.03
    } else {
      // Exit: collapse word spacing back to tight, fade
      const t = easeInOutExpo(exitProgress)
      wordSpacingPx = fontSize * 0.3 * (1 - t)
      opacity = 1 - exitProgress
      fontWeight = 700
      letterSpacingEm = 0.03 - t * 0.08
    }

    const partA = parts[0] ?? ''
    const partB = parts.slice(1).join(' ') || ''

    const wordSpacingEm = wordSpacingPx / fontSize

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          display: 'flex',
          alignItems: 'baseline',
          gap: `${Math.max(-0.8, wordSpacingEm).toFixed(3)}em`,
          whiteSpace: 'nowrap',
        }}
      >
        {[partA, partB].filter(Boolean).map((part, i) => (
          <div
            key={i}
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
              fontSize,
              fontWeight,
              letterSpacing: `${letterSpacingEm.toFixed(3)}em`,
              textTransform: 'uppercase',
              color,
              lineHeight: 1,
              userSelect: 'none',
              fontVariationSettings: `"wght" ${Math.min(900, fontWeight)}`,
            }}
          >
            {part}
          </div>
        ))}
      </div>
    )
  },
}

function WordSpacingSnapComponent(props: MotionGraphicProps<WordSpacingSnapConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-word-spacing-snap',
  title: 'Word Spacing Snap',
  description:
    'Two word-chunks spring apart from an overlapping crush to a wide cinematic word-spacing, settling at typographic normal with an elastic overshoot. Demonstrates word-spacing as a primary animation axis.',
  tags: ['kinetic', 'typography', 'word-spacing', 'snap', 'elastic', 'spacing', 'craft', 'cinematic'],
  category: 'captions',
  component: WordSpacingSnapComponent as any,
  defaultConfig: {
    words: ['NEW WORLD', 'OPEN SPACE', 'WORD SNAP', 'TYPE SET'],
    colors: ['#e8e8e8', '#c0c0c0', '#e8e8e8', '#a0a0a0'],
    bgColor: '#111111',
    cycleDuration: 2.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['NEW WORLD', 'OPEN SPACE', 'WORD SNAP', 'TYPE SET'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#e8e8e8', '#c0c0c0', '#e8e8e8', '#a0a0a0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111111', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.2, min: 1.0, max: 6, group: 'Timing' },
  ],
})
