import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HairlineWhisperConfig extends KineticBaseConfig {}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

/**
 * Hairline Whisper — the word materializes at the absolute thinnest weight (100),
 * almost invisible, like a whisper or ghost. During hold, the weight barely
 * undulates — a barely-perceptible breath from 100 to 200 and back. Very
 * large type size compensates: what feels delicate at 100pt is still legible.
 * Exit: weight fades to invisible without weight change. The effect is elegance
 * through restraint — maximum font size, minimum weight.
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
    // Extra large — hairline weight at large size is the whole aesthetic
    const fontSize = Math.min(width * 0.18, height * 0.22, 160)

    let fontWeight: number
    let opacity: number
    let letterSpacing: string

    if (phase === 'enter') {
      // Dissolve in from invisible — no movement, just opacity
      const t = easeOutCubic(enterProgress)
      fontWeight = 100
      opacity = t * 0.92 // never fully 1 — stays slightly translucent
      letterSpacing = `${0.06 + (1 - t) * 0.15}em` // starts wide, settles to fine
    } else if (phase === 'hold') {
      // Weight barely breathes 100 → 180 → 100
      const breathe = easeInOutSine(
        holdProgress < 0.5 ? holdProgress * 2 : 2 - holdProgress * 2
      )
      fontWeight = Math.round(100 + breathe * 80)
      opacity = 0.88 + breathe * 0.08 // 0.88 → 0.96 — always slightly spectral
      letterSpacing = '0.06em'
    } else {
      // Exit: simple fade, no weight change
      fontWeight = 100
      opacity = (1 - easeInQuart(exitProgress)) * 0.9
      letterSpacing = '0.06em'
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
        }}
      >
        <div
          style={{
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize,
            fontWeight,
            fontVariationSettings: `"wght" ${fontWeight}`,
            letterSpacing,
            textTransform: 'uppercase',
            color,
            whiteSpace: 'nowrap',
            lineHeight: 0.9,
            userSelect: 'none',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function HairlineWhisperComponent(props: MotionGraphicProps<HairlineWhisperConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-hairline-whisper',
  title: 'Hairline Whisper',
  description:
    'Type appears at absolute minimum weight (100 Hairline) — large, quiet, and barely there. A gentle undulation from 100 to 180 and back breathes life into it. Elegance through restraint: maximum size, minimum weight.',
  tags: ['kinetic', 'typography', 'font-weight', 'hairline', 'thin', 'whisper', 'minimal', 'elegant', 'craft'],
  category: 'captions',
  component: HairlineWhisperComponent as any,
  defaultConfig: {
    words: ['QUIET', 'THIN', 'SOFT', 'STILL'],
    colors: ['#1a1a1a', '#2a2a2a', '#1a1a1a', '#2a2a2a'],
    bgColor: '#f5f3f0',
    cycleDuration: 3.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['QUIET', 'THIN', 'SOFT', 'STILL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#2a2a2a', '#1a1a1a', '#2a2a2a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f5f3f0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 3.0, min: 1.5, max: 6, group: 'Timing' },
  ],
})
