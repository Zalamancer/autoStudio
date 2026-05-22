import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalPerspectiveConfig extends KineticBaseConfig {}

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
    let opacity = 1
    let rotateX = 0

    if (phase === 'enter') {
      // Tilt forward from above: rotateX starts at -35deg (tilted away) and comes to 0
      const eased = easeOutCubic(enterProgress)
      opacity = Math.min(1, enterProgress * 2)
      rotateX = -35 * (1 - eased)
    } else if (phase === 'exit') {
      // Tilt forward and away on exit
      const eased = easeInCubic(exitProgress)
      opacity = 1 - eased
      rotateX = 25 * eased
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          perspective: '500px',
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
            opacity,
            transform: `rotateX(${rotateX.toFixed(2)}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function MinimalPerspectiveComponent(props: MotionGraphicProps<MinimalPerspectiveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-perspective',
  title: 'Minimal Perspective',
  description:
    'Text tilts in with subtle 3D perspective rotation on the X axis — arrives flat from an angled position using a single rotateX transform.',
  tags: ['kinetic', 'typography', 'minimal', 'perspective', '3d', 'tilt', 'rotateX', 'depth'],
  category: 'captions',
  component: MinimalPerspectiveComponent as any,
  defaultConfig: {
    words: ['DEPTH', 'TILT', 'ANGLE', 'PLANE'],
    colors: ['#1A1A1A', '#222222', '#1A1A1A', '#333333'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.3,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['DEPTH', 'TILT', 'ANGLE', 'PLANE'],
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
