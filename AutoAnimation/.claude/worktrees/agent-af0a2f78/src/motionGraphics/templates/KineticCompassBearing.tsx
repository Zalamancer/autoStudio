import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CompassBearingConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const cx = width / 2
    const cy = height / 2
    const outerR = Math.min(width, height) * 0.42
    const needleRotation = Math.sin(time * 0.5) * 8 // subtle magnetic drift

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Dark base with subtle radial gradient */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, #151c28 0%, #0c1018 60%, #080c12 100%)',
        }} />
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Outer compass ring */}
          <circle cx={cx} cy={cy} r={outerR} fill="none"
            stroke="rgba(200, 180, 120, 0.08)" strokeWidth={2} />
          <circle cx={cx} cy={cy} r={outerR * 0.92} fill="none"
            stroke="rgba(200, 180, 120, 0.05)" strokeWidth={0.5} />
          <circle cx={cx} cy={cy} r={outerR * 0.65} fill="none"
            stroke="rgba(200, 180, 120, 0.04)" strokeWidth={0.5} strokeDasharray="3,6" />
          <circle cx={cx} cy={cy} r={outerR * 0.35} fill="none"
            stroke="rgba(200, 180, 120, 0.03)" strokeWidth={0.5} />

          {/* Degree tick marks around circumference */}
          {Array.from({ length: 72 }, (_, i) => {
            const angle = (i / 72) * Math.PI * 2 - Math.PI / 2
            const isMajor = i % 18 === 0  // N, E, S, W
            const isMinor = i % 9 === 0    // NE, SE, SW, NW
            const r1 = outerR * (isMajor ? 0.85 : isMinor ? 0.88 : 0.92)
            const r2 = outerR * 0.92
            return (
              <line key={`tick${i}`}
                x1={cx + Math.cos(angle) * r1}
                y1={cy + Math.sin(angle) * r1}
                x2={cx + Math.cos(angle) * r2}
                y2={cy + Math.sin(angle) * r2}
                stroke={`rgba(200, 180, 120, ${isMajor ? 0.15 : isMinor ? 0.1 : 0.04})`}
                strokeWidth={isMajor ? 1.5 : 0.5} />
            )
          })}

          {/* Cardinal direction labels */}
          {['N', 'E', 'S', 'W'].map((dir, i) => {
            const angle = (i / 4) * Math.PI * 2 - Math.PI / 2
            const r = outerR * 0.78
            return (
              <text key={`dir${i}`}
                x={cx + Math.cos(angle) * r}
                y={cy + Math.sin(angle) * r + 4}
                textAnchor="middle"
                fill={dir === 'N' ? 'rgba(220, 80, 60, 0.2)' : 'rgba(200, 180, 120, 0.12)'}
                fontSize={dir === 'N' ? 14 : 11}
                fontFamily="'Georgia', serif"
                fontWeight={600}>
                {dir}
              </text>
            )
          })}

          {/* Ordinal direction labels */}
          {['NE', 'SE', 'SW', 'NW'].map((dir, i) => {
            const angle = ((i + 0.5) / 4) * Math.PI * 2 - Math.PI / 2
            const r = outerR * 0.78
            return (
              <text key={`odir${i}`}
                x={cx + Math.cos(angle) * r}
                y={cy + Math.sin(angle) * r + 3}
                textAnchor="middle"
                fill="rgba(200, 180, 120, 0.07)"
                fontSize={8}
                fontFamily="'Georgia', serif">
                {dir}
              </text>
            )
          })}

          {/* Compass needle with subtle drift */}
          <g transform={`translate(${cx}, ${cy}) rotate(${needleRotation})`}>
            {/* North-pointing needle (red) */}
            <polygon
              points={`0,${-outerR * 0.55} ${-5},${0} ${5},${0}`}
              fill="rgba(200, 60, 50, 0.15)"
              stroke="rgba(200, 60, 50, 0.2)"
              strokeWidth={0.5} />
            {/* South-pointing needle */}
            <polygon
              points={`0,${outerR * 0.55} ${-5},${0} ${5},${0}`}
              fill="rgba(200, 180, 120, 0.06)"
              stroke="rgba(200, 180, 120, 0.08)"
              strokeWidth={0.5} />
            {/* Center pivot */}
            <circle cx={0} cy={0} r={4} fill="rgba(200, 180, 120, 0.1)"
              stroke="rgba(200, 180, 120, 0.15)" strokeWidth={0.5} />
          </g>

          {/* Bearing readout */}
          <text x={cx} y={cy + outerR + 18} textAnchor="middle"
            fill="rgba(200, 180, 120, 0.08)" fontSize={7}
            fontFamily="'Courier New', monospace">
            BRG {Math.round(360 + needleRotation) % 360}&deg; MAG
          </text>
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height, frame }: WordRenderProps) => {
    const fontSize = Math.min(width / (word.length * 0.55), 100)
    const cx = width / 2
    const cy = height / 2

    if (phase === 'enter') {
      const t = enterProgress
      const ease = 1 - Math.pow(1 - t, 3)

      // Needle spins rapidly then locks — text radiates from center compass point
      const spinAngle = (1 - ease) * 720 // rapid spin that decelerates
      const textScale = ease

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Spinning bearing indicator ring */}
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
            <g transform={`translate(${cx}, ${cy}) rotate(${spinAngle})`}>
              <line x1={0} y1={-35} x2={0} y2={-50}
                stroke={`${color}60`} strokeWidth={2} strokeLinecap="round" />
              <polygon points="0,-55 -4,-45 4,-45"
                fill={`${color}50`} />
            </g>
          </svg>
          {/* Text scaling up from center */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${textScale})`,
            fontFamily: "'Georgia', 'Palatino Linotype', serif",
            fontSize: `clamp(24px, 8vw, ${fontSize}px)`,
            fontWeight: 600,
            color,
            letterSpacing: 8,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            opacity: ease,
            textShadow: `0 0 15px ${color}20`,
          }}>
            {word}
          </div>
          {/* Bearing readout */}
          <div style={{
            position: 'absolute',
            top: `calc(50% + ${fontSize * 0.55}px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: `${color}30`,
            letterSpacing: 2,
            opacity: ease > 0.7 ? (ease - 0.7) * 3.3 : 0,
          }}>
            BRG 045&deg; &bull; MAG VAR +3&deg;W
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      const breathe = Math.sin(holdProgress * Math.PI * 3) * 0.5
      const needleWobble = Math.sin(holdProgress * Math.PI * 8) * 2

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Locked bearing indicator */}
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
            <g transform={`translate(${cx}, ${cy}) rotate(${needleWobble})`}>
              <line x1={0} y1={-35} x2={0} y2={-50}
                stroke={`${color}40`} strokeWidth={2} strokeLinecap="round" />
              <polygon points="0,-55 -4,-45 4,-45"
                fill={`${color}30`} />
            </g>
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) rotate(${breathe}deg)`,
            fontFamily: "'Georgia', 'Palatino Linotype', serif",
            fontSize: `clamp(24px, 8vw, ${fontSize}px)`,
            fontWeight: 600,
            color,
            letterSpacing: 8,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            textShadow: `0 0 12px ${color}15`,
          }}>
            {word}
          </div>
          <div style={{
            position: 'absolute',
            top: `calc(50% + ${fontSize * 0.55}px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: `${color}25`,
            letterSpacing: 2,
          }}>
            BRG 045&deg; &bull; MAG VAR +3&deg;W
          </div>
        </div>
      )
    } else {
      const t = exitProgress
      const ease = t * t

      // Needle spins away, text shrinks back to center point
      const spinAngle = ease * 360
      const textScale = 1 - ease

      return (
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - ease }}>
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
            <g transform={`translate(${cx}, ${cy}) rotate(${spinAngle})`}>
              <line x1={0} y1={-35} x2={0} y2={-50}
                stroke={`${color}${Math.round((1 - ease) * 40).toString(16).padStart(2, '0')}`}
                strokeWidth={2} strokeLinecap="round" />
            </g>
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${textScale})`,
            fontFamily: "'Georgia', 'Palatino Linotype', serif",
            fontSize: `clamp(24px, 8vw, ${fontSize}px)`,
            fontWeight: 600,
            color,
            letterSpacing: 8,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            filter: `blur(${ease * 3}px)`,
          }}>
            {word}
          </div>
        </div>
      )
    }
  },
}

function CompassBearingComponent(props: MotionGraphicProps<CompassBearingConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-compass-bearing',
  title: 'Compass Bearing',
  description: 'Compass rose with text radiating from center point, cardinal/ordinal direction markers, spinning needle that locks to bearing, magnetic variation, tick marks around circumference',
  tags: ['kinetic', 'typography', 'compass', 'bearing', 'needle', 'direction', 'magnetic', 'navigation'],
  category: 'captions',
  component: CompassBearingComponent as any,
  defaultConfig: {
    words: ['NORTH', 'BEARING', 'COURSE', 'HEADING'],
    colors: ['#C8B478', '#D4C490', '#C8B478', '#E0D4A0'],
    bgColor: '#0c1018',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['NORTH', 'BEARING', 'COURSE', 'HEADING'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C8B478', '#D4C490', '#C8B478', '#E0D4A0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c1018', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
