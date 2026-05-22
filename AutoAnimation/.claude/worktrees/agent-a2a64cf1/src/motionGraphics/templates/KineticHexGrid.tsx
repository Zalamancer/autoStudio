import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HexGridConfig extends KineticBaseConfig {
  hexColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// Hexagon SVG path for a given center and size
function hexPath(cx: number, cy: number, size: number): string {
  const points = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    points.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`)
  }
  return `M${points.join('L')}Z`
}

const COLS = 10
const ROWS = 7
const HEX_SIZE = 28

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const hexagons: React.ReactNode[] = []

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const offsetX = row % 2 === 0 ? 0 : HEX_SIZE * 0.87
        const cx = col * HEX_SIZE * 1.74 + HEX_SIZE + offsetX
        const cy = row * HEX_SIZE * 1.5 + HEX_SIZE

        // Distance from center for wave animation
        const centerCol = COLS / 2
        const centerRow = ROWS / 2
        const dist = Math.sqrt(Math.pow(col - centerCol, 2) + Math.pow(row - centerRow, 2))

        // Wave: intensity ripples outward from center
        const wave = Math.sin(time * 3 - dist * 0.8) * 0.5 + 0.5
        const baseOpacity = 0.05 + wave * 0.2

        hexagons.push(
          <path
            key={`${row}-${col}`}
            d={hexPath(cx, cy, HEX_SIZE * 0.85)}
            fill="none"
            stroke="rgba(100,200,255,0.8)"
            strokeWidth={0.8}
            opacity={baseOpacity}
          />
        )
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox={`0 0 ${COLS * HEX_SIZE * 1.74 + HEX_SIZE * 2} ${ROWS * HEX_SIZE * 1.5 + HEX_SIZE * 2}`}
          preserveAspectRatio="xMidYMid slice"
        >
          {hexagons}
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let translateY = 20

    if (phase === 'enter') {
      opacity = easeOutCubic(enterProgress)
      translateY = 20 * (1 - easeOutCubic(enterProgress))
    } else if (phase === 'hold') {
      opacity = 1
      translateY = 0
    } else {
      opacity = 1 - exitProgress
      translateY = -10 * exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px)`,
          opacity,
          fontFamily: "'Inter', 'SF Pro Display', sans-serif",
          fontSize: 'clamp(40px, 10vw, 140px)',
          fontWeight: 800,
          color,
          whiteSpace: 'nowrap',
          textShadow: '0 0 30px rgba(100,200,255,0.3), 0 2px 8px rgba(0,0,0,0.5)',
          letterSpacing: '4px',
        }}
      >
        {word}
      </div>
    )
  },
}

function HexGridComponent(props: MotionGraphicProps<HexGridConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-hex-grid',
  title: 'Kinetic Hex Grid',
  description: 'Hexagonal grid background with wave-lit hexagons. Text appears over the pulsing grid with a tech/sci-fi aesthetic.',
  tags: ['kinetic', 'typography', 'hexagon', 'grid', 'geometric', 'sci-fi', 'tech', 'wave'],
  category: 'captions',
  component: HexGridComponent as any,
  defaultConfig: {
    words: ['HEXAGON', 'GRID', 'TECH', 'PULSE'],
    colors: ['#64C8FF', '#FFFFFF', '#64C8FF', '#FFFFFF'],
    bgColor: '#080818',
    cycleDuration: 1.5,
    hexColor: '#64C8FF',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HEXAGON', 'GRID', 'TECH', 'PULSE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#64C8FF', '#FFFFFF', '#64C8FF', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080818', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
    { key: 'hexColor', label: 'Hex Color', type: 'color', defaultValue: '#64C8FF', group: 'Animation' },
  ],
})
