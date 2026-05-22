import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EKGTraceConfig extends KineticBaseConfig {}

/** Generate a PQRST-like waveform y-value for a given x position */
function pqrstWave(x: number): number {
  // Normalize to 0..1 cycle
  const t = ((x % 1) + 1) % 1
  // P wave
  if (t >= 0.05 && t < 0.15) {
    const p = (t - 0.05) / 0.1
    return -Math.sin(p * Math.PI) * 0.15
  }
  // Q dip
  if (t >= 0.2 && t < 0.25) {
    const q = (t - 0.2) / 0.05
    return Math.sin(q * Math.PI) * 0.1
  }
  // R spike
  if (t >= 0.25 && t < 0.35) {
    const r = (t - 0.25) / 0.1
    return -Math.sin(r * Math.PI) * 0.8
  }
  // S dip
  if (t >= 0.35 && t < 0.4) {
    const s = (t - 0.35) / 0.05
    return Math.sin(s * Math.PI) * 0.2
  }
  // T wave
  if (t >= 0.5 && t < 0.65) {
    const tw = (t - 0.5) / 0.15
    return -Math.sin(tw * Math.PI) * 0.25
  }
  return 0
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    const gridSpacing = 20
    const gridLines: React.ReactNode[] = []

    // Vertical grid lines
    for (let x = 0; x < width; x += gridSpacing) {
      const isMajor = x % (gridSpacing * 5) === 0
      gridLines.push(
        <line
          key={`v${x}`}
          x1={x} y1={0} x2={x} y2={height}
          stroke={isMajor ? 'rgba(0, 180, 0, 0.15)' : 'rgba(0, 180, 0, 0.06)'}
          strokeWidth={isMajor ? 0.8 : 0.4}
        />
      )
    }
    // Horizontal grid lines
    for (let y = 0; y < height; y += gridSpacing) {
      const isMajor = y % (gridSpacing * 5) === 0
      gridLines.push(
        <line
          key={`h${y}`}
          x1={0} y1={y} x2={width} y2={y}
          stroke={isMajor ? 'rgba(0, 180, 0, 0.15)' : 'rgba(0, 180, 0, 0.06)'}
          strokeWidth={isMajor ? 0.8 : 0.4}
        />
      )
    }

    // Scrolling EKG trace
    const traceY = height * 0.5
    const traceAmplitude = height * 0.2
    const scrollOffset = frame * 2
    const points: string[] = []
    for (let px = 0; px < width; px += 2) {
      const cycleX = (px + scrollOffset) / 200
      const yVal = pqrstWave(cycleX) * traceAmplitude
      points.push(`${px},${traceY + yVal}`)
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {gridLines}
          {/* EKG trace glow */}
          <polyline
            points={points.join(' ')}
            fill="none"
            stroke="rgba(0, 255, 60, 0.15)"
            strokeWidth={6}
            strokeLinejoin="round"
          />
          {/* Main EKG trace */}
          <polyline
            points={points.join(' ')}
            fill="none"
            stroke="#00ff3c"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {/* Leading dot */}
          <circle
            cx={width - 2}
            cy={traceY + pqrstWave((width - 2 + scrollOffset) / 200) * traceAmplitude}
            r={4}
            fill="#00ff3c"
          />
        </svg>
        {/* Monitor border vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 80px rgba(0,0,0,0.6)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    // Heartbeat pulse rhythm
    const beatPhase = (f * 0.08) % (Math.PI * 2)
    const beatScale = 1 + Math.max(0, Math.sin(beatPhase)) * 0.04

    if (phase === 'enter') {
      // Text traces in like an EKG signal, left to right reveal
      const revealPct = enterProgress * 100
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${0.95 + enterProgress * 0.05})`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 11vw, 140px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 10px ${color}, 0 0 30px rgba(0,255,60,0.3)`,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            clipPath: `inset(0 ${100 - revealPct}% 0 0)`,
            opacity: Math.min(1, enterProgress * 2),
          }}
        >
          {word}
        </div>
      )
    } else if (phase === 'hold') {
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${beatScale})`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 11vw, 140px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 ${10 + Math.sin(beatPhase) * 8}px ${color}, 0 0 30px rgba(0,255,60,0.25)`,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
          }}
        >
          {word}
        </div>
      )
    } else {
      // Flatline exit - text fades as trace goes flat
      const opacity = 1 - exitProgress
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scaleY(${1 - exitProgress * 0.5})`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 11vw, 140px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 8px ${color}`,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            opacity,
          }}
        >
          {word}
        </div>
      )
    }
  },
}

function EKGTraceComponent(props: MotionGraphicProps<EKGTraceConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ekg-trace',
  title: 'Kinetic EKG Trace',
  description: 'EKG/ECG heartbeat monitor with PQRST waveform trace on green-on-black grid, text pulses with cardiac rhythm',
  tags: ['kinetic', 'typography', 'ekg', 'ecg', 'heartbeat', 'medical', 'monitor', 'science'],
  category: 'captions',
  component: EKGTraceComponent as any,
  defaultConfig: {
    words: ['PULSE', 'HEART', 'ALIVE', 'RHYTHM'],
    colors: ['#00ff3c', '#00ff60', '#00ff3c', '#00dd44'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PULSE', 'HEART', 'ALIVE', 'RHYTHM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00ff3c', '#00ff60'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
