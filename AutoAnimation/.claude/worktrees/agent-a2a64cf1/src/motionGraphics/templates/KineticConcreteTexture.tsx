import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ConcreteTextureConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Concrete aggregate particles
    const particles = Array.from({ length: 30 }, (_, i) => {
      const x = seededRand(i * 37 + 5) * 100
      const y = seededRand(i * 53 + 11) * 100
      const size = 2 + seededRand(i * 71 + 3) * 6
      const opacity = 0.02 + seededRand(i * 97 + 7) * 0.06
      const isLight = seededRand(i * 23) > 0.5
      return { x, y, size, opacity, isLight }
    })

    // Hairline cracks
    const cracks = Array.from({ length: 5 }, (_, i) => {
      const x1 = seededRand(i * 43 + 100) * width
      const y1 = seededRand(i * 67 + 200) * height
      const angle = seededRand(i * 89 + 300) * Math.PI
      const len = 40 + seededRand(i * 101 + 400) * 80
      const x2 = x1 + Math.cos(angle) * len
      const y2 = y1 + Math.sin(angle) * len
      return { x1, y1, x2, y2 }
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Noise texture overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(0,0,0,0.03) 0%, transparent 50%), radial-gradient(circle at 80% 30%, rgba(0,0,0,0.04) 0%, transparent 50%), radial-gradient(circle at 50% 80%, rgba(255,255,255,0.02) 0%, transparent 50%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Aggregate specks */}
        {particles.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: '40%',
              background: p.isLight ? `rgba(255,255,255,${p.opacity})` : `rgba(0,0,0,${p.opacity})`,
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Hairline cracks */}
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {cracks.map((c, i) => (
            <line
              key={i}
              x1={c.x1}
              y1={c.y1}
              x2={c.x2}
              y2={c.y2}
              stroke="rgba(0,0,0,0.06)"
              strokeWidth={0.5}
            />
          ))}
        </svg>
        {/* Form lines -- horizontal concrete joint */}
        <div
          style={{
            position: 'absolute',
            top: '33%',
            left: 0,
            right: 0,
            height: 1,
            background: 'rgba(0,0,0,0.04)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '66%',
            left: 0,
            right: 0,
            height: 1,
            background: 'rgba(0,0,0,0.04)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const seed = index * 59 + 23

    if (phase === 'enter') {
      // Text revealed like concrete being poured / troweled into shape
      // Use vertical wipe with rough edge
      const wipeProgress = Math.min(1, enterProgress * 1.3)
      const roughEdge = Math.sin(enterProgress * 20 + seed) * 3

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
              fontFamily: "'Arial Black', 'Helvetica Neue', Impact, sans-serif",
              fontSize: 'clamp(48px, 13vw, 170px)',
              fontWeight: 900,
              color,
              textTransform: 'uppercase',
              letterSpacing: -2,
              lineHeight: 0.9,
              whiteSpace: 'nowrap',
              clipPath: `inset(${100 - wipeProgress * 100}% 0 0 0)`,
              textShadow: `2px 2px 0 rgba(0,0,0,0.15), -1px -1px 0 rgba(255,255,255,0.08)`,
            }}
          >
            {word}
          </div>
          {/* Wet concrete sheen */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(180deg, transparent ${(1 - wipeProgress) * 100}%, rgba(255,255,255,0.08) ${(1 - wipeProgress) * 100 + 5}%, transparent ${(1 - wipeProgress) * 100 + 15}%)`,
              pointerEvents: 'none',
            }}
          />
        </div>
      )
    } else if (phase === 'hold') {
      // Solid with subtle surface variation
      const shimmer = Math.sin(holdProgress * Math.PI * 2) * 0.03

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
              fontFamily: "'Arial Black', 'Helvetica Neue', Impact, sans-serif",
              fontSize: 'clamp(48px, 13vw, 170px)',
              fontWeight: 900,
              color,
              textTransform: 'uppercase',
              letterSpacing: -2,
              lineHeight: 0.9,
              whiteSpace: 'nowrap',
              textShadow: `2px 2px 0 rgba(0,0,0,0.15), -1px -1px 0 rgba(255,255,255,${0.06 + shimmer})`,
            }}
          >
            {word}
          </div>
          {/* Subtle form-tie holes */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: -16,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.12)',
              transform: 'translateY(-50%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              right: -16,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.12)',
              transform: 'translateY(-50%)',
            }}
          />
        </div>
      )
    } else {
      // Exit: crumble away, text fragments fall
      const crumble = exitProgress
      const chars = word.split('').map((ch, ci) => {
        const delay = ci / word.length * 0.3
        const p = Math.max(0, Math.min(1, (crumble - delay) / 0.7))
        const fallY = p * (30 + seededRand(ci * 41 + seed) * 50)
        const rotate = p * (seededRand(ci * 67 + seed) * 20 - 10)
        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              transform: `translateY(${fallY}px) rotate(${rotate}deg)`,
              opacity: 1 - p,
              color,
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
            fontFamily: "'Arial Black', 'Helvetica Neue', Impact, sans-serif",
            fontSize: 'clamp(48px, 13vw, 170px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: -2,
            lineHeight: 0.9,
            whiteSpace: 'nowrap',
            textShadow: '2px 2px 0 rgba(0,0,0,0.15)',
          }}
        >
          {chars}
        </div>
      )
    }
  },
}

function ConcreteTextureComponent(props: MotionGraphicProps<ConcreteTextureConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-concrete-texture',
  title: 'Kinetic Concrete Texture',
  description: 'Brutalist concrete-textured text with aggregate particles, hairline cracks, poured-in reveal, and crumbling exit animation',
  tags: ['kinetic', 'typography', 'concrete', 'brutalist', 'architecture', 'texture', 'industrial'],
  category: 'captions',
  component: ConcreteTextureComponent as any,
  defaultConfig: {
    words: ['BRUT', 'FORM', 'CAST', 'SLAB'],
    colors: ['#4A4A4A', '#5A5A5A', '#4A4A4A', '#5A5A5A'],
    bgColor: '#C4BEB4',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BRUT', 'FORM', 'CAST', 'SLAB'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#4A4A4A', '#5A5A5A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#C4BEB4', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
