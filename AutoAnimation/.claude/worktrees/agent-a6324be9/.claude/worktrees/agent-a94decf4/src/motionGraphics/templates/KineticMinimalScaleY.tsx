import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalScaleYConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // scaleY: text starts flat (squashed to zero height) and springs up to full height
    let scaleY = 1
    let opacity = 1

    if (phase === 'enter') {
      // Ease out back: overshoots slightly past 1.0 then settles — spring feel
      const c1 = 1.70158
      const c3 = c1 + 1
      const eased = 1 + c3 * Math.pow(enterProgress - 1, 3) + c1 * Math.pow(enterProgress - 1, 2)
      scaleY = Math.max(0, eased)
      opacity = Math.min(1, enterProgress * 3)
    } else if (phase === 'exit') {
      // Ease in cubic: collapses back flat
      const eased = exitProgress * exitProgress * exitProgress
      scaleY = 1 - eased
      opacity = 1 - eased * 0.5
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scaleY(${scaleY.toFixed(4)})`,
          transformOrigin: 'center center',
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

function MinimalScaleYComponent(props: MotionGraphicProps<MinimalScaleYConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-scaley',
  title: 'Minimal Scale Y',
  description: 'Text springs up from flat using scaleY with an ease-out-back overshoot. Single vertical-axis transform, satisfying snap.',
  tags: ['kinetic', 'typography', 'minimal', 'scaleY', 'transform', 'spring', 'vertical', 'squash', 'snap'],
  category: 'captions',
  component: MinimalScaleYComponent as any,
  defaultConfig: {
    words: ['RISE', 'SNAP', 'SPRING', 'TALL'],
    colors: ['#111111', '#222222', '#333333', '#111111'],
    bgColor: '#ffffff',
    cycleDuration: 1.0,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['RISE', 'SNAP', 'SPRING', 'TALL'],
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
      defaultValue: 1.0,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
