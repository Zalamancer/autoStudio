import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CircuitBoardConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    const gridSize = 40
    const cols = Math.ceil(width / gridSize)
    const rows = Math.ceil(height / gridSize)

    // Generate deterministic traces
    const traces: { x1: number; y1: number; x2: number; y2: number; lit: boolean }[] = []
    const dots: { x: number; y: number; lit: boolean }[] = []

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const seed = r * cols + c
        const rand = seededRand(seed)
        const x = c * gridSize
        const y = r * gridSize

        // Node dot at intersections
        if (rand > 0.6) {
          const pulsePhase = (frame * 0.05 + seed * 0.3) % (Math.PI * 2)
          const lit = Math.sin(pulsePhase) > 0.3
          dots.push({ x, y, lit })
        }

        // Horizontal trace
        if (rand > 0.4 && c < cols - 1) {
          const traceSeed = seed * 7 + 11
          const tracePhase = (frame * 0.03 + traceSeed * 0.2) % (Math.PI * 2)
          traces.push({ x1: x, y1: y, x2: x + gridSize, y2: y, lit: Math.sin(tracePhase) > 0 })
        }
        // Vertical trace
        if (rand > 0.55 && r < rows - 1) {
          const traceSeed = seed * 13 + 23
          const tracePhase = (frame * 0.03 + traceSeed * 0.2) % (Math.PI * 2)
          traces.push({ x1: x, y1: y, x2: x, y2: y + gridSize, lit: Math.sin(tracePhase) > 0 })
        }
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Traces */}
          {traces.map((t, i) => (
            <line
              key={`t${i}`}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={t.lit ? 'rgba(0, 200, 255, 0.25)' : 'rgba(0, 200, 255, 0.06)'}
              strokeWidth={t.lit ? 1.5 : 0.8}
            />
          ))}
          {/* Node dots */}
          {dots.map((d, i) => (
            <circle
              key={`d${i}`}
              cx={d.x}
              cy={d.y}
              r={d.lit ? 3 : 2}
              fill={d.lit ? 'rgba(0, 220, 255, 0.6)' : 'rgba(0, 200, 255, 0.12)'}
            />
          ))}
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0

    if (phase === 'enter') {
      // Fade in with slight scale
      opacity = enterProgress
      const scale = 0.9 + enterProgress * 0.1

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            opacity,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 10px ${color}, 0 0 30px ${color}30`,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
          }}
        >
          {word}
        </div>
      )
    } else if (phase === 'hold') {
      opacity = 1
      // Pulse glow during hold like data passing through traces
      const pulse = 0.7 + Math.sin(holdProgress * Math.PI * 6) * 0.3

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 ${8 + pulse * 15}px ${color}, 0 0 ${25 + pulse * 20}px ${color}40`,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
          }}
        >
          {word}
        </div>
      )
    } else {
      opacity = 1 - exitProgress

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${1 - exitProgress * 0.1})`,
            opacity,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 10px ${color}`,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
          }}
        >
          {word}
        </div>
      )
    }
  },
}

function CircuitBoardComponent(props: MotionGraphicProps<CircuitBoardConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-circuit-board',
  title: 'Kinetic Circuit Board',
  description: 'Circuit board trace pattern background with pulsing data nodes, horizontal/vertical lines, and tech-style text reveal',
  tags: ['kinetic', 'typography', 'circuit', 'pcb', 'tech', 'electronic'],
  category: 'captions',
  component: CircuitBoardComponent as any,
  defaultConfig: {
    words: ['CHIP', 'BOARD', 'LOGIC', 'GATE'],
    colors: ['#00D4FF', '#00FFD4', '#00D4FF', '#00FFD4'],
    bgColor: '#050a12',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CHIP', 'BOARD', 'LOGIC', 'GATE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00D4FF', '#00FFD4'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050a12', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
