import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TypewriterDisplayConfig extends KineticBaseConfig {}

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
 * Typewriter → Display — the word types in character-by-character in a
 * monospace font (mechanical, mundane), then each letter simultaneously
 * transforms into a display/headline typeface (large, expressive) with a
 * dramatic scale bloom. The transformation from utilitarian to expressive
 * is the story — the same word, but elevated. Hold shows it in full display
 * glory. Exit: scale collapses back to monospace and fades.
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
    const letters = word.split('')
    const n = letters.length

    const monoSize = Math.min(width * 0.07, height * 0.09, 64)
    const displaySize = Math.min(width * 0.15, height * 0.19, 140)

    // Morph from mono to display during hold
    const getMorphT = (): number => {
      if (phase === 'enter') return 0
      if (phase === 'exit') return Math.max(0, 1 - exitProgress * 3)
      return Math.min(1, holdProgress / 0.35)
    }
    const globalMorphT = getMorphT()

    const fontSize = monoSize + easeOutBack(Math.min(1, globalMorphT * 1.1)) * (displaySize - monoSize)
    const fontFamily = globalMorphT > 0.6
      ? "'Impact', 'Arial Black', 'Helvetica Neue', sans-serif"
      : "'Courier New', 'Lucida Console', monospace"
    const fontWeight = globalMorphT > 0.5 ? 900 : 400
    const letterSpacing = globalMorphT > 0.5 ? '-0.03em' : '0.08em'

    // Typewriter enter: reveal letter by letter
    const revealCount = phase === 'enter'
      ? Math.floor(easeInOutCubic(enterProgress) * (n + 1))
      : n

    const els: React.ReactNode[] = []
    const monoSpacing = monoSize * 0.68
    const displaySpacing = displaySize * 0.62
    const charSpacing = monoSpacing + globalMorphT * (displaySpacing - monoSpacing)
    const totalW = n * charSpacing
    const startX = width / 2 - totalW / 2

    for (let i = 0; i < n; i++) {
      const isRevealed = i < revealCount
      if (!isRevealed && phase === 'enter') continue

      let opacity = 1
      if (phase === 'exit') {
        opacity = Math.max(0, 1 - exitProgress * 2.5)
      }

      // Cursor blink on the current typing position
      const isCurrent = phase === 'enter' && i === revealCount - 1

      els.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: startX + i * charSpacing,
            top: '50%',
            transform: 'translateY(-50%)',
            fontFamily,
            fontSize,
            fontWeight,
            letterSpacing: '0',
            color,
            opacity,
            lineHeight: 1,
            userSelect: 'none',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
          }}
        >
          {letters[i]}
          {isCurrent && (
            <span
              style={{
                position: 'absolute',
                right: -(monoSize * 0.06),
                top: '10%',
                width: 2,
                height: '80%',
                background: color,
                opacity: 0.9,
              }}
            />
          )}
        </div>
      )
    }

    // Phase label
    const phaseLabel = globalMorphT < 0.1 ? 'courier 400' : globalMorphT > 0.8 ? 'impact 900' : 'morphing...'
    const labelOpacity = phase === 'hold' ? 0.18 : 0

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
            letterSpacing: '0.12em',
          }}
        >
          {phaseLabel}
        </div>
      </div>
    )
  },
}

function TypewriterDisplayComponent(props: MotionGraphicProps<TypewriterDisplayConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-typewriter-display',
  title: 'Typewriter → Display',
  description:
    'Word types in character-by-character in monospace (Courier), then all letters simultaneously bloom to headline weight (Impact). Mechanical → expressive. The same word, elevated. Font identity as transformation.',
  tags: ['kinetic', 'typography', 'typewriter', 'display', 'morph', 'multi-font', 'bloom', 'craft', 'per-letter'],
  category: 'captions',
  component: TypewriterDisplayComponent as any,
  defaultConfig: {
    words: ['POWER', 'TYPE', 'BOLD', 'LIFE'],
    colors: ['#ffffff', '#ffdd00', '#ffffff', '#ffdd00'],
    bgColor: '#0f0f0f',
    cycleDuration: 2.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['POWER', 'TYPE', 'BOLD', 'LIFE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#ffdd00', '#ffffff', '#ffdd00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0f0f', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.5, min: 1.5, max: 5, group: 'Timing' },
  ],
})
