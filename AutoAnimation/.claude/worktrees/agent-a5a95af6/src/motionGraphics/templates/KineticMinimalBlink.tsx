import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalBlinkConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    exitProgress,
    phase,
  }: WordRenderProps) => {
    const chars = word.split('')
    const n = chars.length

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {chars.map((char, i) => {
          const delay = i / n

          // Each character flashes in with a brief high-intensity blink then settles
          let charP = 0
          if (phase === 'enter') {
            charP = Math.max(0, Math.min(1, (enterProgress - delay * 0.6) / 0.4))
          } else if (phase === 'hold') {
            charP = 1
          } else {
            // Exit: blink out from right to left
            const reverseDelay = (n - 1 - i) / n
            charP = 1 - Math.max(0, Math.min(1, (exitProgress - reverseDelay * 0.6) / 0.4))
          }

          // The blink flash: at charP ~0 to ~0.3 it flickers between 0 and 1,
          // then locks solid for the rest. We simulate 2 fast blinks via a triangle wave.
          let opacity = 0
          let scaleVal = 1

          if (charP < 0.25) {
            // Two quick flashes: triangle wave over [0, 0.25]
            const t = charP / 0.25 // 0..1
            const flash = Math.abs(Math.sin(t * Math.PI * 2))
            opacity = flash
            scaleVal = 1 + flash * 0.15
          } else {
            // Settled: ease from flash brightness to 1
            const t = (charP - 0.25) / 0.75
            const eased = 1 - Math.pow(1 - t, 2)
            opacity = eased
            scaleVal = 1 + (1 - eased) * 0.05
          }

          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
                fontSize: 'clamp(36px, 8vw, 120px)',
                fontWeight: 700,
                letterSpacing: '0.04em',
                color,
                opacity,
                transform: `scale(${scaleVal})`,
                transformOrigin: 'center center',
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          )
        })}
      </div>
    )
  },
}

function MinimalBlinkComponent(props: MotionGraphicProps<MinimalBlinkConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-blink',
  title: 'Minimal Blink',
  description:
    'Each letter flashes in with two rapid blinks then holds steady — characters appear sequentially left to right with a staggered flash-on effect.',
  tags: ['kinetic', 'minimal', 'blink', 'flash', 'stagger', 'appear', 'sequence', 'character'],
  category: 'captions',
  component: MinimalBlinkComponent as any,
  defaultConfig: {
    words: ['FLASH', 'BLINK', 'SPARK', 'LIGHT'],
    colors: ['#111111', '#222222', '#333333', '#111111'],
    bgColor: '#ffffff',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['FLASH', 'BLINK', 'SPARK', 'LIGHT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#111111', '#222222', '#333333', '#111111'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
