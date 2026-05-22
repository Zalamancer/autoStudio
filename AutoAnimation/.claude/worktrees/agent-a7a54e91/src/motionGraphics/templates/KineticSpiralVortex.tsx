import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SpiralVortexConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at center, #1a1a2e 0%, ${bgColor} 100%)`,
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress }: WordRenderProps) => {
    let opacity = 0
    let scale = 0
    let rotate = 0

    if (phase === 'enter') {
      const ease = 1 - Math.pow(1 - enterProgress, 3)
      opacity = Math.min(1, enterProgress * 2.5)
      scale = ease
      rotate = 360 * (1 - ease)
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      rotate = Math.sin(holdProgress * Math.PI * 4) * 5
    } else {
      const ease = exitProgress * exitProgress
      opacity = 1 - ease
      scale = 1 - ease
      rotate = -360 * ease
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`,
          opacity,
          fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(44px, 13vw, 170px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: 4,
          color,
          textShadow: `0 0 15px ${color}, 0 0 30px rgba(255,51,102,0.2)`,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function SpiralVortexComponent(props: MotionGraphicProps<SpiralVortexConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-spiral-vortex',
  title: 'Kinetic Spiral Vortex',
  description: 'Spiral vortex spinning entrance with scale and rotation, gentle oscillating hold',
  tags: ['kinetic', 'typography', 'spiral', 'vortex', 'spin'],
  category: 'captions',
  component: SpiralVortexComponent as any,
  defaultConfig: {
    words: ['SPIN', 'TWIST', 'WHIRL', 'VORTEX'],
    colors: ['#FF3366', '#00BFFF', '#FFD700', '#FF6EC7'],
    bgColor: '#0a0a1a',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SPIN', 'TWIST', 'WHIRL', 'VORTEX'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF3366', '#00BFFF', '#FFD700', '#FF6EC7'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
