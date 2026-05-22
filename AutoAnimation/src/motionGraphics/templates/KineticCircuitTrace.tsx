import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CircuitTraceConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // PCB board background -- fiberglass green-tinted with copper traces
    const traceColor = 'rgba(180, 140, 60, 0.08)'
    const padColor = 'rgba(180, 140, 60, 0.12)'
    const viaColor = 'rgba(200, 160, 80, 0.15)'

    // Generate deterministic traces as orthogonal routes
    const traces: { points: string; thick: boolean }[] = []
    const pads: { x: number; y: number; size: number }[] = []
    const vias: { x: number; y: number }[] = []

    for (let i = 0; i < 25; i++) {
      const seed = i * 47 + 13
      const sx = seededRand(seed) * width
      const sy = seededRand(seed + 1) * height
      const ex = seededRand(seed + 2) * width
      const ey = seededRand(seed + 3) * height
      // Orthogonal routing: go horizontal then vertical
      const midX = ex
      traces.push({
        points: `${sx},${sy} ${midX},${sy} ${midX},${ey}`,
        thick: seededRand(seed + 4) > 0.7,
      })
    }

    // Solder pads at grid intersections
    for (let i = 0; i < 30; i++) {
      const seed = i * 29 + 7
      const px = Math.round(seededRand(seed) * width / 20) * 20
      const py = Math.round(seededRand(seed + 1) * height / 20) * 20
      const isLarge = seededRand(seed + 2) > 0.6
      pads.push({ x: px, y: py, size: isLarge ? 4 : 2.5 })
    }

    // Vias
    for (let i = 0; i < 8; i++) {
      const seed = i * 61 + 17
      vias.push({
        x: seededRand(seed) * width,
        y: seededRand(seed + 1) * height,
      })
    }

    // Animated data pulse along a trace
    const pulseT = (frame * 0.02) % 1

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Board outline */}
          <rect x={6} y={6} width={width - 12} height={height - 12} rx={3}
            fill="none" stroke="rgba(180, 140, 60, 0.06)" strokeWidth={1} />
          {/* Copper traces */}
          {traces.map((t, i) => (
            <polyline key={`tr${i}`} points={t.points}
              fill="none" stroke={traceColor}
              strokeWidth={t.thick ? 2 : 0.8}
              strokeLinejoin="round" />
          ))}
          {/* Solder pads */}
          {pads.map((p, i) => (
            <g key={`p${i}`}>
              <circle cx={p.x} cy={p.y} r={p.size} fill={padColor} />
              <circle cx={p.x} cy={p.y} r={p.size * 0.4} fill={bgColor} />
            </g>
          ))}
          {/* Vias */}
          {vias.map((v, i) => (
            <g key={`v${i}`}>
              <circle cx={v.x} cy={v.y} r={3.5} fill="none" stroke={viaColor} strokeWidth={0.8} />
              <circle cx={v.x} cy={v.y} r={1.2} fill={viaColor} />
            </g>
          ))}
          {/* Data pulse indicator */}
          <circle cx={width * pulseT} cy={height * 0.3}
            r={4} fill="rgba(255, 200, 50, 0.15)" />
          {/* Silkscreen reference designators */}
          <text x={20} y={25} fill="rgba(255, 255, 255, 0.06)" fontSize={6} fontFamily="'Courier New', monospace">R1</text>
          <text x={width - 40} y={height - 20} fill="rgba(255, 255, 255, 0.06)" fontSize={6} fontFamily="'Courier New', monospace">C4</text>
          <text x={width * 0.4} y={20} fill="rgba(255, 255, 255, 0.06)" fontSize={6} fontFamily="'Courier New', monospace">U1</text>
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height, frame }: WordRenderProps) => {
    const letters = word.split('')
    const fontSize = Math.min(width / (letters.length * 0.65), 130)
    const totalWidth = letters.length * fontSize * 0.65
    const startX = (width - totalWidth) / 2

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {/* Traces routing into letter positions */}
          {letters.map((_, i) => {
            const letterCx = startX + i * fontSize * 0.65 + fontSize * 0.3
            const letterCy = height * 0.5
            const traceStartX = i % 2 === 0 ? 0 : width
            const traceStartY = seededRand(i * 31) * height * 0.6 + height * 0.2
            // Route: horizontal to midpoint, vertical to letter
            const midX = letterCx
            let traceOpacity = 0
            let traceProgress = 0

            if (phase === 'enter') {
              const letterT = i / letters.length
              traceProgress = Math.min(1, (enterProgress - letterT * 0.3) / 0.7)
              traceOpacity = traceProgress > 0 ? 0.3 : 0
            } else if (phase === 'hold') {
              traceProgress = 1
              const pulse = Math.sin(holdProgress * Math.PI * 6 + i * 1.2)
              traceOpacity = 0.2 + pulse * 0.1
            } else {
              traceProgress = 1
              traceOpacity = (1 - exitProgress) * 0.3
            }

            if (traceProgress <= 0) return null

            const segLen1 = Math.abs(midX - traceStartX)
            const segLen2 = Math.abs(letterCy - traceStartY)
            const totalLen = segLen1 + segLen2
            const drawnLen = traceProgress * totalLen

            let points = `${traceStartX},${traceStartY}`
            if (drawnLen > segLen1) {
              points += ` ${midX},${traceStartY}`
              const vLen = Math.min(segLen2, drawnLen - segLen1)
              const vy = traceStartY + (letterCy - traceStartY) * (vLen / segLen2)
              points += ` ${midX},${vy}`
            } else {
              const hx = traceStartX + (midX - traceStartX) * (drawnLen / segLen1)
              points += ` ${hx},${traceStartY}`
            }

            return (
              <g key={`trace${i}`} opacity={traceOpacity}>
                <polyline points={points} fill="none" stroke={color}
                  strokeWidth={1.5} strokeLinejoin="round" />
                {/* Solder node at letter position */}
                {traceProgress > 0.9 && (
                  <g>
                    <circle cx={letterCx} cy={letterCy + fontSize * 0.5} r={5}
                      fill={`${color}30`} stroke={color} strokeWidth={1} />
                    <circle cx={letterCx} cy={letterCy + fontSize * 0.5} r={2}
                      fill={color} />
                  </g>
                )}
              </g>
            )
          })}
        </svg>

        {/* Letters */}
        {letters.map((letter, i) => {
          const letterX = startX + i * fontSize * 0.65
          let opacity = 0

          if (phase === 'enter') {
            const letterT = i / letters.length
            const t = Math.max(0, (enterProgress - letterT * 0.3 - 0.5) / 0.5)
            opacity = Math.min(1, t * 2)
          } else if (phase === 'hold') {
            opacity = 1
          } else {
            opacity = 1 - exitProgress
          }

          return (
            <div key={i} style={{
              position: 'absolute',
              left: letterX,
              top: '50%',
              transform: 'translateY(-50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
              fontWeight: 700,
              color,
              opacity,
              textTransform: 'uppercase',
              textShadow: `0 0 8px ${color}40`,
              whiteSpace: 'nowrap',
            }}>
              {letter}
            </div>
          )
        })}

        {/* Silkscreen component reference */}
        {phase !== 'exit' && (
          <div style={{
            position: 'absolute',
            bottom: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: `${color}35`,
            letterSpacing: 2,
            opacity: phase === 'enter' ? Math.max(0, enterProgress - 0.6) * 2.5 : 1,
          }}>
            REF: PCB-{word}-001
          </div>
        )}
      </div>
    )
  },
}

function CircuitTraceComponent(props: MotionGraphicProps<CircuitTraceConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-circuit-trace',
  title: 'Circuit Trace',
  description: 'PCB circuit board traces routing into text letterforms with solder point nodes, copper pads, vias, and orthogonal trace routing',
  tags: ['kinetic', 'typography', 'pcb', 'circuit', 'trace', 'solder', 'electronics', 'technical'],
  category: 'captions',
  component: CircuitTraceComponent as any,
  defaultConfig: {
    words: ['TRACE', 'ROUTE', 'NODE', 'LINK'],
    colors: ['#C8A040', '#E0C060', '#C8A040', '#E0C060'],
    bgColor: '#0a1408',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TRACE', 'ROUTE', 'NODE', 'LINK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C8A040', '#E0C060'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a1408', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
