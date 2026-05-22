import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ChronographDialConfig extends KineticBaseConfig {}

// Ease for the sub-dial spin — deceleration as it clicks into position
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

// Sub-dial overshoot: spins past then snaps back, like a chronograph register zeroing
function dialOvershoot(t: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  const eased = easeOutCubic(t)
  // Small overshoot oscillation that decays
  return eased + Math.sin(t * Math.PI * 3) * 0.018 * (1 - t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const cx = width / 2
    const cy = height / 2
    const dialR = Math.min(width, height) * 0.42

    // Slow continuous sweep hand — like a running chronograph seconds hand
    const sweepAngleDeg = (time * 6) % 360 // 6°/sec = 1 revolution per minute

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Ambient glow on dial */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, rgba(40,60,90,0.18) 0%, transparent 65%)',
          }}
        />

        <svg width={width} height={height} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {/* Outer bezel ring */}
          <circle cx={cx} cy={cy} r={dialR} fill="none" stroke="rgba(150,170,200,0.12)" strokeWidth={3} />
          <circle cx={cx} cy={cy} r={dialR * 0.94} fill="none" stroke="rgba(150,170,200,0.06)" strokeWidth={1} />

          {/* 60 minute track marks */}
          {Array.from({ length: 60 }, (_, i) => {
            const ang = (i * 6 - 90) * (Math.PI / 180)
            const isMajor = i % 5 === 0
            const innerR = dialR * (isMajor ? 0.82 : 0.88)
            const outerR = dialR * 0.94
            return (
              <line
                key={i}
                x1={cx + Math.cos(ang) * innerR}
                y1={cy + Math.sin(ang) * innerR}
                x2={cx + Math.cos(ang) * outerR}
                y2={cy + Math.sin(ang) * outerR}
                stroke={`rgba(160,180,210,${isMajor ? 0.25 : 0.08})`}
                strokeWidth={isMajor ? 1.5 : 0.8}
              />
            )
          })}

          {/* Subdial circles at 3, 6, 9 o'clock positions */}
          {[0, 90, -90].map((offsetDeg, i) => {
            const subCX = cx + Math.cos((offsetDeg * Math.PI) / 180) * dialR * 0.52
            const subCY = cy + Math.sin((offsetDeg * Math.PI) / 180) * dialR * 0.52
            return (
              <circle
                key={i}
                cx={subCX}
                cy={subCY}
                r={dialR * 0.14}
                fill="none"
                stroke="rgba(130,150,180,0.1)"
                strokeWidth={1}
              />
            )
          })}

          {/* Live sweep seconds hand */}
          {(() => {
            const rad = ((sweepAngleDeg - 90) * Math.PI) / 180
            return (
              <>
                <line
                  x1={cx}
                  y1={cy}
                  x2={cx + Math.cos(rad) * dialR * 0.88}
                  y2={cy + Math.sin(rad) * dialR * 0.88}
                  stroke="rgba(255,80,60,0.5)"
                  strokeWidth={1.2}
                  strokeLinecap="round"
                />
                {/* Counterweight tail */}
                <line
                  x1={cx}
                  y1={cy}
                  x2={cx - Math.cos(rad) * dialR * 0.2}
                  y2={cy - Math.sin(rad) * dialR * 0.2}
                  stroke="rgba(255,80,60,0.35)"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
              </>
            )
          })()}

          {/* Center jewel cap */}
          <circle cx={cx} cy={cy} r={4} fill="rgba(80,120,200,0.4)" />
          <circle cx={cx} cy={cy} r={2} fill="rgba(140,180,255,0.6)" />
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const dialR = Math.min(width, height) * 0.3
    const cx = width / 2
    const cy = height / 2

    // Each character occupies a position around the sub-dial
    // On enter: dial spins so that the current word's letters rotate to the 12 o'clock reading window
    // Characters start distributed around the dial then spin to the reading arc at top

    let dialSpinDeg = 0
    let opacity = 1
    let scaleWord = 1

    if (phase === 'enter') {
      // Spin from -180 (characters hidden behind bottom) to 0 (reading position)
      const eased = dialOvershoot(enterProgress)
      dialSpinDeg = (1 - eased) * -200
      opacity = Math.min(1, enterProgress * 2.5)
      scaleWord = 0.6 + 0.4 * easeOutCubic(enterProgress)
    } else if (phase === 'hold') {
      dialSpinDeg = 0
      scaleWord = 1
    } else {
      // Spin out the other way — continuing the dial motion
      const eased = easeInCubic(exitProgress)
      dialSpinDeg = eased * 160
      opacity = 1 - eased
      scaleWord = 1 - eased * 0.3
    }

    return (
      <div style={{ position: 'absolute', inset: 0, opacity }}>
        {chars.map((char, ci) => {
          // Place characters evenly in a horizontal arc at the reading position
          const spread = Math.min(dialR * 1.6, width * 0.7)
          const charOffsetX = totalChars > 1 ? (ci / (totalChars - 1) - 0.5) * spread : 0

          // Each character spins on the dial — simulated by per-char vertical offset
          // Characters further from center have slightly more arc displacement
          const arcFraction = totalChars > 1 ? ci / (totalChars - 1) - 0.5 : 0
          const dialRadAngle = (dialSpinDeg * Math.PI) / 180

          // X stays at horizontal layout; Y shifts as dial rotates (arc reading)
          const charY = Math.sin(dialRadAngle + arcFraction * 0.4) * dialR * 0.35

          // Individual stagger for character spin opacity
          const stagger = Math.abs(arcFraction) * 0.15
          const charOpacity = phase === 'enter' ? Math.min(1, Math.max(0, (enterProgress - stagger) * 5)) : 1

          return (
            <div
              key={ci}
              style={{
                position: 'absolute',
                top: cy,
                left: cx + charOffsetX,
                transform: `translate(-50%, -50%) translateY(${charY}px) scale(${scaleWord})`,
                fontFamily: "'Courier New', 'Courier', monospace",
                fontSize: 'clamp(36px, 8vw, 120px)',
                fontWeight: 700,
                color,
                opacity: charOpacity,
                letterSpacing: '0.08em',
                textShadow: `0 0 20px ${color}50, 0 2px 8px rgba(0,0,0,0.6)`,
                whiteSpace: 'nowrap',
                lineHeight: 1,
              }}
            >
              {char}
            </div>
          )
        })}
      </div>
    )
  },
}

function ChronographDialComponent(props: MotionGraphicProps<ChronographDialConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-chronograph-dial',
  title: 'Chronograph Dial',
  description:
    "Text spins in on a rotating chronograph sub-dial — characters arc up from below into the 12-o'clock reading position with overshoot, like a register zeroing. A live sweep seconds hand runs continuously.",
  tags: ['kinetic', 'typography', 'chronograph', 'watch', 'dial', 'horology', 'sub-dial', 'sweep', 'mechanical'],
  category: 'captions',
  component: ChronographDialComponent as any,
  defaultConfig: {
    words: ['00:00', 'SET', 'STOP', 'RESET'],
    colors: ['#E0EAFF', '#A0C4FF', '#FFD700', '#FF6B6B'],
    bgColor: '#05080F',
    cycleDuration: 1.6,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['00:00', 'SET', 'STOP', 'RESET'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#E0EAFF', '#A0C4FF', '#FFD700', '#FF6B6B'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#05080F', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
