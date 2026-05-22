import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// ── Shatter/Fragment 1: Voronoi Shatter ──────────────────────────────────────
// Text shatters into irregular Voronoi-style polygon fragments that explode
// outward and reassemble on exit.

interface VoronoiShatterConfig extends KineticBaseConfig {
  fragmentCount: number
  explosionRadius: number
}

function seeded(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// Generate a Voronoi-like polygon clip path (5-7 sides, irregular)
function voronoiPolygon(seed: number): string {
  const sides = 5 + Math.floor(seeded(seed * 99) * 3)
  const points: string[] = []
  for (let i = 0; i < sides; i++) {
    const baseAngle = (i / sides) * Math.PI * 2
    const jitter = (seeded(seed * 7 + i) - 0.5) * 0.6
    const angle = baseAngle + jitter
    const radius = 35 + seeded(seed * 3 + i) * 30
    const px = 50 + Math.cos(angle) * radius
    const py = 50 + Math.sin(angle) * radius
    points.push(`${px.toFixed(1)}% ${py.toFixed(1)}%`)
  }
  return `polygon(${points.join(', ')})`
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const COUNT = 16
    const fragments = Array.from({ length: COUNT }, (_, i) => {
      const angle = (i / COUNT) * Math.PI * 2 + seeded(i * 17) * 0.5
      const dist = 180 + seeded(i * 5) * 220
      const rotMax = (seeded(i * 11) - 0.5) * 720
      const cx = width / 2 + (seeded(i * 3) - 0.5) * width * 0.9
      const cy = height / 2 + (seeded(i * 7) - 0.5) * height * 0.7
      const size = 60 + seeded(i * 13) * 100

      let tx = 0, ty = 0, rot = 0, op = 0, sc = 1

      if (phase === 'enter') {
        // Fragments fly IN from exploded positions, converge
        const p = easeOutBack(enterProgress)
        const inv = 1 - p
        tx = Math.cos(angle) * dist * inv
        ty = Math.sin(angle) * dist * inv
        rot = rotMax * inv
        op = Math.min(1, enterProgress * 3)
        sc = 0.3 + p * 0.7
      } else if (phase === 'hold') {
        // Subtle breathing — fragments drift slightly
        const breathe = Math.sin(holdProgress * Math.PI * 4 + i * 0.9) * 3
        tx = breathe * Math.cos(angle)
        ty = breathe * Math.sin(angle)
        op = 0.85
        sc = 1
      } else {
        // Explode outward
        const p = easeInExpo(exitProgress)
        tx = Math.cos(angle) * dist * p
        ty = Math.sin(angle) * dist * p
        rot = rotMax * p
        op = 1 - p
        sc = 1 + p * 0.3
      }

      const hue = (i * 22) % 360
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: cx - size / 2,
            top: cy - size / 2,
            width: size,
            height: size,
            clipPath: voronoiPolygon(i),
            background: `hsla(${hue}, 70%, 60%, 0.18)`,
            border: `1px solid hsla(${hue}, 80%, 70%, 0.35)`,
            transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${sc})`,
            opacity: op,
            mixBlendMode: 'screen',
          }}
        />
      )
    })

    // Text: slams in with scaleX punch after fragments converge
    let textOp = 0, textScX = 3, textScY = 0.4, textBlur = 20
    if (phase === 'enter') {
      const p = Math.max(0, (enterProgress - 0.4) / 0.6)
      const e = easeOutBack(p)
      textOp = Math.min(1, p * 2)
      textScX = 3 - e * 2
      textScY = 0.4 + e * 0.6
      textBlur = 20 * (1 - p)
    } else if (phase === 'hold') {
      textOp = 1; textScX = 1; textScY = 1; textBlur = 0
    } else {
      const p = easeInExpo(exitProgress)
      textOp = 1 - p
      textScX = 1 + p * 4
      textScY = 1 - p * 0.8
      textBlur = p * 15
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {fragments}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scaleX(${textScX}) scaleY(${textScY})`,
            opacity: textOp,
            filter: `blur(${textBlur}px)`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(48px, 11vw, 148px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '-0.02em',
            textShadow: `0 0 40px ${color}60`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function VoronoiShatterComponent(props: MotionGraphicProps<VoronoiShatterConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-voronoi-shatter',
  title: 'Kinetic Voronoi Shatter',
  description: 'Irregular Voronoi polygon fragments converge from an explosion to form text, then blast apart again on exit — maximum impact with geometric chaos.',
  tags: ['kinetic', 'typography', 'shatter', 'voronoi', 'fragment', 'geometric', 'distortion', 'explode'],
  category: 'captions',
  component: VoronoiShatterComponent as any,
  defaultConfig: {
    words: ['SHATTER', 'BREAK', 'CRACK', 'SPLIT'],
    colors: ['#FFFFFF', '#FF6B6B', '#FFFFFF', '#4ECDC4'],
    bgColor: '#0a0014',
    cycleDuration: 1.5,
    fragmentCount: 16,
    explosionRadius: 300,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SHATTER', 'BREAK', 'CRACK', 'SPLIT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FF6B6B', '#FFFFFF', '#4ECDC4'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0014', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'fragmentCount', label: 'Fragment Count', type: 'number', defaultValue: 16, min: 8, max: 32, group: 'Animation' },
    { key: 'explosionRadius', label: 'Explosion Radius', type: 'number', defaultValue: 300, min: 100, max: 600, group: 'Animation' },
  ],
})
