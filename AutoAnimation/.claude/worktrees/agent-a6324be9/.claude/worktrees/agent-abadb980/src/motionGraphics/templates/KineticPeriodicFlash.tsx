import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PeriodicFlashConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const ELEMENT_DATA = [
  { number: 1, symbol: 'H', weight: '1.008', group: 1, period: 1 },
  { number: 6, symbol: 'C', weight: '12.011', group: 14, period: 2 },
  { number: 7, symbol: 'N', weight: '14.007', group: 15, period: 2 },
  { number: 8, symbol: 'O', weight: '15.999', group: 16, period: 2 },
  { number: 11, symbol: 'Na', weight: '22.990', group: 1, period: 3 },
  { number: 26, symbol: 'Fe', weight: '55.845', group: 8, period: 4 },
  { number: 29, symbol: 'Cu', weight: '63.546', group: 11, period: 4 },
  { number: 79, symbol: 'Au', weight: '196.97', group: 11, period: 6 },
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Subtle periodic table grid in background
    const cellSize = 36
    const cols = Math.ceil(width / cellSize)
    const rows = Math.ceil(height / cellSize)
    const cells: React.ReactNode[] = []

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const seed = r * cols + c
        const rand = seededRand(seed)
        if (rand > 0.75) {
          const x = c * cellSize
          const y = r * cellSize
          const elemIdx = Math.floor(seededRand(seed + 33) * ELEMENT_DATA.length)
          const elem = ELEMENT_DATA[elemIdx]
          const pulsePhase = (frame * 0.02 + seed * 0.4) % (Math.PI * 2)
          const alpha = 0.04 + Math.max(0, Math.sin(pulsePhase)) * 0.04

          cells.push(
            <g key={`c${r}-${c}`}>
              <rect
                x={x + 1} y={y + 1}
                width={cellSize - 2} height={cellSize - 2}
                fill="none"
                stroke={`rgba(100, 180, 255, ${alpha})`}
                strokeWidth={0.5}
                rx={2}
              />
              <text
                x={x + cellSize / 2} y={y + cellSize / 2 + 3}
                textAnchor="middle"
                fill={`rgba(100, 180, 255, ${alpha * 1.5})`}
                fontSize={10}
                fontFamily="monospace"
                fontWeight={600}
              >
                {elem.symbol}
              </text>
            </g>
          )
        }
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {cells}
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const letters = word.split('')

    // Each letter becomes an element card
    const renderLetterCards = (opacity: number, cardScale: number) => {
      const cardWidth = Math.min(120, width / (letters.length + 1))
      const cardHeight = cardWidth * 1.2
      const totalWidth = letters.length * (cardWidth + 8) - 8

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 8,
            opacity,
          }}
        >
          {letters.map((letter, i) => {
            const atomicNum = ((letter.charCodeAt(0) - 64) % 118) + 1
            const weight = (atomicNum * 2.15 + seededRand(i * 7) * 5).toFixed(3)
            const shellCount = Math.min(4, Math.ceil(atomicNum / 20))

            // Electron shell animation
            const shellElements: React.ReactNode[] = []
            for (let s = 0; s < shellCount; s++) {
              const shellRadius = 10 + s * 6
              const electronAngle = ((f * (3 - s) * 0.08) + s * 2.1 + i * 1.5) % (Math.PI * 2)
              shellElements.push(
                <g key={`shell${s}`}>
                  <circle
                    cx={cardWidth / 2} cy={cardHeight * 0.55}
                    r={shellRadius}
                    fill="none"
                    stroke={`rgba(100,180,255,${0.1 + s * 0.05})`}
                    strokeWidth={0.5}
                    strokeDasharray="2 3"
                  />
                  <circle
                    cx={cardWidth / 2 + Math.cos(electronAngle) * shellRadius}
                    cy={cardHeight * 0.55 + Math.sin(electronAngle) * shellRadius}
                    r={1.5}
                    fill={color}
                    opacity={0.6}
                  />
                </g>
              )
            }

            return (
              <div
                key={i}
                style={{
                  width: cardWidth,
                  height: cardHeight,
                  border: `1.5px solid ${color}50`,
                  borderRadius: 4,
                  background: 'rgba(10, 15, 30, 0.85)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  transform: `scale(${cardScale})`,
                  overflow: 'hidden',
                }}
              >
                {/* Atomic number */}
                <div
                  style={{
                    position: 'absolute',
                    top: 4,
                    left: 6,
                    fontFamily: 'monospace',
                    fontSize: Math.max(8, cardWidth * 0.1),
                    color: `${color}80`,
                  }}
                >
                  {atomicNum}
                </div>
                {/* Letter as element symbol */}
                <div
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: Math.max(24, cardWidth * 0.4),
                    fontWeight: 700,
                    color,
                    textShadow: `0 0 8px ${color}40`,
                    lineHeight: 1,
                  }}
                >
                  {letter}
                </div>
                {/* Atomic weight */}
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: Math.max(7, cardWidth * 0.08),
                    color: `${color}60`,
                    marginTop: 2,
                  }}
                >
                  {weight}
                </div>
                {/* Electron shells SVG overlay */}
                <svg
                  width={cardWidth}
                  height={cardHeight}
                  style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
                >
                  {shellElements}
                </svg>
              </div>
            )
          })}
        </div>
      )
    }

    if (phase === 'enter') {
      const scale = 0.7 + enterProgress * 0.3
      return renderLetterCards(enterProgress, scale)
    } else if (phase === 'hold') {
      const pulse = 1 + Math.sin(holdProgress * Math.PI * 3) * 0.02
      return renderLetterCards(1, pulse)
    } else {
      return renderLetterCards(1 - exitProgress, 1 - exitProgress * 0.2)
    }
  },
}

function PeriodicFlashComponent(props: MotionGraphicProps<PeriodicFlashConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-periodic-flash',
  title: 'Kinetic Periodic Flash',
  description: 'Periodic table element cards with atomic number, symbol, weight, and orbiting electron shell animations for each letter',
  tags: ['kinetic', 'typography', 'periodic', 'table', 'element', 'chemistry', 'science', 'atom'],
  category: 'captions',
  component: PeriodicFlashComponent as any,
  defaultConfig: {
    words: ['ATOM', 'BOND', 'IONS', 'MASS'],
    colors: ['#66BBFF', '#88DDFF', '#44AAFF', '#AAEEFF'],
    bgColor: '#08101c',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ATOM', 'BOND', 'IONS', 'MASS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#66BBFF', '#88DDFF', '#44AAFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#08101c', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
