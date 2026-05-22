import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LeafParticlesConfig extends KineticBaseConfig {}

// Individual leaf emoji/shape particles that swirl around
function FallingLeaves({ progress, color: _color, seed, frame }: { progress: number; color: string; seed: number; frame: number }) {
  if (progress <= 0) return null

  const leafShapes = ['🍂', '🍁', '🌿', '🍃']
  const numLeaves = 14

  const leaves = Array.from({ length: numLeaves }, (_, i) => {
    const startX = ((seed * (i + 1) * 137) % 200) - 100
    const startY = ((seed * (i + 1) * 79) % 60) - 80
    const speed = 0.5 + ((seed * (i + 3) * 31) % 10) / 10
    const swirl = Math.sin((frame ?? 0) * 0.05 + i * 0.7 + seed) * 30
    const cx = startX + swirl + (1 - progress) * startX * 0.5
    const cy = startY + progress * speed * 120
    const rot = ((frame ?? 0) * (2 + i % 3) + i * 45) % 360
    const size = 12 + ((seed * (i + 2)) % 10)
    const leafOpacity = progress < 0.2
      ? progress / 0.2
      : progress > 0.8
        ? (1 - progress) / 0.2
        : 0.8
    const leafIndex = (seed + i) % leafShapes.length
    return { cx, cy, rot, size, opacity: leafOpacity, leaf: leafShapes[leafIndex] }
  })

  return (
    <div
      style={{ position: 'absolute', top: '50%', left: '50%', pointerEvents: 'none', overflow: 'visible' }}
    >
      {leaves.map((l, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: l.cx,
            top: l.cy,
            transform: `rotate(${l.rot}deg)`,
            fontSize: l.size,
            opacity: l.opacity,
            pointerEvents: 'none',
          }}
        >
          {l.leaf}
        </div>
      ))}
    </div>
  )
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, #3a2a10 0%, ${bgColor} 60%, #1a3a0a 100%)`,
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 67 + 23

    let opacity = 0
    let scale = 1
    let translateY = 0
    let leavesProgress = 0

    if (phase === 'enter') {
      // Leaves swirl in to form the word
      opacity = Math.min(1, enterProgress * 2)
      scale = 0.7 + enterProgress * 0.3
      translateY = (1 - enterProgress) * 20
      leavesProgress = enterProgress
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Gentle sway
      translateY = Math.sin(holdProgress * Math.PI * 4 + seed) * 3
      leavesProgress = 0.5 + holdProgress * 0.5
    } else {
      // Word scatters into leaves
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.1
      leavesProgress = exitProgress
    }

    const autumnGlow = phase === 'hold'
      ? 8 + Math.sin(holdProgress * Math.PI * 6) * 3
      : 6

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
        <FallingLeaves
          progress={leavesProgress}
          color={color}
          seed={seed}
          frame={Math.floor(Date.now() / 16)}
        />
        <div
          style={{
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 700,
            letterSpacing: 5,
            color,
            textShadow: [
              `0 0 ${autumnGlow}px ${color}88`,
              `0 2px 8px rgba(80,40,0,0.5)`,
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

function LeafParticlesComponent(props: MotionGraphicProps<LeafParticlesConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-leaf-particles',
  title: 'Kinetic Leaf Particles',
  description: 'Autumn leaves swirl around text on entry and scatter outward on exit with gentle wind sway',
  tags: ['kinetic', 'typography', 'leaves', 'autumn', 'fall', 'particles', 'nature', 'organic'],
  category: 'captions',
  component: LeafParticlesComponent as any,
  defaultConfig: {
    words: ['AUTUMN', 'FALL', 'DRIFT', 'CHANGE'],
    colors: ['#D4771C', '#A0522D', '#C0392B', '#E67E22'],
    bgColor: '#8B4513',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['AUTUMN', 'FALL', 'DRIFT', 'CHANGE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D4771C', '#A0522D', '#C0392B', '#E67E22'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#8B4513', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.4, max: 6, group: 'Timing' },
  ],
})
