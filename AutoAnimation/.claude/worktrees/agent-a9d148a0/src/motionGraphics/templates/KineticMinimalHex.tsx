import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalHexConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

/**
 * Hexagonal mask expanding outward from the center.
 * A regular hexagon has 6 vertices at angles 0°, 60°, 120°, 180°, 240°, 300°.
 * We express each vertex in % of the container (cx + r*cos, cy + r*sin)
 * with r scaling from 0 → 90% so the hex fully covers the element.
 * The hex is flat-topped (first vertex at 0°).
 */
function hexClipPath(r: number): string {
  const cx = 50
  const cy = 50
  const points: string[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30) // pointy-top: offset by -30°
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
    let r: number

    if (phase === 'enter') {
      r = easeOutCubic(enterProgress) * 90
    } else if (phase === 'hold') {
      r = 90
    } else {
      r = (1 - easeInCubic(exitProgress)) * 90
    }

    const clipPath = hexClipPath(r)

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

function MinimalHexComponent(props: MotionGraphicProps<MinimalHexConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-hex',
  title: 'Kinetic Minimal Hex',
  description: 'Hexagonal mask expanding outward from center — 6-point polygon clip-path creates a honeycomb-style reveal',
  tags: ['kinetic', 'typography', 'minimal', 'clip-path', 'reveal', 'hexagon', 'geometric', 'hex'],
  category: 'captions',
  component: MinimalHexComponent as any,
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
