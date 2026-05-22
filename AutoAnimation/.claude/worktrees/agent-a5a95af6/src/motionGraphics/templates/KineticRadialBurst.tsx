import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RadialBurstConfig extends KineticBaseConfig {
  segments: number
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__radialBurstConfig ?? { segments: 12 }
    const segments = config.segments ?? 12

    const cx = width / 2
    const cy = height / 2
    // Radius large enough to cover corners
    const maxR = Math.sqrt(cx * cx + cy * cy) * 1.05

    // Reveal progress: enter expands radius outward, exit collapses inward
    const revealR = phase === 'hold'
      ? maxR
      : phase === 'enter'
        ? easeOutQuart(enterProgress) * maxR
        : (1 - easeInQuart(exitProgress)) * maxR

    // Build an SVG clip region: a circle with staggered petal notches
    // Each segment is a pie slice. The leading edge creates a burst effect.
    const segAngle = (Math.PI * 2) / segments

    // Build clip polygon points using radial burst shape:
    // Each segment's reveal radius is staggered so the burst has a jagged leading edge.
    const points: string[] = []
    // Center point first
    points.push(`${cx},${cy}`)

    const totalPoints = segments * 2 + 1
    for (let i = 0; i <= segments; i++) {
      // Two sub-points per segment (start and end of each slice)
      for (let sub = 0; sub < (i < segments ? 2 : 1); sub++) {
        const frac = (i + sub * 0.5) / segments
        const angle = frac * Math.PI * 2 - Math.PI / 2 // start from top
        // Each segment tip is staggered slightly to create burst pattern
        const segStagger = (i % 2 === 0 ? 0.0 : 0.08)
        const r = Math.max(0, revealR * (1 - segStagger))
        const px = cx + r * Math.cos(angle)
        const py = cy + r * Math.sin(angle)
        points.push(`${px.toFixed(1)},${py.toFixed(1)}`)
      }
    }

    const svgClipId = `radial-burst-clip-${phase}`

    // Use CSS clip-path with circle for the main reveal, plus segment ring decorations
    const circleClip = `circle(${revealR.toFixed(1)}px at ${cx}px ${cy}px)`

    // Decorative burst rays — thin triangular rays that shoot outward
    const rays: React.ReactNode[] = []
    for (let i = 0; i < segments; i++) {
      const centerAngle = (i / segments) * Math.PI * 2 - Math.PI / 2
      const halfWidth = Math.PI / segments * 0.25
      const a1 = centerAngle - halfWidth
      const a2 = centerAngle + halfWidth
      const rayR = revealR + 20

      const x1 = cx + Math.cos(a1) * (revealR * 0.85)
      const y1 = cy + Math.sin(a1) * (revealR * 0.85)
      const x2 = cx + Math.cos(a2) * (revealR * 0.85)
      const y2 = cy + Math.sin(a2) * (revealR * 0.85)
      const tipX = cx + Math.cos(centerAngle) * rayR
      const tipY = cy + Math.sin(centerAngle) * rayR

      const rayOpacity = phase === 'hold' ? 0 : phase === 'enter' ? Math.max(0, enterProgress * 2 - 1) * 0.5 : exitProgress * 0.5

      rays.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: `polygon(${x1.toFixed(1)}px ${y1.toFixed(1)}px, ${x2.toFixed(1)}px ${y2.toFixed(1)}px, ${tipX.toFixed(1)}px ${tipY.toFixed(1)}px)`,
            WebkitClipPath: `polygon(${x1.toFixed(1)}px ${y1.toFixed(1)}px, ${x2.toFixed(1)}px ${y2.toFixed(1)}px, ${tipX.toFixed(1)}px ${tipY.toFixed(1)}px)`,
            background: color,
            opacity: rayOpacity,
          }}
        />,
      )
    }

    const textOpacity = phase === 'hold' ? 1 : phase === 'enter' ? Math.min(1, enterProgress * 2.5) : Math.max(0, 1 - exitProgress * 2.5)

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Burst ray decorations at leading edge */}
        {rays}

        {/* Main radial clip revealing text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: circleClip,
            WebkitClipPath: circleClip,
          }}
        >
          {/* Radial gradient glow fill inside clip */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at center, ${color}18 0%, transparent 65%)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(40px, 10vw, 140px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              opacity: textOpacity,
            }}
          >
            {word}
          </div>
        </div>

        {/* Glowing ring at the burst boundary */}
        {phase !== 'hold' && (
          <div
            style={{
              position: 'absolute',
              left: cx - revealR,
              top: cy - revealR,
              width: revealR * 2,
              height: revealR * 2,
              borderRadius: '50%',
              border: `3px solid ${color}`,
              boxShadow: `0 0 12px ${color}, 0 0 24px ${color}60`,
              opacity: 0.7,
            }}
          />
        )}
      </div>
    )
  },
}

function RadialBurstComponent(props: MotionGraphicProps<RadialBurstConfig>) {
  ;(globalThis as any).__radialBurstConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-radial-burst',
  title: 'Kinetic Radial Burst',
  description: 'Text is revealed by a circular burst expanding from the center outward, with glowing ring boundary and decorative rays at the leading edge',
  tags: ['kinetic', 'typography', 'radial', 'burst', 'reveal', 'geometric', 'pattern', 'circle', 'expand'],
  category: 'captions',
  component: RadialBurstComponent as any,
  defaultConfig: {
    words: ['BURST', 'RADIAL', 'EXPAND', 'BLAST'],
    colors: ['#FF6B6B', '#FFD700', '#4ECDC4', '#A78BFA'],
    bgColor: '#08080F',
    cycleDuration: 1.3,
    segments: 12,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BURST', 'RADIAL', 'EXPAND', 'BLAST'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6B6B', '#FFD700', '#4ECDC4', '#A78BFA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#08080F', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
    { key: 'segments', label: 'Burst Segments', type: 'number', defaultValue: 12, min: 4, max: 24, group: 'Animation' },
  ],
})
