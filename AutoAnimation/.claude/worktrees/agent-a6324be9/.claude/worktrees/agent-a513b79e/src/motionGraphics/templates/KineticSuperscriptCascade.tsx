import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SuperscriptCascadeConfig extends KineticBaseConfig {}

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
 * Superscript Cascade — each letter rises into superscript position
 * (higher, smaller) in a left-to-right cascade, then drops back to the
 * baseline in reverse order. During hold, letters oscillate between
 * full baseline and superscript in a ripple pattern. The effect
 * demonstrates baseline and vertical positioning as primary animation.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Baseline indicator */}
      <div
        style={{
          position: 'absolute',
          left: '6%',
          right: '6%',
          top: '50%',
          height: 1,
          background: 'rgba(255,255,255,0.05)',
          transform: 'translateY(20px)',
        }}
      />
      {/* Superscript line */}
      <div
        style={{
          position: 'absolute',
          left: '6%',
          right: '6%',
          top: '50%',
          height: 1,
          background: 'rgba(255,255,255,0.04)',
          transform: 'translateY(-48px)',
          borderTop: '1px dashed rgba(255,255,255,0.04)',
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
    const fontSize = Math.min(width * 0.14, height * 0.17, 120)
    const charSpacing = fontSize * 0.63
    const totalW = n * charSpacing
    const startX = (width - totalW) / 2
    const baseY = height / 2

    // Superscript offset: rise up by ~65% font size, shrink to ~65% size
    const superRise = -fontSize * 0.65
    const superShrink = 0.65

    const els: React.ReactNode[] = []

    for (let i = 0; i < n; i++) {
      const x = startX + i * charSpacing
      const pos = n > 1 ? i / (n - 1) : 0.5 // 0..1 left to right

      let translateY: number
      let scale: number
      let opacity: number
      let fontWeight: number

      if (phase === 'enter') {
        // Left-to-right cascade: each letter appears at superscript first
        // then drops to baseline with elastic bounce
        const charDelay = pos * 0.5
        const charT = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay)))
        // charT 0→0.3: letter at superscript position
        // charT 0.3→1.0: drops to baseline with elastic
        if (charT < 0.3) {
          const t = charT / 0.3
          translateY = superRise
          scale = superShrink * (0.5 + t * 0.5)
          opacity = t * t
          fontWeight = 300
        } else {
          const t = easeOutElastic((charT - 0.3) / 0.7)
          translateY = superRise * (1 - t)
          scale = superShrink + (1 - superShrink) * t
          opacity = 1
          fontWeight = Math.round(300 + t * 400)
        }
      } else if (phase === 'hold') {
        // Rolling superscript wave: each letter takes turns rising up
        // Wave speed: complete one pass in the hold duration
        const wavePhase = holdProgress * 1.2 - pos * 0.8
        const waveClamped = Math.max(0, Math.sin(wavePhase * Math.PI * 2))
        // Rise = waveClamped, normal = 1 - waveClamped
        translateY = superRise * waveClamped
        scale = 1 - (1 - superShrink) * waveClamped
        opacity = 1
        fontWeight = Math.round(700 - waveClamped * 300)
      } else {
        // Exit: letters rise to superscript in reverse (right-to-left) and fade
        const reversePos = 1 - pos
        const charDelay = reversePos * 0.4
        const charT = Math.max(0, Math.min(1, (exitProgress - charDelay) / (1 - charDelay + 0.01)))
        const eased = easeInOutCubic(charT)
        translateY = superRise * eased
        scale = 1 - (1 - superShrink) * eased
        opacity = 1 - charT
        fontWeight = Math.round(700 - eased * 400)
      }

      els.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: baseY,
            transform: `translateY(calc(-50% + ${translateY}px)) scale(${scale})`,
            fontFamily: "'Playfair Display', 'Georgia', serif",
            fontSize,
            fontWeight,
            color,
            opacity,
            lineHeight: 1,
            userSelect: 'none',
            whiteSpace: 'nowrap',
            transformOrigin: '50% 100%', // scale from bottom baseline
          }}
        >
          {letters[i]}
        </div>
      )
    }

    // Superscript label
    const labelOpacity = phase === 'hold' ? 0.2 : 0

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {els}
        <div
          style={{
            position: 'absolute',
            right: '6%',
            top: '50%',
            transform: `translateY(${-fontSize * 0.65 - 16}px)`,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            color,
            opacity: labelOpacity,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          superscript
        </div>
      </div>
    )
  },
}

function SuperscriptCascadeComponent(props: MotionGraphicProps<SuperscriptCascadeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-superscript-cascade',
  title: 'Superscript Cascade',
  description:
    'Letters cascade left-to-right into superscript position (smaller, raised), then drop to the baseline with elastic bounce. During hold, a rolling wave lifts each letter into superscript in sequence.',
  tags: ['kinetic', 'typography', 'baseline', 'superscript', 'cascade', 'vertical', 'per-letter', 'serif', 'craft'],
  category: 'captions',
  component: SuperscriptCascadeComponent as any,
  defaultConfig: {
    words: ['RISE', 'FLOAT', 'ASCEND', 'SUPER'],
    colors: ['#ffd700', '#b8860b', '#ffd700', '#daa520'],
    bgColor: '#0a0800',
    cycleDuration: 2.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RISE', 'FLOAT', 'ASCEND', 'SUPER'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffd700', '#b8860b', '#ffd700', '#daa520'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0800', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.2, min: 1.2, max: 6, group: 'Timing' },
  ],
})
