import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SerifGrowConfig extends KineticBaseConfig {}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

function easeInCubic(t: number): number {
  return t * t * t
}

/**
 * Serif Grow / Chop — the word begins rendered as a pure sans-serif (no serifs),
 * then the word transitions to a serif typeface, effectively "growing" the
 * tiny bracketed foot details onto each letterform. The enter shows the
 * skeletal strokes (sans); the hold "grows" into the serif version with a
 * horizontal wipe that feels like ink spreading into the serifs.
 *
 * On exit: the serifs "chop" off — the word snaps back to sans and fades.
 * This is a genuine celebration of the serif as a design element: not just
 * decoration, but the product of centuries of stone-cutting and punchcutting.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Type specimen background — barely there grid */}
      <div
        style={{
          position: 'absolute',
          left: '8%',
          right: '8%',
          top: '64%',
          height: 1,
          background: 'rgba(100,100,100,0.1)',
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
    const fontSize = Math.min(width * 0.15, height * 0.19, 138)

    // 0 = pure sans, 1 = fully serif
    // The morph is done by cross-fading two absolutely-positioned text layers
    let serifProgress: number
    let opacity: number
    let scale: number = 1

    if (phase === 'enter') {
      // Start sans, enter just reveals the sans layer
      serifProgress = 0
      opacity = Math.min(1, enterProgress * 2)
    } else if (phase === 'hold') {
      // Serif grows in during first half of hold
      serifProgress = Math.min(1, holdProgress / 0.45)
      opacity = 1
    } else {
      // Serifs chop: snap back to sans, then fade
      serifProgress = Math.max(0, 1 - exitProgress * 4) // quick chop
      opacity = 1 - easeInCubic(exitProgress)
    }

    const serifEased = easeOutBack(Math.min(1, serifProgress * 1.05))

    // Cross-fade: reveal serif layer via clipPath wipe (left to right)
    const wipePercent = serifEased * 100

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
        }}
      >
        {/* Sans layer (base — always present) */}
        <div
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            color,
            whiteSpace: 'nowrap',
            lineHeight: 1,
            userSelect: 'none',
            opacity: 1 - serifEased,
          }}
        >
          {word}
        </div>

        {/* Serif layer — revealed via clip wipe */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.01em',
            color,
            whiteSpace: 'nowrap',
            lineHeight: 1,
            userSelect: 'none',
            clipPath: `inset(0 ${100 - wipePercent}% 0 0)`,
            opacity: serifEased,
          }}
        >
          {word}
        </div>

        {/* Serif/Sans label */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: fontSize * 1.2,
            transform: 'translateX(-50%)',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color,
            opacity: phase === 'hold' ? 0.22 : 0,
            letterSpacing: '0.14em',
            textTransform: 'lowercase',
            whiteSpace: 'nowrap',
          }}
        >
          {serifProgress > 0.7 ? 'serif grows' : 'sans skeleton'}
        </div>
      </div>
    )
  },
}

function SerifGrowComponent(props: MotionGraphicProps<SerifGrowConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-serif-grow',
  title: 'Serif Grow / Chop',
  description:
    'Word begins as pure sans-serif skeleton, then the serif typeface is revealed via a left-to-right wipe — as if ink spreading into the bracketed serifs. Exit chops the serifs instantly back to sans. Celebrates the serif as designed element.',
  tags: ['kinetic', 'typography', 'serif', 'anatomy', 'morph', 'wipe', 'craft', 'history', 'reveal'],
  category: 'captions',
  component: SerifGrowComponent as any,
  defaultConfig: {
    words: ['CARVED', 'ROMAN', 'STONE', 'CRAFT'],
    colors: ['#1a1a1a', '#552200', '#1a1a1a', '#552200'],
    bgColor: '#f5f2eb',
    cycleDuration: 2.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CARVED', 'ROMAN', 'STONE', 'CRAFT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#552200', '#1a1a1a', '#552200'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f5f2eb', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.5, min: 1.5, max: 5, group: 'Timing' },
  ],
})
