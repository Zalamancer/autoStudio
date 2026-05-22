import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalDoubleBounceConfig extends KineticBaseConfig {}

function doubleBounce(t: number): number {
  // Two bounces: big first, smaller second — pure spring energy
  if (t < 0.6) {
    const t1 = t / 0.6
    return Math.sin(t1 * Math.PI) * (1 - t1 * 0.3)
  }
  const t2 = (t - 0.6) / 0.4
  return Math.sin(t2 * Math.PI) * 0.25 * (1 - t2)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let translateY = 0
    let opacity = 1

    if (phase === 'enter') {
      // Drops in and bounces twice — physically satisfying
      const bounce = doubleBounce(enterProgress)
      translateY = -bounce * 28
      opacity = Math.min(1, enterProgress * 4)
    } else if (phase === 'exit') {
      translateY = exitProgress * 30
      opacity = 1 - exitProgress
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

function MinimalDoubleBounceComponent(props: MotionGraphicProps<MinimalDoubleBounceConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-double-bounce',
  title: 'Minimal Double Bounce',
  description: 'Words settle with two bounces — a big first bounce and a smaller echo — rhythm as the mechanic, pure kinetic satisfaction.',
  tags: ['kinetic', 'typography', 'minimal', 'bounce', 'double', 'spring', 'rhythm', 'timing'],
  category: 'captions',
  component: MinimalDoubleBounceComponent as any,
  defaultConfig: {
    words: ['BOUNCE', 'SPRING', 'JUMP', 'HOP'],
    colors: ['#111111', '#222222', '#333333', '#111111'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BOUNCE', 'SPRING', 'JUMP', 'HOP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#111111', '#222222', '#333333', '#111111'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
