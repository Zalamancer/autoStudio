import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalBrightnessConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // brightness: enters very dim (0.05) and blooms to full (1.0), exits by dimming back
    let brightness = 1
    let opacity = 1

    if (phase === 'enter') {
      // Ease out cubic: dim → bright
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      brightness = 0.05 + eased * 0.95
      opacity = Math.min(1, enterProgress * 2.5)
    } else if (phase === 'exit') {
      // Ease in cubic: bright → dim
      const eased = exitProgress * exitProgress * exitProgress
      brightness = 1 - eased * 0.9
      opacity = 1 - eased * 0.6
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          filter: `brightness(${brightness.toFixed(4)})`,
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

function MinimalBrightnessComponent(props: MotionGraphicProps<MinimalBrightnessConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-brightness',
  title: 'Minimal Brightness',
  description: 'Text materialises from near-black darkness via CSS brightness — single filter property, like a light turning on.',
  tags: ['kinetic', 'typography', 'minimal', 'brightness', 'filter', 'dim', 'glow', 'light'],
  category: 'captions',
  component: MinimalBrightnessComponent as any,
  defaultConfig: {
    words: ['LIGHT', 'GLOW', 'DAWN', 'BRIGHT'],
    colors: ['#111111', '#222222', '#333333', '#111111'],
    bgColor: '#ffffff',
    cycleDuration: 1.1,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['LIGHT', 'GLOW', 'DAWN', 'BRIGHT'],
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
      defaultValue: 1.1,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
