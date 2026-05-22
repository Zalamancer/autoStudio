import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalPolygonConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

/**
 * Rotating polygon reveal — an 8-sided regular polygon (octagon) that simultaneously
 * expands AND rotates as it reveals the text. The rotation gives a spinning-iris feel
 * that's distinct from a plain expand. The octagon is centered at (50%, 50%).
 *
 * rotation: 0° (collapsed, rotated 22.5° off-axis) → 22.5° (fully open, axis-aligned)
 * This means the polygon rotates into its "settled" orientation while growing.
 */
function octagonClipPath(r: number, rotationDeg: number): string {
  const cx = 50
  const cy = 50
  const n = 8
  const points: string[] = []
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI / 180) * (360 / n * i + rotationDeg)
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    points.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`)
  }
  return `polygon(${points.join(', ')})`
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let p: number

    if (phase === 'enter') {
      p = easeOutCubic(enterProgress)
    } else if (phase === 'hold') {
      p = 1
    } else {
      p = 1 - easeInCubic(exitProgress)
    }

    // r: 0 → 90% (needs to be large enough to cover element corners)
    const r = p * 90
    // Rotate from -22.5° (closed, tilted) → 0° (open, flat-side up)
    const rotationDeg = -22.5 + p * 22.5
    const clipPath = octagonClipPath(r, rotationDeg)

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(36px, 8vw, 120px)',
          fontWeight: 300,
          color,
          whiteSpace: 'nowrap',
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
          clipPath,
        }}
      >
        {word}
      </div>
    )
  },
}

function MinimalPolygonComponent(props: MotionGraphicProps<MinimalPolygonConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-polygon',
  title: 'Kinetic Minimal Polygon',
  description: 'Rotating octagon iris — polygon expands and rotates simultaneously as it reveals text, creating a spinning-iris clip-path effect',
  tags: ['kinetic', 'typography', 'minimal', 'clip-path', 'reveal', 'polygon', 'octagon', 'rotate', 'iris'],
  category: 'captions',
  component: MinimalPolygonComponent as any,
  defaultConfig: {
    words: ['REVEAL', 'SHAPE', 'CLEAN'],
    colors: ['#1A1A1A', '#1A1A1A', '#1A1A1A'],
    bgColor: '#FFFFFF',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['REVEAL', 'SHAPE', 'CLEAN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1A1A1A', '#1A1A1A', '#1A1A1A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
