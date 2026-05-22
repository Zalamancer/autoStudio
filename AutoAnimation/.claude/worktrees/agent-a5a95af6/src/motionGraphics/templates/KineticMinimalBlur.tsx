import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalBlurConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let blurPx = 0
    let opacity = 1

    if (phase === 'enter') {
      // Blur starts high (16px) and reduces to 0 as enterProgress goes 0→1
      blurPx = (1 - enterProgress) * 16
      opacity = enterProgress
    } else if (phase === 'exit') {
      // Re-blur on exit
      blurPx = exitProgress * 16
      opacity = 1 - exitProgress * 0.5
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          filter: blurPx > 0 ? `blur(${blurPx.toFixed(2)}px)` : 'none',
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

function MinimalBlurComponent(props: MotionGraphicProps<MinimalBlurConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-blur',
  title: 'Minimal Blur',
  description: 'Text transitions from blurred to sharp focus using CSS filter: blur. Single-property minimal effect.',
  tags: ['kinetic', 'typography', 'minimal', 'blur', 'focus', 'sharp', 'filter'],
  category: 'captions',
  component: MinimalBlurComponent as any,
  defaultConfig: {
    words: ['FOCUS', 'CLARITY', 'SHARP', 'CLEAR'],
    colors: ['#111111', '#222222', '#333333', '#111111'],
    bgColor: '#ffffff',
    cycleDuration: 1.2,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['FOCUS', 'CLARITY', 'SHARP', 'CLEAR'],
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
