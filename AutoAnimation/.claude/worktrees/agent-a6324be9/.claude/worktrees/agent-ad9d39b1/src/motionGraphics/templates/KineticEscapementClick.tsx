import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EscapementClickConfig extends KineticBaseConfig {}

// Escapement micro-recoil: snap to position then bounce back slightly
// Mimics the pallet fork catching an escape wheel tooth
function escapementEase(t: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  // Fast advance (the escape) followed by micro-recoil then settle
  if (t < 0.55) {
    // Sharp snap forward — cubic in
    return Math.pow(t / 0.55, 2.2) * 1.08
  } else {
    // Micro-recoil: slight backward spring, then settle
    const s = (t - 0.55) / 0.45
    return 1.08 - 0.08 * Math.pow(1 - s, 2) * Math.cos(s * Math.PI * 2.5)
  }
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

const TICK_COUNT = 8 // escape wheel tooth count shown in bg

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const cx = width * 0.82
    const cy = height * 0.5
    const r = Math.min(width, height) * 0.22

    // Escape wheel advances by one tooth per second — discrete tick rotation
    const toothAngleDeg = 360 / TICK_COUNT
    // Snap to nearest tooth angle + micro-recoil based on sub-second fractional time
    const frac = time % 1
    const tickedTeeth = Math.floor(time)
    const snapFrac = escapementEase(Math.min(frac * 3, 1)) // fast snap within first 0.33s
    const wheelAngle = (tickedTeeth + snapFrac) * toothAngleDeg

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Subtle vertical guide lines — movement plates */}
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${18 + i * 16}%`,
              top: 0,
              bottom: 0,
              width: 1,
              background: 'rgba(255,255,255,0.025)',
            }}
          />
        ))}

        {/* Escape wheel */}
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {/* Wheel body */}
          <circle cx={cx} cy={cy} r={r * 0.55} fill="none" stroke="rgba(200,180,120,0.15)" strokeWidth={1.5} />
          {/* Wheel teeth — pointed impulse faces */}
          {Array.from({ length: TICK_COUNT }, (_, i) => {
            const tAngle = ((wheelAngle + i * toothAngleDeg) * Math.PI) / 180
            const toothTipR = r * 0.82
            const toothBaseR = r * 0.55
            const halfW = (Math.PI / TICK_COUNT) * 0.4
            const tipX = cx + Math.cos(tAngle) * toothTipR
            const tipY = cy + Math.sin(tAngle) * toothTipR
            const base1X = cx + Math.cos(tAngle - halfW) * toothBaseR
            const base1Y = cy + Math.sin(tAngle - halfW) * toothBaseR
            const base2X = cx + Math.cos(tAngle + halfW * 0.3) * toothBaseR
            const base2Y = cy + Math.sin(tAngle + halfW * 0.3) * toothBaseR
            return (
              <polygon
                key={i}
                points={`${tipX},${tipY} ${base1X},${base1Y} ${base2X},${base2Y}`}
                fill="rgba(200,175,100,0.18)"
                stroke="rgba(220,195,120,0.3)"
                strokeWidth={0.8}
              />
            )
          })}
          {/* Center arbor */}
          <circle cx={cx} cy={cy} r={3.5} fill="rgba(200,175,100,0.4)" />
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 2,
          }}
        >
          {chars.map((char, ci) => {
            // Each character ticks in with escapement timing — staggered by index
            const staggerStep = 0.1
            const windowSize = 1 - staggerStep * (totalChars - 1)

            let opacity = 0
            let translateY = 0
            let skewX = 0

            if (phase === 'enter') {
              const localStart = ci * staggerStep
              const localT = Math.max(0, Math.min(1, (enterProgress - localStart) / windowSize))
              const eased = escapementEase(localT)
              opacity = Math.min(1, localT * 4)
              // Tick snaps DOWN from slightly above — like a pallet advancing a tooth
              translateY = (1 - eased) * -18
              // Micro-tilt during the snap — angular impulse
              skewX = localT < 0.55 ? (1 - localT / 0.55) * -6 : 0
            } else if (phase === 'hold') {
              opacity = 1
              translateY = 0
              skewX = 0
            } else {
              // Exit: characters tick OUT upward one-by-one, reverse order
              const revIdx = totalChars - 1 - ci
              const localStart = revIdx * staggerStep
              const localT = Math.max(0, Math.min(1, (exitProgress - localStart) / windowSize))
              const eased = easeOutQuad(localT)
              opacity = 1 - eased
              translateY = eased * -20
            }

            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Georgia', 'Palatino Linotype', serif",
                  fontSize: 'clamp(40px, 9vw, 130px)',
                  fontWeight: 700,
                  color,
                  opacity,
                  transform: `translateY(${translateY}px) skewX(${skewX}deg)`,
                  letterSpacing: '0.04em',
                  textShadow: `0 2px 12px ${color}40`,
                  lineHeight: 1,
                }}
              >
                {char}
              </span>
            )
          })}
        </div>
      </div>
    )
  },
}

function EscapementClickComponent(props: MotionGraphicProps<EscapementClickConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-escapement-click',
  title: 'Escapement Click',
  description:
    'Letters tick in one-by-one with the sharp snap-and-recoil of a watch escapement mechanism — each character advances like a pallet fork catching an escape wheel tooth.',
  tags: ['kinetic', 'typography', 'clockwork', 'escapement', 'watch', 'tick', 'mechanical', 'horology'],
  category: 'captions',
  component: EscapementClickComponent as any,
  defaultConfig: {
    words: ['TICK', 'SNAP', 'LOCK', 'TIME'],
    colors: ['#C8A96E', '#E8D5A0', '#B89050', '#D4BC80'],
    bgColor: '#100E08',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['TICK', 'SNAP', 'LOCK', 'TIME'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#C8A96E', '#E8D5A0', '#B89050', '#D4BC80'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#100E08', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
