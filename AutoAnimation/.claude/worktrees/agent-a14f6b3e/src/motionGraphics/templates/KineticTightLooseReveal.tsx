import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TightLooseRevealConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

/**
 * Tight-Loose Reveal — each letter reveals sequentially, but the tracking
 * transitions per-letter from ultra-tight (letters overlap) to typographically
 * loose (generous spacing). The effect propagates left-to-right like a wave:
 * letters start as a compressed cluster then expand to their final positions.
 * The cascade reveals the word letter-by-letter via spacing expansion.
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

    const finalFontSize = Math.min(width * 0.13, height * 0.16, 110)
    // Final letter spacing (loose)
    const finalSpacing = finalFontSize * 0.70
    // Tight spacing (compressed)
    const tightSpacing = finalFontSize * 0.35

    // Total widths
    const finalTotalW = n * finalSpacing
    const tightTotalW = n * tightSpacing
    const finalStartX = (width - finalTotalW) / 2
    const tightStartX = (width - tightTotalW) / 2

    const els: React.ReactNode[] = []

    for (let i = 0; i < n; i++) {
      // Each letter has its own reveal timing: left-to-right cascade
      const cascadeOffset = (i / Math.max(n - 1, 1)) * 0.6

      let charOpacity: number
      let charX: number
      let charFontSize: number
      let charFontWeight: number

      if (phase === 'enter') {
        // Letter reveals when enterProgress crosses its cascade threshold
        const charT = Math.max(0, Math.min(1, (enterProgress - cascadeOffset * 0.5) / (1 - cascadeOffset * 0.5)))
        const eased = easeOutQuint(charT)

        // X position: from tight cluster position → final spaced position
        const tightX = tightStartX + i * tightSpacing
        const finalX = finalStartX + i * finalSpacing
        charX = tightX + (finalX - tightX) * eased

        charOpacity = charT > 0 ? Math.min(1, charT * 3) : 0
        charFontSize = finalFontSize * (0.7 + eased * 0.3)
        charFontWeight = Math.round(300 + eased * 400) // 300 → 700
      } else if (phase === 'hold') {
        // All at final positions, very subtle per-letter breathing
        charX = finalStartX + i * finalSpacing
        const breathe = Math.sin(holdProgress * Math.PI * 2 + i * 0.6) * 1.5
        charX += breathe
        charOpacity = 1
        charFontSize = finalFontSize
        charFontWeight = 700
      } else {
        // Exit: compress back to tight, fade
        const t = easeInCubic(exitProgress)
        const tightX = tightStartX + i * tightSpacing
        const finalX = finalStartX + i * finalSpacing
        charX = finalX + (tightX - finalX) * t
        charOpacity = 1 - exitProgress * exitProgress
        charFontSize = finalFontSize * (1 - t * 0.2)
        charFontWeight = Math.round(700 - t * 400)
      }

      // Letter-spacing indicator (tiny gap marker between letters during hold)
      const showGap = phase === 'hold' && i < n - 1
      const gapOpacity = phase === 'hold' ? Math.min(1, holdProgress * 4) * 0.18 : 0
      const gapX = charX + finalSpacing * 0.7
      const gapW = finalSpacing * 0.28

      els.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: charX,
            transform: 'translateY(-50%)',
            fontFamily: "'Playfair Display', 'Georgia', serif",
            fontSize: charFontSize,
            fontWeight: charFontWeight,
            color,
            opacity: charOpacity,
            lineHeight: 1,
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {letters[i]}
        </div>
      )

      if (showGap) {
        els.push(
          <div
            key={`gap-${i}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: gapX,
              width: gapW,
              height: 1,
              background: color,
              opacity: gapOpacity,
              transform: 'translateY(24px)',
            }}
          />
        )
      }
    }

    return <div style={{ position: 'absolute', inset: 0 }}>{els}</div>
  },
}

function TightLooseRevealComponent(props: MotionGraphicProps<TightLooseRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-tight-loose-reveal',
  title: 'Tight-Loose Reveal',
  description:
    'Letters cascade left-to-right, each expanding from an ultra-tight compressed cluster to a generously-spaced final position. The word is revealed through spacing expansion rather than opacity or movement.',
  tags: ['kinetic', 'typography', 'tracking', 'spacing', 'reveal', 'cascade', 'per-letter', 'serif', 'craft'],
  category: 'captions',
  component: TightLooseRevealComponent as any,
  defaultConfig: {
    words: ['EXPAND', 'REVEAL', 'LOOSE', 'OPEN'],
    colors: ['#1a1a1a', '#2d2d2d', '#1a1a1a', '#333'],
    bgColor: '#f2ede8',
    cycleDuration: 2.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['EXPAND', 'REVEAL', 'LOOSE', 'OPEN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#2d2d2d', '#1a1a1a', '#333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f2ede8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.4, min: 1.2, max: 6, group: 'Timing' },
  ],
})
