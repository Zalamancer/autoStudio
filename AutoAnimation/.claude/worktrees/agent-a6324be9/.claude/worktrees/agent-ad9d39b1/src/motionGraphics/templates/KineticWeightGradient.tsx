import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WeightGradientConfig extends KineticBaseConfig {
  waveSpeed: number
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInQuad(t: number): number {
  return t * t
}

/**
 * Weight Gradient Wave — a smooth weight gradient sweeps across the letters
 * like a shaft of light: letters on the leading edge reach 900 (Black) while
 * trailing letters sit at 100 (Thin). The gradient band travels left to right
 * continuously. This creates a rolling, typographic spotlight effect. No color
 * change — only weight varies. The letterform itself becomes a waveform.
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
    const fontSize = Math.min(width * 0.14, height * 0.17, 122)
    const charSpacing = fontSize * 0.62
    const totalW = n * charSpacing
    const startX = width / 2 - totalW / 2

    // Weight gradient: Gaussian bell centered at wave position
    const waveWidth = 0.5 // fraction of word width the peak covers

    const els: React.ReactNode[] = []

    for (let i = 0; i < n; i++) {
      const pos = n > 1 ? i / (n - 1) : 0.5 // 0..1 along word

      let weight: number
      let opacity: number

      if (phase === 'enter') {
        // Wipe in from left — weight at 100 until reveal passes
        const revealFront = easeOutCubic(enterProgress) * 1.2
        const charVisible = revealFront - pos
        if (charVisible < 0) {
          weight = 100
          opacity = 0
        } else {
          const t = Math.min(1, charVisible / 0.3)
          weight = Math.round(100 + t * 500)
          opacity = t
        }
      } else if (phase === 'hold') {
        // Wave travels from left to right, repeating
        // waveCenter goes 0 → 1 during hold
        const waveCenter = (holdProgress * 1.4 - 0.2) % 1.2 - 0.1
        const dist = Math.abs(pos - waveCenter)
        const normalizedDist = dist / waveWidth
        // Gaussian: e^(-dist^2 * 4)
        const peakness = Math.exp(-normalizedDist * normalizedDist * 3.5)
        weight = Math.round(100 + peakness * 800) // 100 → 900 at peak
        opacity = 1
      } else {
        // Exit: wave sweeps off right edge and dims
        const t = easeInQuad(exitProgress)
        const waveCenter = 0.8 + t * 0.8
        const dist = Math.abs(pos - waveCenter)
        const peakness = Math.exp(-(dist / waveWidth) * (dist / waveWidth) * 3.5)
        weight = Math.round(100 + peakness * 500)
        opacity = 1 - t
      }

      const clamped = Math.max(100, Math.min(900, weight))

      els.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: startX + i * charSpacing,
            top: '50%',
            transform: 'translateY(-50%)',
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize,
            fontWeight: clamped,
            fontVariationSettings: `"wght" ${clamped}`,
            color,
            opacity,
            lineHeight: 1,
            userSelect: 'none',
            whiteSpace: 'nowrap',
            letterSpacing: 0,
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

function WeightGradientComponent(props: MotionGraphicProps<WeightGradientConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-weight-gradient',
  title: 'Weight Gradient Wave',
  description:
    'A smooth Gaussian weight gradient sweeps across the letters: the leading edge peaks at 900 Black while trailing letters sit at 100 Thin. The rolling spotlight travels left to right, turning letterforms into a waveform.',
  tags: ['kinetic', 'typography', 'font-weight', 'gradient', 'wave', 'per-letter', 'craft', 'variable-font', 'spotlight'],
  category: 'captions',
  component: WeightGradientComponent as any,
  defaultConfig: {
    words: ['WEIGHT', 'SHIFT', 'ROLL', 'WAVE'],
    colors: ['#ffffff', '#cccccc', '#ffffff', '#cccccc'],
    bgColor: '#111111',
    cycleDuration: 2.2,
    waveSpeed: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WEIGHT', 'SHIFT', 'ROLL', 'WAVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#cccccc', '#ffffff', '#cccccc'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111111', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.2, min: 1.0, max: 5, group: 'Timing' },
    { key: 'waveSpeed', label: 'Wave Speed', type: 'number', defaultValue: 1, min: 0.5, max: 3, group: 'Animation' },
  ],
})
