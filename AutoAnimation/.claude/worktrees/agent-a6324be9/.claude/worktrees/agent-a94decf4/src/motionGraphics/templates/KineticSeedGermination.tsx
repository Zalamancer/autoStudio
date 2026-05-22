import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SeedGerminationConfig extends KineticBaseConfig {}

function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3
  if (t === 0) return 0
  if (t === 1) return 1
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInQuad(t: number): number {
  return t * t
}

// Deterministic pseudo-random
function rand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const BURST_COUNT = 12

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Soil-like subtle warmth at the bottom
    const shimmer = 0.06 + Math.sin(time * 0.5) * 0.02

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Soil gradient at the base */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '30%',
            background: `linear-gradient(0deg, rgba(100,60,20,${shimmer}) 0%, transparent 100%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    // Phase 1 (enter 0→0.3): seed pod — tiny compressed dot, scale nearly 0
    // Phase 2 (enter 0.3→0.7): germination burst — radial shards fly out + text scales up elastically
    // Phase 3 (enter 0.7→1): settles — shards fade, text holds
    // Exit: text compresses back into seed and sinks

    const enterEased = easeOutElastic(Math.min(1, Math.max(0, (enterProgress - 0.25) / 0.75)))
    const burstProgress = easeOutCubic(Math.min(1, Math.max(0, (enterProgress - 0.2) / 0.5)))

    let textScale = 1
    let textOpacity = 1

    if (phase === 'enter') {
      // Text emerges via elastic spring from scale 0
      textScale = Math.max(0, enterEased)
      textOpacity = Math.min(1, enterProgress * 3)
    } else if (phase === 'exit') {
      // Compress back to seed
      const eased = easeInQuad(exitProgress)
      textScale = 1 - eased * 0.98
      textOpacity = 1 - eased
    }

    // Burst shards — only visible during enter burst phase
    const shardOpacity = phase === 'enter'
      ? Math.max(0, 1 - (enterProgress > 0.5 ? (enterProgress - 0.5) * 2 : 0)) * Math.min(1, (enterProgress - 0.2) * 5)
      : 0

    const shards = Array.from({ length: BURST_COUNT }, (_, i) => {
      const angle = (i / BURST_COUNT) * Math.PI * 2 + rand(index * 17 + i) * 0.4
      const speed = 60 + rand(index * 31 + i) * 80
      const dist = burstProgress * speed
      const x = Math.cos(angle) * dist
      const y = Math.sin(angle) * dist
      const w = 3 + rand(i * 7 + index) * 5
      const h = 2 + rand(i * 13 + index) * 3
      const rot = angle * (180 / Math.PI) + 90
      // Gravity: slight downward pull over time
      const gravityY = burstProgress * burstProgress * 15

      return { x, y: y + gravityY, w, h, rot }
    })

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Seed germination burst shards */}
        {shards.map((s, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: s.w,
              height: s.h,
              transform: `translate(calc(-50% + ${s.x}px), calc(-50% + ${s.y}px)) rotate(${s.rot}deg)`,
              opacity: shardOpacity * (0.5 + rand(i * 3 + index) * 0.5),
              background: i % 3 === 0
                ? `rgba(120,200,60,0.85)`
                : i % 3 === 1
                ? `rgba(180,140,60,0.7)`
                : `rgba(220,200,100,0.6)`,
              borderRadius: 1,
            }}
          />
        ))}

        {/* The text itself — bursts out of the seed */}
        <div
          style={{
            transform: `scale(${textScale})`,
            opacity: textOpacity,
            transformOrigin: 'center center',
          }}
        >
          <div
            style={{
              fontFamily: "'Trebuchet MS', 'Arial Rounded MT Bold', sans-serif",
              fontSize: 'clamp(36px, 8.5vw, 122px)',
              fontWeight: 800,
              letterSpacing: '0.02em',
              color,
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              textShadow: `0 0 30px rgba(150,220,80,0.4), 0 2px 8px rgba(0,0,0,0.5)`,
            }}
          >
            {word}
          </div>
        </div>

        {/* Seed dot — visible before burst */}
        {phase === 'enter' && enterProgress < 0.4 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 12,
              height: 16,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              background: `linear-gradient(160deg, #c8a050, #7a4810)`,
              opacity: Math.max(0, 1 - enterProgress * 4),
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
            }}
          />
        )}
      </div>
    )
  },
}

function SeedGerminationComponent(props: MotionGraphicProps<SeedGerminationConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-seed-germination',
  title: 'Seed Germination Burst',
  description: 'Text erupts from a seed pod with a radial burst of organic shards, then settles with an elastic spring — mimicking seed germination.',
  tags: ['kinetic', 'typography', 'botanical', 'nature', 'seed', 'germination', 'burst', 'growth', 'organic', 'spring'],
  category: 'captions',
  component: SeedGerminationComponent as any,
  defaultConfig: {
    words: ['SPROUT', 'BLOOM', 'BURST', 'THRIVE'],
    colors: ['#A8E060', '#F0D060', '#80CC40', '#D4B840'],
    bgColor: '#0a1206',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SPROUT', 'BLOOM', 'BURST', 'THRIVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#A8E060', '#F0D060', '#80CC40', '#D4B840'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a1206', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
