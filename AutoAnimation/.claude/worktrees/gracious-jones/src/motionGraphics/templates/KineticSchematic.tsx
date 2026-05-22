import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SchematicConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

// Electronic schematic component symbols as SVG paths
function ResistorSymbol({ x, y, color, opacity }: { x: number; y: number; color: string; opacity: number }) {
  return (
    <g opacity={opacity} transform={`translate(${x},${y})`}>
      <line x1={-15} y1={0} x2={-10} y2={0} stroke={color} strokeWidth={0.6} />
      <polyline points="-10,0 -8,-4 -4,4 0,-4 4,4 8,-4 10,0" fill="none" stroke={color} strokeWidth={0.6} />
      <line x1={10} y1={0} x2={15} y2={0} stroke={color} strokeWidth={0.6} />
    </g>
  )
}

function CapacitorSymbol({ x, y, color, opacity }: { x: number; y: number; color: string; opacity: number }) {
  return (
    <g opacity={opacity} transform={`translate(${x},${y})`}>
      <line x1={-12} y1={0} x2={-2} y2={0} stroke={color} strokeWidth={0.6} />
      <line x1={-2} y1={-6} x2={-2} y2={6} stroke={color} strokeWidth={0.8} />
      <line x1={2} y1={-6} x2={2} y2={6} stroke={color} strokeWidth={0.8} />
      <line x1={2} y1={0} x2={12} y2={0} stroke={color} strokeWidth={0.6} />
    </g>
  )
}

function DiodeSymbol({ x, y, color, opacity }: { x: number; y: number; color: string; opacity: number }) {
  return (
    <g opacity={opacity} transform={`translate(${x},${y})`}>
      <line x1={-12} y1={0} x2={-4} y2={0} stroke={color} strokeWidth={0.6} />
      <polygon points="-4,-5 -4,5 4,0" fill="none" stroke={color} strokeWidth={0.6} />
      <line x1={4} y1={-5} x2={4} y2={5} stroke={color} strokeWidth={0.8} />
      <line x1={4} y1={0} x2={12} y2={0} stroke={color} strokeWidth={0.6} />
    </g>
  )
}

function OpAmpSymbol({ x, y, color, opacity }: { x: number; y: number; color: string; opacity: number }) {
  return (
    <g opacity={opacity} transform={`translate(${x},${y})`}>
      <polygon points="-10,-10 -10,10 10,0" fill="none" stroke={color} strokeWidth={0.6} />
      <text x={-6} y={-2} fill={color} fontSize={6} fontFamily="'Courier New', monospace">+</text>
      <text x={-6} y={5} fill={color} fontSize={6} fontFamily="'Courier New', monospace">-</text>
      <line x1={-16} y1={-5} x2={-10} y2={-5} stroke={color} strokeWidth={0.5} />
      <line x1={-16} y1={5} x2={-10} y2={5} stroke={color} strokeWidth={0.5} />
      <line x1={10} y1={0} x2={16} y2={0} stroke={color} strokeWidth={0.5} />
    </g>
  )
}

