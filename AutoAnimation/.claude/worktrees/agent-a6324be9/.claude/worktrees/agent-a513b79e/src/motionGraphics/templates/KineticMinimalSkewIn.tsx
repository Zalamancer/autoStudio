import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalSkewInConfig extends KineticBaseConfig {}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 1
    let skewX = 0
    let translateX = 0

    if (phase === 'enter') {
      const eased = easeOutQuart(enterProgress)
      opacity = Math.min(1, enterProgress * 2.5)
      skewX = (1 - eased) * -18
      translateX = (1 - eased) * -40
    } else if (phase === 'exit') {
      const eased = easeInQuart(exitProgress)
      opacity = 1 - eased
      skewX = eased * 10
      translateX = eased * 30
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${translateX.toFixed(2)}px) skewX(${skewX.toFixed(3)}deg)`,
          opacity,
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(36px, 8vw, 120px)',
          fontWeight: 300,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function MinimalSkewInComponent(props: MotionGraphicProps<MinimalSkewInConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-skew-in',
  title: 'Minimal Skew In',
  description: 'Text enters with a horizontal skew that straightens to upright — a single italic-to-roman motion with no decoration',
  tags: ['kinetic', 'typography', 'minimal', 'skew', 'italic', 'entrance', 'clean'],
  category: 'captions',
  component: MinimalSkewInComponent as any,
  defaultConfig: {
    words: ['SLANT', 'LEAN', 'TILT', 'ANGLE'],
    colors: ['#111111', '#222222', '#111111', '#333333'],
    bgColor: '#F5F5F5',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SLANT', 'LEAN', 'TILT', 'ANGLE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#111111', '#222222', '#111111', '#333333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5F5F5', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.4, max: 5, group: 'Timing' },
  ],
})
