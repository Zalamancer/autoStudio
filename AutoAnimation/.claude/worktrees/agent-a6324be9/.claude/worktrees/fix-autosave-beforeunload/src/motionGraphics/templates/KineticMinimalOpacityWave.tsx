import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalOpacityWaveConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
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
          const charFraction = chars.length > 1 ? i / (chars.length - 1) : 0.5
          let opacity = 1

          if (phase === 'enter') {
            // Opacity wave sweeps left-to-right as word appears
            const waveProgress = Math.max(0, Math.min(1, enterProgress * 1.4 - charFraction * 0.4))
            opacity = easeOutCubic(waveProgress)
          } else if (phase === 'hold') {
            // Subtle standing wave: chars gently pulse with slight phase offset
            const wave = Math.sin(holdProgress * Math.PI * 2 + charFraction * Math.PI)
            opacity = 0.85 + wave * 0.15
          } else {
            // Sweep out right-to-left
            const waveProgress = Math.max(0, Math.min(1, exitProgress * 1.4 - (1 - charFraction) * 0.4))
            opacity = 1 - easeOutCubic(waveProgress)
          }

          return (
            <div
              key={i}
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
                fontSize: 'clamp(36px, 8vw, 120px)',
                fontWeight: 300,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color,
                opacity,
                display: 'inline-block',
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </div>
          )
        })}
      </div>
    )
  },
}

function MinimalOpacityWaveComponent(props: MotionGraphicProps<MinimalOpacityWaveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-opacity-wave',
  title: 'Minimal Opacity Wave',
  description: 'An opacity wave sweeps left-to-right across characters on enter, becomes a living standing wave during hold, sweeps out in reverse — pure rhythmic opacity',
  tags: ['kinetic', 'typography', 'minimal', 'wave', 'opacity', 'characters', 'rhythm', 'stagger'],
  category: 'captions',
  component: MinimalOpacityWaveComponent as any,
  defaultConfig: {
    words: ['WAVE', 'RIPPLE', 'FLOW', 'PULSE'],
    colors: ['#1A1A1A', '#222222', '#1A1A1A', '#333333'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WAVE', 'RIPPLE', 'FLOW', 'PULSE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1A1A1A', '#222222', '#1A1A1A', '#333333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.6, max: 6, group: 'Timing' },
  ],
})
