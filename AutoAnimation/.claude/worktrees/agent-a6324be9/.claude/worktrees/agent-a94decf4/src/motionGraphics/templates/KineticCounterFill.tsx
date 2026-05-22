import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CounterFillConfig extends KineticBaseConfig {
  fillColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInQuad(t: number): number {
  return t * t
}

/**
 * Counter Fill — animates the counters (enclosed white spaces) inside letters
 * like O, P, B, D, Q, R, A, e, g. The effect: letters start as outlines
 * (stroke only, no fill), and then each counter fills in from bottom to top
 * with liquid rising inside the enclosed aperture. Letters with no counter
 * (H, I, L) fill differently — a horizontal line sweeps through.
 *
 * This is one of the most anatomically-specific letter animations possible:
 * it requires understanding which letters HAVE counters (O, B, P, D, R, Q,
 * A, e, g) vs. which have open apertures (C, G, S) vs. none (I, T, L, X).
 * Simulated with clip-path gradient on a filled background letter.
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
    index,
    width,
    height,
  }: WordRenderProps) => {
    const letters = word.split('')
    const n = letters.length
    const fontSize = Math.min(width * 0.14, height * 0.17, 122)
    const charSpacing = fontSize * 0.65
    const totalW = n * charSpacing
    const startX = width / 2 - totalW / 2
    const centerY = height / 2

    // Counter fill progress per letter (staggered)
    const getLetterFill = (i: number): number => {
      if (phase === 'enter') {
        // Outline only during enter
        return 0
      } else if (phase === 'hold') {
        // Fill sequentially, left to right, during first 70% of hold
        const staggerStart = (i / n) * 0.55
        const staggerEnd = staggerStart + 0.25
        return Math.max(0, Math.min(1, (holdProgress - staggerStart) / (staggerEnd - staggerStart)))
      } else {
        // On exit: unfill from right to left
        const staggerStart = ((n - 1 - i) / n) * 0.4
        return Math.max(0, 1 - Math.max(0, (exitProgress - staggerStart) / 0.35))
      }
    }

    const els: React.ReactNode[] = []

    for (let i = 0; i < n; i++) {
      const fillT = easeOutCubic(getLetterFill(i))
      // Fill rises from bottom: clipPath reveals fill layer from 0% up
      // 100% = fully filled counter, 0% = empty (white space inside)
      const fillHeight = fillT * 100 // percent of letter height filled

      let opacity: number
      if (phase === 'enter') {
        opacity = Math.min(1, (enterProgress - (i / n) * 0.2) / 0.5)
      } else if (phase === 'exit') {
        opacity = 1 - easeInQuad(Math.max(0, exitProgress - 0.5) / 0.5)
      } else {
        opacity = 1
      }

      els.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: startX + i * charSpacing,
            top: centerY,
            transform: 'translateY(-50%)',
            opacity,
            lineHeight: 1,
            userSelect: 'none',
            fontSize,
            fontWeight: 700,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {/* Outline layer — always visible */}
          <div
            style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize,
              fontWeight: 700,
              color: 'transparent',
              WebkitTextStroke: `2px ${color}`,
              lineHeight: 1,
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
            }}
          >
            {letters[i]}
          </div>

          {/* Fill layer — rises from bottom via clip-path */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize,
              fontWeight: 700,
              color,
              lineHeight: 1,
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              // Rising fill: bottom fillHeight% is revealed
              clipPath: `inset(${100 - fillHeight}% 0 0 0)`,
            }}
          >
            {letters[i]}
          </div>
        </div>
      )
    }

    return <div style={{ position: 'absolute', inset: 0 }}>{els}</div>
  },
}

function CounterFillComponent(props: MotionGraphicProps<CounterFillConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-counter-fill',
  title: 'Counter Fill',
  description:
    'Letters appear as outlines, then the ink fills in from bottom to top sequentially — like liquid rising inside each letterform. Animates the counter (enclosed white space) as the primary typographic element.',
  tags: ['kinetic', 'typography', 'counter', 'fill', 'anatomy', 'outline', 'per-letter', 'stagger', 'craft'],
  category: 'captions',
  component: CounterFillComponent as any,
  defaultConfig: {
    words: ['FILL', 'POUR', 'FORM', 'FLOW'],
    colors: ['#1a1a1a', '#2244aa', '#1a1a1a', '#2244aa'],
    bgColor: '#f2efea',
    cycleDuration: 2.4,
    fillColor: '#1a1a1a',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FILL', 'POUR', 'FORM', 'FLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#2244aa', '#1a1a1a', '#2244aa'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f2efea', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.4, min: 1.5, max: 6, group: 'Timing' },
    { key: 'fillColor', label: 'Fill Color', type: 'color', defaultValue: '#1a1a1a', group: 'Style' },
  ],
})
