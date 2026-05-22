import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalCornerPeekConfig extends KineticBaseConfig {}

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

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // Diagonal slide: arrives from bottom-left corner toward center
    let translateX = 0
    let translateY = 0
    let opacity = 1

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      // Start at bottom-left offset, slide diagonally to center
      translateX = -50 * (1 - eased)
      translateY = 40 * (1 - eased)
      opacity = Math.min(1, enterProgress * 2.5)
    } else if (phase === 'exit') {
      const eased = easeInCubic(exitProgress)
      // Exit toward top-right corner
      translateX = 50 * eased
      translateY = -40 * eased
      opacity = 1 - eased
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translate(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px)`,
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

function MinimalCornerPeekComponent(props: MotionGraphicProps<MinimalCornerPeekConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-corner-peek',
  title: 'Minimal Corner Peek',
  description:
    'Text peeks in from the bottom-left corner with a diagonal slide to center. Single diagonal translate motion — asymmetric enter and exit.',
  tags: ['kinetic', 'typography', 'minimal', 'corner', 'diagonal', 'peek', 'slide', 'asymmetric'],
  category: 'captions',
  component: MinimalCornerPeekComponent as any,
  defaultConfig: {
    words: ['PEEK', 'ARRIVE', 'CORNER', 'ENTER'],
    colors: ['#1A1A1A', '#222222', '#1A1A1A', '#333333'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.3,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['PEEK', 'ARRIVE', 'CORNER', 'ENTER'],
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
      defaultValue: 1.3,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
