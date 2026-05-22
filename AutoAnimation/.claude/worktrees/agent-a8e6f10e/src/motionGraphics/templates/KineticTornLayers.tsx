import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 20px)',
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let translateX = 0
    let rotation = 0
    const direction = index % 2 === 0 ? 1 : -1

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 2.5)
      translateX = (1 - enterProgress) * 120 * direction
      rotation = (1 - enterProgress) * 8 * direction
    } else if (phase === 'hold') {
      opacity = 1
      rotation = direction * 1.5
    } else {
      opacity = 1 - exitProgress
      rotation = exitProgress * -12 * direction
      translateX = exitProgress * -80 * direction
    }

    const fontFamily = index % 2 === 0
      ? "'Georgia', 'Times New Roman', serif"
      : "'Arial Black', 'Helvetica Neue', sans-serif"

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${translateX}px) rotate(${rotation}deg)`,
          opacity,
          fontFamily,
          fontSize: 'clamp(40px, 11vw, 150px)',
          fontWeight: 700,
          color,
          textShadow: '4px 4px 8px rgba(0,0,0,0.3), 2px 2px 0 rgba(0,0,0,0.15)',
          whiteSpace: 'nowrap',
          padding: '8px 24px',
          background: 'rgba(255,255,255,0.08)',
          borderLeft: phase === 'hold' ? `4px solid ${color}` : undefined,
        }}
      >
        {word}
      </div>
    )
  },
}

function TornLayersComponent(props: MotionGraphicProps<KineticBaseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-torn-layers',
  title: 'Kinetic Torn Layers',
  description: 'Torn paper layers collage with mixed typography sliding in with rotation like layered cutouts',
  tags: ['kinetic', 'typography', 'collage', 'paper', 'torn'],
  category: 'captions',
  component: TornLayersComponent as any,
  defaultConfig: {
    words: ['TEAR', 'APART', 'THE', 'RULES'],
    colors: ['#2D2D2D', '#CC0000', '#003366', '#2D2D2D'],
    bgColor: '#C4A882',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TEAR', 'APART', 'THE', 'RULES'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2D2D2D', '#CC0000', '#003366'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#C4A882', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
