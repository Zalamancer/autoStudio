import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalWaveConfig extends KineticBaseConfig {}

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
          const delay = i / chars.length

          let charP = 0
          if (phase === 'enter') {
            charP = Math.max(0, Math.min(1, (enterProgress - delay * 0.6) / 0.4))
          } else if (phase === 'hold') {
            charP = 1
          } else {
            charP = 1 - Math.max(0, Math.min(1, (exitProgress - delay * 0.6) / 0.4))
          }

          // Sine wave offset: each char has a unique phase offset based on index
          const waveOffset = Math.sin((i / Math.max(chars.length - 1, 1)) * Math.PI * 2) * 18
          // During enter/exit, the wave Y is offset by (1 - charP) * amplitude; settled = pure sine
          const translateY = waveOffset * charP + (1 - charP) * 40
          const opacity = charP

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
                transform: `translateY(${translateY}px)`,
                transition: 'none',
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

function MinimalWaveComponent(props: MotionGraphicProps<MinimalWaveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-wave',
  title: 'Minimal Wave',
  description:
    'Characters enter with staggered timing and settle into a sine-wave vertical offset pattern. Clean, rhythmic motion.',
  tags: ['kinetic', 'minimal', 'wave', 'stagger', 'character', 'sine', 'sequence'],
  category: 'captions',
  component: MinimalWaveComponent as any,
  defaultConfig: {
    words: ['WAVE', 'FLOW', 'DRIFT', 'PULSE'],
    colors: ['#111111', '#222222', '#333333', '#111111'],
    bgColor: '#ffffff',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['WAVE', 'FLOW', 'DRIFT', 'PULSE'],
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
