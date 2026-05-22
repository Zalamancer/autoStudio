import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalFlipConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // Flip in on Y axis: rotateY 90deg → 0deg on enter, 0deg → -90deg on exit
    // Use 3D perspective for depth
    let rotateY = 0
    let opacity = 1

    if (phase === 'enter') {
      // Ease out cubic: 90deg → 0deg
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      rotateY = 90 * (1 - eased)
      opacity = enterProgress < 0.3 ? enterProgress / 0.3 : 1
    } else if (phase === 'exit') {
      // Ease in cubic: 0deg → -90deg
      const eased = exitProgress * exitProgress * exitProgress
      rotateY = -90 * eased
      opacity = exitProgress > 0.7 ? 1 - (exitProgress - 0.7) / 0.3 : 1
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          perspective: '600px',
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
            transform: `rotateY(${rotateY.toFixed(2)}deg)`,
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function MinimalFlipComponent(props: MotionGraphicProps<MinimalFlipConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-flip',
  title: 'Minimal Flip',
  description: 'Text flips in on the Y axis with 3D perspective. Single rotateY CSS transform as the entire effect.',
  tags: ['kinetic', 'typography', 'minimal', 'flip', '3d', 'rotate', 'perspective', 'y-axis'],
  category: 'captions',
  component: MinimalFlipComponent as any,
  defaultConfig: {
    words: ['FLIP', 'TURN', 'SPIN', 'PIVOT'],
    colors: ['#111111', '#222222', '#333333', '#111111'],
    bgColor: '#ffffff',
    cycleDuration: 1.2,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['FLIP', 'TURN', 'SPIN', 'PIVOT'],
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
