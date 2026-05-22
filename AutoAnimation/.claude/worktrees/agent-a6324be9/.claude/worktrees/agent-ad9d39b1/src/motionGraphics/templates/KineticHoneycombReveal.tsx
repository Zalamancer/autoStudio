import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HoneycombRevealConfig extends KineticBaseConfig {
  hexSize: number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Build a flat-top hexagon SVG polygon path centred at (cx, cy) with radius r */
function hexPath(cx: number, cy: number, r: number): string {
  const pts = []
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i) // flat-top: 0°, 60°, …
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`)
  }
  return pts.join(' ')
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__honeycombRevealConfig ?? { hexSize: 48 }
    const r = config.hexSize ?? 48
    // Flat-top hex grid spacing
    const hexW = r * 2
    const hexH = Math.sqrt(3) * r
    const colStep = hexW * 0.75
    const rowStep = hexH

    const cols = Math.ceil(width / colStep) + 2
    const rows = Math.ceil(height / rowStep) + 2

    const seed = index * 137
    const cells: React.ReactNode[] = []
    let cellIdx = 0

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const cx = col * colStep
        const cy = row * rowStep + (col % 2 === 1 ? hexH / 2 : 0)

        const tileSeed = seed + cellIdx * 53
        const order = pseudoRandom(tileSeed)
        const stagger = order * 0.65

        let scaleVal = 1
        let opacityVal = 1

        if (phase === 'enter') {
          const delayed = Math.max(0, Math.min(1, (enterProgress - stagger) / 0.35))
          // Cells shrink from big → normal to uncover text
          scaleVal = 1 + (1 - easeOutBack(delayed)) * 1.2
          opacityVal = Math.min(1, delayed * 3)
        } else if (phase === 'hold') {
          scaleVal = 1
          opacityVal = 1
        } else {
          const reverseOrder = 1 - order
          const delayed = Math.max(0, Math.min(1, (exitProgress - reverseOrder * 0.5) / 0.5))
          scaleVal = 1 + easeInCubic(delayed) * 1.5
          opacityVal = 1 - easeInCubic(delayed)
        }

        if (opacityVal <= 0.01) { cellIdx++; continue }

        const pts = hexPath(0, 0, r * 0.95)

        cells.push(
          <polygon
            key={cellIdx}
            points={pts}
            transform={`translate(${cx},${cy}) scale(${scaleVal})`}
            fill={`rgba(20,20,30,0.92)`}
            style={{ transformOrigin: `${cx}px ${cy}px`, opacity: opacityVal }}
          />,
        )
        cellIdx++
      }
    }

    // Overall text opacity
    let textOpacity = 0
    if (phase === 'enter') textOpacity = Math.min(1, enterProgress * 2)
    else if (phase === 'hold') textOpacity = 1
    else textOpacity = 1 - exitProgress

    return (
      <>
        {/* Text layer behind the honeycomb */}
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
        {/* Honeycomb overlay that peels away */}
        <svg
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          width={width}
          height={height}
          overflow="visible"
        >
          {cells}
        </svg>
      </>
    )
  },
}

function HoneycombRevealComponent(props: MotionGraphicProps<HoneycombRevealConfig>) {
  ;(globalThis as any).__honeycombRevealConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-honeycomb-reveal',
  title: 'Kinetic Honeycomb Reveal',
  description: 'Hexagonal honeycomb cells scale away in a staggered wave to reveal text hidden beneath',
  tags: ['kinetic', 'typography', 'honeycomb', 'hexagon', 'tile', 'reveal', 'pattern', 'geometric'],
  category: 'captions',
  component: HoneycombRevealComponent as any,
  defaultConfig: {
    words: ['HONEY', 'HIVE', 'SWARM', 'BUZZ'],
    colors: ['#FFD700', '#FFA500', '#FF8C00', '#FFD700'],
    bgColor: '#0d0d1a',
    cycleDuration: 1.5,
    hexSize: 48,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HONEY', 'HIVE', 'SWARM', 'BUZZ'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD700', '#FFA500'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'hexSize', label: 'Hex Cell Size (px)', type: 'number', defaultValue: 48, min: 20, max: 100, group: 'Animation' },
  ],
})
