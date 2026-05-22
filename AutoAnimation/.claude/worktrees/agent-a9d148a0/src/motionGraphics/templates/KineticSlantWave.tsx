import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SlantWaveConfig extends KineticBaseConfig {
  maxSlant: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

/**
 * Slant Wave — each letter's italic angle is animated individually, creating
 * a rolling wave of oblique slant across the word. Uses font-style oblique
 * with CSS skewX transform + font-variation-settings ital/slnt axis.
 * The wave sweeps left-to-right on enter, holds with a gentle oscillation,
 * and reverses on exit.
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
    const fontSize = Math.min(width * 0.15, height * 0.18, 130)
    const charSpacing = fontSize * 0.62
    const totalW = letters.length * charSpacing
    const startX = (width - totalW) / 2

    const maxSlant = 30 // degrees

    const els: React.ReactNode[] = []

    for (let i = 0; i < letters.length; i++) {
      const x = startX + i * charSpacing
      // Wave position: 0 (leftmost) to 1 (rightmost)
      const pos = letters.length > 1 ? i / (letters.length - 1) : 0.5

      let slantDeg: number
      let opacity: number
      let scaleX: number = 1

      if (phase === 'enter') {
        // Wave sweeps left-to-right: letter at pos=0 leads, pos=1 follows
        const waveLeadT = Math.max(0, Math.min(1, (enterProgress - pos * 0.35) / 0.65))
        const eased = easeOutCubic(waveLeadT)
        // Slant: starts at max (leaning forward), snaps to upright at rest
        slantDeg = maxSlant * (1 - eased)
        opacity = waveLeadT > 0 ? 0.2 + waveLeadT * 0.8 : 0
        // Slight horizontal compression as slant is high
        scaleX = 1 - (slantDeg / maxSlant) * 0.1
      } else if (phase === 'hold') {
        // Gentle slant wave oscillates — sinusoidal roll across letters
        const waveT = (holdProgress + pos * 0.5) % 1
        slantDeg = Math.sin(waveT * Math.PI * 2) * 8
        opacity = 1
        scaleX = 1
      } else {
        // Exit: slant cranks up and letters fade
        const charT = Math.max(0, Math.min(1, (exitProgress + (1 - pos) * 0.3) / 1.3))
        const eased = easeInCubic(Math.min(1, charT))
        slantDeg = eased * maxSlant // lean hard then gone
        opacity = 1 - eased * eased
        scaleX = 1 - eased * 0.1
      }

      // Use skewX to simulate italic/oblique — also set font-style for real oblique support
      const skewDeg = -slantDeg // negative skewX = forward lean (italic direction)

      els.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: '50%',
            transform: `translateY(-50%) skewX(${skewDeg}deg) scaleX(${scaleX})`,
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize,
            fontWeight: 700,
            fontStyle: Math.abs(slantDeg) > 5 ? 'italic' : 'normal',
            fontVariationSettings: `"slnt" ${Math.round(-slantDeg)}, "ital" ${Math.abs(slantDeg) > 10 ? 1 : 0}`,
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

    // Slant angle indicator
    const centerSlant = (() => {
      if (phase === 'hold') {
        const waveT = (holdProgress + 0.25) % 1
        return Math.sin(waveT * Math.PI * 2) * 8
      }
      return 0
    })()
    const labelOpacity = phase === 'hold' ? 0.18 : 0

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {els}
        <div
          style={{
            position: 'absolute',
            left: '5%',
            bottom: '15%',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color,
            opacity: labelOpacity,
            letterSpacing: '0.1em',
          }}
        >
          slnt {centerSlant > 0 ? '+' : ''}{Math.round(centerSlant)}°
        </div>
      </div>
    )
  },
}

function SlantWaveComponent(props: MotionGraphicProps<SlantWaveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-slant-wave',
  title: 'Slant Wave',
  description:
    'Each letter\'s italic slant angle is animated individually, creating a rolling wave of oblique lean across the word. Uses skewX + font-variation-settings slnt axis. Snaps upright on enter, oscillates gently during hold.',
  tags: ['kinetic', 'typography', 'variable-font', 'slant', 'italic', 'oblique', 'wave', 'per-letter', 'craft'],
  category: 'captions',
  component: SlantWaveComponent as any,
  defaultConfig: {
    words: ['SLANT', 'LEAN', 'OBLIQUE', 'ITALIC'],
    colors: ['#ff6b35', '#f7c59f', '#ff6b35', '#efefd0'],
    bgColor: '#1a0f0a',
    cycleDuration: 2.0,
    maxSlant: 30,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SLANT', 'LEAN', 'OBLIQUE', 'ITALIC'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ff6b35', '#f7c59f', '#ff6b35', '#efefd0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0f0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 1.0, max: 5, group: 'Timing' },
    { key: 'maxSlant', label: 'Max Slant (deg)', type: 'number', defaultValue: 30, min: 10, max: 45, group: 'Animation' },
  ],
})
