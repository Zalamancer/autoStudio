import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MacrameKnotConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// Macramé: cotton/jute cord knotted to form patterns.
// The PROCESS is cords hanging straight, then being pulled into knots
// The aesthetic: natural fiber texture, decorative knotwork, wall hanging
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    const f = frame ?? 0
    // Linen-textured wall behind wall hanging
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Linen weave texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(0deg, rgba(180,160,130,0.07) 0px, rgba(180,160,130,0.07) 1px, transparent 1px, transparent 4px),
              repeating-linear-gradient(90deg, rgba(180,160,130,0.07) 0px, rgba(180,160,130,0.07) 1px, transparent 1px, transparent 4px)`,
            pointerEvents: 'none',
          }}
        />
        {/* Hanging rod shadow */}
        <div
          style={{
            position: 'absolute',
            top: '12%',
            left: '5%',
            right: '5%',
            height: 8,
            background: 'rgba(100,70,40,0.3)',
            borderRadius: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        />
        {/* Warm craft-room light */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 70% 80% at 50% 30%, rgba(255,220,150,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    width,
    height,
    frame,
  }: WordRenderProps) => {
    const f = frame ?? 0
    const chars = word.split('')
    const numCords = chars.length * 2 + 2  // Cords hanging per word

    // Cord colors (natural fiber palette)
    const cordColors = ['#C8A882', '#B89060', '#A07840', '#8B6530', '#D4B896']

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Hanging cords that form letters */}
        {chars.map((ch, ci) => {
          const charDelay = ci * 0.1
          let knotProgress = 0
          let opacity = 0
          let dropY = 0

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (0.8 - charDelay * 0.5)))
            knotProgress = easeOutCubic(p)
            opacity = Math.min(1, p * 2)
            // Cords drop from rod into position
            dropY = (1 - knotProgress) * (-height * 0.3)
          } else if (phase === 'hold') {
            knotProgress = 1
            opacity = 1
            // Gentle sway
            dropY = Math.sin(f * 0.3 + ci * 0.4) * 3
          } else {
            knotProgress = 1 - exitProgress
            opacity = Math.max(0, 1 - exitProgress * 1.5)
            dropY = exitProgress * height * 0.2
          }

          const charX = (width / 2) - (chars.length * 50) / 2 + ci * 50 + 25

          return (
            <g key={ci}>
              {/* Vertical cord segments */}
              {[0, 1].map((cordIdx) => {
                const cx = charX + cordIdx * 18 - 9
                const cordColor = cordColors[(ci + cordIdx) % cordColors.length]
                const swayX = Math.sin(f * 0.25 + ci * 0.7 + cordIdx) * (phase === 'hold' ? 2 : 0)

                return (
                  <div
                    key={cordIdx}
                    style={{
                      position: 'absolute',
                      left: cx + swayX,
                      top: `${15 + (1 - knotProgress) * 10}%`,
                      width: 3,
                      height: `${knotProgress * 45}%`,
                      background: `linear-gradient(180deg, ${cordColor} 0%, ${cordColor}CC 100%)`,
                      borderRadius: 2,
                      transform: `translateY(${dropY}px)`,
                      opacity: opacity * 0.9,
                      boxShadow: '1px 0 2px rgba(0,0,0,0.1)',
                    }}
                  />
                )
              })}
            </g>
          )
        })}

        {/* Main text rendered as knotted macramé style */}
        <div
          style={{
            position: 'absolute',
            top: '55%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 6,
          }}
        >
          {chars.map((ch, ci) => {
            const charDelay = ci * 0.1
            let knotProgress = 0
            let opacity = 0
            let dropY = 0

            if (phase === 'enter') {
              const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (0.8 - charDelay * 0.5)))
              knotProgress = easeOutCubic(p)
              opacity = Math.min(1, p * 2)
              dropY = (1 - knotProgress) * -30
            } else if (phase === 'hold') {
              knotProgress = 1
              opacity = 1
              dropY = Math.sin(f * 0.3 + ci * 0.4) * 3
            } else {
              opacity = Math.max(0, 1 - exitProgress * 1.5)
              dropY = exitProgress * 20
            }

            return (
              <div
                key={ci}
                style={{
                  position: 'relative',
                  opacity,
                  transform: `translateY(${dropY}px) scaleY(${0.5 + knotProgress * 0.5})`,
                  transformOrigin: 'center top',
                }}
              >
                {/* Knot texture decoration above letter */}
                {knotProgress > 0.5 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -16,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 12,
                      height: 10,
                      opacity: (knotProgress - 0.5) * 2 * opacity,
                    }}
                  >
                    {/* Simple knot SVG */}
                    <svg width="12" height="10" viewBox="0 0 12 10">
                      <path d="M6 1 C2 1, 1 5, 4 5 C7 5, 8 9, 6 9" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
                      <path d="M6 1 C10 1, 11 5, 8 5 C5 5, 4 9, 6 9" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity={0.6} />
                    </svg>
                  </div>
                )}
                <span
                  style={{
                    fontFamily: "'Georgia', 'Palatino', serif",
                    fontSize: 'clamp(40px, 10vw, 140px)',
                    fontWeight: 700,
                    color,
                    display: 'inline-block',
                    lineHeight: 1,
                    letterSpacing: 1,
                    // Rope texture via text-shadow
                    textShadow: `1px 0 0 rgba(0,0,0,0.15), -1px 0 0 rgba(255,255,255,0.1), 0 1px 0 rgba(0,0,0,0.1)`,
                  }}
                >
                  {ch}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  },
}

function MacrameKnotComponent(props: MotionGraphicProps<MacrameKnotConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-macrame-knot',
  title: 'Kinetic Macramé Knot',
  description: 'Natural fiber cords drop from hanging rod and are knotted into text — decorative knots appear above each letter, cords sway gently on hold, full macramé wall-hanging aesthetic',
  tags: ['kinetic', 'typography', 'macrame', 'craft', 'textile', 'fiber', 'knot', 'boho', 'natural', 'cord'],
  category: 'captions',
  component: MacrameKnotComponent as any,
  defaultConfig: {
    words: ['KNOT', 'CORD', 'LOOP', 'HANG'],
    colors: ['#8B6530', '#A07840', '#6B4F2A', '#C8A882'],
    bgColor: '#F5EDD8',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['KNOT', 'CORD', 'LOOP', 'HANG'], group: 'Content' },
    { key: 'colors', label: 'Cord Colors', type: 'text-array', defaultValue: ['#8B6530', '#A07840', '#6B4F2A', '#C8A882'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5EDD8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
