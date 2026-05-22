import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Each character arcs in from a different direction, like candy being tossed.
// Per-char stagger with elastic landing. Rainbow gradient background pulses.
// Sparkle bursts appear near random letters during hold.
// Exit: chars scatter outward in all directions like confetti.
// Perfect for day-in-my-life vlogs, cooking videos, cooking content.

interface CandyTossConfig extends KineticBaseConfig {
  arcHeight: number
}

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  const p = 0.4
  return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * 2 * Math.PI) / p) + 1
}

function easeInBack(t: number): number {
  const c1 = 1.70158
  return c1 * t * t * t - c1 * t * t
}

// Deterministic sparkle positions around each char
function buildSparkles(seed: number): Array<{ x: number; y: number; size: number; delay: number }> {
  const out = []
  for (let i = 0; i < 5; i++) {
    const s = seed + i * 41 + 3
    out.push({
      x: ((s * 37) % 60) - 30,
      y: ((s * 53) % 60) - 30,
      size: 4 + ((s * 11) % 6),
      delay: (s % 8) / 10,
    })
  }
  return out
}

const GRADIENT_PAIRS = [
  ['#FF6B6B', '#FFE66D'],
  ['#A8E6CF', '#FFD3B6'],
  ['#FF8B94', '#FFEAA7'],
  ['#DDA0DD', '#98FB98'],
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Rotating hue-shift on a fun pastel gradient
    const rot = (t * 30) % 360
    const pulse = 0.5 + Math.sin(t * 2) * 0.06
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Animated rainbow arc overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `conic-gradient(from ${rot}deg at 50% 120%,
              rgba(255,107,107,${pulse * 0.12}),
              rgba(255,230,109,${pulse * 0.1}),
              rgba(168,230,207,${pulse * 0.1}),
              rgba(200,137,255,${pulse * 0.12}),
              rgba(255,107,107,${pulse * 0.12})
            )`,
          }}
        />
        {/* Polka dots — playful background texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 2px, transparent 2px)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame = 0 }: WordRenderProps) => {
    const chars = word.split('')
    const total = chars.length || 1
    const seedBase = index * 83 + 11

    const charElements = chars.map((ch, ci) => {
      const charSeed = seedBase + ci * 29
      const staggerDelay = (ci / (total + 1)) * 0.45
      const staggeredEnter = Math.max(0, Math.min(1, (enterProgress - staggerDelay) / (1 - staggerDelay * 0.5)))
      const staggeredExit = Math.max(0, Math.min(1, (exitProgress - (ci / total) * 0.3) / 0.7))

      // Arc direction: each char comes from a different angle (deterministic)
      const arcAngle = ((charSeed * 47) % 240) - 120  // -120..+120 degrees from top
      const rad = (arcAngle * Math.PI) / 180
      const arcDist = 0.6 + ((charSeed % 5) * 0.08)  // 0.6..1.0 of height

      let tx = 0
      let ty = 0
      let scale = 1
      let rotation = 0
      let charOpacity = 1

      if (phase === 'enter') {
        if (staggeredEnter < 1) {
          const eased = easeOutElastic(staggeredEnter)
          const startX = Math.sin(rad) * width * arcDist
          const startY = -Math.cos(rad) * height * arcDist
          tx = startX * (1 - eased)
          ty = startY * (1 - eased)
          scale = 0.3 + eased * 0.7
          rotation = ((charSeed % 7) - 3) * 30 * (1 - Math.min(1, staggeredEnter * 2))
          charOpacity = Math.min(1, staggeredEnter * 3)
        }
      } else if (phase === 'hold') {
        // Gentle independent wobble per character
        const wobbleT = holdProgress * Math.PI * 4 + ci * 0.8
        ty = Math.sin(wobbleT + ci) * 4
        rotation = Math.sin(wobbleT * 0.7 + ci * 0.5) * 2.5
        scale = 1 + Math.sin(wobbleT * 1.3 + ci * 0.3) * 0.03
      } else {
        // Scatter outward — each char flies to a random direction
        const exitAngle = (charSeed * 73 % 360) * (Math.PI / 180)
        const speed = 0.5 + (charSeed % 5) * 0.12
        const ep = easeInBack(staggeredExit)
        tx = Math.cos(exitAngle) * width * speed * ep
        ty = Math.sin(exitAngle) * height * speed * ep
        rotation = ((charSeed % 11) - 5) * 60 * ep
        scale = 1 - ep * 0.5
        charOpacity = Math.max(0, 1 - staggeredExit * 2)
      }

      // Rainbow per-char coloring during hold
      const hueShift = (ci / total) * 60
      const charColor = phase === 'hold'
        ? `hsl(${parseInt(color.replace('#', ''), 16) % 360 + hueShift + holdProgress * 20}, 90%, 55%)`
        : color

      // Sparkles for this char during hold
      const sparkles = buildSparkles(charSeed)
      const showSparkles = phase === 'hold'

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            position: 'relative',
            transform: `translate(${tx}px, ${ty}px) scale(${scale}) rotate(${rotation}deg)`,
            opacity: charOpacity,
            color: charColor,
            textShadow: `2px 3px 0 rgba(0,0,0,0.25), -1px -1px 0 rgba(255,255,255,0.4)`,
          }}
        >
          {ch === ' ' ? '\u00A0' : ch}
          {/* Sparkle burst */}
          {showSparkles && sparkles.map((sp, si) => {
            const sparkPhase = (holdProgress * 3 + sp.delay) % 1
            const sparkOpacity = sparkPhase < 0.5
              ? sparkPhase / 0.5
              : (1 - sparkPhase) / 0.5
            return (
              <div
                key={si}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: sp.size,
                  height: sp.size,
                  borderRadius: '50%',
                  background: '#fff',
                  transform: `translate(calc(-50% + ${sp.x}px), calc(-50% + ${sp.y}px)) scale(${sparkOpacity})`,
                  opacity: sparkOpacity * 0.9,
                  pointerEvents: 'none',
                }}
              />
            )
          })}
        </span>
      )
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
        <div
          style={{
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 4,
            whiteSpace: 'nowrap',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {charElements}
        </div>
      </div>
    )
  },
}

function CandyTossComponent(props: MotionGraphicProps<CandyTossConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-candy-toss',
  title: 'Kinetic Candy Toss',
  description:
    'Each letter arcs in from a different direction with elastic landing, like candy being tossed. Sparkle bursts twinkle on letters during hold. On exit, chars scatter like confetti. Bright rainbow energy for vlogs and cooking content.',
  tags: ['kinetic', 'typography', 'candy', 'toss', 'bounce', 'elastic', 'rainbow', 'sparkle', 'confetti', 'playful', 'fun', 'vlog', 'cooking', 'energetic'],
  category: 'captions',
  component: CandyTossComponent as any,
  defaultConfig: {
    words: ['YUMMY!', 'TASTE', 'RECIPE', 'COOK'],
    colors: ['#FF3CAC', '#F7971E', '#7FFF00', '#00D4FF'],
    bgColor: '#FFF8E1',
    cycleDuration: 1.4,
    arcHeight: 80,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['YUMMY!', 'TASTE', 'RECIPE', 'COOK'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Letter Colors',
      type: 'text-array',
      defaultValue: ['#FF3CAC', '#F7971E', '#7FFF00', '#00D4FF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF8E1', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'arcHeight',
      label: 'Arc Height %',
      type: 'number',
      defaultValue: 80,
      min: 30,
      max: 150,
      group: 'Animation',
    },
  ],
})