function GroundSymbol({ x, y, color, opacity }: { x: number; y: number; color: string; opacity: number }) {
  return (
    <g opacity={opacity} transform={`translate(${x},${y})`}>
      <line x1={0} y1={-6} x2={0} y2={0} stroke={color} strokeWidth={0.6} />
      <line x1={-6} y1={0} x2={6} y2={0} stroke={color} strokeWidth={0.7} />
      <line x1={-4} y1={3} x2={4} y2={3} stroke={color} strokeWidth={0.6} />
      <line x1={-2} y1={6} x2={2} y2={6} stroke={color} strokeWidth={0.5} />
    </g>
  )
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    const schematicColor = 'rgba(0, 200, 120, 0.1)'
    const wireColor = 'rgba(0, 200, 120, 0.06)'

    // Generate component layout
    const components: { type: string; x: number; y: number }[] = []
    const wires: { x1: number; y1: number; x2: number; y2: number }[] = []

    for (let i = 0; i < 12; i++) {
      const seed = i * 53 + 7
      const types = ['R', 'C', 'D', 'OP', 'GND']
      components.push({
        type: types[Math.floor(seededRand(seed) * types.length)],
        x: seededRand(seed + 1) * (width - 60) + 30,
        y: seededRand(seed + 2) * (height - 60) + 30,
      })
    }

    // Connect nearby components with orthogonal wires
    for (let i = 0; i < components.length - 1; i++) {
      const a = components[i]
      const b = components[i + 1]
      wires.push({ x1: a.x + 15, y1: a.y, x2: b.x - 15, y2: a.y })
      wires.push({ x1: b.x - 15, y1: a.y, x2: b.x - 15, y2: b.y })
    }

    // Animated signal flow
    const signalT = (frame * 0.015) % 1

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Wires */}
          {wires.map((w, i) => (
            <line key={`w${i}`} x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2}
              stroke={wireColor} strokeWidth={0.5} />
          ))}
          {/* Component symbols */}
          {components.map((c, i) => {
            const props = { x: c.x, y: c.y, color: schematicColor, opacity: 1 }
            switch (c.type) {
              case 'R': return <ResistorSymbol key={`c${i}`} {...props} />
              case 'C': return <CapacitorSymbol key={`c${i}`} {...props} />
              case 'D': return <DiodeSymbol key={`c${i}`} {...props} />
              case 'OP': return <OpAmpSymbol key={`c${i}`} {...props} />
              case 'GND': return <GroundSymbol key={`c${i}`} {...props} />
              default: return null
            }
          })}
          {/* Reference designators */}
          {components.map((c, i) => (
            <text key={`ref${i}`} x={c.x} y={c.y - 12}
              textAnchor="middle" fill="rgba(0, 200, 120, 0.08)"
              fontSize={6} fontFamily="'Courier New', monospace">
              {c.type === 'R' ? `R${i + 1}` : c.type === 'C' ? `C${i + 1}` : c.type === 'D' ? `D${i + 1}` : c.type === 'OP' ? `U${i + 1}` : 'GND'}
            </text>
          ))}
          {/* Signal flow dot */}
          {wires.length > 0 && (
            <circle cx={wires[0].x1 + (wires[0].x2 - wires[0].x1) * signalT}
              cy={wires[0].y1} r={2}
              fill="rgba(0, 255, 150, 0.2)" />
          )}
          {/* Border */}
          <rect x={3} y={3} width={width - 6} height={height - 6}
            fill="none" stroke="rgba(0, 200, 120, 0.04)" strokeWidth={0.5} />
          {/* Sheet reference */}
          <text x={width - 10} y={height - 8} textAnchor="end"
            fill="rgba(0, 200, 120, 0.08)" fontSize={6} fontFamily="'Courier New', monospace">Sheet 1/1</text>
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height, frame }: WordRenderProps) => {
    const letters = word.split('')
    const fontSize = Math.min(width / (letters.length * 0.65), 130)
    const totalWidth = letters.length * fontSize * 0.65
    const startX = (width - totalWidth) / 2
    const baseY = height * 0.5

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {/* Wire bus connecting letters at bottom */}
          {letters.map((_, i) => {
            if (i === 0) return null
            const prevX = startX + (i - 1) * fontSize * 0.65 + fontSize * 0.3
            const currX = startX + i * fontSize * 0.65 + fontSize * 0.3
            const wireY = baseY + fontSize * 0.55
            let opacity = 0
            if (phase === 'enter') {
              const t = Math.max(0, (enterProgress - 0.3) / 0.7)
              opacity = Math.min(1, t * 2) * 0.4
            } else if (phase === 'hold') {
              opacity = 0.35
            } else {
              opacity = (1 - exitProgress) * 0.35
            }
            return (
              <line key={`bus${i}`} x1={prevX} y1={wireY} x2={currX} y2={wireY}
                stroke={color} strokeWidth={1} opacity={opacity} />
            )
          })}
          {/* Junction dots on wire bus */}
          {letters.map((_, i) => {
            const dotX = startX + i * fontSize * 0.65 + fontSize * 0.3
            const dotY = baseY + fontSize * 0.55
            let opacity = 0
            if (phase === 'enter') {
              opacity = Math.max(0, enterProgress - 0.4) * 1.5 * 0.6
            } else if (phase === 'hold') {
              const pulse = Math.sin(holdProgress * Math.PI * 5 + i * 1.5)
              opacity = 0.4 + pulse * 0.15
            } else {
              opacity = (1 - exitProgress) * 0.5
            }
            return (
              <circle key={`jn${i}`} cx={dotX} cy={dotY} r={3}
                fill={color} opacity={opacity} />
            )
          })}
          {/* Component symbol decorations around text */}
          {phase === 'hold' && (
            <>
              <ResistorSymbol x={startX - 30} y={baseY} color={color} opacity={0.2} />
              <CapacitorSymbol x={startX + totalWidth + 30} y={baseY} color={color} opacity={0.2} />
              <GroundSymbol x={width / 2} y={baseY + fontSize * 0.55 + 20} color={color} opacity={0.15} />
            </>
          )}
        </svg>

        {/* Letters */}
        {letters.map((letter, i) => {
          const letterX = startX + i * fontSize * 0.65
          let opacity = 0
          let scale = 1

          if (phase === 'enter') {
            // Schematic-style snap-in: each letter appears with a crisp digital snap
            const letterT = i / letters.length
            const t = Math.max(0, (enterProgress - letterT * 0.5) / (1 - letterT * 0.5))
            // Step function for crisp digital appearance
            opacity = t > 0.3 ? 1 : t / 0.3
            scale = t > 0.3 ? 1 : 0.85 + t * 0.5
          } else if (phase === 'hold') {
            opacity = 1
          } else {
            opacity = 1 - exitProgress * 1.2
            scale = 1 - exitProgress * 0.1
          }

          return (
            <div key={i} style={{
              position: 'absolute',
              left: letterX,
              top: '50%',
              transform: `translateY(-50%) scale(${scale})`,
              fontFamily: "'Courier New', monospace",
              fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
              fontWeight: 700,
              color,
              opacity: Math.max(0, opacity),
              textTransform: 'uppercase',
              letterSpacing: 1,
              whiteSpace: 'nowrap',
            }}>
              {letter}
            </div>
          )
        })}

        {/* Net label */}
        {phase !== 'exit' && (
          <div style={{
            position: 'absolute',
            top: baseY - fontSize * 0.6 - 14,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: `${color}40`,
            letterSpacing: 1,
            opacity: phase === 'enter' ? Math.max(0, enterProgress - 0.5) * 2 : 1,
            borderBottom: `1px solid ${color}20`,
            paddingBottom: 1,
          }}>
            NET: /{word}_BUS
          </div>
        )}
      </div>
    )
  },
}

function SchematicComponent(props: MotionGraphicProps<SchematicConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-schematic',
  title: 'Schematic',
  description: 'Electronic schematic diagram style with resistor, capacitor, diode, and op-amp symbols forming text connected by wire buses with junction nodes',
  tags: ['kinetic', 'typography', 'schematic', 'electronic', 'circuit', 'component', 'engineering', 'technical'],
  category: 'captions',
  component: SchematicComponent as any,
  defaultConfig: {
    words: ['SIGNAL', 'GAIN', 'BIAS', 'LOAD'],
    colors: ['#00C878', '#40E8A0', '#00C878', '#40E8A0'],
    bgColor: '#080c0a',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SIGNAL', 'GAIN', 'BIAS', 'LOAD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00C878', '#40E8A0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080c0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
