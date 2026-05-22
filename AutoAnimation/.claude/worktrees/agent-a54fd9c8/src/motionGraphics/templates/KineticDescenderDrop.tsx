import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DescenderDropConfig extends KineticBaseConfig {
  dropDepth: number
}

function easeOutBounce(t: number): number {
  const n1 = 7.5625
  const d1 = 2.75
  if (t < 1 / d1) return n1 * t * t
  else if (t < 2 / d1) { t -= 1.5 / d1; return n1 * t * t + 0.75 }
  else if (t < 2.5 / d1) { t -= 2.25 / d1; return n1 * t * t + 0.9375 }
  else { t -= 2.625 / d1; return n1 * t * t + 0.984375 }
}

function easeInQuad(t: number): number {
  return t * t
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * Descender Drop — only letters with descenders (g, j, p, q, y) have their
 * descending stroke drop and bounce on the descender line. Letters without
 * descenders (cap letters, letters sitting on baseline without descending parts)
 * are stable. This animates a real anatomical feature — the part of the letter
 * that descends below the baseline.
 *
 * Lowercase word works best: 'gypsy', 'play', 'type', 'jump'.
 * Each descender letter drops on its own beat, creating a rhythmic cascade.
 * The animation uses translateY per letter, offset based on descender height.
 */

const DESCENDER_LETTERS = new Set(['g', 'j', 'p', 'q', 'y', 'f', 'G', 'J', 'Q', 'Y'])

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Baseline */}
      <div
        style={{
          position: 'absolute',
          left: '8%',
          right: '8%',
          top: '60%',
          height: 1,
          background: 'rgba(100,100,100,0.12)',
        }}
      />
      {/* Descender line */}
      <div
        style={{
          position: 'absolute',
          left: '8%',
          right: '8%',
          top: '72%',
          height: 1,
          background: 'rgba(100,100,100,0.07)',
          borderTop: '1px dashed rgba(100,100,100,0.12)',
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
    const charSpacing = fontSize * 0.62
    const totalW = n * charSpacing
    const startX = width / 2 - totalW / 2
    // Position so baseline aligns with 60% of canvas height
    const baselineY = height * 0.60

    const dropDepth = fontSize * 0.35 // descender drop amount

    const els: React.ReactNode[] = []

    // Collect descender positions (indices)
    const descenderIndices = letters
      .map((l, i) => ({ l, i }))
      .filter(({ l }) => DESCENDER_LETTERS.has(l))
      .map(({ i }) => i)

    for (let i = 0; i < n; i++) {
      const isDescender = DESCENDER_LETTERS.has(letters[i])

      // Stagger drops per descender position
      const descIdx = descenderIndices.indexOf(i)
      const stagger = descIdx >= 0 ? (descIdx / Math.max(descenderIndices.length - 1, 1)) * 0.4 : 0

      let descDrop: number = 0
      let opacity: number
      let scale: number = 1

      if (phase === 'enter') {
        opacity = Math.min(1, (enterProgress - i / n * 0.2) / 0.4)
        // Descenders drop from extra below during enter
        if (isDescender) {
          const t = easeOutBounce(Math.min(1, enterProgress * 1.2))
          descDrop = (1 - t) * dropDepth * 3
        }
      } else if (phase === 'hold') {
        opacity = 1
        if (isDescender) {
          // Each descender bounces on its own beat
          const beatT = ((holdProgress * 2) + stagger) % 1
          // Bounce: drop then spring back
          const isDropping = beatT < 0.15
          const bounceT = isDropping
            ? beatT / 0.15
            : easeOutBounce(Math.min(1, (beatT - 0.15) / 0.45))
          descDrop = isDropping
            ? bounceT * dropDepth * 0.5
            : dropDepth * 0.5 * (1 - bounceT)
        }
      } else {
        const t = easeInQuad(exitProgress)
        opacity = 1 - t
        // Descenders drop away on exit
        if (isDescender) {
          descDrop = t * dropDepth * 4
        }
      }

      els.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: startX + i * charSpacing,
            top: baselineY + descDrop,
            transform: 'translateY(-75%)', // align to baseline (75% of cap height from top)
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
        {/* Anatomy label */}
        <div
          style={{
            position: 'absolute',
            right: '6%',
            top: '70%',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            color,
            opacity: phase === 'hold' ? 0.18 : 0,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          descender
        </div>
      </div>
    )
  },
}

function DescenderDropComponent(props: MotionGraphicProps<DescenderDropConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-descender-drop',
  title: 'Descender Drop',
  description:
    'Letters with descenders (g, j, p, q, y) have their descending strokes bounce below the baseline independently. Letters without descenders stay stable. Pure anatomy animation — the descender line is made visible.',
  tags: ['kinetic', 'typography', 'descender', 'anatomy', 'bounce', 'per-letter', 'baseline', 'serif', 'craft'],
  category: 'captions',
  component: DescenderDropComponent as any,
  defaultConfig: {
    words: ['gypsy', 'jumpy', 'ploy', 'yoga'],
    colors: ['#1a1a1a', '#885522', '#1a1a1a', '#885522'],
    bgColor: '#f5f2ec',
    cycleDuration: 2.0,
    dropDepth: 35,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['gypsy', 'jumpy', 'ploy', 'yoga'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#885522', '#1a1a1a', '#885522'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f5f2ec', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 1.0, max: 5, group: 'Timing' },
    { key: 'dropDepth', label: 'Drop Depth (px)', type: 'number', defaultValue: 35, min: 10, max: 80, group: 'Animation' },
  ],
})
