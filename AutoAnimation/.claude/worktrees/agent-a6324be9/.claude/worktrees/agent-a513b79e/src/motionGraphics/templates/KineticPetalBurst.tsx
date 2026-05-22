import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PetalBurstConfig extends KineticBaseConfig {}

// SVG petal shapes that radiate outward from the word
function PetalRing({ progress, color, seed }: { progress: number; color: string; seed: number }) {
  if (progress <= 0) return null

  const numPetals = 10
  const petals = Array.from({ length: numPetals }, (_, i) => {
    const angle = (i / numPetals) * Math.PI * 2 + seed * 0.3
    const dist = progress * 70 + ((seed + i * 13) % 20)
    const cx = Math.cos(angle) * dist
    const cy = Math.sin(angle) * dist * 0.65   // slightly flat for top-down look
    const rot = angle * (180 / Math.PI) + 90
    const petalOpacity = progress < 0.25
      ? progress / 0.25
      : (1 - (progress - 0.25) / 0.75) * 0.9
    const size = (8 + ((seed + i * 7) % 6)) * Math.max(0, 1 - progress * 0.5)
    return { cx, cy, rot, size, opacity: petalOpacity }
  })

  return (
    <svg
      style={{ position: 'absolute', top: '50%', left: '50%', overflow: 'visible', pointerEvents: 'none' }}
      width={1}
      height={1}
    >
      {petals.map((p, i) => (
        <ellipse
          key={i}
          cx={p.cx}
          cy={p.cy}
          rx={p.size}
          ry={p.size * 0.45}
          fill={color}
          opacity={p.opacity}
          transform={`rotate(${p.rot}, ${p.cx}, ${p.cy})`}
        />
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
        background: `radial-gradient(ellipse at center, ${bgColor}ee 0%, #1a0a1a 100%)`,
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 59 + 37

    let opacity = 0
    let scale = 1
    let translateY = 0
    let petalProgress = 0

    if (phase === 'enter') {
      // Petals converge inward as text appears (reversed: petals fly in)
      opacity = Math.min(1, enterProgress * 2.5)
      scale = 0.5 + enterProgress * 0.5
      translateY = (1 - enterProgress) * 15
      petalProgress = enterProgress
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Gentle float
      translateY = Math.sin(holdProgress * Math.PI * 3 + seed) * 3
      petalProgress = 1
    } else {
      // Petals burst outward as word dissolves
      opacity = 1 - exitProgress
      petalProgress = exitProgress
    }

    const flowerGlow = phase === 'hold'
      ? 12 + Math.sin(holdProgress * Math.PI * 5) * 5
      : 8

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
        }}
      >
        <PetalRing progress={petalProgress} color={color} seed={seed} />
        <div
          style={{
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 400,
            fontStyle: 'italic',
            letterSpacing: 6,
            color,
            textShadow: [
              `0 0 ${flowerGlow}px ${color}`,
              `0 0 ${flowerGlow * 2.5}px ${color}55`,
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

function PetalBurstComponent(props: MotionGraphicProps<PetalBurstConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-petal-burst',
  title: 'Kinetic Petal Burst',
  description: 'Cherry blossom petals converge to form the word then burst outward as it exits',
  tags: ['kinetic', 'typography', 'petals', 'flowers', 'blossom', 'spring', 'nature', 'particles'],
  category: 'captions',
  component: PetalBurstComponent as any,
  defaultConfig: {
    words: ['BLOOM', 'SPRING', 'LOVE', 'PETAL'],
    colors: ['#FFB7C5', '#FF69B4', '#FFD1DC', '#FFC0CB'],
    bgColor: '#2D1A2D',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BLOOM', 'SPRING', 'LOVE', 'PETAL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFB7C5', '#FF69B4', '#FFD1DC', '#FFC0CB'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2D1A2D', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.4, max: 6, group: 'Timing' },
  ],
})
