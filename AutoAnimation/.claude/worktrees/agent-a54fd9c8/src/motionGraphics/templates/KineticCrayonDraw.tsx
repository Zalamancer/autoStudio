import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CrayonDrawConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Construction paper texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'radial-gradient(circle at 10% 20%, rgba(0,0,0,0.02) 0%, transparent 4%)',
            'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.015) 0%, transparent 6%)',
            'radial-gradient(circle at 90% 80%, rgba(0,0,0,0.02) 0%, transparent 5%)',
            'radial-gradient(circle at 30% 70%, rgba(0,0,0,0.015) 0%, transparent 3%)',
            'radial-gradient(circle at 70% 30%, rgba(0,0,0,0.02) 0%, transparent 7%)',
          ].join(', '),
        }}
      />
      {/* Subtle paper grain */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(45deg, rgba(0,0,0,0.01) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.01) 75%)',
          backgroundSize: '4px 4px',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 73 + 29

    // Create crayon texture: multiple overlapping semi-transparent layers at slight offsets
    const renderCrayonText = (opacity: number, chaosAmount: number = 0) => {
      const layers = 4
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
          }}
        >
          {Array.from({ length: layers }, (_, li) => {
            const offsetX = Math.sin(seed * 3 + li * 2.3) * (1.5 + chaosAmount * 8) * (li > 0 ? 1 : 0)
            const offsetY = Math.cos(seed * 5 + li * 1.7) * (1 + chaosAmount * 6) * (li > 0 ? 1 : 0)
            const rotation = Math.sin(seed * 7 + li * 3.1) * (0.5 + chaosAmount * 5)
            const layerOpacity = li === 0 ? 0.9 : 0.15 + Math.sin(seed + li) * 0.05

            return (
              <div
                key={li}
                style={{
                  position: li === 0 ? 'relative' : 'absolute',
                  top: li === 0 ? undefined : '50%',
                  left: li === 0 ? undefined : '50%',
                  transform: li === 0
                    ? `rotate(${rotation}deg)`
                    : `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) rotate(${rotation}deg)`,
                  fontFamily: "'Comic Sans MS', 'Segoe Print', 'Chalkduster', cursive",
                  fontSize: 'clamp(44px, 11vw, 140px)',
                  fontWeight: 700,
                  color,
                  opacity: layerOpacity,
                  whiteSpace: 'nowrap',
                  letterSpacing: 3,
                  textShadow: li === 0 ? `0 0 2px ${color}` : undefined,
                }}
              >
                {word}
              </div>
            )
          })}
        </div>
      )
    }

    if (phase === 'enter') {
      // Scribble-in effect: chaotic to ordered
      const chaosLevel = 1 - enterProgress // starts chaotic, becomes ordered
      const opacity = Math.min(1, enterProgress * 1.5)
      return renderCrayonText(opacity, chaosLevel * 0.8)
    }

    if (phase === 'hold') {
      // Gentle breathing with slight color vibrance
      const breathe = 1 + Math.sin(holdProgress * Math.PI * 2 + seed) * 0.01
      return (
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${breathe})` }}>
          {renderCrayonText(1, 0)}
        </div>
      )
    }

    // Exit: scribbles apart (increases chaos) and fades
    const chaosLevel = exitProgress * 0.8
    const opacity = 1 - exitProgress
    return renderCrayonText(opacity, chaosLevel)
  },
}

function CrayonDrawComponent(props: MotionGraphicProps<CrayonDrawConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-crayon-draw',
  title: 'Kinetic Crayon Draw',
  description: 'Crayon colored pencil texture with overlapping semi-transparent layers and scribble-in animation',
  tags: ['kinetic', 'typography', 'crayon', 'pencil', 'childlike', 'colorful', 'organic', 'texture'],
  category: 'captions',
  component: CrayonDrawComponent as any,
  defaultConfig: {
    words: ['DRAW', 'PLAY', 'COLOR', 'FUN'],
    colors: ['#E74C3C', '#3498DB', '#F39C12', '#2ECC71'],
    bgColor: '#FFF5E6',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DRAW', 'PLAY', 'COLOR', 'FUN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E74C3C', '#3498DB', '#F39C12', '#2ECC71'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF5E6', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
