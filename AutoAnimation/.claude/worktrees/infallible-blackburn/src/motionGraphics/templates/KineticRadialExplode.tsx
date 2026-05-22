import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// ── Shatter/Fragment 4: Radial Explode ───────────────────────────────────────
// Text flies in as wedge-shaped radial segments from a central explosion point.

interface RadialExplodeConfig extends KineticBaseConfig {
  segmentCount: number
}

function seeded(s: number): number {
  const x = Math.sin(s * 44.7 + 27.3) * 43758.5453
  return x - Math.floor(x)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158; const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInBack(t: number): number {
  const c1 = 1.70158; const c3 = c1 + 1
  return c3 * t * t * t - c1 * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 60%)`,
      }} />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const SEGS = 12
    const cx = width / 2
    const cy = height / 2

    const segments = Array.from({ length: SEGS }, (_, i) => {
      const angle = (i / SEGS) * 360
      const arcAngle = 360 / SEGS

      // Each segment's explosion trajectory
      const midAngle = (angle + arcAngle / 2) * (Math.PI / 180)
      const flyDist = 250 + seeded(i * 7) * 200
      const flyX = Math.cos(midAngle) * flyDist
      const flyY = Math.sin(midAngle) * flyDist
      const rotOffset = (seeded(i * 13) - 0.5) * 90

      // Stagger by angle position
      const stagger = (i / SEGS) * 0.15

      let tx = 0, ty = 0, rot = 0, op = 0, sc = 1

      if (phase === 'enter') {
        const p = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger * 0.5)))
        const e = easeOutBack(p)
        tx = flyX * (1 - e)
        ty = flyY * (1 - e)
        rot = rotOffset * (1 - e)
        op = Math.min(1, p * 3)
        sc = 0.1 + e * 0.9
      } else if (phase === 'hold') {
        // Segments rotate slowly around center
        const drift = Math.sin(holdProgress * Math.PI * 2 + i * 0.5) * 3
        tx = drift * Math.cos(midAngle)
        ty = drift * Math.sin(midAngle)
        op = 0.9
      } else {
        const p = Math.max(0, Math.min(1, (exitProgress - stagger * 0.3) / (1 - stagger * 0.2)))
        const e = easeInBack(p)
        tx = flyX * e
        ty = flyY * e
        rot = rotOffset * e
        op = 1 - p
        sc = 1 + e * 0.5
      }

      // Wedge shape via clip-path
      const innerR = 5
      const outerR = 80
      const halfArc = (arcAngle / 2 - 2) * (Math.PI / 180)
      const angRad = midAngle
      const p1x = 50 + Math.cos(angRad - halfArc) * innerR
      const p1y = 50 + Math.sin(angRad - halfArc) * innerR
      const p2x = 50 + Math.cos(angRad + halfArc) * innerR
      const p2y = 50 + Math.sin(angRad + halfArc) * innerR
      const p3x = 50 + Math.cos(angRad + halfArc) * outerR
      const p3y = 50 + Math.sin(angRad + halfArc) * outerR
      const p4x = 50 + Math.cos(angRad - halfArc) * outerR
      const p4y = 50 + Math.sin(angRad - halfArc) * outerR
      const clip = `polygon(${p1x.toFixed(1)}% ${p1y.toFixed(1)}%, ${p2x.toFixed(1)}% ${p2y.toFixed(1)}%, ${p3x.toFixed(1)}% ${p3y.toFixed(1)}%, ${p4x.toFixed(1)}% ${p4y.toFixed(1)}%)`

      const hue = (i / SEGS) * 60 + 200
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: clip,
            background: `linear-gradient(${angle}deg, ${color}25, transparent)`,
            border: `none`,
            transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${sc})`,
            opacity: op,
            transformOrigin: `${cx}px ${cy}px`,
          }}
        />
      )
    })

    // Shockwave ring on enter
    const ringScale = phase === 'enter' ? enterProgress * 3 : 0
    const ringOp = phase === 'enter' ? Math.max(0, 1 - enterProgress * 2) : 0

    // Text
    let textOp = 0, textSc = 0.5
    if (phase === 'enter') {
      const p = Math.max(0, (enterProgress - 0.3) / 0.7)
      textOp = easeOutBack(p); textSc = textOp
    } else if (phase === 'hold') {
      textOp = 1; textSc = 1
    } else {
      textOp = Math.max(0, 1 - exitProgress * 2); textSc = 1 + exitProgress * 0.3
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {segments}
        {/* Shockwave ring */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: 200, height: 200,
          marginLeft: -100, marginTop: -100,
          borderRadius: '50%',
          border: `3px solid ${color}`,
          transform: `scale(${ringScale})`,
          opacity: ringOp,
          pointerEvents: 'none',
        }} />
        <div
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: `translate(-50%, -50%) scale(${textSc})`,
            opacity: textOp,
            fontFamily: "'Impact', 'Arial Narrow', sans-serif",
            fontSize: 'clamp(50px, 12vw, 155px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.03em',
            textShadow: `0 0 30px ${color}80, 0 2px 0 rgba(0,0,0,0.8)`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function RadialExplodeComponent(props: MotionGraphicProps<RadialExplodeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-radial-explode',
  title: 'Kinetic Radial Explode',
  description: 'Wedge-shaped radial segments converge from an explosion — text materializes at the epicenter with a shockwave ring, segments blast outward on exit.',
  tags: ['kinetic', 'typography', 'radial', 'explode', 'shatter', 'fragment', 'impact', 'burst'],
  category: 'captions',
  component: RadialExplodeComponent as any,
  defaultConfig: {
    words: ['BOOM', 'FIRE', 'BURST', 'BANG'],
    colors: ['#FF6600', '#FFFFFF', '#FFCC00', '#FF3300'],
    bgColor: '#0a0500',
    cycleDuration: 1.4,
    segmentCount: 12,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BOOM', 'FIRE', 'BURST', 'BANG'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6600', '#FFFFFF', '#FFCC00', '#FF3300'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0500', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
    { key: 'segmentCount', label: 'Segment Count', type: 'number', defaultValue: 12, min: 6, max: 24, group: 'Animation' },
  ],
})
