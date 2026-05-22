import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalTrackingConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // letter-spacing: wide (1.2em) → normal (0.02em) on enter, expand on exit
    let letterSpacing = '0.02em'
    let opacity = 1

    if (phase === 'enter') {
      const eased = enterProgress * enterProgress * (3 - 2 * enterProgress) // smoothstep
      // 1.2em → 0.02em as eased goes 0→1
      const spacing = 1.2 - eased * 1.18
      letterSpacing = `${spacing.toFixed(3)}em`
      opacity = enterProgress
    } else if (phase === 'exit') {
      const eased = exitProgress * exitProgress * (3 - 2 * exitProgress)
      // 0.02em → 1.2em
      const spacing = 0.02 + eased * 1.18
      letterSpacing = `${spacing.toFixed(3)}em`
      opacity = 1 - exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Helvetica, sans-serif",
            fontSize: 'clamp(36px, 8vw, 120px)',
            fontWeight: 300,
            letterSpacing,
            textTransform: 'uppercase',
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

function MinimalTrackingComponent(props: MotionGraphicProps<MinimalTrackingConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-tracking',
  title: 'Minimal Tracking',
  description: 'Wide letter-spacing compresses to normal as the sole animation. Clean typographic tracking effect.',
  tags: ['kinetic', 'typography', 'minimal', 'tracking', 'letter-spacing', 'compress', 'expand'],
  category: 'captions',
  component: MinimalTrackingComponent as any,
  defaultConfig: {
    words: ['SPACE', 'TRACK', 'KERN', 'WIDE'],
    colors: ['#111111', '#222222', '#333333', '#111111'],
    bgColor: '#ffffff',
    cycleDuration: 1.2,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SPACE', 'TRACK', 'KERN', 'WIDE'],
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
      defaultValue: 1.2,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
