import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalVerticalClipConfig extends KineticBaseConfig {}

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
    // Vertical clip from center outward using clipPath: inset(top% 0 bottom% 0)
    // At progress=0: fully clipped (top 50%, bottom 50% = nothing visible)
    // At progress=1: fully revealed (top 0%, bottom 0%)
    let clipTop = 50
    let clipBottom = 50
    let opacity = 1

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      // Clip expands from center outward
      clipTop = 50 * (1 - eased)
      clipBottom = 50 * (1 - eased)
      opacity = Math.min(1, enterProgress * 3)
    } else if (phase === 'exit') {
      const eased = easeInCubic(exitProgress)
      // Clip collapses back to center
      clipTop = 50 * eased
      clipBottom = 50 * eased
      opacity = 1 - eased * 0.6
    }

    const clipPath = `inset(${clipTop.toFixed(1)}% 0 ${clipBottom.toFixed(1)}% 0)`

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          clipPath,
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

function MinimalVerticalClipComponent(props: MotionGraphicProps<MinimalVerticalClipConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-vertical-clip',
  title: 'Minimal Vertical Clip',
  description:
    'Text clips in vertically from the center outward — top and bottom edges expand symmetrically using CSS clipPath: inset(). Single clip property.',
  tags: ['kinetic', 'typography', 'minimal', 'clip', 'vertical', 'reveal', 'center', 'inset', 'mask'],
  category: 'captions',
  component: MinimalVerticalClipComponent as any,
  defaultConfig: {
    words: ['REVEAL', 'EXPAND', 'OPEN', 'CLIP'],
    colors: ['#1A1A1A', '#222222', '#1A1A1A', '#333333'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.3,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['REVEAL', 'EXPAND', 'OPEN', 'CLIP'],
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
