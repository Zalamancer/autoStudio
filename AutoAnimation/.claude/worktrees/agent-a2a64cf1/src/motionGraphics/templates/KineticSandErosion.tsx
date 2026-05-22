import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SandErosionConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, ${bgColor} 0%, #8B7355 100%)`,
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let blur = 0
    let translateX = 0

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 1.8)
      scale = 0.8 + enterProgress * 0.2
      blur = (1 - enterProgress) * 5
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      const shimmer = Math.sin(holdProgress * Math.PI * 6) * 0.3
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color,
            textShadow: `0 2px 4px rgba(139,115,85,${0.5 + shimmer}), 0 0 ${10 + shimmer * 15}px rgba(194,168,120,0.3)`,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      )
    } else {
      opacity = 1 - exitProgress
      blur = exitProgress * 6
      translateX = exitProgress * 20
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), -50%) scale(${scale})`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 6,
          color,
          textShadow: '0 2px 4px rgba(139,115,85,0.5)',
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function SandErosionComponent(props: MotionGraphicProps<SandErosionConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sand-erosion',
  title: 'Kinetic Sand Erosion',
  description: 'Desert sand forming and eroding text with warm earth tone shimmer',
  tags: ['kinetic', 'typography', 'sand', 'desert', 'erosion'],
  category: 'captions',
  component: SandErosionComponent as any,
  defaultConfig: {
    words: ['DUST', 'WIND', 'STONE', 'TIME'],
    colors: ['#8B7355', '#C2A878', '#D4A574', '#A0522D'],
    bgColor: '#C2A878',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DUST', 'WIND', 'STONE', 'TIME'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#8B7355', '#C2A878', '#D4A574', '#A0522D'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#C2A878', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
