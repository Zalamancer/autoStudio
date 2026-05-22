import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OilSlickConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 from seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Compute an iridescent hue-shift for oil slick rainbow shimmer */
function iridescentColor(t: number, base: string): string {
  const hue = (t * 360) % 360
  return `hsl(${hue}, 80%, 60%)`
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Oil slick surface: dark base with slowly drifting iridescent blobs
    const blobs = Array.from({ length: 6 }, (_, i) => {
      const cx = width * (0.15 + 0.7 * rand(i * 31 + 7))
      const cy = height * (0.15 + 0.7 * rand(i * 47 + 13))
      const drift = Math.sin(t * 0.4 + i * 1.2) * 40
      const driftY = Math.cos(t * 0.3 + i * 0.8) * 30
      const size = 120 + rand(i * 19) * 200
      const hue = ((t * 30 + i * 60) % 360)
      const alpha = 0.12 + rand(i * 23) * 0.08
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: cx + drift - size / 2,
            top: cy + driftY - size / 2,
            width: size,
            height: size,
            borderRadius: '50%',
            background: `radial-gradient(ellipse at 40% 40%, hsla(${hue}, 90%, 55%, ${alpha}), hsla(${(hue + 120) % 360}, 85%, 40%, ${alpha * 0.5}), transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Dark oil surface tension pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${50 + Math.sin(t * 0.2) * 10}% ${50 + Math.cos(t * 0.15) * 10}%, rgba(20, 20, 30, 0.0), rgba(0, 0, 0, 0.4))`,
          }}
        />
        {blobs}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30 // approximate seconds for shimmer

    // Per-character iridescent shimmer
    const chars = word.split('').map((ch, ci) => {
      const charPhase = (t * 1.5 + ci * 0.3 + index * 0.7) % 1
      const shimmerHue = ((charPhase * 360 + ci * 45) % 360)
      const shimmerSat = 75 + Math.sin(t * 2 + ci) * 20

      let charOpacity = 1
      let charScale = 1
      let yShift = 0

      if (phase === 'enter') {
        // Characters rise from oil surface with surface tension delay
        const delay = ci / (word.length + 1) * 0.6
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.4))
        const ep = easeInOut(p)
        charOpacity = ep
        charScale = 0.3 + ep * 0.7
        yShift = (1 - ep) * 50
      } else if (phase === 'hold') {
        // Gentle undulation like oil surface tension
        yShift = Math.sin(t * 2.5 + ci * 0.5) * 3
        charScale = 1 + Math.sin(t * 1.8 + ci * 0.4) * 0.03
      } else {
        // Sink back into oil
        const delay = ci / (word.length + 1) * 0.4
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.6))
        const ep = easeInOut(p)
        charOpacity = 1 - ep
        yShift = ep * 40
        charScale = 1 - ep * 0.5
      }

      // Iridescent color with shifting rainbow
      const iridescent = `hsl(${shimmerHue}, ${shimmerSat}%, 65%)`
      // Blend between base color and iridescent based on shimmer wave
      const shimmerWave = Math.sin(t * 3 + ci * 0.8) * 0.5 + 0.5

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color: shimmerWave > 0.4 ? iridescent : color,
            opacity: charOpacity,
            transform: `translateY(${yShift}px) scale(${charScale})`,
            transition: 'none',
            textShadow: `0 0 ${8 + shimmerWave * 12}px hsla(${shimmerHue}, 90%, 50%, 0.5), 0 2px 4px rgba(0,0,0,0.6)`,
          }}
        >
          {ch}
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
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(44px, 12vw, 150px)',
          fontWeight: 700,
          fontStyle: 'italic',
          whiteSpace: 'nowrap',
          letterSpacing: 3,
        }}
      >
        {chars}
      </div>
    )
  },
}

function OilSlickComponent(props: MotionGraphicProps<OilSlickConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-oil-slick',
  title: 'Kinetic Oil Slick',
  description: 'Iridescent oil slick rainbow shimmer across text with dark surface tension. Characters rise from an oily surface with per-letter hue shifting.',
  tags: ['kinetic', 'typography', 'liquid', 'oil', 'iridescent', 'rainbow', 'shimmer', 'dark'],
  category: 'captions',
  component: OilSlickComponent as any,
  defaultConfig: {
    words: ['SLICK', 'PRISM', 'SHEEN', 'GLOW'],
    colors: ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981'],
    bgColor: '#0a0a12',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SLICK', 'PRISM', 'SHEEN', 'GLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a12', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
