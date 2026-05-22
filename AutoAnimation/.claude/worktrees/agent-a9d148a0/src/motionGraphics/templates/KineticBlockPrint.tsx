import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BlockPrintConfig extends KineticBaseConfig {
  stampOffset: number
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    // Repeated motif background — small woodblock stamp pattern
    const motifSize = Math.max(30, Math.floor(Math.min(width, height) / 12))
    const cols = Math.ceil(width / motifSize) + 1
    const rows = Math.ceil(height / motifSize) + 1

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Cotton fabric texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(180,150,120,0.06) 2px, rgba(180,150,120,0.06) 3px),
              repeating-linear-gradient(90deg, transparent 0px, transparent 2px, rgba(180,150,120,0.06) 2px, rgba(180,150,120,0.06) 3px)`,
            pointerEvents: 'none',
          }}
        />
        {/* Repeated small motif stamps — floral/geometric block print pattern */}
        <svg
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}
          viewBox={`0 0 ${width} ${height}`}
        >
          {Array.from({ length: Math.min(rows * cols, 120) }, (_, i) => {
            const col = i % cols
            const row = Math.floor(i / cols)
            const cx = col * motifSize + motifSize / 2
            const cy = row * motifSize + motifSize / 2
            // Slight offset for hand-stamped feel
            const ox = (rand(i * 3 + 1) - 0.5) * 3
            const oy = (rand(i * 3 + 2) - 0.5) * 3
            const rot = (rand(i * 3 + 3) - 0.5) * 4
            const r = motifSize * 0.3

            return (
              <g key={i} transform={`translate(${cx + ox}, ${cy + oy}) rotate(${rot})`} opacity={0.08}>
                {/* Simple 4-petal flower motif */}
                <circle cx={0} cy={-r * 0.5} r={r * 0.25} fill="#8B4513" />
                <circle cx={0} cy={r * 0.5} r={r * 0.25} fill="#8B4513" />
                <circle cx={-r * 0.5} cy={0} r={r * 0.25} fill="#8B4513" />
                <circle cx={r * 0.5} cy={0} r={r * 0.25} fill="#8B4513" />
                <circle cx={0} cy={0} r={r * 0.15} fill="#8B4513" />
              </g>
            )
          })}
        </svg>
        {/* Aged paper overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(120,90,60,0.06) 100%)',
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
    const chars = word.split('')
    const totalChars = chars.length
    const f = frame ?? 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 6,
          whiteSpace: 'nowrap',
        }}
      >
        {chars.map((ch, ci) => {
          const charDelay = (ci / (totalChars + 1)) * 0.55
          let stampProgress = 0
          let opacity = 1
          let pressDepth = 0
          let inkSpread = 0
          // Hand-stamped offset — each character slightly misregistered
          const offsetX = (rand(ci * 13 + index * 7) - 0.5) * 4
          const offsetY = (rand(ci * 17 + index * 11) - 0.5) * 3
          const rotation = (rand(ci * 23 + index * 3) - 0.5) * 3

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.5)))
            // Stamp press down then release
            if (p < 0.4) {
              // Approaching fabric
              stampProgress = 0
              pressDepth = -(1 - p / 0.4) * 30
              opacity = Math.min(1, p * 4)
            } else if (p < 0.6) {
              // Contact — ink transfers
              stampProgress = (p - 0.4) / 0.2
              pressDepth = 0
              inkSpread = stampProgress
            } else {
              // Block lifts away, ink remains
              stampProgress = 1
              pressDepth = (p - 0.6) / 0.4 * 5
              inkSpread = 1
            }
          } else if (phase === 'hold') {
            stampProgress = 1
            opacity = 1
            inkSpread = 1
            // Subtle ink settling
            pressDepth = Math.sin(holdProgress * Math.PI * 2 + ci) * 0.3
          } else {
            const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.3) / (1 - charDelay * 0.2)))
            stampProgress = 1
            opacity = 1 - p
            inkSpread = 1
          }

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
                transform: `translate(${offsetX}px, ${offsetY + pressDepth}px) rotate(${rotation}deg)`,
              }}
            >
              {/* Ink bleed / stamp impression — slightly larger than text */}
              {inkSpread > 0.1 && (
                <div
                  style={{
                    position: 'absolute',
                    inset: '-6% -4%',
                    background: `${color}15`,
                    borderRadius: 3,
                    opacity: inkSpread * 0.5,
                    filter: `blur(${2 + (1 - inkSpread) * 4}px)`,
                    pointerEvents: 'none',
                  }}
                />
              )}
              {/* Wood grain texture on stamp impression */}
              {stampProgress > 0.3 && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `repeating-linear-gradient(${85 + rotation}deg, transparent 0px, transparent 4px, ${color}08 4px, ${color}08 5px)`,
                    pointerEvents: 'none',
                    opacity: stampProgress * 0.4,
                  }}
                />
              )}
              {/* Main stamped character */}
              <span
                style={{
                  fontFamily: "'Georgia', 'Palatino', serif",
                  fontSize: 'clamp(40px, 10vw, 130px)',
                  fontWeight: 900,
                  color: stampProgress > 0.3 ? color : 'transparent',
                  opacity: opacity * Math.min(1, stampProgress * 2),
                  display: 'inline-block',
                  letterSpacing: 4,
                  lineHeight: 1,
                  // Ink density variation — characteristic of block prints
                  textShadow: stampProgress > 0.5
                    ? `0 0 1px ${color}, 0 1px 0 rgba(0,0,0,0.1)`
                    : 'none',
                  // Uneven ink coverage
                  filter: stampProgress > 0.3 && stampProgress < 0.8
                    ? 'contrast(1.2) brightness(0.95)'
                    : 'none',
                }}
              >
                {ch}
              </span>
              {/* Ink spots — excess ink from hand pressing */}
              {stampProgress > 0.5 &&
                Array.from({ length: 3 }, (_, si) => {
                  const sx = (rand(ci * 37 + si * 19) - 0.5) * 30
                  const sy = (rand(ci * 43 + si * 23) - 0.5) * 40
                  const size = 1 + rand(ci * 29 + si * 31) * 3
                  return (
                    <div
                      key={si}
                      style={{
                        position: 'absolute',
                        left: `calc(50% + ${sx}px)`,
                        top: `calc(50% + ${sy}px)`,
                        width: size,
                        height: size,
                        borderRadius: '50%',
                        background: color,
                        opacity: opacity * 0.15,
                        pointerEvents: 'none',
                      }}
                    />
                  )
                })}
            </div>
          )
        })}
      </div>
    )
  },
}

function BlockPrintComponent(props: MotionGraphicProps<BlockPrintConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-block-print',
  title: 'Kinetic Block Print',
  description: 'Hand-carved stamp pressed onto fabric with slight offset registration, ink spread, wood grain texture, and repeated motif background',
  tags: ['kinetic', 'typography', 'block-print', 'woodblock', 'stamp', 'indian', 'textile', 'fabric', 'craft', 'handmade'],
  category: 'captions',
  component: BlockPrintComponent as any,
  defaultConfig: {
    words: ['STAMP', 'PRESS', 'CARVE', 'PRINT'],
    colors: ['#8B0000', '#1B5E20', '#4A148C', '#BF360C'],
    bgColor: '#F5ECD7',
    cycleDuration: 1.4,
    stampOffset: 2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['STAMP', 'PRESS', 'CARVE', 'PRINT'], group: 'Content' },
    { key: 'colors', label: 'Ink Colors', type: 'text-array', defaultValue: ['#8B0000', '#1B5E20', '#4A148C', '#BF360C'], group: 'Style' },
    { key: 'bgColor', label: 'Fabric Color', type: 'color', defaultValue: '#F5ECD7', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
    { key: 'stampOffset', label: 'Stamp Offset', type: 'number', defaultValue: 2, min: 0, max: 8, group: 'Style' },
  ],
})
