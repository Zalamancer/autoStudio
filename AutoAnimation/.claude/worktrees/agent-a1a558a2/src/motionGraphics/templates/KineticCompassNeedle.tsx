import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CompassNeedleConfig extends KineticBaseConfig {}

function easeOutElastic(t: number): number {
  if (t === 0) return 0
  if (t === 1) return 1
  const c4 = (2 * Math.PI) / 3.5
  return Math.pow(2, -9 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

function easeInQuad(t: number): number {
  return t * t
}

/**
 * KineticCompassNeedle
 * Text hangs from a compass needle that swings in from the left (west)
 * and settles pointing north. The elastic overshoot mimics the real physics
 * of a magnetised needle finding magnetic north — text becomes readable
 * only once the needle points straight up (or to the target heading).
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    const cx = width / 2
    const cy = height / 2
    const r = Math.min(width, height) * 0.4

    // Compass rose — cardinal tick marks
    const cardinals = [
      { label: 'N', angle: -90 },
      { label: 'E', angle: 0 },
      { label: 'S', angle: 90 },
      { label: 'W', angle: 180 },
    ]

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Outer bezel ring */}
        <div
          style={{
            position: 'absolute',
            left: cx - r,
            top: cy - r,
            width: r * 2,
            height: r * 2,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />
        {/* Inner ring */}
        <div
          style={{
            position: 'absolute',
            left: cx - r * 0.88,
            top: cy - r * 0.88,
            width: r * 1.76,
            height: r * 1.76,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        />
        {/* Cardinal direction labels */}
        {cardinals.map(({ label, angle }) => {
          const rad = (angle * Math.PI) / 180
          const lx = cx + Math.cos(rad) * (r * 0.78)
          const ly = cy + Math.sin(rad) * (r * 0.78)
          return (
            <div
              key={label}
              style={{
                position: 'absolute',
                left: lx - 8,
                top: ly - 10,
                width: 16,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Courier New', monospace",
                fontSize: 11,
                fontWeight: 700,
                color: label === 'N' ? 'rgba(255,80,80,0.5)' : 'rgba(255,255,255,0.18)',
              }}
            >
              {label}
            </div>
          )
        })}
        {/* 8 minor tick marks */}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * 45 - 90) * (Math.PI / 180)
          const ir = r * 0.88
          const or = r * 0.96
          return (
            <svg
              key={i}
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}
              width={width}
              height={height}
            >
              <line
                x1={cx + Math.cos(a) * ir}
                y1={cy + Math.sin(a) * ir}
                x2={cx + Math.cos(a) * or}
                y2={cy + Math.sin(a) * or}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={1}
              />
            </svg>
          )
        })}
        {/* Pivot hub */}
        <div
          style={{
            position: 'absolute',
            left: cx - 6,
            top: cy - 6,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.4)',
            zIndex: 5,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const cx = width / 2
    const cy = height / 2

    // Needle starts pointing west (-180°), swings to north (-90°) with overshoot
    let needleAngle = -180
    let opacity = 1

    if (phase === 'enter') {
      const eased = easeOutElastic(enterProgress)
      // Swing from -180 (west) to -90 (north)
      needleAngle = -180 + 90 * eased
      opacity = enterProgress < 0.15 ? enterProgress / 0.15 : 1
    } else if (phase === 'hold') {
      needleAngle = -90
    } else {
      const eased = easeInQuad(exitProgress)
      // Swing back east (+90°)
      needleAngle = -90 + 90 * eased
      opacity = exitProgress > 0.7 ? 1 - (exitProgress - 0.7) / 0.3 : 1
    }

    const needleRad = (needleAngle * Math.PI) / 180
    const needleLength = Math.min(width, height) * 0.3
    const tipX = cx + Math.cos(needleRad) * needleLength
    const tipY = cy + Math.sin(needleRad) * needleLength
    const tailX = cx - Math.cos(needleRad) * needleLength * 0.45
    const tailY = cy - Math.sin(needleRad) * needleLength * 0.45

    // Text sits at the needle tip, centered
    const textOffsetX = tipX - cx
    const textOffsetY = tipY - cy

    return (
      <div style={{ position: 'absolute', inset: 0, opacity }}>
        {/* Needle body */}
        <svg
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          width={width}
          height={height}
        >
          {/* Red (north-pointing) half */}
          <line
            x1={cx}
            y1={cy}
            x2={tipX}
            y2={tipY}
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            opacity={0.8}
          />
          {/* White (south-pointing) tail */}
          <line
            x1={cx}
            y1={cy}
            x2={tailX}
            y2={tailY}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={2}
            strokeLinecap="round"
          />
          {/* Tip diamond */}
          <polygon
            points={`
              ${tipX},${tipY}
              ${cx + Math.cos(needleRad + Math.PI / 2) * 6},${cy + Math.sin(needleRad + Math.PI / 2) * 6}
              ${cx},${cy}
              ${cx + Math.cos(needleRad - Math.PI / 2) * 6},${cy + Math.sin(needleRad - Math.PI / 2) * 6}
            `}
            fill={color}
            opacity={0.9}
          />
        </svg>
        {/* Text at needle tip */}
        <div
          style={{
            position: 'absolute',
            left: cx + textOffsetX,
            top: cy + textOffsetY,
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            textShadow: `0 2px 20px ${color}55`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function CompassNeedleComponent(props: MotionGraphicProps<CompassNeedleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-compass-needle',
  title: 'Kinetic Compass Needle',
  description:
    'Text swings in on a compass needle that finds north — elastic overshoot mimics real magnetised needle physics.',
  tags: ['kinetic', 'typography', 'compass', 'needle', 'swing', 'elastic', 'navigation', 'mechanical'],
  category: 'captions',
  component: CompassNeedleComponent as any,
  defaultConfig: {
    words: ['NORTH', 'TRUE', 'FIND', 'WAY'],
    colors: ['#FF4444', '#FF8800', '#FFCC00', '#44AAFF'],
    bgColor: '#080c10',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['NORTH', 'TRUE', 'FIND', 'WAY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF4444', '#FF8800', '#FFCC00', '#44AAFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080c10', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
  ],
})
