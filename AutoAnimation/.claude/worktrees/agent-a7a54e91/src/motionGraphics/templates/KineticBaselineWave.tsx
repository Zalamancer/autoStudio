import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BaselineWaveConfig extends KineticBaseConfig {
  waveAmplitude: number
  waveFrequency: number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

function easeInQuad(t: number): number {
  return t * t
}

/**
 * Baseline Wave — a continuous sine wave rolls along the letter baselines.
 * On enter, letters arrive from below with staggered bounce to join the wave.
 * During hold the wave propagates across the word at a steady cadence.
 * On exit, the wave amplitude spikes then collapses to flatline.
 * This is pure baseline manipulation — no position/opacity tricks.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Baseline rule */}
      <div
        style={{
          position: 'absolute',
          left: '6%',
          right: '6%',
          top: '50%',
          height: 1,
          background: 'rgba(255,255,255,0.06)',
          transform: 'translateY(28px)',
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

    const waveAmplitude = height * 0.07 // ~7% height
    const waveFrequency = 2.0 // cycles per word

    const els: React.ReactNode[] = []

    for (let i = 0; i < n; i++) {
      const x = startX + i * charSpacing
      // Normalized position along the word (0..1)
      const pos = n > 1 ? i / (n - 1) : 0.5

      let waveY: number
      let opacity: number
      let fontSize2: number = fontSize
      let fontWeight: number = 700

      if (phase === 'enter') {
        // Staggered: each letter joins the wave from below
        const charDelay = pos * 0.45
        const charT = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay)))
        const eased = easeOutBack(charT)

        // Start far below, spring up to current wave position
        const targetWave = Math.sin((pos * waveFrequency * Math.PI * 2) + holdProgress * Math.PI * 2) * waveAmplitude
        waveY = targetWave + (1 - eased) * fontSize * 1.2 // arrive from below
        opacity = charT > 0 ? Math.min(1, charT * 3) : 0
        fontSize2 = fontSize * (0.6 + eased * 0.4)
      } else if (phase === 'hold') {
        // Continuous wave rolling rightward
        const wavePhase = (pos * waveFrequency - holdProgress * 1.5) * Math.PI * 2
        waveY = Math.sin(wavePhase) * waveAmplitude
        opacity = 1
      } else {
        // Exit: wave amplitude spikes then collapses
        const t = easeInQuad(exitProgress)
        const amplitudeScale = exitProgress < 0.4
          ? 1 + exitProgress / 0.4 * 0.6  // spike up to 1.6x
          : (1 + 0.6) * (1 - (exitProgress - 0.4) / 0.6) // collapse
        const wavePhase = (pos * waveFrequency - 0.5) * Math.PI * 2
        waveY = Math.sin(wavePhase) * waveAmplitude * amplitudeScale
        opacity = 1 - exitProgress * exitProgress
      }

      // Scale up/down slightly based on wave position (high = slightly larger)
      const scaleFactor = 1 + ((-waveY) / (waveAmplitude * 2)) * 0.06

      els.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: baseY + waveY,
            transform: `translateY(-50%) scale(${scaleFactor})`,
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize: fontSize2,
            fontWeight,
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

    return <div style={{ position: 'absolute', inset: 0 }}>{els}</div>
  },
}

function BaselineWaveComponent(props: MotionGraphicProps<BaselineWaveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-baseline-wave',
  title: 'Baseline Wave',
  description:
    'A continuous sine wave rolls along the letter baselines. Letters arrive from below with staggered bounce to join the wave on enter. During hold the wave propagates steadily. Exit spikes then flatlines the amplitude.',
  tags: ['kinetic', 'typography', 'baseline', 'wave', 'sine', 'per-letter', 'stagger', 'craft'],
  category: 'captions',
  component: BaselineWaveComponent as any,
  defaultConfig: {
    words: ['WAVE', 'SINE', 'FLOW', 'ROLL'],
    colors: ['#00d4ff', '#0099bb', '#00d4ff', '#006688'],
    bgColor: '#001a22',
    cycleDuration: 2.0,
    waveAmplitude: 40,
    waveFrequency: 2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WAVE', 'SINE', 'FLOW', 'ROLL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00d4ff', '#0099bb', '#00d4ff', '#006688'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#001a22', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 1.0, max: 5, group: 'Timing' },
    { key: 'waveAmplitude', label: 'Wave Height (px)', type: 'number', defaultValue: 40, min: 10, max: 100, group: 'Animation' },
    { key: 'waveFrequency', label: 'Wave Frequency', type: 'number', defaultValue: 2, min: 1, max: 4, group: 'Animation' },
  ],
})
