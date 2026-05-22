import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PropagandaConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Radiating lines using repeating conic gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-conic-gradient(from 0deg, rgba(255,255,255,0.04) 0deg, rgba(255,255,255,0.04) 5deg, transparent 5deg, transparent 10deg)',
          backgroundPosition: 'center',
          pointerEvents: 'none',
        }}
      />
      {/* Radial vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.3) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let translateY = 0

    if (phase === 'enter') {
      // Stamp down with power curve (sharp ease)
      const t = enterProgress
      const eased = 1 - Math.pow(1 - t, 4) // power4 out
      opacity = Math.min(1, enterProgress * 4)
      scale = 1.5 - eased * 0.5
    } else if (phase === 'hold') {
      // Rock-solid, no movement
      opacity = 1
      scale = 1
    } else {
      // Quick fade with slight downward shift
      opacity = 1 - exitProgress * exitProgress
      translateY = exitProgress * 15
      scale = 1
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) translateY(${translateY}px)`,
          opacity,
          fontFamily: "Impact, 'Arial Black', sans-serif",
          fontSize: 'clamp(48px, 14vw, 180px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: 6,
          color,
          textShadow: '3px 3px 0 rgba(0,0,0,0.5), 1px 1px 0 rgba(0,0,0,0.3)',
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function PropagandaComponent(props: MotionGraphicProps<PropagandaConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-propaganda',
  title: 'Kinetic Propaganda',
  description: 'Soviet propaganda poster style with radiating lines, bold stamped text, and deep red background',
  tags: ['kinetic', 'typography', 'propaganda', 'poster', 'bold'],
  category: 'captions',
  component: PropagandaComponent as any,
  defaultConfig: {
    words: ['OBEY', 'WORK', 'SERVE', 'COMPLY'],
    colors: ['#FFF8E7', '#FFD700', '#FFFFFF', '#FFF8E7'],
    bgColor: '#8B0000',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['OBEY', 'WORK', 'SERVE', 'COMPLY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFF8E7', '#FFD700', '#FFFFFF', '#FFF8E7'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#8B0000', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
