import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WeightBreatheConfig extends KineticBaseConfig {
  minWeight: number
  maxWeight: number
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

/**
 * Weight Breathe — font-weight pulses from ultralight to heavy and back,
 * as if the type itself is breathing. Each letter is staggered slightly
 * so the weight wave rolls across the word. Uses font-variation-settings
 * where supported, with fontWeight fallback.
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
    const fontSize = Math.min(width * 0.16, height * 0.2, 140)
    const charSpacing = fontSize * 0.65
    const totalW = letters.length * charSpacing
    const startX = (width - totalW) / 2

    const minWeight = 100
    const maxWeight = 900

    const els: React.ReactNode[] = []

    for (let i = 0; i < letters.length; i++) {
      const x = startX + i * charSpacing
      // Stagger: each letter's breathing cycle is offset by its position
      const staggerOffset = (i / Math.max(letters.length - 1, 1)) * 0.3

      let weight: number
      let opacity: number
      let scaleY: number = 1

      if (phase === 'enter') {
        // Enter: weight builds from min to max with stagger
        const charT = Math.max(0, Math.min(1, (enterProgress - staggerOffset * 0.5) / (1 - staggerOffset * 0.5)))
        const eased = easeOutQuart(charT)
        weight = Math.round(minWeight + eased * (maxWeight - minWeight))
        opacity = charT > 0 ? 0.2 + charT * 0.8 : 0
        // Slight vertical squash as weight increases (heavier = slightly wider/shorter)
        scaleY = 1 - (eased * 0.06)
      } else if (phase === 'hold') {
        // Hold: continuous breathing — weight oscillates between min and max
        // Each letter offset creates a wave
        const breathePhase = (holdProgress + staggerOffset) % 1
        const breathe = easeInOutSine(breathePhase)
        weight = Math.round(minWeight + breathe * (maxWeight - minWeight))
        opacity = 1
        scaleY = 1 - (breathe * 0.05)
      } else {
        // Exit: weight collapses back to min
        const charT = Math.max(0, Math.min(1, (exitProgress - staggerOffset * 0.3) / (1 - staggerOffset * 0.3)))
        const eased = easeInQuart(charT)
        weight = Math.round(maxWeight - eased * (maxWeight - minWeight))
        opacity = 1 - charT * charT
        scaleY = 1 - (eased * 0.06)
      }

      // Clamp weight to valid range
      const clampedWeight = Math.max(100, Math.min(900, weight))

      els.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: '50%',
            transform: `translateY(-50%) scaleY(${scaleY})`,
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize,
            fontWeight: clampedWeight,
            // font-variation-settings for variable fonts
            fontVariationSettings: `"wght" ${clampedWeight}`,
            color,
            opacity,
            lineHeight: 1,
            userSelect: 'none',
            whiteSpace: 'nowrap',
            letterSpacing: '0.01em',
          }}
        >
          {letters[i]}
        </div>
      )
    }

    // Weight readout label during hold
    const centerWeight = (() => {
      const breathePhase = (holdProgress + 0.15) % 1
      return Math.round(minWeight + easeInOutSine(breathePhase) * (maxWeight - minWeight))
    })()
    const labelOpacity = phase === 'hold' ? 0.2 + Math.sin(holdProgress * Math.PI) * 0.15 : 0

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {els}
        <div
          style={{
            position: 'absolute',
            right: '5%',
            bottom: '15%',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            color,
            opacity: labelOpacity,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          wght {centerWeight}
        </div>
      </div>
    )
  },
}

function WeightBreatheComponent(props: MotionGraphicProps<WeightBreatheConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-weight-breathe',
  title: 'Weight Breathe',
  description:
    'Font-weight pulses from ultralight (100) to black (900) across the word in a continuous breathing wave. Each letter is staggered so weight rolls like a tide. Uses font-variation-settings for variable font support.',
  tags: ['kinetic', 'typography', 'variable-font', 'font-weight', 'breathe', 'wave', 'stagger', 'craft'],
  category: 'captions',
  component: WeightBreatheComponent as any,
  defaultConfig: {
    words: ['BREATHE', 'PULSE', 'HEAVY', 'LIGHT'],
    colors: ['#1a1a1a', '#333', '#1a1a1a', '#444'],
    bgColor: '#f5f5f0',
    cycleDuration: 2.5,
    minWeight: 100,
    maxWeight: 900,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BREATHE', 'PULSE', 'HEAVY', 'LIGHT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#333', '#1a1a1a', '#444'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f5f5f0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.5, min: 1.0, max: 6, group: 'Timing' },
    { key: 'minWeight', label: 'Min Weight', type: 'number', defaultValue: 100, min: 100, max: 400, group: 'Animation' },
    { key: 'maxWeight', label: 'Max Weight', type: 'number', defaultValue: 900, min: 500, max: 900, group: 'Animation' },
  ],
})
