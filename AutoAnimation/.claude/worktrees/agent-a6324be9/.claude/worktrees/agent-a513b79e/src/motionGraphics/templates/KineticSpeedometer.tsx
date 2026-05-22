import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SpeedometerConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const cx = width / 2
    const cy = height * 0.62
    const radius = Math.min(width, height) * 0.32

    // Needle sweeps from -135deg to +135deg based on time
    const sweep = (Math.sin(time * 1.2) * 0.5 + 0.5)
    const needleAngle = -135 + sweep * 270
    const needleRad = (needleAngle * Math.PI) / 180
    const needleLen = radius * 0.78
    const nx = cx + Math.cos(needleRad) * needleLen
    const ny = cy + Math.sin(needleRad) * needleLen

    const tickCount = 11
    const ticks = Array.from({ length: tickCount }, (_, i) => {
      const frac = i / (tickCount - 1)
      const angle = -135 + frac * 270
      const rad = (angle * Math.PI) / 180
      const inner = radius * 0.82
      const outer = radius * 0.95
      return {
        x1: cx + Math.cos(rad) * inner,
        y1: cy + Math.sin(rad) * inner,
        x2: cx + Math.cos(rad) * outer,
        y2: cy + Math.sin(rad) * outer,
        label: `${Math.round(frac * 200)}`,
        lx: cx + Math.cos(rad) * (radius * 1.06),
        ly: cy + Math.sin(rad) * (radius * 1.06),
      }
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Gauge arc background */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={radius * 0.14}
            strokeDasharray={`${radius * Math.PI * 1.5} ${radius * Math.PI * 2}`}
            strokeDashoffset={radius * Math.PI * 0.25}
            strokeLinecap="round"
            transform={`rotate(-135, ${cx}, ${cy})`}
          />
          {/* Colored arc */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="url(#speedGrad)"
            strokeWidth={radius * 0.1}
            strokeDasharray={`${radius * Math.PI * 1.5 * sweep} ${radius * Math.PI * 2}`}
            strokeDashoffset={radius * Math.PI * 0.25}
            strokeLinecap="round"
            transform={`rotate(-135, ${cx}, ${cy})`}
          />
          <defs>
            <linearGradient id="speedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00ff88" />
              <stop offset="50%" stopColor="#ffcc00" />
              <stop offset="100%" stopColor="#ff3333" />
            </linearGradient>
          </defs>
          {/* Tick marks */}
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
              <text x={t.lx} y={t.ly} fill="rgba(255,255,255,0.35)" fontSize={Math.max(9, radius * 0.1)} textAnchor="middle" dominantBaseline="middle">
                {t.label}
              </text>
            </g>
          ))}
          {/* Needle */}
          <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#ff3333" strokeWidth={3} strokeLinecap="round" />
          <circle cx={cx} cy={cy} r={radius * 0.06} fill="#ff3333" />
          <circle cx={cx} cy={cy} r={radius * 0.03} fill="#ffffff" />
          {/* Speed readout */}
          <text x={cx} y={cy + radius * 0.35} fill="rgba(255,255,255,0.6)" fontSize={Math.max(11, radius * 0.14)} textAnchor="middle" fontFamily="monospace">
            {Math.round(sweep * 200)} MPH
          </text>
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let translateY = 0

    if (phase === 'enter') {
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      opacity = eased
      scale = 0.6 + eased * 0.4
      translateY = (1 - eased) * 30
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1 + Math.sin(Date.now() * 0.003) * 0.02
    } else {
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.3
      translateY = -exitProgress * 25
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '18%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) translateY(${translateY}px)`,
          opacity,
          fontFamily: "'Arial Black', 'Impact', sans-serif",
          fontSize: 'clamp(36px, 10vw, 120px)',
          fontWeight: 900,
          color,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          whiteSpace: 'nowrap',
          textShadow: `0 0 20px ${color}60, 0 2px 8px rgba(0,0,0,0.6)`,
        }}
      >
        {word}
      </div>
    )
  },
}

function SpeedometerComponent(props: MotionGraphicProps<SpeedometerConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-speedometer',
  title: 'Speedometer',
  description: 'Words appear above an animated speedometer gauge with sweeping needle, colored arc, tick marks, and MPH readout.',
  tags: ['kinetic', 'car', 'speed', 'racing', 'gauge', 'motorsport', 'auto'],
  category: 'captions',
  component: SpeedometerComponent as any,
  defaultConfig: {
    words: ['SPEED', 'POWER', 'TURBO', 'BOOST'],
    colors: ['#ff3333', '#ffcc00', '#00ff88', '#00bbff'],
    bgColor: '#0a0a12',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SPEED', 'POWER', 'TURBO', 'BOOST'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ff3333', '#ffcc00', '#00ff88', '#00bbff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a12', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
