import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalPingPongConfig extends KineticBaseConfig {}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, holdProgress, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 1
    let translateX = 0

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 3)
    } else if (phase === 'hold') {
      // During hold, text gently oscillates left↔right like a ping-pong pendulum
      const oscillation = Math.sin(holdProgress * Math.PI * 2) // one full cycle
      const eased = easeInOutSine(Math.abs(oscillation))
      translateX = Math.sign(oscillation) * eased * 16
      opacity = 1
    } else {
      opacity = 1 - exitProgress * exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${translateX.toFixed(2)}px)`,
          opacity,
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(36px, 8vw, 120px)',
          fontWeight: 300,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function MinimalPingPongComponent(props: MotionGraphicProps<MinimalPingPongConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-ping-pong',
  title: 'Minimal Ping Pong',
  description: 'Word gently swings left and right during its hold — a living, rhythmic oscillation on a single axis. Nothing else moves.',
  tags: ['kinetic', 'typography', 'minimal', 'ping-pong', 'oscillate', 'swing', 'rhythm', 'pendulum'],
  category: 'captions',
  component: MinimalPingPongComponent as any,
  defaultConfig: {
    words: ['SWING', 'SWAY', 'ROCK', 'SHIFT'],
    colors: ['#1A1A1A', '#222222', '#1A1A1A', '#333333'],
    bgColor: '#FFFFFF',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SWING', 'SWAY', 'ROCK', 'SHIFT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1A1A1A', '#222222', '#1A1A1A', '#333333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.8, max: 6, group: 'Timing' },
  ],
})
