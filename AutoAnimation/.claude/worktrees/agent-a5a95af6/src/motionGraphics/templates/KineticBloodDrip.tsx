import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BloodDripConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0

    // Deterministic wobble offset from index
    const seed = index * 97 + 31

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 2)
      // Drip down from above
      translateY = -80 + enterProgress * 80
      // Slight wobble during descent
      translateY += Math.sin(enterProgress * 8 + seed) * (1 - enterProgress) * 6
    } else if (phase === 'hold') {
      opacity = 1
      translateY = 0
    } else {
      opacity = 1 - exitProgress
      // Melt/drip downward
      translateY = exitProgress * 60
    }

    // Drip shadow effect: elongated downward shadow during hold
    const dripShadowLength = phase === 'hold'
      ? 8 + Math.sin(Date.now() * 0.003) * 4
      : phase === 'enter'
        ? enterProgress * 6
        : 6 * (1 - exitProgress)

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px)`,
          opacity,
          fontFamily: "Impact, 'Arial Black', sans-serif",
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          color,
          textShadow: `0 ${dripShadowLength}px ${dripShadowLength * 2}px rgba(139, 0, 0, 0.7), 0 0 15px rgba(204, 0, 0, 0.4)`,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function BloodDripComponent(props: MotionGraphicProps<BloodDripConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-blood-drip',
  title: 'Kinetic Blood Drip',
  description: 'Horror blood drip style with words dripping down and elongated red shadow effects',
  tags: ['kinetic', 'typography', 'horror', 'blood', 'drip', 'dark'],
  category: 'captions',
  component: BloodDripComponent as any,
  defaultConfig: {
    words: ['BLOOD', 'DARK', 'FEAR', 'NIGHT'],
    colors: ['#8B0000', '#CC0000', '#FF0000', '#660000'],
    bgColor: '#0a0a0a',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BLOOD', 'DARK', 'FEAR', 'NIGHT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#8B0000', '#CC0000', '#FF0000', '#660000'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
