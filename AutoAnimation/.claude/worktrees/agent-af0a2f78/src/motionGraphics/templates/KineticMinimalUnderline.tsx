import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalUnderlineConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    // Text fades in during enter. Underline draws left-to-right during hold.
    // Both fade out on exit.
    let textOpacity = 1
    let underlineWidth = '0%'
    let underlineOpacity = 1

    if (phase === 'enter') {
      // Text fades in
      textOpacity = enterProgress
      underlineWidth = '0%'
      underlineOpacity = 0
    } else if (phase === 'hold') {
      // Underline draws left to right
      textOpacity = 1
      const eased = holdProgress * holdProgress * (3 - 2 * holdProgress) // smoothstep
      underlineWidth = `${(eased * 100).toFixed(1)}%`
      underlineOpacity = 1
    } else {
      // Both fade out
      textOpacity = 1 - exitProgress
      underlineWidth = '100%'
      underlineOpacity = 1 - exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Text */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Helvetica, sans-serif",
            fontSize: 'clamp(36px, 8vw, 120px)',
            fontWeight: 300,
            letterSpacing: '0.05em',
            color,
            whiteSpace: 'nowrap',
            opacity: textOpacity,
            position: 'relative',
          }}
        >
          {word}
        </div>
        {/* Underline bar — draws left to right */}
        <div
          style={{
            position: 'relative',
            height: '2px',
            width: '100%',
            marginTop: '4px',
            overflow: 'hidden',
            opacity: underlineOpacity,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: underlineWidth,
              background: color,
            }}
          />
        </div>
      </div>
    )
  },
}

function MinimalUnderlineComponent(props: MotionGraphicProps<MinimalUnderlineConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-underline',
  title: 'Minimal Underline',
  description: 'Text fades in on enter, then an underline draws left to right during hold. Clean typographic reveal.',
  tags: ['kinetic', 'typography', 'minimal', 'underline', 'draw', 'reveal', 'line'],
  category: 'captions',
  component: MinimalUnderlineComponent as any,
  defaultConfig: {
    words: ['UNDERLINE', 'DRAW', 'LINE', 'MARK'],
    colors: ['#111111', '#222222', '#333333', '#111111'],
    bgColor: '#ffffff',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['UNDERLINE', 'DRAW', 'LINE', 'MARK'],
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
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
