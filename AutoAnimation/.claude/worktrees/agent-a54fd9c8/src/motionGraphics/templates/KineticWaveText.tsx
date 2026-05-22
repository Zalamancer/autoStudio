import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WaveTextConfig extends KineticBaseConfig {
  waveAmplitude: number
  waveSpeed: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const waveColors = ['#06D6A0', '#118AB2', '#073B4C', '#06D6A0', '#118AB2']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    const letters = word.split('')
    const totalLetters = letters.length

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 'clamp(1px, 0.3vw, 4px)',
        }}
      >
        {letters.map((letter, i) => {
          let opacity = 1
          let translateY = 0
          let spreadX = 0
          const phaseOffset = (i / totalLetters) * Math.PI * 2

          if (phase === 'enter') {
            const eased = easeOutCubic(enterProgress)
            opacity = Math.min(1, enterProgress * 3)
            // Wave amplitude grows from 0 to full
            const amplitude = eased * 15
            translateY = Math.sin(enterProgress * Math.PI * 4 + phaseOffset) * amplitude
          } else if (phase === 'hold') {
            opacity = 1
            // Continuous wave
            const amplitude = 15
            translateY = Math.sin(holdProgress * Math.PI * 8 + phaseOffset) * amplitude
          } else {
            const eased = easeInCubic(exitProgress)
            opacity = 1 - eased
            // Wave shrinks, letters spread apart
            const amplitude = (1 - eased) * 15
            translateY = Math.sin(exitProgress * Math.PI * 4 + phaseOffset) * amplitude
            spreadX = eased * (i - totalLetters / 2) * 12
          }

          const letterColor = waveColors[i % waveColors.length]

          return (
            <div
              key={i}
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
                fontSize: 'clamp(40px, 12vw, 160px)',
                fontWeight: 800,
                color: letterColor,
                transform: `translate(${spreadX}px, ${translateY}px)`,
                opacity,
                whiteSpace: 'nowrap',
                display: 'inline-block',
                textShadow: `0 0 15px ${letterColor}44`,
              }}
            >
              {letter}
            </div>
          )
        })}
      </div>
    )
  },
}

function WaveTextComponent(props: MotionGraphicProps<WaveTextConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-wave-text',
  title: 'Kinetic Wave Text',
  description: 'Per-letter sine wave oscillation with staggered phases — wave builds in, flows, then disperses',
  tags: ['kinetic', 'typography', 'wave', 'oscillation', 'per-letter'],
  category: 'captions',
  component: WaveTextComponent as any,
  defaultConfig: {
    words: ['WAVE', 'FLOW', 'DRIFT', 'RISE'],
    colors: ['#06D6A0', '#118AB2', '#073B4C', '#06D6A0'],
    bgColor: '#0A0E17',
    cycleDuration: 1.2,
    waveAmplitude: 15,
    waveSpeed: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WAVE', 'FLOW', 'DRIFT', 'RISE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#06D6A0', '#118AB2', '#073B4C'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0E17', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
    { key: 'waveAmplitude', label: 'Wave Amplitude', type: 'number', defaultValue: 15, min: 5, max: 50, group: 'Animation' },
    { key: 'waveSpeed', label: 'Wave Speed', type: 'number', defaultValue: 1, min: 0.2, max: 3, group: 'Animation' },
  ],
})
