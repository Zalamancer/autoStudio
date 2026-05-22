import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalSkewConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // skewX: starts at -20deg, settles to 0 on enter; re-skews on exit
    let skewX = 0
    let opacity = 1

    if (phase === 'enter') {
      // Overshoot settle: skew from -20deg → 0deg with slight overshoot
      const eased = 1 - Math.pow(1 - enterProgress, 3) // ease out cubic
      // Overshoot: go slightly past 0 then settle
      const overshoot = enterProgress < 0.8
        ? -20 * (1 - eased * 1.05)
        : -20 * (1 - eased) + Math.sin((enterProgress - 0.8) / 0.2 * Math.PI) * 2
      skewX = overshoot
      opacity = Math.min(1, enterProgress * 3)
    } else if (phase === 'exit') {
      // Skew out to the right (+20deg)
      const eased = exitProgress * exitProgress * (3 - 2 * exitProgress)
      skewX = eased * 20
      opacity = 1 - exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) skewX(${skewX.toFixed(2)}deg)`,
          opacity,
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Helvetica, sans-serif",
            fontSize: 'clamp(36px, 8vw, 120px)',
            fontWeight: 300,
            letterSpacing: '0.04em',
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

function MinimalSkewComponent(props: MotionGraphicProps<MinimalSkewConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-skew',
  title: 'Minimal Skew',
  description: 'Text skews in from an angle and settles upright. Single skewX CSS transform as the entire effect.',
  tags: ['kinetic', 'typography', 'minimal', 'skew', 'italic', 'settle', 'transform'],
  category: 'captions',
  component: MinimalSkewComponent as any,
  defaultConfig: {
    words: ['SKEW', 'LEAN', 'TILT', 'SLANT'],
    colors: ['#111111', '#222222', '#333333', '#111111'],
    bgColor: '#ffffff',
    cycleDuration: 1.2,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SKEW', 'LEAN', 'TILT', 'SLANT'],
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
