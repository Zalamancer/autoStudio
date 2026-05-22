import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MonoProportionalConfig extends KineticBaseConfig {}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

/**
 * Mono → Proportional — each letter animates from monospace width (every
 * character occupies the same horizontal cell, like a typewriter) to its true
 * proportional width. The narrow letters (I, l, 1) compress; wide letters
 * (M, W) expand. The motion reveals the optical rhythm hidden inside the word.
 * Enter appears as monospace; hold morphs letter by letter to proportional;
 * exit snaps back to mono and fades.
 *
 * Proportional width approximations by letter:
 * Narrow: I,J,l,1,i → 0.30em   Mid-narrow: f,j,r,t → 0.45em
 * Medium: most letters → 0.60em  Wide: m,M,w,W → 0.85em
 */

function proportionalWidth(ch: string): number {
  const c = ch.toLowerCase()
  if ('il1!|'.includes(c)) return 0.30
  if ('jftry'.includes(c)) return 0.46
  if ('mwMW'.includes(ch)) return 0.82
  if ('cdgoqpbDGOQPB'.includes(ch)) return 0.66
  return 0.58
}

const MONO_WIDTH = 0.60 // em

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Grid ticks — evoke monospace cell structure */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(90deg, rgba(100,100,100,0.05) 1px, transparent 1px)',
          backgroundSize: '28px 100%',
          pointerEvents: 'none',
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
    const letters = word.split('')
    const n = letters.length
    const fontSize = Math.min(width * 0.13, height * 0.16, 112)

    // Compute morph progress per letter (stagger across hold)
    const morphLetterT = (i: number): number => {
      if (phase !== 'hold') return phase === 'enter' ? 0 : 1
      // Each letter morphs in sequence over first 60% of hold
      const stagger = i / Math.max(n - 1, 1)
      const windowStart = stagger * 0.5
      const windowEnd = windowStart + 0.35
      const t = Math.max(0, Math.min(1, (holdProgress - windowStart) / (windowEnd - windowStart)))
      return easeOutBack(Math.min(1, t * 1.1))
    }

    // Compute positions for all morph states
    const positions: number[] = []
    let cursor = 0
    for (let i = 0; i < n; i++) {
      const morphT = morphLetterT(i)
      const monoW = MONO_WIDTH * fontSize
      const propW = proportionalWidth(letters[i]) * fontSize
      const cellW = monoW + (propW - monoW) * morphT
      positions.push(cursor + cellW / 2) // center of cell
      cursor += cellW + fontSize * 0.04 // gap
    }
    const totalW = cursor
    const startX = width / 2 - totalW / 2

    const els: React.ReactNode[] = []
    for (let i = 0; i < n; i++) {
      const morphT = morphLetterT(i)
      const monoW = MONO_WIDTH * fontSize
      const propW = proportionalWidth(letters[i]) * fontSize

      let opacity: number = 1
      let fontFamily: string
      let fontWeight: number

      if (phase === 'enter') {
        opacity = Math.min(1, enterProgress * 2.5)
        fontFamily = "'Courier New', 'Lucida Console', monospace"
        fontWeight = 400
      } else if (phase === 'hold') {
        // Cross-fade font family at midpoint of letter morph
        fontFamily = morphT > 0.5
          ? "'Helvetica Neue', Helvetica, Arial, sans-serif"
          : "'Courier New', 'Lucida Console', monospace"
        fontWeight = 400 + Math.round(morphT * 300)
      } else {
        const t = easeInOutCubic(exitProgress)
        opacity = 1 - t
        fontFamily = "'Courier New', 'Lucida Console', monospace"
        fontWeight = 400
      }

      els.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: startX + positions[i],
            top: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily,
            fontSize,
            fontWeight,
            color,
            opacity,
            lineHeight: 1,
            userSelect: 'none',
            whiteSpace: 'nowrap',
            transition: 'font-family 0ms',
          }}
        >
          {letters[i]}
        </div>
      )
    }

    // Mode label
    const overallMorph = phase === 'hold'
      ? letters.reduce((sum, _, i) => sum + morphLetterT(i), 0) / n
      : phase === 'enter' ? 0 : 1
    const modeLabel = overallMorph < 0.4 ? 'MONO' : overallMorph > 0.7 ? 'PROP' : 'MORPH'
    const labelOpacity = 0.2

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {els}
        <div
          style={{
            position: 'absolute',
            right: '6%',
            bottom: '14%',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color,
            opacity: labelOpacity,
            letterSpacing: '0.14em',
          }}
        >
          {modeLabel}
        </div>
      </div>
    )
  },
}

function MonoProportionalComponent(props: MotionGraphicProps<MonoProportionalConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-mono-proportional',
  title: 'Mono to Proportional',
  description:
    'Each letter morphs from its monospace cell width (typewriter) to its true proportional width, revealing the optical rhythm hidden in the word. Narrow letters compress, wide letters expand in sequence.',
  tags: ['kinetic', 'typography', 'monospace', 'proportional', 'morph', 'spacing', 'per-letter', 'craft', 'kerning'],
  category: 'captions',
  component: MonoProportionalComponent as any,
  defaultConfig: {
    words: ['FILM', 'WIDE', 'TYPE', 'FLOW'],
    colors: ['#0a0a0a', '#444', '#0a0a0a', '#444'],
    bgColor: '#f8f8f6',
    cycleDuration: 2.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FILM', 'WIDE', 'TYPE', 'FLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#0a0a0a', '#444', '#0a0a0a', '#444'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f8f8f6', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.8, min: 1.5, max: 6, group: 'Timing' },
  ],
})
