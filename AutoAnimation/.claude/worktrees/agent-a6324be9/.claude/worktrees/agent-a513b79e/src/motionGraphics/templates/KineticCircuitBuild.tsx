import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CircuitBuildConfig extends KineticBaseConfig {
  traceCount: number
  pulseSpeed: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function pseudo(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Generate orthogonal circuit trace path (PCB style — only 90° turns)
function buildTracePath(seed: number, w: number, h: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = []
  const startX = pseudo(seed) * w
  const startY = pseudo(seed + 1) * h
  points.push({ x: startX, y: startY })

  let cx = startX
  let cy = startY
  const steps = 4 + Math.floor(pseudo(seed + 2) * 4)

  for (let i = 0; i < steps; i++) {
    const horizontal = i % 2 === 0
    const dist = (0.1 + pseudo(seed + i * 7 + 3) * 0.3) * (horizontal ? w : h)
    const dir = pseudo(seed + i * 11 + 4) > 0.5 ? 1 : -1

    if (horizontal) {
      cx = Math.max(0, Math.min(w, cx + dist * dir))
    } else {
      cy = Math.max(0, Math.min(h, cy + dist * dir))
    }
    points.push({ x: cx, y: cy })
  }

  return points
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* PCB substrate texture hint */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(0,100,60,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,100,60,0.04) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height, index }: WordRenderProps) => {
    const traceCount = 14
    const seed = index * 59

    let buildP = 0
    let shortCircuitP = 0

    if (phase === 'enter') {
      buildP = easeOutExpo(enterProgress)
    } else if (phase === 'hold') {
      buildP = 1
    } else {
      buildP = 1
      shortCircuitP = easeInCubic(exitProgress)
    }

    // Electrical pulse that travels along built traces
    const pulsePos = ((holdProgress * 2 + enterProgress) % 1)

    const traces = []
    const pads = []

    for (let t = 0; t < traceCount; t++) {
      const traceSeed = seed + t * 37
      const points = buildTracePath(traceSeed, width, height)

      const traceDelay = (t / traceCount) * 0.55
      const traceP = Math.max(0, Math.min(1, (buildP - traceDelay) / (1 - traceDelay + 0.01)))
      const easedTrace = easeOutExpo(traceP)

      if (easedTrace <= 0) continue

      // Build total path length for partial drawing
      let totalLen = 0
      const segLengths: number[] = []
      for (let s = 0; s < points.length - 1; s++) {
        const dx = points[s + 1].x - points[s].x
        const dy = points[s + 1].y - points[s].y
        const len = Math.sqrt(dx * dx + dy * dy)
        segLengths.push(len)
        totalLen += len
      }

      const drawnLen = totalLen * easedTrace
      let remaining = drawnLen
      const drawnPoints: { x: number; y: number }[] = [points[0]]

      for (let s = 0; s < points.length - 1 && remaining > 0; s++) {
        if (remaining >= segLengths[s]) {
          drawnPoints.push(points[s + 1])
          remaining -= segLengths[s]
        } else {
          const frac = remaining / segLengths[s]
          drawnPoints.push({
            x: points[s].x + (points[s + 1].x - points[s].x) * frac,
            y: points[s].y + (points[s + 1].y - points[s].y) * frac,
          })
          remaining = 0
        }
      }

      const pathD = drawnPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
      const traceOpacity = (0.3 + pseudo(traceSeed) * 0.4) * (1 - shortCircuitP)

      traces.push(
        <path
          key={`trace${t}`}
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={1.5 + pseudo(traceSeed + 1) * 1}
          strokeOpacity={traceOpacity}
          strokeLinecap="square"
        />,
      )

      // Solder pads at endpoints
      if (traceP > 0.05) {
        const padP = Math.min(1, traceP * 5)
        pads.push(
          <circle
            key={`pad${t}a`}
            cx={points[0].x}
            cy={points[0].y}
            r={4 * padP}
            fill={color}
            opacity={0.4 * padP * (1 - shortCircuitP)}
          />,
        )
      }

      // Pulse glow traveling along fully-built traces
      if (phase === 'hold' && drawnPoints.length >= 2) {
        const pulseIdx = Math.floor(pulsePos * (drawnPoints.length - 1))
        const pulseFrac = (pulsePos * (drawnPoints.length - 1)) - pulseIdx
        if (pulseIdx < drawnPoints.length - 1) {
          const px = drawnPoints[pulseIdx].x + (drawnPoints[pulseIdx + 1].x - drawnPoints[pulseIdx].x) * pulseFrac
          const py = drawnPoints[pulseIdx].y + (drawnPoints[pulseIdx + 1].y - drawnPoints[pulseIdx].y) * pulseFrac
          pads.push(
            <circle
              key={`pulse${t}`}
              cx={px}
              cy={py}
              r={5}
              fill={color}
              opacity={0.8}
            />,
          )
        }
      }
    }

    const textOpacity = phase === 'enter' ? Math.max(0, (buildP - 0.6) / 0.4) : phase === 'hold' ? 1 : 1 - shortCircuitP

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {traces}
          {pads}
        </svg>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: Math.max(0, textOpacity),
            whiteSpace: 'nowrap',
          }}
        >
          <span
            style={{
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: 'clamp(48px, 12vw, 150px)',
              fontWeight: 700,
              color,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textShadow: `0 0 20px ${color}60`,
            }}
          >
            {word}
          </span>
        </div>
      </div>
    )
  },
}

function CircuitBuildComponent(props: MotionGraphicProps<CircuitBuildConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-circuit-build',
  title: 'Kinetic Circuit Build',
  description: 'PCB circuit traces route across the frame in orthogonal paths, solder pads dot into place, and electrical pulses run along them — then the text powers up.',
  tags: ['kinetic', 'typography', 'circuit', 'pcb', 'electronics', 'trace', 'build', 'tech', 'lines', 'assembly'],
  category: 'captions',
  component: CircuitBuildComponent as any,
  defaultConfig: {
    words: ['POWER', 'SIGNAL', 'BUILD', 'LIVE'],
    colors: ['#00FF88', '#33FF99', '#00DD77', '#11FFAA'],
    bgColor: '#071210',
    cycleDuration: 2.0,
    traceCount: 14,
    pulseSpeed: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['POWER', 'SIGNAL', 'BUILD', 'LIVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FF88', '#33FF99', '#00DD77', '#11FFAA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#071210', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 5, group: 'Timing' },
    { key: 'traceCount', label: 'Trace Count', type: 'number', defaultValue: 14, min: 4, max: 30, group: 'Animation' },
    { key: 'pulseSpeed', label: 'Pulse Speed', type: 'number', defaultValue: 1, min: 0.2, max: 4, group: 'Animation' },
  ],
})
