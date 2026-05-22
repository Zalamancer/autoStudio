import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TriangleTileConfig extends KineticBaseConfig {
  tileSize: number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    const cfg = (globalThis as any).__triangleTileConfig ?? { tileSize: 56 }
    const sz = cfg.tileSize ?? 56
    const cols = Math.ceil(width / sz) + 2
    const rows = Math.ceil(height / sz) + 2
    const seed = index * 127

    const triangles: React.ReactNode[] = []
    let triIdx = 0

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        // Each square cell is divided into 2 triangles
        for (let half = 0; half < 2; half++) {
          const tileSeed = seed + triIdx * 61

          const left = col * sz
          const top = row * sz

          // Triangle clip-paths: upper-left and lower-right halves
          // half 0 = upper-right triangle, half 1 = lower-left triangle
          const clipPath = half === 0
            ? 'polygon(100% 0%, 0% 0%, 100% 100%)'
            : 'polygon(0% 0%, 0% 100%, 100% 100%)'

          // Diagonal distance stagger — waves from top-right corner
          const cx = left + sz * 0.5
          const cy = top + sz * 0.5
          const diagNorm = ((cx / width) + (1 - cy / height)) / 2
          const stagger = diagNorm * 0.6 + pseudoRandom(tileSeed) * 0.1

          // Triangles flip 180° around their hypotenuse to reveal text
          // Simulated as rotateX for the top and rotateY for the bottom
          let rotateAngle = 0
          let opacity = 1

          const isTop = half === 0

          if (phase === 'enter') {
            const delayed = Math.max(0, Math.min(1, (enterProgress - stagger * 0.65) / 0.35))
            const eased = easeOutBack(Math.min(1, delayed))
            rotateAngle = (1 - eased) * 180
            opacity = 1 - Math.min(1, eased * 1.1)
          } else if (phase === 'hold') {
            opacity = 0
          } else {
            const revStagger = 1 - stagger
            const delayed = Math.max(0, Math.min(1, (exitProgress - revStagger * 0.45) / 0.55))
            const eased = easeInQuart(delayed)
            rotateAngle = eased * 180
            opacity = eased
          }

          if (opacity <= 0.01) { triIdx++; continue }

          const hue = 30 + pseudoRandom(tileSeed + 3) * 30
          const sat = 10 + pseudoRandom(tileSeed + 4) * 12
          const lit = 13 + pseudoRandom(tileSeed + 5) * 10
          const darken = half === 1 ? -4 : 0

          triangles.push(
            <div
              key={triIdx}
              style={{
                position: 'absolute',
                left,
                top,
                width: sz,
                height: sz,
                clipPath,
                background: `hsl(${hue},${sat}%,${lit + darken}%)`,
                border: '1px solid rgba(255,255,255,0.05)',
                transformOrigin: isTop ? 'right top' : 'left bottom',
                transform: isTop
                  ? `perspective(300px) rotateX(${rotateAngle}deg)`
                  : `perspective(300px) rotateY(${-rotateAngle}deg)`,
                opacity,
              }}
            />,
          )
          triIdx++
        }
      }
    }

    let textOpacity = 0
    if (phase === 'enter') textOpacity = Math.min(1, enterProgress * 2.5)
    else if (phase === 'hold') textOpacity = 1
    else textOpacity = Math.max(0, 1 - exitProgress * 2)

    return (
      <>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: textOpacity,
          }}
        >
          {word}
        </div>
        {triangles}
      </>
    )
  },
}

function TriangleTileComponent(props: MotionGraphicProps<TriangleTileConfig>) {
  ;(globalThis as any).__triangleTileConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-triangle-tile',
  title: 'Kinetic Triangle Tile',
  description: 'Triangular tessellation: paired triangles flip back along their hypotenuse in a diagonal wave to reveal text',
  tags: ['kinetic', 'typography', 'triangle', 'tessellation', 'tile', 'reveal', 'pattern', 'geometric', 'flip'],
  category: 'captions',
  component: TriangleTileComponent as any,
  defaultConfig: {
    words: ['SHARP', 'FACET', 'EDGE', 'ANGLE'],
    colors: ['#FB923C', '#F97316', '#FDBA74', '#FB923C'],
    bgColor: '#0c0804',
    cycleDuration: 1.5,
    tileSize: 56,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SHARP', 'FACET', 'EDGE', 'ANGLE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FB923C', '#F97316', '#FDBA74'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0804', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'tileSize', label: 'Triangle Grid Size (px)', type: 'number', defaultValue: 56, min: 24, max: 120, group: 'Animation' },
  ],
})
