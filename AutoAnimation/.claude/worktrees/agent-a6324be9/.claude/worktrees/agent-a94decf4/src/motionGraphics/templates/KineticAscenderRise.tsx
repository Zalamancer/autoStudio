import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AscenderRiseConfig extends KineticBaseConfig {
  riseHeight: number
}

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  const c4 = (2 * Math.PI) / 3
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * Ascender Rise — only letters with ascenders (b, d, f, h, k, l, t, and caps)
 * have their ascending strokes spring up above the cap line on enter. On hold,
 * they gently sway — tall letters towering over their shorter neighbors.
 * The animation celebrates the vertical rhythm of lowercase type, specifically
 * the dance between x-height letters (a, c, e, m, n, o, s, u, v, w, x, z)
 * and their taller ascender companions.
 *
 * Works beautifully with mixed-case words containing both ascenders and regular
 * x-height letters: 'height', 'lifted', 'thrill', 'bright'.
 */

const ASCENDER_LETTERS = new Set([
  'b', 'd', 'f', 'h', 'i', 'j', 'k', 'l', 't',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I',
  'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
  'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
])

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* x-height line */}
      <div
        style={{
          position: 'absolute',
          left: '8%',
          right: '8%',
          top: '56%',
          height: 1,
          background: 'rgba(100,100,100,0.08)',
        }}
      />
      {/* Cap line / ascender line */}
      <div
        style={{
          position: 'absolute',
          left: '8%',
          right: '8%',
          top: '36%',
          height: 1,
          background: 'rgba(100,100,100,0.06)',
          borderTop: '1px dashed rgba(100,100,100,0.08)',
        }}
      />
      {/* Baseline */}
      <div
        style={{
          position: 'absolute',
          left: '8%',
          right: '8%',
          top: '68%',
          height: 1,
          background: 'rgba(100,100,100,0.12)',
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
    const fontSize = Math.min(width * 0.12, height * 0.15, 104)
    const charSpacing = fontSize * 0.61
    const totalW = n * charSpacing
    const startX = width / 2 - totalW / 2
    const baselineY = height * 0.68

    const riseAmount = fontSize * 0.5 // how much ascenders spring above

    const els: React.ReactNode[] = []

    for (let i = 0; i < n; i++) {
      const isAscender = ASCENDER_LETTERS.has(letters[i])
      const pos = n > 1 ? i / (n - 1) : 0.5
      const stagger = pos * 0.35

      let riseOffset: number = 0
      let opacity: number
      let scaleY: number = 1

      if (phase === 'enter') {
        const charT = Math.max(0, Math.min(1, (enterProgress - stagger * 0.3) / (1 - stagger * 0.3)))
        if (isAscender) {
          // Ascender letters spring up from below with elastic overshoot
          const elastic = easeOutElastic(Math.min(1, charT * 1.05))
          // Start from below baseline, spring to correct position
          riseOffset = (1 - elastic) * riseAmount * 2.5
        }
        opacity = Math.min(1, charT * 3)
      } else if (phase === 'hold') {
        opacity = 1
        if (isAscender) {
          // Gentle sway — tall letters feel their height
          const sway = Math.sin(holdProgress * Math.PI * 2 + pos * 2) * riseAmount * 0.06
          riseOffset = sway
        }
      } else {
        const t = easeInCubic(exitProgress)
        opacity = 1 - t
        if (isAscender) {
          // Ascenders retract back up on exit
          riseOffset = -t * riseAmount * 1.5
          scaleY = 1 - t * 0.3
        }
      }

      // Ascender letters sit higher (their cap/ascender top is at ascender line)
      const letterY = baselineY - (isAscender ? 0 : 0) + riseOffset

      els.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: startX + i * charSpacing,
            top: letterY,
            transform: `translateY(-100%) scaleY(${scaleY})`,
            transformOrigin: 'bottom center',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize,
            fontWeight: 400,
            color,
            opacity,
            lineHeight: 1,
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {letters[i]}
        </div>
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {els}
        {/* Anatomy labels */}
        <div
          style={{
            position: 'absolute',
            left: '6%',
            top: '34%',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            color,
            opacity: phase === 'hold' ? 0.16 : 0,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          ascender
        </div>
        <div
          style={{
            position: 'absolute',
            left: '6%',
            top: '54%',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            color,
            opacity: phase === 'hold' ? 0.13 : 0,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          x-height
        </div>
      </div>
    )
  },
}

function AscenderRiseComponent(props: MotionGraphicProps<AscenderRiseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ascender-rise',
  title: 'Ascender Rise',
  description:
    'Letters with ascenders (b, d, f, h, k, l, t) spring up above the x-height with elastic bounce on enter. x-height letters stay grounded while ascenders sway gently during hold. Typographic anatomy made kinetic.',
  tags: ['kinetic', 'typography', 'ascender', 'anatomy', 'elastic', 'per-letter', 'baseline', 'serif', 'craft'],
  category: 'captions',
  component: AscenderRiseComponent as any,
  defaultConfig: {
    words: ['lifted', 'bright', 'height', 'thrill'],
    colors: ['#1a1a1a', '#2255aa', '#1a1a1a', '#2255aa'],
    bgColor: '#f4f1eb',
    cycleDuration: 2.2,
    riseHeight: 50,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['lifted', 'bright', 'height', 'thrill'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#2255aa', '#1a1a1a', '#2255aa'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f4f1eb', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.2, min: 1.0, max: 5, group: 'Timing' },
    { key: 'riseHeight', label: 'Rise Height (px)', type: 'number', defaultValue: 50, min: 20, max: 120, group: 'Animation' },
  ],
})
