import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CapsLockSlamConfig extends KineticBaseConfig {}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInQuad(t: number): number {
  return t * t
}

/**
 * Caps Lock Slam — the word appears in lowercase, then each letter individually
 * "gets hit" by the Caps Lock key and snaps to uppercase with a physical scale
 * pop. Letters are "locked" sequentially from left to right during hold.
 * The case transformation IS the animation — no other movement involved.
 * After all letters are capitalized, a brief "KEY LOCKED" indicator appears.
 * Exit: the caps lock is released — letters drop back to lowercase and fade.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Caps lock LED indicator */}
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
    const lower = word.toLowerCase()
    const upper = word.toUpperCase()
    const letters = lower.split('')
    const n = letters.length

    const fontSizeLower = Math.min(width * 0.14, height * 0.17, 122)
    // Uppercase is slightly smaller visually due to cap height vs x-height
    const fontSizeUpper = fontSizeLower * 0.9

    // Which letters have been "capped" — stagger across hold phase
    const letterCappedT = (i: number): number => {
      if (phase === 'enter') return 0
      if (phase === 'exit') return 1 // all capped during exit (then released)
      // Each letter caps during first 70% of hold, staggered
      const start = (i / n) * 0.65
      const dur = 0.12
      return Math.max(0, Math.min(1, (holdProgress - start) / dur))
    }

    const charSpacing = fontSizeLower * 0.72
    const totalW = n * charSpacing
    const startX = width / 2 - totalW / 2
    const centerY = height / 2

    const els: React.ReactNode[] = []

    for (let i = 0; i < n; i++) {
      const cappedT = letterCappedT(i)
      const isCapped = cappedT > 0.5
      const isTransitioning = cappedT > 0 && cappedT < 1

      // Pop scale: peaks at moment of transition
      const popScale = isTransitioning
        ? 1 + easeOutBack(cappedT) * 0.2
        : 1

      let opacity: number = 1
      let displayLetter: string
      let fontSize: number

      if (phase === 'enter') {
        opacity = Math.min(1, enterProgress * 2.5)
        displayLetter = letters[i]
        fontSize = fontSizeLower
      } else if (phase === 'hold') {
        displayLetter = isCapped ? upper[i] : lower[i]
        fontSize = isCapped ? fontSizeUpper : fontSizeLower
      } else {
        // Release: caps → lower during exit
        const releaseT = easeInQuad(exitProgress)
        displayLetter = releaseT < 0.3 ? upper[i] : lower[i]
        fontSize = fontSizeLower
        opacity = 1 - releaseT
      }

      els.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: startX + i * charSpacing,
            top: centerY,
            transform: `translateY(-50%) scale(${popScale})`,
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize,
            fontWeight: isCapped ? 700 : 400,
            color,
            opacity,
            lineHeight: 1,
            userSelect: 'none',
            whiteSpace: 'nowrap',
            transformOrigin: 'center bottom',
          }}
        >
          {displayLetter}
        </div>
      )
    }

    // CAPS LOCK indicator — appears when all letters are capped
    const allCapped = holdProgress > 0.8
    const ledOpacity = phase === 'hold' && allCapped
      ? Math.min(1, (holdProgress - 0.8) / 0.1) * 0.7
      : 0

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {els}
        {/* Caps lock LED */}
        <div
          style={{
            position: 'absolute',
            top: '18%',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            opacity: ledOpacity,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9,
              color,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            CAPS LOCK
          </div>
        </div>
      </div>
    )
  },
}

function CapsLockSlamComponent(props: MotionGraphicProps<CapsLockSlamConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-caps-lock-slam',
  title: 'Caps Lock Slam',
  description:
    'Word starts lowercase then each letter individually "gets hit" by the Caps Lock key and snaps to uppercase with a pop. Letters lock left to right during hold. A CAPS LOCK LED appears when all are locked. Exit releases the lock.',
  tags: ['kinetic', 'typography', 'caps', 'uppercase', 'case', 'slam', 'per-letter', 'stagger', 'craft'],
  category: 'captions',
  component: CapsLockSlamComponent as any,
  defaultConfig: {
    words: ['loud', 'type', 'bold', 'case'],
    colors: ['#1a1a1a', '#cc2200', '#1a1a1a', '#cc2200'],
    bgColor: '#f5f2ec',
    cycleDuration: 2.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['loud', 'type', 'bold', 'case'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#cc2200', '#1a1a1a', '#cc2200'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f5f2ec', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.2, min: 1.2, max: 5, group: 'Timing' },
  ],
})
