import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BloodSplatterConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 from integer seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, width, height }: WordRenderProps) => {
    let opacity = 0

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 2)
    } else if (phase === 'hold') {
      opacity = 1
    } else {
      opacity = 1 - exitProgress
    }

    // Generate 6 splatter blobs with deterministic positions
    const splatCount = 6
    const splatters = Array.from({ length: splatCount }, (_, i) => {
      const seed = index * 97 + i * 31
      const cx = 30 + rand(seed) * 40 // 30%-70% of width
      const cy = 25 + rand(seed + 1) * 50 // 25%-75% of height
      const size = 60 + rand(seed + 2) * 120 // 60-180px
      const rot = rand(seed + 3) * 360

      // Splatter scale based on phase
      let splatScale = 0
      if (phase === 'enter') {
        // Stagger splatter bursts
        const delay = (i / splatCount) * 0.6
        const localProgress = Math.max(0, (enterProgress - delay) / (1 - delay))
        splatScale = Math.min(1, localProgress * 2.5)
      } else if (phase === 'hold') {
        splatScale = 1
      } else {
        splatScale = 1 - exitProgress * 0.3
      }

      // Drip effect during hold: elongate downward
      const dripY = phase === 'hold' ? holdProgress * 15 * rand(seed + 4) : 0

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${cx}%`,
            top: `${cy}%`,
            width: size,
            height: size + dripY,
            borderRadius: '50% 40% 60% 45% / 50% 55% 40% 60%',
            background: `radial-gradient(ellipse at ${30 + rand(seed + 5) * 40}% ${30 + rand(seed + 6) * 40}%, rgba(180, 0, 0, 0.9), rgba(100, 0, 0, 0.7) 60%, transparent 100%)`,
            transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${splatScale})`,
            opacity: opacity * (0.5 + rand(seed + 7) * 0.5),
            transition: 'none',
          }}
        />
      )
    })

    return (
      <>
        {splatters}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${phase === 'enter' ? 0.8 + enterProgress * 0.2 : 1})`,
            opacity,
            fontFamily: "Impact, 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color,
            textShadow: '0 0 20px rgba(139, 0, 0, 0.8), 0 2px 10px rgba(0, 0, 0, 0.9)',
            whiteSpace: 'nowrap',
            zIndex: 1,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function BloodSplatterComponent(props: MotionGraphicProps<BloodSplatterConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-blood-splatter',
  title: 'Kinetic Blood Splatter',
  description: 'Blood splatter reveal with expanding splatter shapes behind text, drips during hold, horror red on black',
  tags: ['kinetic', 'typography', 'horror', 'blood', 'splatter', 'dark', 'gore'],
  category: 'captions',
  component: BloodSplatterComponent as any,
  defaultConfig: {
    words: ['KILL', 'BLOOD', 'SCREAM', 'FEAR'],
    colors: ['#CC0000', '#FF0000', '#8B0000', '#B22222'],
    bgColor: '#050505',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['KILL', 'BLOOD', 'SCREAM', 'FEAR'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#CC0000', '#FF0000', '#8B0000', '#B22222'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050505', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
