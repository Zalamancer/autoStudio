import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalHorizClipConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // clip-path: inset(0 right% 0 left%) — text reveals from center outward horizontally
    // At progress=0: inset(0 50% 0 50%) — fully hidden, both sides clipped to center
    // At progress=1: inset(0 0% 0 0%) — fully revealed
    let clipSide = 50

    if (phase === 'enter') {
      // Ease out quart: fast initial reveal that decelerates
      const eased = 1 - Math.pow(1 - enterProgress, 4)
      clipSide = 50 * (1 - eased)
    } else if (phase === 'exit') {
      // Ease in quart: accelerating collapse back to center
      const eased = Math.pow(exitProgress, 4)
      clipSide = 50 * eased
    }

    const clipPath = `inset(0 ${clipSide.toFixed(2)}% 0 ${clipSide.toFixed(2)}%)`

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
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

function MinimalHorizClipComponent(props: MotionGraphicProps<MinimalHorizClipConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-horiz-clip',
  title: 'Minimal Horizontal Clip',
  description: 'Text wipes in from the center outward horizontally via CSS clip-path: inset. Single clip property, sharp and clean.',
  tags: ['kinetic', 'typography', 'minimal', 'clip', 'horizontal', 'reveal', 'wipe', 'center', 'inset', 'mask'],
  category: 'captions',
  component: MinimalHorizClipComponent as any,
  defaultConfig: {
    words: ['OPEN', 'WIPE', 'SPLIT', 'REVEAL'],
    colors: ['#111111', '#222222', '#333333', '#111111'],
    bgColor: '#ffffff',
    cycleDuration: 1.0,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['OPEN', 'WIPE', 'SPLIT', 'REVEAL'],
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
