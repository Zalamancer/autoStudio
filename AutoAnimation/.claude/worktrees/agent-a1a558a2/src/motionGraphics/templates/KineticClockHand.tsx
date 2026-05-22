import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ClockHandConfig extends KineticBaseConfig {}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return c3 * t * t * t - c1 * t * t
}

/**
 * KineticClockHand
 * A clock hand sweeps from 12 o'clock (top, -90°) to 3 o'clock (right, 0°)
 * over the enter phase with an easeOutBack overshoot.
 * The text is pinned to the END of the hand and arcs along with it,
 * only becoming readable when the hand slows near 3 o'clock.
 * The text itself IS the hand's label — it snaps into view.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    const cx = width / 2
    const cy = height / 2
    const r = Math.min(width, height) * 0.38

    // Clock face — minimal hour marks
    const hourMarks = Array.from({ length: 12 }, (_, i) => {
      const angle = (i * 30 - 90) * (Math.PI / 180)
      const isMajor = i % 3 === 0
      const innerR = r * (isMajor ? 0.82 : 0.88)
      const outerR = r * 0.96
      return {
        x1: cx + Math.cos(angle) * innerR,
        y1: cy + Math.sin(angle) * innerR,
        x2: cx + Math.cos(angle) * outerR,
        y2: cy + Math.sin(angle) * outerR,
        isMajor,
      }
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Clock face ring */}
        <div
          style={{
            position: 'absolute',
            left: cx - r,
            top: cy - r,
            width: r * 2,
            height: r * 2,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.09)',
            background: 'rgba(255,255,255,0.015)',
          }}
        />
        {/* Hour marks */}
        <svg
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          width={width}
          height={height}
        >
          {hourMarks.map((m, i) => (
            <line
              key={i}
              x1={m.x1}
              y1={m.y1}
              x2={m.x2}
              y2={m.y2}
              stroke={`rgba(255,255,255,${m.isMajor ? 0.2 : 0.07})`}
              strokeWidth={m.isMajor ? 2 : 1}
            />
          ))}
        </svg>
        {/* 12 and 3 numerals */}
        {[
          { label: '12', angle: -90 },
          { label: '3', angle: 0 },
        ].map(({ label, angle }) => {
          const rad = (angle * Math.PI) / 180
          const lx = cx + Math.cos(rad) * (r * 0.7)
          const ly = cy + Math.sin(rad) * (r * 0.7)
          return (
            <div
              key={label}
              style={{
                position: 'absolute',
                left: lx - 12,
                top: ly - 10,
                width: 24,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Georgia', serif",
                fontSize: 12,
                color: 'rgba(255,255,255,0.2)',
              }}
            >
              {label}
            </div>
          )
        })}
        {/* Center pivot */}
        <div
          style={{
            position: 'absolute',
            left: cx - 6,
            top: cy - 6,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)',
            zIndex: 5,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const cx = width / 2
    const cy = height / 2
    const handLength = Math.min(width, height) * 0.32

    // Hand goes from -90° (12 o'clock) to 0° (3 o'clock) = 90° sweep
    let handAngleDeg = -90
    let opacity = 1

    if (phase === 'enter') {
      const eased = easeOutBack(enterProgress)
      handAngleDeg = -90 + 90 * Math.min(eased, 1.06) // allow slight overshoot past 3
      opacity = enterProgress < 0.12 ? enterProgress / 0.12 : 1
    } else if (phase === 'hold') {
      handAngleDeg = 0
    } else {
      const eased = easeInBack(exitProgress)
      handAngleDeg = 0 + 90 * eased // sweeps down to 6 o'clock
      opacity = exitProgress > 0.72 ? 1 - (exitProgress - 0.72) / 0.28 : 1
    }

    const handRad = (handAngleDeg * Math.PI) / 180
    const tipX = cx + Math.cos(handRad) * handLength
    const tipY = cy + Math.sin(handRad) * handLength

    // Text is centered just beyond the tip of the hand
    const textDist = handLength + 0 // right at the tip
    const textX = cx + Math.cos(handRad) * textDist
    const textY = cy + Math.sin(handRad) * textDist

    return (
      <div style={{ position: 'absolute', inset: 0, opacity }}>
        {/* Clock hand */}
        <svg
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          width={width}
          height={height}
        >
          {/* Hand tail (short, toward 6) */}
          <line
            x1={cx}
            y1={cy}
            x2={cx - Math.cos(handRad) * handLength * 0.18}
            y2={cy - Math.sin(handRad) * handLength * 0.18}
            stroke={color}
            strokeWidth={4}
            strokeLinecap="round"
            opacity={0.5}
          />
          {/* Main hand */}
          <line
            x1={cx}
            y1={cy}
            x2={tipX}
            y2={tipY}
            stroke={color}
            strokeWidth={4}
            strokeLinecap="round"
            opacity={0.85}
          />
          {/* Arc trail (ghosted sweep path) */}
          <path
            d={`M ${cx} ${cy - handLength} A ${handLength} ${handLength} 0 0 1 ${tipX} ${tipY}`}
            fill="none"
            stroke={color}
            strokeWidth={1}
            strokeDasharray="4 6"
            opacity={0.15}
          />
        </svg>
        {/* Text at hand tip */}
        <div
          style={{
            position: 'absolute',
            left: textX,
            top: textY,
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            textShadow: `0 2px 18px ${color}55`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function ClockHandComponent(props: MotionGraphicProps<ClockHandConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-clock-hand',
  title: 'Kinetic Clock Hand',
  description:
    'Text arcs in on a clock hand sweeping from 12 to 3 — the hand slows with an overshoot bounce, delivering the word at 3 o\'clock.',
  tags: ['kinetic', 'typography', 'clock', 'hand', 'sweep', 'arc', 'mechanical', 'timer'],
  category: 'captions',
  component: ClockHandComponent as any,
  defaultConfig: {
    words: ['TIME', 'TICK', 'NOW', 'MOVE'],
    colors: ['#FFFFFF', '#FFD700', '#FF6B6B', '#00DDFF'],
    bgColor: '#080808',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TIME', 'TICK', 'NOW', 'MOVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFD700', '#FF6B6B', '#00DDFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080808', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
