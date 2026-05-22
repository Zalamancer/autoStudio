import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalBreathScaleConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 1
    let scale = 1

    if (phase === 'enter') {
      // Fade in from slightly smaller scale
      const eased = easeOutCubic(enterProgress)
      opacity = eased
      scale = 0.92 + eased * 0.08
    } else if (phase === 'hold') {
      // Gentle breathing: scale oscillates 1.0 → 1.03 → 1.0 using sine wave
      opacity = 1
      const breathCycle = Math.sin(holdProgress * Math.PI) // 0 → 1 → 0
      scale = 1 + breathCycle * 0.03
    } else {
      // Exit: fade out while scaling slightly up
      const eased = easeInCubic(exitProgress)
      opacity = 1 - eased
      scale = 1 + eased * 0.04
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale.toFixed(4)})`,
          opacity,
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Helvetica, sans-serif",
            fontSize: 'clamp(36px, 8vw, 120px)',
            fontWeight: 300,
            letterSpacing: '0.05em',
            color,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function MinimalBreathScaleComponent(props: MotionGraphicProps<MinimalBreathScaleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-breath-scale',
  title: 'Minimal Breath Scale',
  description:
    'Text gently scales up and down like breathing during the hold phase. Calm, living typographic pulse using a single scale property.',
  tags: ['kinetic', 'typography', 'minimal', 'breathe', 'scale', 'pulse', 'gentle', 'calm', 'loop'],
  category: 'captions',
  component: MinimalBreathScaleComponent as any,
  defaultConfig: {
    words: ['BREATHE', 'CALM', 'SLOW', 'EASY'],
    colors: ['#1A1A1A', '#222222', '#1A1A1A', '#333333'],
    bgColor: '#FFFFFF',
    cycleDuration: 2.0,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['BREATHE', 'CALM', 'SLOW', 'EASY'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#1A1A1A', '#222222', '#1A1A1A', '#333333'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.0,
      min: 0.8,
      max: 6,
      group: 'Timing',
    },
  ],
})
