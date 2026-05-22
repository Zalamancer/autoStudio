import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SmokeRevealConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at center, #1a1a1a 0%, ${bgColor} 100%)`,
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress }: WordRenderProps) => {
    let opacity = 0
    let blur = 0
    let scale = 1

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 1.5)
      blur = (1 - enterProgress) * 20
      scale = 1.1 - enterProgress * 0.1
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      const breathe = Math.sin(holdProgress * Math.PI * 3)
      const spread = 20 + breathe * 8

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(44px, 12vw, 160px)',
            fontWeight: 300,
            textTransform: 'uppercase',
            letterSpacing: 10,
            color,
            textShadow: `0 0 ${spread}px rgba(192,192,192,${0.3 + breathe * 0.1}), 0 0 ${spread * 2}px rgba(192,192,192,0.1)`,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      )
    } else {
      opacity = 1 - exitProgress
      blur = exitProgress * 15
      scale = 1 + exitProgress * 0.05
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
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(44px, 12vw, 160px)',
          fontWeight: 300,
          textTransform: 'uppercase',
          letterSpacing: 10,
          color,
          textShadow: '0 0 20px rgba(192,192,192,0.3), 0 0 40px rgba(192,192,192,0.1)',
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function SmokeRevealComponent(props: MotionGraphicProps<SmokeRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-smoke-reveal',
  title: 'Kinetic Smoke Reveal',
  description: 'Smoke and mist reveal effect with heavy blur entrance and breathing glow',
  tags: ['kinetic', 'typography', 'smoke', 'mist', 'ethereal'],
  category: 'captions',
  component: SmokeRevealComponent as any,
  defaultConfig: {
    words: ['MIST', 'SHADOW', 'VANISH', 'GHOST'],
    colors: ['#C0C0C0', '#E0E0E0', '#FFFFFF', '#A0A0A0'],
    bgColor: '#0d0d0d',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MIST', 'SHADOW', 'VANISH', 'GHOST'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C0C0C0', '#E0E0E0', '#FFFFFF', '#A0A0A0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d0d', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
