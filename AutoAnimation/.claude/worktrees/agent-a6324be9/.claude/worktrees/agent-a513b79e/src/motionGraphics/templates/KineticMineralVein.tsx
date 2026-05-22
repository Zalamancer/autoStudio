import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MineralVeinConfig extends KineticBaseConfig {
  veinColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

// Deterministic pseudo-random [0,1]
function rand(s: number): number {
  const x = Math.sin(s * 431.7 + 193.1) * 21983.7
  return x - Math.floor(x)
}

// Generate branching mineral vein paths across the background
function buildVein(x0: number, y0: number, angle: number, length: number, depth: number, seed: number): string[] {
  const lines: string[] = []
  const x1 = x0 + Math.cos(angle) * length
  const y1 = y0 + Math.sin(angle) * length
  lines.push(`M${x0.toFixed(1)},${y0.toFixed(1)} L${x1.toFixed(1)},${y1.toFixed(1)}`)
  if (depth > 0 && length > 6) {
    // Two child branches at diverging angles
    const branchAngle1 = angle + (rand(seed) - 0.4) * 0.9
    const branchAngle2 = angle - (rand(seed + 7) - 0.4) * 0.9
    const childLen = length * (0.55 + rand(seed + 3) * 0.2)
    lines.push(...buildVein(x1, y1, branchAngle1, childLen, depth - 1, seed * 3 + 11))
    if (rand(seed + 13) > 0.45) {
      lines.push(...buildVein(x1, y1, branchAngle2, childLen * 0.75, depth - 1, seed * 5 + 7))
    }
  }
  return lines
}

// Pre-generate a fixed set of background vein seed paths
const BG_VEINS = Array.from({ length: 5 }, (_, i) => {
  const angle = (i / 5) * Math.PI * 2 + 0.3
  return buildVein(50, 50, angle, 30, 2, i * 137 + 41)
}).flat()

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Slow pulsing mineral glow across background veins
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          backgroundImage: `
            repeating-linear-gradient(
              60deg,
              transparent,
              transparent 12px,
              rgba(255,255,255,0.007) 12px,
              rgba(255,255,255,0.007) 13px
            )
          `,
        }}
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.18 }}
        >
          {BG_VEINS.map((d, i) => {
            const pulse = 0.4 + Math.sin(t * 1.2 + i * 0.7) * 0.25
            return (
              <path
                key={i}
                d={d}
                stroke="rgba(200,160,80,1)"
                strokeWidth="0.25"
                fill="none"
                strokeLinecap="round"
                opacity={pulse}
              />
            )
          })}
        </svg>
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    width,
    height,
    frame,
  }: WordRenderProps) => {
    const t = (frame ?? 0) / 30
    const seed = index * 97 + 23
    const chars = word.split('')
    const totalChars = chars.length

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Per-character mineral vein threads that "fill in" the letter shapes */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            whiteSpace: 'nowrap',
            alignItems: 'center',
          }}
        >
          {chars.map((ch, ci) => {
            const charSeed = seed + ci * 53
            const stagger = (ci / totalChars) * 0.45

            let opacity = 0
            let veinProgress = 0
            let shimmer = 0
            let scale = 1

            if (phase === 'enter') {
              const p = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger * 0.6)))
              // Vein "threading" in: text appears with growing brightness from left-to-right
              // as if mineral ore is filling in from a spreading solution
              veinProgress = easeOutCubic(p)
              opacity = Math.min(1, p * 2.5)
              scale = 0.92 + easeOutCubic(p) * 0.08
              shimmer = veinProgress
            } else if (phase === 'hold') {
              opacity = 1
              veinProgress = 1
              scale = 1
              // Ore veins pulse: subtle brightness oscillation per character
              shimmer = 0.7 + Math.sin(t * 3.5 + ci * 0.9 + seed * 0.1) * 0.3
            } else {
              // Exit: mineral dissolves — each char flakes away at staggered times
              const exitStagger = rand(charSeed + 11) * 0.3
              const p = Math.max(0, Math.min(1, (exitProgress - exitStagger) / 0.7))
              const ep = easeInOutQuad(p)
              opacity = 1 - ep
              scale = 1 + ep * 0.08
              veinProgress = 1 - ep
            }

            // Ore brightness: metallic mineral glint — copper, gold, pyrite
            const r = parseInt(color.slice(1, 3), 16)
            const g = parseInt(color.slice(3, 5), 16)
            const b = parseInt(color.slice(5, 7), 16)

            // Multiple shadow layers simulate vein depth in rock
            const veinDepth1 = `2px 2px 0 rgba(0,0,0,0.55)`
            const veinDepth2 = `1px 1px 0 rgba(0,0,0,0.35)`
            const veinHighlight = `${-1}px ${-1}px 0 rgba(255,220,120,${veinProgress * 0.35})`
            const veinGlow = `0 0 ${6 + shimmer * 14}px rgba(${r},${g},${b},${veinProgress * 0.5})`

            // Build a vein-crack clipPath for partial reveal on enter
            // The vein "fills" from left — reveal slices through using a horizontal progress mask
            const revealClip =
              phase === 'enter' && veinProgress < 0.98
                ? `polygon(0% 0%, ${veinProgress * 100 + 8}% 0%, ${veinProgress * 100 + 8}% 100%, 0% 100%)`
                : undefined

            return (
              <span
                key={ci}
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontSize: 'clamp(40px, 10vw, 140px)',
                  fontWeight: 900,
                  letterSpacing: '0.03em',
                  color,
                  opacity,
                  transform: `scale(${scale})`,
                  transformOrigin: 'center bottom',
                  clipPath: revealClip,
                  textShadow: [veinDepth1, veinDepth2, veinHighlight, veinGlow].join(', '),
                  // Inner metallic luster via text-stroke-like multi-outline
                  WebkitTextStroke: `0.5px rgba(255,200,80,${veinProgress * 0.25})`,
                }}
              >
                {ch}
                {/* Mineral glint overlay — a bright flash that sweeps the character on reveal */}
                {phase === 'enter' && veinProgress > 0.2 && veinProgress < 0.9 && (
                  <span
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: `linear-gradient(90deg, transparent ${(veinProgress - 0.15) * 100}%, rgba(255,230,140,0.3) ${veinProgress * 100}%, transparent ${(veinProgress + 0.12) * 100}%)`,
                      pointerEvents: 'none',
                      mixBlendMode: 'screen',
                    }}
                  />
                )}
              </span>
            )
          })}
        </div>

        {/* Decorative vein lines that radiate outward from the word on hold */}
        {phase === 'hold' && (
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            {Array.from({ length: 6 }, (_, i) => {
              const angle = (i / 6) * Math.PI * 2 + holdProgress * 0.5
              const startX = width / 2 + Math.cos(angle) * (width * 0.08)
              const startY = height / 2 + Math.sin(angle) * (height * 0.04)
              const endX = startX + Math.cos(angle + (rand(i * 17) - 0.5) * 0.8) * (width * 0.12)
              const endY = startY + Math.sin(angle + (rand(i * 23) - 0.5) * 0.8) * (height * 0.08)
              const pulse = 0.15 + Math.sin(t * 2.5 + i * 1.3) * 0.08
              return (
                <line
                  key={i}
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke={color}
                  strokeWidth={0.8}
                  opacity={pulse}
                  strokeLinecap="round"
                />
              )
            })}
          </svg>
        )}
      </div>
    )
  },
}

function MineralVeinComponent(props: MotionGraphicProps<MineralVeinConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-mineral-vein',
  title: 'Mineral Vein',
  description:
    'Text materializes like ore threading through rock — each character fills in left-to-right with a metallic sweep, as if copper or pyrite mineral veins are precipitating through stone. Background carries branching geological vein patterns.',
  tags: ['kinetic', 'typography', 'mineral', 'vein', 'geology', 'ore', 'copper', 'pyrite', 'rock', 'metal'],
  category: 'captions',
  component: MineralVeinComponent as any,
  defaultConfig: {
    words: ['ORE', 'VEIN', 'FORGE', 'MINE'],
    colors: ['#D4A040', '#C89030', '#E8B850', '#B87828'],
    bgColor: '#1C1410',
    cycleDuration: 1.8,
    veinColor: '#D4A040',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['ORE', 'VEIN', 'FORGE', 'MINE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#D4A040', '#C89030', '#E8B850', '#B87828'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1C1410', group: 'Style' },
    { key: 'veinColor', label: 'Vein Color', type: 'color', defaultValue: '#D4A040', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.6,
      max: 5,
      group: 'Timing',
    },
  ],
})
