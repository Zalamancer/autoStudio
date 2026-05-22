import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalWeightConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // font-weight transitions: 100 (ultralight) → 700 (bold) on enter, 700 → 100 on exit
    // CSS font-weight as a number 100–700
    let weight = 700
    let opacity = 1

    if (phase === 'enter') {
      // Ease in: ultralight to bold
      const eased = enterProgress * enterProgress * (3 - 2 * enterProgress) // smoothstep
      weight = Math.round(100 + eased * 600)
      opacity = 0.4 + enterProgress * 0.6
    } else if (phase === 'exit') {
      // Ease out: bold back to ultralight
      const eased = exitProgress * exitProgress * (3 - 2 * exitProgress)
      weight = Math.round(700 - eased * 600)
      opacity = 1 - exitProgress * 0.8
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
            fontWeight: weight,
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

function MinimalWeightComponent(props: MotionGraphicProps<MinimalWeightConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-weight',
  title: 'Minimal Weight',
  description: 'Font-weight transitions from ultralight (100) to bold (700) as the sole animation. Minimal typography effect.',
  tags: ['kinetic', 'typography', 'minimal', 'weight', 'bold', 'thin', 'font-weight'],
  category: 'captions',
  component: MinimalWeightComponent as any,
  defaultConfig: {
    words: ['BOLD', 'LIGHT', 'HEAVY', 'THIN'],
    colors: ['#111111', '#333333', '#111111', '#444444'],
    bgColor: '#ffffff',
    cycleDuration: 1.2,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['BOLD', 'LIGHT', 'HEAVY', 'THIN'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#111111', '#333333', '#111111', '#444444'],
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
