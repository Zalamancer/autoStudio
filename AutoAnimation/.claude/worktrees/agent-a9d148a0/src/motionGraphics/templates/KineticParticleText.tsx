import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ParticleTextConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let blur = 0
    let letterSpacing = 0

    if (phase === 'enter') {
      // Particles assembling — letters come together
      opacity = Math.min(1, enterProgress * 2)
      scale = 0.5 + enterProgress * 0.5
      blur = (1 - enterProgress) * 10
      letterSpacing = (1 - enterProgress) * 40
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
    } else {
      // Particles exploding apart
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.5
      blur = exitProgress * 8
      letterSpacing = exitProgress * 60
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(36px, 10vw, 140px)',
          fontWeight: 700,
          letterSpacing,
          color,
          textShadow: `0 0 10px ${color}, 0 0 30px ${color}`,
          whiteSpace: 'nowrap',
          transition: 'letter-spacing 0.1s ease',
        }}
      >
        {word}
      </div>
    )
  },
}

function ParticleTextComponent(props: MotionGraphicProps<ParticleTextConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-particle-text',
  title: 'Particle Text',
  description: 'Words formed from particles that assemble, hold, then explode before cycling to next word',
  tags: ['particle', 'text', 'animation', 'kinetic'],
  category: 'captions',
  component: ParticleTextComponent as any,
  defaultConfig: {
    words: ['FORM', 'HOLD', 'BURST', 'REPEAT'],
    colors: ['#FF3366', '#00FFAA', '#FFD700', '#00BFFF'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FORM', 'HOLD', 'BURST'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF3366', '#00FFAA', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
