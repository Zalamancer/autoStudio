import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DashboardConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    const cx = width / 2
    const cy = height / 2
    const gaugeR = Math.min(width, height) * 0.14

    // 3 small gauges across the bottom
    const gauges = [
      { label: 'RPM', cx: cx - gaugeR * 2.8, cy: cy + gaugeR * 1.4, speed: 1.5, max: 8 },
      { label: 'TEMP', cx: cx, cy: cy + gaugeR * 1.6, speed: 0.4, max: 120 },
      { label: 'FUEL', cx: cx + gaugeR * 2.8, cy: cy + gaugeR * 1.4, speed: 0.2, max: 100 },
    ]

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Dashboard panel texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, rgba(20,20,30,0.8) 0%, ${bgColor} 30%, rgba(15,15,20,0.9) 100%)`,
          }}
        />
        {/* Subtle carbon fiber pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.04,
            background: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)`,
          }}
        />
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {gauges.map((g, gi) => {
            const val = (Math.sin(time * g.speed + gi * 2) * 0.5 + 0.5)
            const needleAngle = -135 + val * 270
            const needleRad = (needleAngle * Math.PI) / 180
            const nx = g.cx + Math.cos(needleRad) * gaugeR * 0.7
            const ny = g.cy + Math.sin(needleRad) * gaugeR * 0.7
            return (
              <g key={gi}>
                {/* Gauge ring */}
                <circle cx={g.cx} cy={g.cy} r={gaugeR} fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.1)" strokeWidth={1.5} />
                <circle
                  cx={g.cx}
                  cy={g.cy}
                  r={gaugeR * 0.85}
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth={gaugeR * 0.08}
                  strokeDasharray={`${gaugeR * Math.PI * 1.5} ${gaugeR * Math.PI * 2}`}
                  strokeDashoffset={gaugeR * Math.PI * 0.25}
                  transform={`rotate(-135, ${g.cx}, ${g.cy})`}
                />
                {/* Value arc */}
                <circle
                  cx={g.cx}
                  cy={g.cy}
                  r={gaugeR * 0.85}
                  fill="none"
                  stroke={gi === 0 ? '#ff4444' : gi === 1 ? '#44aaff' : '#44ff88'}
                  strokeWidth={gaugeR * 0.06}
                  strokeDasharray={`${gaugeR * Math.PI * 1.5 * val} ${gaugeR * Math.PI * 2}`}
                  strokeDashoffset={gaugeR * Math.PI * 0.25}
                  strokeLinecap="round"
                  transform={`rotate(-135, ${g.cx}, ${g.cy})`}
                  opacity={0.7}
                />
                {/* Needle */}
                <line x1={g.cx} y1={g.cy} x2={nx} y2={ny} stroke="#ff6644" strokeWidth={2} strokeLinecap="round" />
                <circle cx={g.cx} cy={g.cy} r={gaugeR * 0.05} fill="#ff6644" />
                {/* Label */}
                <text x={g.cx} y={g.cy + gaugeR * 0.35} fill="rgba(255,255,255,0.4)" fontSize={Math.max(8, gaugeR * 0.18)} textAnchor="middle" fontFamily="monospace">
                  {g.label}
                </text>
                {/* Value */}
                <text x={g.cx} y={g.cy - gaugeR * 0.15} fill="rgba(255,255,255,0.7)" fontSize={Math.max(10, gaugeR * 0.22)} textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                  {Math.round(val * g.max)}
                </text>
              </g>
            )
          })}
        </svg>
        {/* Indicator lights row */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 12,
          }}
        >
          {['#ff4444', '#ffaa00', '#44ff88', '#44aaff'].map((c, i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: c,
                opacity: Math.sin(time * 2 + i * 1.5) > 0.3 ? 0.8 : 0.15,
                boxShadow: `0 0 6px ${c}60`,
              }}
            />
          ))}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let letterSpacing = 0

    if (phase === 'enter') {
      // Digital display flicker-on
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      const flicker = enterProgress < 0.3 ? (Math.sin(enterProgress * 80) > 0 ? 1 : 0.3) : 1
      opacity = eased * flicker
      scale = 0.95 + eased * 0.05
      letterSpacing = (1 - eased) * 20
    } else if (phase === 'hold') {
      opacity = 1
      letterSpacing = Math.sin(Date.now() * 0.002) * 0.5
    } else {
      // Fade out like LCD turning off
      opacity = 1 - exitProgress * exitProgress
      scale = 1 - exitProgress * 0.1
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
        }}
      >
        <div
          style={{
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(32px, 10vw, 110px)',
            fontWeight: 900,
            color,
            textTransform: 'uppercase',
            letterSpacing: `${letterSpacing}px`,
            whiteSpace: 'nowrap',
            textShadow: `0 0 8px ${color}80, 0 0 24px ${color}30`,
          }}
        >
          {word}
        </div>
        {/* Digital underline */}
        <div
          style={{
            marginTop: 6,
            height: 2,
            background: `linear-gradient(90deg, transparent 0%, ${color}60 20%, ${color}60 80%, transparent 100%)`,
          }}
        />
      </div>
    )
  },
}

function DashboardComponent(props: MotionGraphicProps<DashboardConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dashboard',
  title: 'Dashboard',
  description: 'Words displayed as if on a car dashboard with animated RPM, temp, and fuel gauges, indicator lights, and digital display flicker.',
  tags: ['kinetic', 'dashboard', 'gauge', 'car', 'instrument', 'panel', 'motorsport', 'auto'],
  category: 'captions',
  component: DashboardComponent as any,
  defaultConfig: {
    words: ['READY', 'SET', 'DRIVE', 'GO'],
    colors: ['#00ff88', '#ffcc00', '#ff4444', '#00ccff'],
    bgColor: '#0c0c14',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['READY', 'SET', 'DRIVE', 'GO'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00ff88', '#ffcc00', '#ff4444', '#00ccff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0c14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
