import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalSkewLeanConfig extends KineticBaseConfig {}

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let skewY = 0
    let opacity = 1

    if (phase === 'enter') {
      // Leans in from a heavy skew — decelerates to upright
      const e = easeOutQuint(enterProgress)
      skewY = (1 - e) * 20
      opacity = Math.min(1, enterProgress * 2)
    } else if (phase === 'hold') {
      // Tiny residual lean — almost imperceptible, adds life
      skewY = Math.sin(holdProgress * Math.PI * 0.5) * 0.5
    } else {
      // Leans away in the opposite direction
      skewY = -(exitProgress * 15)
      opacity = 1 - exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) skewY(${skewY.toFixed(3)}deg)`,
          opacity,
          transformOrigin: 'center center',
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(36px, 8vw, 120px)',
          fontWeight: 300,
          letterSpacing: '0.06em',
          color,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function MinimalSkewLeanComponent(props: MotionGraphicProps<MinimalSkewLeanConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-skew-lean',
  title: 'Minimal Skew Lean',
  description: 'Text leans in with skewY, decelerating to upright — single-axis skew creates a sense of momentum arriving and departing.',
  tags: ['kinetic', 'typography', 'minimal', 'skewY', 'lean', 'transform', 'momentum'],
  category: 'captions',
  component: MinimalSkewLeanComponent as any,
  defaultConfig: {
    words: ['LEAN', 'TILT', 'ANGLE', 'SLANT'],
    colors: ['#111111', '#222222', '#333333', '#111111'],
    bgColor: '#FAFAFA',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LEAN', 'TILT', 'ANGLE', 'SLANT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#111111', '#222222', '#333333', '#111111'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FAFAFA', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.5, max: 5, group: 'Timing' },
  ],
})
