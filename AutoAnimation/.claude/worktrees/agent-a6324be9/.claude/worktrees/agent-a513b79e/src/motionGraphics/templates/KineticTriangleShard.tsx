import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TriangleShardConfig extends KineticBaseConfig {
  shardColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

// Deterministic pseudo-random for consistent shard placement
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

const SHARD_COUNT = 12

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const shards = Array.from({ length: SHARD_COUNT }, (_, i) => {
      const angle = (i / SHARD_COUNT) * Math.PI * 2
      const r1 = seededRandom(i * 3 + 1)
      const r2 = seededRandom(i * 3 + 2)
      const r3 = seededRandom(i * 3 + 3)

      // Triangle vertices relative to center
      const size = 80 + r1 * 120
      const cx = width / 2 + Math.cos(angle) * (40 + r2 * 60)
      const cy = height / 2 + Math.sin(angle) * (30 + r3 * 40)

      // How far the shard flies out
      const flyDistance = 300 + r1 * 400
      const flyX = Math.cos(angle) * flyDistance
      const flyY = Math.sin(angle) * flyDistance
      const rotAngle = (r2 - 0.5) * 360

      let translateX = 0
      let translateY = 0
      let rotation = 0
      let opacity = 1

      if (phase === 'enter') {
        const ease = easeOutCubic(enterProgress)
        translateX = flyX * ease
        translateY = flyY * ease
        rotation = rotAngle * ease
        opacity = 1 - ease * 0.7
      } else if (phase === 'hold') {
        translateX = flyX * (1 + holdProgress * 0.05 * Math.sin(i * 2.5))
        translateY = flyY * (1 + holdProgress * 0.05 * Math.cos(i * 2.5))
        rotation = rotAngle
        opacity = 0.3
      } else {
        const ease = easeInCubic(exitProgress)
        translateX = flyX * (1 - ease)
        translateY = flyY * (1 - ease)
        rotation = rotAngle * (1 - ease)
        opacity = 0.3 + ease * 0.7
      }

      // CSS clip-path triangle
      const p1x = 50
      const p1y = 0
      const p2x = 0
      const p2y = 100
      const p3x = 100
      const p3y = 100

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: cx - size / 2,
            top: cy - size / 2,
            width: size,
            height: size,
            clipPath: `polygon(${p1x}% ${p1y}%, ${p2x}% ${p2y}%, ${p3x}% ${p3y}%)`,
            background: `linear-gradient(${45 + i * 30}deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))`,
            backdropFilter: 'blur(2px)',
            transform: `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg)`,
            opacity,
          }}
        />
      )
    })

    let textOpacity = 0
    let textScale = 0.8

    if (phase === 'enter') {
      textOpacity = easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7))
      textScale = 0.8 + easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7)) * 0.2
    } else if (phase === 'hold') {
      textOpacity = 1
      textScale = 1
    } else {
      textOpacity = 1 - easeInCubic(exitProgress)
      textScale = 1
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {shards}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${textScale})`,
            opacity: textOpacity,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function TriangleShardComponent(props: MotionGraphicProps<TriangleShardConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-triangle-shard',
  title: 'Kinetic Triangle Shard',
  description: 'Background shatters into triangular shards that fly outward revealing text. Shards drift at edges during hold, then return to cover text on exit.',
  tags: ['kinetic', 'typography', 'triangle', 'shatter', 'geometric', 'abstract', 'shard'],
  category: 'captions',
  component: TriangleShardComponent as any,
  defaultConfig: {
    words: ['SHATTER', 'BREAK', 'REVEAL', 'BOLD'],
    colors: ['#FFFFFF', '#E0E0FF', '#FFFFFF', '#E0E0FF'],
    bgColor: '#0a0a1a',
    cycleDuration: 1.5,
    shardColor: '#ffffff',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SHATTER', 'BREAK', 'REVEAL', 'BOLD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#E0E0FF', '#FFFFFF', '#E0E0FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
    { key: 'shardColor', label: 'Shard Color', type: 'color', defaultValue: '#ffffff', group: 'Animation' },
  ],
})
