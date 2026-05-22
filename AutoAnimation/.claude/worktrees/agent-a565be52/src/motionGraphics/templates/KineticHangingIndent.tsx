import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HangingIndentConfig extends KineticBaseConfig {}

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  const c4 = (2 * Math.PI) / 3
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

/**
 * Hanging Indent Swing — the word enters from the left with exaggerated
 * hanging indent: the first letter "hangs" far to the left while the rest
 * align to a normal indent. On enter, the hanging portion swings in from
 * off-screen and elastically settles. The text demonstrates the typographic
 * concept of hanging punctuation/indent as kinetic motion.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Left margin guide */}
      <div
        style={{
          position: 'absolute',
          left: '15%',
          top: '25%',
          bottom: '25%',
          width: 1,
          background: 'rgba(255,255,255,0.07)',
        }}
      />
      {/* Hanging zone indicator */}
      <div
        style={{
          position: 'absolute',
          left: '5%',
          right: '85%',
          top: '25%',
          bottom: '25%',
          background: 'rgba(255,255,255,0.02)',
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
    index,
    width,
    height,
  }: WordRenderProps) => {
    const letters = word.split('')
    const n = letters.length
    const fontSize = Math.min(width * 0.13, height * 0.16, 110)
    const charSpacing = fontSize * 0.63

    // Indent positions
    const hangX = width * 0.05  // hanging position (far left)
    const indentX = width * 0.15 // normal indent position

    // First letter hangs to the left; rest start at indentX
    // During hold, first letter is at hangX, rest at indentX
    const totalRestW = (n - 1) * charSpacing
    const firstLetterX_hang = hangX
    const firstLetterX_normal = indentX

    const centerY = height / 2

    const els: React.ReactNode[] = []

    for (let i = 0; i < n; i++) {
      let x: number
      let opacity: number
      let fontWeight: number
      let fontSize2: number = fontSize

      if (phase === 'enter') {
        if (i === 0) {
          // First letter swings in from far left with elastic
          const t = easeOutElastic(Math.min(1, enterProgress / 0.8))
          x = -width * 0.3 + (firstLetterX_hang - (-width * 0.3)) * t
          opacity = Math.min(1, enterProgress / 0.2)
          fontWeight = Math.round(300 + easeOutQuart(enterProgress) * 500)
        } else {
          // Rest slide in from off-left with delay
          const delay = 0.15 + (i / n) * 0.25
          const charT = Math.max(0, Math.min(1, (enterProgress - delay) / (1 - delay)))
          const eased = easeOutQuart(charT)
          x = indentX + (i - 1) * charSpacing + (1 - eased) * (-width * 0.1 - indentX)
          opacity = charT * charT
          fontWeight = Math.round(300 + eased * 400)
        }
      } else if (phase === 'hold') {
        if (i === 0) {
          x = firstLetterX_hang
          // Subtle swing: first letter oscillates slightly in the hanging zone
          const swing = Math.sin(holdProgress * Math.PI * 2) * fontSize * 0.04
          x = firstLetterX_hang + swing
          fontWeight = 800
        } else {
          x = indentX + (i - 1) * charSpacing
          fontWeight = 600
        }
        opacity = 1
      } else {
        // Exit: all pull off to the left together
        const t = easeInOutCubic(exitProgress)
        if (i === 0) {
          x = firstLetterX_hang - t * width * 0.5
        } else {
          x = indentX + (i - 1) * charSpacing - t * width * 0.4
        }
        opacity = 1 - exitProgress * exitProgress
        fontWeight = 600
      }

      // First letter is slightly larger
      const charFontSize = i === 0 ? fontSize * 1.15 : fontSize

      els.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: centerY,
            transform: 'translateY(-50%)',
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize: charFontSize,
            fontWeight,
            color: i === 0 ? color : color + 'cc',
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

    // "hanging" label
    const labelOpacity = phase === 'hold' ? Math.min(1, holdProgress * 5) * 0.2 : 0

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {els}
        <div
          style={{
            position: 'absolute',
            left: '5%',
            bottom: '18%',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            color,
            opacity: labelOpacity,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          ←hanging
        </div>
        <div
          style={{
            position: 'absolute',
            left: '16%',
            bottom: '18%',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            color,
            opacity: labelOpacity,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          indent
        </div>
      </div>
    )
  },
}

function HangingIndentComponent(props: MotionGraphicProps<HangingIndentConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-hanging-indent',
  title: 'Hanging Indent Swing',
  description:
    'The first letter hangs outside the left margin in typographic "hanging indent" position, swinging in with elastic bounce while the remaining letters align to the indent. Demonstrates hanging punctuation/indent as kinetic motion.',
  tags: ['kinetic', 'typography', 'hanging-indent', 'baseline', 'layout', 'swing', 'elastic', 'craft'],
  category: 'captions',
  component: HangingIndentComponent as any,
  defaultConfig: {
    words: ['HANGING', 'INDENT', 'LAYOUT', 'MARGIN'],
    colors: ['#ffffff', '#dddddd', '#ffffff', '#cccccc'],
    bgColor: '#111118',
    cycleDuration: 2.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HANGING', 'INDENT', 'LAYOUT', 'MARGIN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#dddddd', '#ffffff', '#cccccc'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111118', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.2, min: 1.0, max: 6, group: 'Timing' },
  ],
})
