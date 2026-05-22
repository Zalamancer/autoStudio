import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalElasticConfig extends KineticBaseConfig {}

// Elastic overshoot easing: bounces past 1 then settles
function easeOutElastic(t: number): number {
  if (t === 0) return 0
  if (t === 1) return 1
  const c4 = (2 * Math.PI) / 3
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 1
    let translateY = 0
    let scaleY = 1

    if (phase === 'enter') {
      // Elastic arrives from below: overshoots final position, settles
      const eased = easeOutElastic(enterProgress)
      opacity = Math.min(1, enterProgress * 3)
      translateY = 60 * (1 - eased)
      // Slight squash/stretch mirroring the elastic motion
      scaleY = 1 + Math.abs(eased - 1) * 0.15
    } else if (phase === 'exit') {
      // Clean linear fade-up exit
      const eased = easeInCubic(exitProgress)
      opacity = 1 - eased
      translateY = -30 * eased
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY.toFixed(2)}px) scaleY(${scaleY.toFixed(4)})`,
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

function MinimalElasticComponent(props: MotionGraphicProps<MinimalElasticConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-elastic',
  title: 'Minimal Elastic',
  description:
    'Text enters with elastic overshoot easing — bounces past its resting position before settling. Single CSS transform animation.',
  tags: ['kinetic', 'typography', 'minimal', 'elastic', 'bounce', 'overshoot', 'spring', 'motion'],
  category: 'captions',
  component: MinimalElasticComponent as any,
  defaultConfig: {
    words: ['SPRING', 'BOUNCE', 'SNAP', 'ELASTIC'],
    colors: ['#1A1A1A', '#222222', '#1A1A1A', '#333333'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SPRING', 'BOUNCE', 'SNAP', 'ELASTIC'],
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
      defaultValue: 1.4,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
