import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalRotateSnapConfig extends KineticBaseConfig {}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let rotateZ = 0
    let opacity = 1

    if (phase === 'enter') {
      // Snaps in from -90 degrees with overshoot
      const e = easeOutBack(Math.min(1, enterProgress))
      rotateZ = (1 - e) * -90
      opacity = Math.min(1, enterProgress * 2.5)
    } else if (phase === 'exit') {
      // Snaps out to +45 degrees, sharp
      rotateZ = exitProgress * 45
      opacity = 1 - exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) rotateZ(${rotateZ.toFixed(3)}deg)`,
          opacity,
          transformOrigin: 'center center',
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(36px, 8vw, 120px)',
          fontWeight: 300,
          letterSpacing: '0.05em',
          color,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function MinimalRotateSnapComponent(props: MotionGraphicProps<MinimalRotateSnapConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-rotate-snap',
  title: 'Minimal Rotate Snap',
  description: 'Words snap in from -90° with a satisfying overshoot, then exit upward — single rotateZ transform, mechanical precision.',
  tags: ['kinetic', 'typography', 'minimal', 'rotate', 'snap', 'transform', 'overshoot'],
  category: 'captions',
  component: MinimalRotateSnapComponent as any,
  defaultConfig: {
    words: ['SNAP', 'CLICK', 'LOCK', 'SET'],
    colors: ['#111111', '#222222', '#333333', '#111111'],
    bgColor: '#FAFAFA',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SNAP', 'CLICK', 'LOCK', 'SET'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#111111', '#222222', '#333333', '#111111'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FAFAFA', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.5, max: 5, group: 'Timing' },
  ],
})
