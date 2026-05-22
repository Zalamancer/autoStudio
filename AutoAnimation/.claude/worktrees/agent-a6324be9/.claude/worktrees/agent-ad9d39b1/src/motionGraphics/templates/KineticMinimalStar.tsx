import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalStarConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

/**
 * 5-pointed star expanding from center to reveal text.
 * A star polygon alternates between outer radius (R) and inner radius (r = R * 0.4).
 * 10 vertices total, stepping 36° each.
 * At r=0 the star collapses to a point; at r=90 it fills the container.
 */
function starClipPath(R: number): string {
  const cx = 50
  const cy = 50
  const innerR = R * 0.4
  const points: string[] = []
  for (let i = 0; i < 10; i++) {
    // Star points start at top (-90°), outer every even vertex
    const angle = (Math.PI / 180) * (36 * i - 90)
    const radius = i % 2 === 0 ? R : innerR
    const x = cx + radius * Math.cos(angle)
    const y = cy + radius * Math.sin(angle)
    points.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`)
  }
  return `polygon(${points.join(', ')})`
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let R: number

    if (phase === 'enter') {
      R = easeOutCubic(enterProgress) * 90
    } else if (phase === 'hold') {
      R = 90
    } else {
      R = (1 - easeInCubic(exitProgress)) * 90
    }

    const clipPath = starClipPath(R)

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

function MinimalStarComponent(props: MotionGraphicProps<MinimalStarConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-star',
  title: 'Kinetic Minimal Star',
  description: '5-pointed star expanding from the center — alternating outer/inner radii create a striking starburst clip-path reveal',
  tags: ['kinetic', 'typography', 'minimal', 'clip-path', 'reveal', 'star', 'starburst', 'geometric'],
  category: 'captions',
  component: MinimalStarComponent as any,
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
