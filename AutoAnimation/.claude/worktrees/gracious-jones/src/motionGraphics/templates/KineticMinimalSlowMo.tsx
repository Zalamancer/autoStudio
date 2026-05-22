import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalSlowMoConfig extends KineticBaseConfig {}

function easeInOutQuint(t: number): number {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let translateY = 0
    let opacity = 1

    if (phase === 'enter') {
      // Extremely slow deceleration — the unhurried arrival is the satisfaction
      const e = easeInOutQuint(enterProgress)
      translateY = (1 - e) * 50
      opacity = e
    } else if (phase === 'exit') {
      // Equally slow departure upward — symmetric, meditative
      const e = easeInOutQuint(exitProgress)
      translateY = -e * 50
      opacity = 1 - e
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY.toFixed(3)}px))`,
          opacity,
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(36px, 8vw, 120px)',
          fontWeight: 200,
          letterSpacing: '0.08em',
          color,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function MinimalSlowMoComponent(props: MotionGraphicProps<MinimalSlowMoConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-slow-mo',
  title: 'Minimal Slow Mo',
  description: 'Deeply eased slow-motion slide — easeInOutQuint creates an ultra-smooth cinematic arrival and departure. Slowness is the elegance.',
  tags: ['kinetic', 'typography', 'minimal', 'slow', 'slowmo', 'ease', 'cinematic', 'timing', 'meditative'],
  category: 'captions',
  component: MinimalSlowMoComponent as any,
  defaultConfig: {
    words: ['SLOW', 'EASE', 'DRIFT', 'CALM'],
    colors: ['#111111', '#333333', '#555555', '#222222'],
    bgColor: '#FAFAFA',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SLOW', 'EASE', 'DRIFT', 'CALM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#111111', '#333333', '#555555', '#222222'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FAFAFA', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.8, max: 6, group: 'Timing' },
  ],
})
