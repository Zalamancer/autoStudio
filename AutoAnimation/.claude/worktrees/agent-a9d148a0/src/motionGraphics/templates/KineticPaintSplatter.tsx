import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PaintSplatterConfig extends KineticBaseConfig {}

// Paint splatter drops rendered as SVG ellipses that fly outward
function PaintDrops({ progress, color, seed }: { progress: number; color: string; seed: number }) {
  const numDrops = 12
  const drops = Array.from({ length: numDrops }, (_, i) => {
    const angle = (i / numDrops) * Math.PI * 2 + seed * 0.4
    const dist = (30 + ((seed * i + 17) % 50)) * progress
    const size = (3 + ((seed + i * 7) % 8)) * Math.max(0, 1 - progress * 0.6)
    const cx = Math.cos(angle) * dist
    const cy = Math.sin(angle) * dist * 0.5  // flatten for splat perspective
    const drop_opacity = progress * (1 - progress * 0.5) * (0.4 + ((i * seed) % 6) / 10)
    return { cx, cy, rx: size * 1.5, ry: size * 0.8, opacity: drop_opacity, angle }
  })

  return (
    <svg
      style={{ position: 'absolute', top: '50%', left: '50%', overflow: 'visible', pointerEvents: 'none' }}
      width={1}
      height={1}
    >
      {drops.map((d, i) => (
        <ellipse
          key={i}
          cx={d.cx}
          cy={d.cy}
          rx={Math.max(0.5, d.rx)}
          ry={Math.max(0.5, d.ry)}
          fill={color}
          opacity={d.opacity}
          transform={`rotate(${d.angle * 57.3}, ${d.cx}, ${d.cy})`}
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
        background: bgColor,
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 83 + 29

    let opacity = 0
    let scale = 1
    let splatterProgress = 0
    let shake = 0

    if (phase === 'enter') {
      // Paint thrown at the wall — impact + splatter explosion
      const impactT = Math.min(1, enterProgress * 3)  // fast impact
      scale = impactT < 0.6
        ? 0.1 + impactT * 1.5              // overshoot scale up
        : 1.9 - impactT * 0.9              // bounce back to 1
      opacity = Math.min(1, enterProgress * 4)
      splatterProgress = enterProgress
      shake = (1 - impactT) * 3
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      splatterProgress = 1
      shake = Math.sin(holdProgress * Math.PI * 8) * 0.8
    } else {
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.2
      splatterProgress = 1
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${shake}px), -50%) scale(${scale})`,
          opacity,
        }}
      >
        <PaintDrops progress={splatterProgress} color={color} seed={seed} />
        <div
          style={{
            fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 3,
            color,
            textShadow: [
              `2px 3px 0 rgba(0,0,0,0.25)`,
              `0 0 20px ${color}66`,
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

function PaintSplatterComponent(props: MotionGraphicProps<PaintSplatterConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-paint-splatter',
  title: 'Kinetic Paint Splatter',
  description: 'Paint thrown at a wall: impact burst with SVG droplets flying outward, then settled drip shadow',
  tags: ['kinetic', 'typography', 'paint', 'splatter', 'impact', 'art', 'graffiti'],
  category: 'captions',
  component: PaintSplatterComponent as any,
  defaultConfig: {
    words: ['SPLASH', 'DROP', 'HIT', 'BURST'],
    colors: ['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71'],
    bgColor: '#F5F5F0',
    cycleDuration: 1.1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SPLASH', 'DROP', 'HIT', 'BURST'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E74C3C', '#3498DB', '#F1C40F', '#2ECC71'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5F5F0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
