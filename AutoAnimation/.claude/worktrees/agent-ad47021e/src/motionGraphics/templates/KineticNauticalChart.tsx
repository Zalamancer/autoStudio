import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NauticalChartConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Latitude/longitude grid
    const gridLinesH = 8
    const gridLinesV = 10

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Ocean base with subtle gradient */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #0a1628 0%, #0d1e3a 40%, #0f2340 70%, #0a1628 100%)',
        }} />
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Lat/long grid */}
          {Array.from({ length: gridLinesV }, (_, i) => {
            const x = (width / (gridLinesV + 1)) * (i + 1)
            return (
              <line key={`gv${i}`} x1={x} y1={0} x2={x} y2={height}
                stroke="rgba(100, 160, 200, 0.06)" strokeWidth={0.5} />
            )
          })}
          {Array.from({ length: gridLinesH }, (_, i) => {
            const y = (height / (gridLinesH + 1)) * (i + 1)
            return (
              <line key={`gh${i}`} x1={0} y1={y} x2={width} y2={y}
                stroke="rgba(100, 160, 200, 0.06)" strokeWidth={0.5} />
            )
          })}
          {/* Compass bearing lines (rhumb lines) radiating from center-left */}
          {Array.from({ length: 16 }, (_, i) => {
            const angle = (i / 16) * Math.PI * 2
            const cx = width * 0.25
            const cy = height * 0.4
            const len = Math.max(width, height) * 0.8
            const ex = cx + Math.cos(angle) * len
            const ey = cy + Math.sin(angle) * len
            return (
              <line key={`rh${i}`} x1={cx} y1={cy} x2={ex} y2={ey}
                stroke="rgba(100, 160, 200, 0.03)" strokeWidth={0.4}
                strokeDasharray={i % 4 === 0 ? 'none' : '4,6'} />
            )
          })}
          {/* Depth soundings scattered across chart */}
          {Array.from({ length: 25 }, (_, i) => {
            const sx = seededRand(i * 7 + 1) * width * 0.9 + width * 0.05
            const sy = seededRand(i * 13 + 3) * height * 0.9 + height * 0.05
            const depth = Math.round(seededRand(i * 19 + 7) * 80 + 5)
            return (
              <text key={`dp${i}`} x={sx} y={sy}
                fill="rgba(100, 160, 200, 0.12)" fontSize={7}
                fontFamily="'Times New Roman', serif" textAnchor="middle">
                {depth}
              </text>
            )
          })}
          {/* Coastline fragments */}
          <path d={`M0,${height * 0.8} Q${width * 0.05},${height * 0.75} ${width * 0.1},${height * 0.82} Q${width * 0.15},${height * 0.88} ${width * 0.2},${height * 0.85} L${width * 0.25},${height} L0,${height} Z`}
            fill="rgba(180, 160, 120, 0.06)" stroke="rgba(180, 160, 120, 0.1)" strokeWidth={0.8} />
          {/* Compass rose small */}
          <g transform={`translate(${width - 50}, ${height - 50})`} opacity={0.15}>
            <circle cx={0} cy={0} r={20} fill="none" stroke="rgba(200, 180, 100, 0.5)" strokeWidth={0.5} />
            <polygon points="0,-18 -3,-5 3,-5" fill="rgba(200, 180, 100, 0.6)" />
            <polygon points="0,18 -3,5 3,5" fill="rgba(200, 180, 100, 0.3)" />
            <polygon points="-18,0 -5,-3 -5,3" fill="rgba(200, 180, 100, 0.3)" />
            <polygon points="18,0 5,-3 5,3" fill="rgba(200, 180, 100, 0.3)" />
            <text x={0} y={-22} textAnchor="middle" fill="rgba(200, 180, 100, 0.5)" fontSize={6} fontFamily="serif">N</text>
          </g>
          {/* Lat/long labels on edges */}
          {Array.from({ length: 4 }, (_, i) => {
            const lat = 48 - i * 2
            const y = (height / 5) * (i + 1)
            return (
              <text key={`lat${i}`} x={5} y={y - 3}
                fill="rgba(100, 160, 200, 0.1)" fontSize={6}
                fontFamily="'Times New Roman', serif">
                {lat}&deg;N
              </text>
            )
          })}
          {Array.from({ length: 5 }, (_, i) => {
            const lon = 122 + i * 2
            const x = (width / 6) * (i + 1)
            return (
              <text key={`lon${i}`} x={x} y={12}
                fill="rgba(100, 160, 200, 0.1)" fontSize={6}
                fontFamily="'Times New Roman', serif" textAnchor="middle">
                {lon}&deg;W
              </text>
            )
          })}
          {/* Animated wave ripples */}
          {Array.from({ length: 3 }, (_, i) => {
            const cx = width * (0.4 + i * 0.2)
            const cy = height * (0.3 + i * 0.15)
            const r = 15 + Math.sin(time * 1.5 + i * 2) * 5
            return (
              <circle key={`wave${i}`} cx={cx} cy={cy} r={r}
                fill="none" stroke="rgba(100, 160, 200, 0.04)" strokeWidth={0.5} />
            )
          })}
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const fontSize = Math.min(width / (word.length * 0.55), 110)

    if (phase === 'enter') {
      const t = enterProgress
      const ease = 1 - Math.pow(1 - t, 3)
      // Text materializes from depth soundings style — fades up from scattered numbers
      const scatter = (1 - ease) * 30

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Bearing line accent */}
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
            <line x1={width * 0.1} y1={height * 0.5}
              x2={width * 0.1 + ease * width * 0.8} y2={height * 0.5}
              stroke={`${color}20`} strokeWidth={0.5} strokeDasharray="6,4" />
          </svg>
          {/* Text with scatter effect */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            display: 'flex',
            transform: 'translate(-50%, -50%)',
            gap: 2,
          }}>
            {word.split('').map((char, i) => {
              const charDelay = i / word.length
              const charProgress = Math.max(0, Math.min(1, (ease - charDelay * 0.5) * 2))
              const yOff = (1 - charProgress) * scatter * (seededRand(i * 7) - 0.5) * 2
              const xOff = (1 - charProgress) * scatter * (seededRand(i * 13) - 0.5)
              return (
                <span key={i} style={{
                  fontFamily: "'Times New Roman', 'Garamond', serif",
                  fontSize: `clamp(26px, 8vw, ${fontSize}px)`,
                  fontWeight: 400,
                  fontStyle: 'italic',
                  color,
                  opacity: charProgress,
                  transform: `translate(${xOff}px, ${yOff}px)`,
                  display: 'inline-block',
                  letterSpacing: 4,
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}>
                  {char}
                </span>
              )
            })}
          </div>
          {/* Coordinate label */}
          <div style={{
            position: 'absolute',
            top: `calc(50% + ${fontSize * 0.55}px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Times New Roman', serif",
            fontSize: 9,
            fontStyle: 'italic',
            color: `${color}40`,
            opacity: ease,
            letterSpacing: 1,
          }}>
            47&deg;36&rsquo;N &nbsp; 122&deg;20&rsquo;W
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      const drift = Math.sin(holdProgress * Math.PI * 3) * 1.5

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Bearing line */}
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
            <line x1={width * 0.1} y1={height * 0.5}
              x2={width * 0.9} y2={height * 0.5}
              stroke={`${color}15`} strokeWidth={0.5} strokeDasharray="6,4" />
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${drift}px))`,
            fontFamily: "'Times New Roman', 'Garamond', serif",
            fontSize: `clamp(26px, 8vw, ${fontSize}px)`,
            fontWeight: 400,
            fontStyle: 'italic',
            color,
            letterSpacing: 4,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>
            {word}
          </div>
          <div style={{
            position: 'absolute',
            top: `calc(50% + ${fontSize * 0.55}px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Times New Roman', serif",
            fontSize: 9,
            fontStyle: 'italic',
            color: `${color}35`,
            letterSpacing: 1,
          }}>
            47&deg;36&rsquo;N &nbsp; 122&deg;20&rsquo;W &nbsp; Depth: 42m
          </div>
        </div>
      )
    } else {
      const t = exitProgress
      const ease = t * t
      // Letters scatter like depth numbers dissolving
      return (
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - ease }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            display: 'flex',
            transform: 'translate(-50%, -50%)',
            gap: 2,
          }}>
            {word.split('').map((char, i) => {
              const drift = ease * 20 * (seededRand(i * 11) - 0.5)
              const yDrift = ease * 25 * seededRand(i * 17)
              return (
                <span key={i} style={{
                  fontFamily: "'Times New Roman', 'Garamond', serif",
                  fontSize: `clamp(26px, 8vw, ${fontSize}px)`,
                  fontWeight: 400,
                  fontStyle: 'italic',
                  color,
                  transform: `translate(${drift}px, ${yDrift}px)`,
                  display: 'inline-block',
                  opacity: 1 - ease,
                  letterSpacing: 4,
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}>
                  {char}
                </span>
              )
            })}
          </div>
        </div>
      )
    }
  },
}

function NauticalChartComponent(props: MotionGraphicProps<NauticalChartConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-nautical-chart',
  title: 'Nautical Chart',
  description: 'Text plotted on maritime sea chart with depth soundings, compass bearing lines, lat/long grid, coastline fragments, and italic serif navigation typography',
  tags: ['kinetic', 'typography', 'nautical', 'chart', 'maritime', 'ocean', 'navigation', 'sea'],
  category: 'captions',
  component: NauticalChartComponent as any,
  defaultConfig: {
    words: ['HARBOR', 'STRAIT', 'SHOAL', 'BEACON'],
    colors: ['#6BAED6', '#7EC8E3', '#6BAED6', '#A8D8EA'],
    bgColor: '#0a1628',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HARBOR', 'STRAIT', 'SHOAL', 'BEACON'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#6BAED6', '#7EC8E3', '#6BAED6', '#A8D8EA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a1628', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
