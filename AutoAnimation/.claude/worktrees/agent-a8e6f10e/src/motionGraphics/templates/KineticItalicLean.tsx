import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ItalicLeanConfig extends KineticBaseConfig {
  maxSkew: number
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

/**
 * Italic Lean-In — the word starts upright (roman), then leans progressively
 * into an italic/oblique angle as if being blown by wind or accelerating.
 * On enter, word slides up from below upright. During hold, the skew
 * increases from 0° to -15° (italic lean) then returns to upright — like the
 * word is taking a running start, leaning in, then straightening. Per-letter
 * stagger makes the lean wave across from left to right.
 * Exit: skew snaps to maximum lean then the word slides out right.
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
    const fontSize = Math.min(width * 0.14, height * 0.18, 130)
    const charSpacing = fontSize * 0.64
    const totalW = n * charSpacing
    const startX = width / 2 - totalW / 2

    // Max skew in degrees (-15 = italic lean)
    const maxSkewDeg = -14

    const els: React.ReactNode[] = []

    for (let i = 0; i < n; i++) {
      const pos = n > 1 ? i / (n - 1) : 0.5
      // Stagger: rightmost letters lean later
      const stagger = pos * 0.3

      let skewDeg: number
      let opacity: number
      let translateY: number = 0
      let scale: number = 1

      if (phase === 'enter') {
        // Rise from below, no skew yet
        const t = easeOutBack(Math.min(1, (enterProgress - stagger * 0.5) / (1 - stagger * 0.5) * 1.1))
        translateY = (1 - Math.max(0, t)) * fontSize * 1.4
        opacity = Math.min(1, (enterProgress - stagger * 0.3) / 0.4)
        skewDeg = 0
      } else if (phase === 'hold') {
        // Lean wave: 0 → maxSkew → 0 with per-letter stagger
        const leanT = (holdProgress + stagger) % 1
        const leanPhase = leanT < 0.5
          ? easeInOutCubic(leanT * 2)
          : 1 - easeInOutCubic((leanT - 0.5) * 2)
        skewDeg = maxSkewDeg * leanPhase
        opacity = 1
        // Slight forward lean scale: letters compress slightly when leaned
        scale = 1 - Math.abs(skewDeg / maxSkewDeg) * 0.03
      } else {
        // Exit: full lean then slide right
        const leanIn = Math.min(1, exitProgress * 3)
        skewDeg = maxSkewDeg * easeInCubic(leanIn)
        const slide = Math.max(0, (exitProgress - 0.2) / 0.8)
        opacity = 1 - easeInCubic(slide)
      }

      els.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: startX + i * charSpacing,
            top: '50%',
            transform: `translateY(calc(-50% + ${translateY}px)) skewX(${skewDeg}deg) scale(${scale})`,
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize,
            fontWeight: 600,
            color,
            opacity,
            lineHeight: 1,
            userSelect: 'none',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
          }}
        >
          {letters[i]}
        </div>
      )
    }

    return <div style={{ position: 'absolute', inset: 0 }}>{els}</div>
  },
}

function ItalicLeanComponent(props: MotionGraphicProps<ItalicLeanConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-italic-lean',
  title: 'Italic Lean-In',
  description:
    'Letters start upright then lean progressively into an italic/oblique angle, creating a wave of skew that travels left to right. The lean implies speed, urgency, or wind — pure CSS skew as typographic expression.',
  tags: ['kinetic', 'typography', 'italic', 'skew', 'lean', 'case', 'per-letter', 'wave', 'craft'],
  category: 'captions',
  component: ItalicLeanComponent as any,
  defaultConfig: {
    words: ['LEAN', 'FAST', 'BOLD', 'RUSH'],
    colors: ['#ffffff', '#ff6600', '#ffffff', '#ff6600'],
    bgColor: '#0d0d0d',
    cycleDuration: 2.0,
    maxSkew: 14,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LEAN', 'FAST', 'BOLD', 'RUSH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#ff6600', '#ffffff', '#ff6600'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d0d', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 1.0, max: 5, group: 'Timing' },
    { key: 'maxSkew', label: 'Max Lean Angle (°)', type: 'number', defaultValue: 14, min: 5, max: 30, group: 'Animation' },
  ],
})
