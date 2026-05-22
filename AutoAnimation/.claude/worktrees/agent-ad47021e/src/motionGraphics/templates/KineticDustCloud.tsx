import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DustCloudConfig extends KineticBaseConfig {}

// Dust/sand mote particles that swirl around
function DustMotes({ progress, color, seed }: { progress: number; color: string; seed: number }) {
  if (progress <= 0.02) return null

  const numMotes = 20
  const motes = Array.from({ length: numMotes }, (_, i) => {
    const angle = ((seed * i * 137) % 360) * (Math.PI / 180)
    const baseRadius = 20 + ((seed + i * 11) % 60)
    const radius = baseRadius * Math.sin(progress * Math.PI)  // expand then contract
    const cx = Math.cos(angle) * radius + Math.sin(angle * 2 + seed) * 15 * progress
    const cy = Math.sin(angle) * radius * 0.5   // flat dust cloud
    const size = (1 + ((seed * (i + 1)) % 3)) * Math.min(1, progress * 3) * Math.max(0, 1 - (progress - 0.6) * 2.5)
    const moteOpacity = Math.sin(progress * Math.PI) * (0.2 + ((i * seed) % 5) / 15)
    return { cx, cy, size, opacity: moteOpacity }
  })

  return (
    <svg
      style={{ position: 'absolute', top: '50%', left: '50%', overflow: 'visible', pointerEvents: 'none' }}
      width={1}
      height={1}
    >
      {motes.map((m, i) => (
        <circle key={i} cx={m.cx} cy={m.cy} r={Math.max(0.3, m.size)} fill={color} opacity={m.opacity} />
      ))}
    </svg>
  )
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, ${bgColor} 0%, #6B4A20 100%)`,
      }}
    >
      {/* Dusty haze */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 70%, rgba(200,160,80,0.08) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 89 + 41

    let opacity = 0
    let blur = 0
    let scale = 1
    let translateX = 0
    let dustProgress = 0

    if (phase === 'enter') {
      // Coalesce from a swirling dust cloud
      opacity = enterProgress * enterProgress
      blur = (1 - enterProgress) * 14
      scale = 0.8 + enterProgress * 0.2
      translateX = (1 - enterProgress) * ((seed % 2 === 0) ? 30 : -30)
      dustProgress = enterProgress
    } else if (phase === 'hold') {
      opacity = 1
      blur = 0
      // Dust settles: very subtle shimmer
      const shimmer = Math.sin(holdProgress * Math.PI * 6 + seed) * 0.01
      scale = 1 + shimmer
      dustProgress = 0.3 + holdProgress * 0.3
    } else {
      // Disintegrate back to dust
      opacity = 1 - exitProgress
      blur = exitProgress * 16
      scale = 1 + exitProgress * 0.05
      dustProgress = exitProgress
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
        }}
      >
        <DustMotes progress={dustProgress} color={color} seed={seed} />
        <div
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color,
            textShadow: [
              `0 0 12px ${color}88`,
              `0 2px 6px rgba(100,60,0,0.4)`,
            ].join(', '),
            whiteSpace: 'nowrap',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function DustCloudComponent(props: MotionGraphicProps<DustCloudConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dust-cloud',
  title: 'Kinetic Dust Cloud',
  description: 'Swirling dust motes coalesce into text from a desert haze then scatter back into the wind',
  tags: ['kinetic', 'typography', 'dust', 'sand', 'particles', 'desert', 'wind', 'organic'],
  category: 'captions',
  component: DustCloudComponent as any,
  defaultConfig: {
    words: ['DESERT', 'WIND', 'DRIFT', 'VAST'],
    colors: ['#D4A86A', '#C49A50', '#E5C080', '#B88040'],
    bgColor: '#8B6914',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DESERT', 'WIND', 'DRIFT', 'VAST'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D4A86A', '#C49A50', '#E5C080', '#B88040'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#8B6914', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.4, max: 6, group: 'Timing' },
  ],
})
