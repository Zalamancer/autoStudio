import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SerifSansMorphConfig extends KineticBaseConfig {
  morphSpeed: number
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInQuad(t: number): number {
  return t * t
}

/**
 * Serif → Sans Morph — the word cross-fades per letter between a classical
 * serif (Georgia) and a clean grotesque (Helvetica Neue). The morph travels
 * left to right like a paintbrush wiping across. During hold, the morph
 * oscillates back and forth — the word shifts between its two identities.
 *
 * This expresses one of the core debates in typography: the humanity and
 * tradition of the serif vs. the rationality and modernity of the sans.
 * The same word, two completely different personalities.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Subtle dividing line in background */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '10%',
          bottom: '10%',
          width: 1,
          background: 'rgba(128,128,128,0.06)',
          transform: 'translateX(-50%)',
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
    const fontSize = Math.min(width * 0.14, height * 0.17, 120)
    const charSpacing = fontSize * 0.64
    const totalW = n * charSpacing
    const startX = width / 2 - totalW / 2
    const centerY = height / 2

    // 0 = pure serif, 1 = pure sans
    const getGlobalMorph = (): number => {
      if (phase === 'enter') return 0 // start in serif
      if (phase === 'exit') return easeInQuad(exitProgress) // exit to sans
      // Hold: oscillate
      return easeInOutCubic(
        holdProgress < 0.5
          ? holdProgress * 2      // 0 → 1 (serif → sans)
          : 2 - holdProgress * 2  // 1 → 0 (sans → serif)
      )
    }

    const globalMorph = getGlobalMorph()

    const els: React.ReactNode[] = []

    for (let i = 0; i < n; i++) {
      const pos = n > 1 ? i / (n - 1) : 0.5

      // Per-letter morph: staggered by position, creates left-to-right wave
      const letterMorph = Math.max(0, Math.min(1,
        (globalMorph - pos * 0.4 + 0.2) / 0.6
      ))

      let opacity: number
      if (phase === 'enter') {
        opacity = Math.min(1, (enterProgress - pos * 0.2) / 0.5)
      } else if (phase === 'exit') {
        opacity = 1 - easeInQuad(exitProgress)
      } else {
        opacity = 1
      }

      // Two layers: serif (opacity 1 - letterMorph) and sans (opacity letterMorph)
      // Cross-fade between them
      const serifOpacity = 1 - letterMorph
      const sansOpacity = letterMorph

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
          }}
        >
          {/* Serif layer */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize,
              fontWeight: 700,
              color,
              opacity: serifOpacity,
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
            }}
          >
            {letters[i]}
          </div>
          {/* Sans layer */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize,
              fontWeight: 700,
              color,
              opacity: sansOpacity,
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
            }}
          >
            {letters[i]}
          </div>
          {/* Spacer for layout */}
          <div
            style={{
              visibility: 'hidden',
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize,
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            {letters[i]}
          </div>
        </div>
      )
    }

    // Family labels
    const serifLabelOpacity = Math.max(0, 1 - globalMorph * 3) * 0.22
    const sansLabelOpacity = Math.max(0, globalMorph * 3 - 2) * 0.22

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {els}
        <div
          style={{
            position: 'absolute',
            bottom: '16%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color,
            opacity: serifLabelOpacity + sansLabelOpacity,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {globalMorph < 0.5 ? 'serif' : 'sans-serif'}
        </div>
      </div>
    )
  },
}

function SerifSansMorphComponent(props: MotionGraphicProps<SerifSansMorphConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-serif-sans-morph',
  title: 'Serif → Sans Morph',
  description:
    'The word cross-fades per letter between Georgian serif and Helvetica Neue grotesque. A left-to-right morph wave wipes the word between its two identities. Expresses the oldest tension in typography: tradition vs. modernity.',
  tags: ['kinetic', 'typography', 'serif', 'sans-serif', 'morph', 'multi-font', 'per-letter', 'cross-fade', 'craft'],
  category: 'captions',
  component: SerifSansMorphComponent as any,
  defaultConfig: {
    words: ['HUMAN', 'CLEAR', 'FORM', 'PURE'],
    colors: ['#1a1a1a', '#2a2a2a', '#1a1a1a', '#2a2a2a'],
    bgColor: '#f6f4f0',
    cycleDuration: 2.5,
    morphSpeed: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HUMAN', 'CLEAR', 'FORM', 'PURE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#2a2a2a', '#1a1a1a', '#2a2a2a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f6f4f0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.5, min: 1.5, max: 5, group: 'Timing' },
    { key: 'morphSpeed', label: 'Morph Speed', type: 'number', defaultValue: 1, min: 0.5, max: 3, group: 'Animation' },
  ],
})
