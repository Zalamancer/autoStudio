import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EqualizerBarsConfig extends KineticBaseConfig {
  barCount: number
  barColor: string
  barGlow: string
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const barCount = 32
    const barWidth = width / (barCount * 1.6)
    const gap = barWidth * 0.6

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '100%',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: gap,
            padding: '0 2%',
          }}
        >
          {Array.from({ length: barCount }).map((_, i) => {
            const freq = 0.8 + (i % 7) * 0.4
            const phase = i * 0.7
            const rawHeight =
              0.3 +
              0.25 * Math.sin(time * freq * 2 * Math.PI + phase) +
              0.15 * Math.sin(time * freq * 1.3 * Math.PI + phase * 0.5) +
              0.1 * Math.cos(time * freq * 3.1 * Math.PI + phase * 1.8)
            const barHeight = Math.max(0.05, Math.min(1, rawHeight))

            const hue = 160 + (i / barCount) * 200
            const color = `hsl(${hue}, 100%, 60%)`
            const glow = `hsl(${hue}, 100%, 50%)`

            return (
              <div
                key={i}
                style={{
                  width: barWidth,
                  height: `${barHeight * 85}%`,
                  background: `linear-gradient(to top, ${color}, ${glow})`,
                  borderRadius: '3px 3px 0 0',
                  boxShadow: `0 0 8px ${glow}60, 0 0 20px ${glow}30`,
                  transition: 'height 0.05s ease',
                }}
              />
            )
          })}
        </div>
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    exitProgress,
    phase,
  }: WordRenderProps) => {
    let opacity = 1
    let scale = 1

    if (phase === 'enter') {
      opacity = enterProgress
      scale = 0.8 + 0.2 * enterProgress
    } else if (phase === 'exit') {
      opacity = 1 - exitProgress
      scale = 1 - 0.2 * exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          fontSize: 'clamp(40px, 10vw, 140px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          textShadow: `0 0 30px ${color}80, 0 0 60px ${color}40, 0 4px 20px rgba(0,0,0,0.8)`,
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function EqualizerBarsComponent(props: MotionGraphicProps<EqualizerBarsConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-equalizer-bars',
  title: 'Kinetic Equalizer Bars',
  description:
    'Animated equalizer bars bouncing at different frequencies behind text. Neon colors on dark background for a music visualizer feel.',
  tags: ['kinetic', 'music', 'equalizer', 'audio', 'neon', 'visualizer', 'bars'],
  category: 'captions',
  component: EqualizerBarsComponent as any,
  defaultConfig: {
    words: ['FEEL', 'THE', 'BEAT', 'DROP'],
    colors: ['#00FF88', '#00DDFF', '#FF00FF', '#FFFF00'],
    bgColor: '#0A0A12',
    cycleDuration: 1.2,
    barCount: 32,
    barColor: '#00FF88',
    barGlow: '#00FF88',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['FEEL', 'THE', 'BEAT', 'DROP'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#00FF88', '#00DDFF', '#FF00FF', '#FFFF00'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A12', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.2,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
