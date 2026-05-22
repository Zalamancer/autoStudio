import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MyceliumSpreadConfig extends KineticBaseConfig {
  networkDensity: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

/** Hypha strand endpoint positions radiating from a center */
function hyphaPoints(
  cx: number,
  cy: number,
  n: number,
  spread: number,
  t: number,
  seed: number,
): Array<{ x: number; y: number; opacity: number }> {
  return Array.from({ length: n }, (_, i) => {
    const baseAngle = (i / n) * Math.PI * 2
    const wander = Math.sin(t * 0.7 + seed + i * 0.9) * 0.4
    const angle = baseAngle + wander
    const dist = spread * (0.5 + Math.sin(t * 0.5 + i * 1.3 + seed) * 0.3)
    const growth = Math.min(1, t * 0.5 + i * 0.05)
    return {
      x: cx + Math.cos(angle) * dist * growth,
      y: cy + Math.sin(angle) * dist * growth,
      opacity: 0.04 + growth * 0.06,
    }
  })
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    const cx = width / 2
    const cy = height / 2

    // Mycelium network radiating through background
    const nodes = hyphaPoints(cx, cy, 12, Math.min(width, height) * 0.3, t, 0)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox={`0 0 ${width || 1080} ${height || 1920}`}
          preserveAspectRatio="none"
        >
          {nodes.map((n, i) => (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={n.x}
              y2={n.y}
              stroke="rgba(200,180,140,1)"
              strokeWidth="0.6"
              opacity={n.opacity}
              strokeLinecap="round"
            />
          ))}
          {/* Second order branching */}
          {nodes.slice(0, 6).map((n, i) => {
            const sub = hyphaPoints(n.x, n.y, 4, 50, t, i * 2.1)
            return sub.map((s, si) => (
              <line
                key={`myc-${i}-${si}`}
                x1={n.x}
                y1={n.y}
                x2={s.x}
                y2={s.y}
                stroke="rgba(180,160,120,1)"
                strokeWidth="0.4"
                opacity={s.opacity * 0.5}
                strokeLinecap="round"
              />
            ))
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
    frame,
    width,
    height,
  }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('').map((ch, ci) => {
      // Mycelium spreads char by char left to right
      const charDelay = (ci / (word.length + 1)) * 0.6
      let opacity = 1
      let xOff = 0
      let yOff = 0
      let scaleX = 1
      let scaleY = 1
      let blur = 0

      if (phase === 'enter') {
        // Hyphae grow inward to form the letter shape — nucleate from edges
        const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.6))
        const ep = easeOutExpo(p)

        // Start at random scattered positions, converge to correct position
        const scatterSeed = ci * 7.3 + index * 2.1
        const scatterX = Math.sin(scatterSeed) * 60 * (1 - ep)
        const scatterY = Math.cos(scatterSeed * 1.3) * 40 * (1 - ep)
        xOff = scatterX
        yOff = scatterY

        // Hyphal growth: elongate on arrival, settle
        scaleX = 0.4 + ep * 0.6
        scaleY = 0.4 + ep * 0.6
        opacity = p < 0.1 ? p * 10 : ep * (0.7 + Math.sin(ep * Math.PI) * 0.3)
        blur = (1 - ep) * 4
      } else if (phase === 'hold') {
        // Mycelium breathes: hyphal tip oscillation
        const growth = Math.sin(t * 2 + ci * 0.6) * 0.5 + 0.5
        scaleX = 1 + growth * 0.025
        scaleY = 1 + growth * 0.02
        yOff = Math.sin(t * 1.5 + ci * 0.4) * 2
        xOff = Math.cos(t * 1.2 + ci * 0.7) * 1.5
        // Sporadic spore release flash
        opacity = 0.88 + Math.abs(Math.sin(t * 4 + ci * 1.1)) * 0.12
      } else {
        // Hyphae desiccate and collapse
        const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.3) / 0.8))
        const ep = easeInQuart(p)

        scaleX = 1 - ep * 0.7
        scaleY = 1 - ep * 0.8
        opacity = 1 - ep
        blur = ep * 5
        yOff = ep * 10
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity,
            transform: `translate(${xOff}px, ${yOff}px) scaleX(${scaleX}) scaleY(${scaleY})`,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            textShadow: `0 0 16px rgba(200,180,100,0.3), 0 2px 6px rgba(0,0,0,0.5)`,
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', serif",
            fontSize: 'clamp(44px, 12vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 5,
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function MyceliumSpreadComponent(props: MotionGraphicProps<MyceliumSpreadConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-mycelium-spread',
  title: 'Kinetic Mycelium Spread',
  description:
    'Text formed by mycelium hyphae growing through substrate: letters nucleate from scattered points and converge, with a branching fungal network radiating from center in background. Hold shows hyphal tip oscillation.',
  tags: ['kinetic', 'typography', 'mycelium', 'fungus', 'organic', 'network', 'biology', 'growth', 'material-physics'],
  category: 'captions',
  component: MyceliumSpreadComponent as any,
  defaultConfig: {
    words: ['SPREAD', 'GROW', 'FUNGI', 'NET'],
    colors: ['#C8B890', '#B8A878', '#D4C8A0', '#A89870'],
    bgColor: '#0A0906',
    cycleDuration: 2.0,
    networkDensity: 1,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SPREAD', 'GROW', 'FUNGI', 'NET'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#C8B890', '#B8A878', '#D4C8A0', '#A89870'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0906', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.0,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'networkDensity',
      label: 'Network Density',
      type: 'number',
      defaultValue: 1,
      min: 0.3,
      max: 3,
      group: 'Animation',
    },
  ],
})
