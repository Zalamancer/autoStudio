import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface KnittedConfig extends KineticBaseConfig {
  yarnWeight: number
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const stitchW = Math.max(6, Math.floor(Math.min(width, height) / 50))
    const stitchH = Math.floor(stitchW * 1.4)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Stockinette stitch pattern — V shapes in rows */}
        <svg
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}
          viewBox={`0 0 ${width} ${height}`}
        >
          {(() => {
            const cols = Math.ceil(width / stitchW) + 1
            const rows = Math.ceil(height / stitchH) + 1
            const elements: React.ReactNode[] = []
            const maxItems = Math.min(rows * cols, 600)
            for (let i = 0; i < maxItems; i++) {
              const col = i % cols
              const row = Math.floor(i / cols)
              const x = col * stitchW + (row % 2 === 0 ? 0 : stitchW / 2)
              const y = row * stitchH
              // V-shape stitch
              elements.push(
                <path
                  key={i}
                  d={`M ${x} ${y} L ${x + stitchW / 2} ${y + stitchH * 0.7} L ${x + stitchW} ${y}`}
                  stroke="rgba(200,180,160,0.12)"
                  strokeWidth={1}
                  fill="none"
                  strokeLinecap="round"
                />,
              )
            }
            return elements
          })()}
        </svg>
        {/* Cable knit border — top */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: '8%',
            background: `linear-gradient(180deg, ${bgColor} 0%, transparent 100%)`,
            zIndex: 2,
          }}
        >
          <svg
            style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
            viewBox={`0 0 ${width} 40`}
            preserveAspectRatio="none"
          >
            {Array.from({ length: Math.ceil(width / 30) }, (_, i) => {
              const x = i * 30
              return (
                <path
                  key={i}
                  d={`M ${x} 20 C ${x + 7} 8, ${x + 15} 32, ${x + 22} 20 C ${x + 29} 8, ${x + 37} 32, ${x + 44} 20`}
                  stroke="rgba(180,160,130,0.2)"
                  strokeWidth={3}
                  fill="none"
                  strokeLinecap="round"
                />
              )
            })}
          </svg>
        </div>
        {/* Cable knit border — bottom */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '8%',
            background: `linear-gradient(0deg, ${bgColor} 0%, transparent 100%)`,
            zIndex: 2,
          }}
        >
          <svg
            style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
            viewBox={`0 0 ${width} 40`}
            preserveAspectRatio="none"
          >
            {Array.from({ length: Math.ceil(width / 30) }, (_, i) => {
              const x = i * 30
              return (
                <path
                  key={i}
                  d={`M ${x} 20 C ${x + 7} 8, ${x + 15} 32, ${x + 22} 20 C ${x + 29} 8, ${x + 37} 32, ${x + 44} 20`}
                  stroke="rgba(180,160,130,0.2)"
                  strokeWidth={3}
                  fill="none"
                  strokeLinecap="round"
                />
              )
            })}
          </svg>
        </div>
        {/* Yarn texture — fuzzy overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.03) 0%, transparent 40%)',
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
    const stitchW = Math.max(4, Math.floor(Math.min(width, height) / 60))
    const stitchH = Math.floor(stitchW * 1.3)

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 4,
          whiteSpace: 'nowrap',
        }}
      >
        {chars.map((ch, ci) => {
          const charDelay = (ci / (totalChars + 1)) * 0.6
          let knitProgress = 0
          let opacity = 1
          let yarnPull = 0

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.5)))
            knitProgress = easeOutQuad(p)
            opacity = p > 0 ? Math.min(1, p * 2.5) : 0
            // Yarn being knitted — row-by-row from bottom to top
            yarnPull = p < 0.8 ? Math.sin(p * Math.PI * 6) * 3 : 0
          } else if (phase === 'hold') {
            knitProgress = 1
            opacity = 1
            // Gentle stretch like worn knitwear
            yarnPull = Math.sin(holdProgress * Math.PI * 2 + ci * 0.9) * 1
          } else {
            const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.3) / (1 - charDelay * 0.2)))
            knitProgress = 1
            // Unraveling from top — yarn pulls out
            opacity = 1 - p
            yarnPull = p * 8
          }

          // Knit stitch rows that compose the letter — revealed bottom to top
          const knitRows = 10
          const visibleRows = Math.ceil(knitProgress * knitRows)

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
                transform: `translateY(${yarnPull}px)`,
              }}
            >
              {/* V-stitch texture overlay on the character */}
              <div
                style={{
                  position: 'absolute',
                  inset: '5% 0',
                  overflow: 'hidden',
                  pointerEvents: 'none',
                  zIndex: 2,
                }}
              >
                <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 60 80" preserveAspectRatio="none">
                  {Array.from({ length: knitRows }, (_, ri) => {
                    if (ri >= visibleRows) return null
                    const rowY = (ri / knitRows) * 80
                    const rowOpacity = ri < visibleRows - 1 ? 1 : Math.min(1, (knitProgress * knitRows - ri) * 2)
                    // 6 V-stitches per row
                    return Array.from({ length: 6 }, (_, si) => {
                      const sx = (si / 6) * 60
                      const offset = ri % 2 === 0 ? 0 : 5
                      return (
                        <path
                          key={`knt-${ri}-${si}`}
                          d={`M ${sx + offset} ${rowY} L ${sx + 5 + offset} ${rowY + 6} L ${sx + 10 + offset} ${rowY}`}
                          stroke={color}
                          strokeWidth={1.5}
                          fill="none"
                          opacity={rowOpacity * opacity * 0.2}
                          strokeLinecap="round"
                        />
                      )
                    })
                  })}
                </svg>
              </div>
              {/* Main knitted character */}
              <span
                style={{
                  fontFamily: "'Georgia', 'Courier New', serif",
                  fontSize: 'clamp(40px, 10vw, 130px)',
                  fontWeight: 800,
                  color,
                  opacity,
                  display: 'inline-block',
                  letterSpacing: 3,
                  lineHeight: 1,
                  // Bottom-to-top reveal
                  clipPath: `inset(${Math.max(0, (1 - knitProgress) * 100)}% 0 0 0)`,
                  textShadow: knitProgress > 0.5 ? `0 1px 0 rgba(0,0,0,0.1), 0 -1px 0 rgba(255,255,255,0.1)` : 'none',
                  // Yarn texture — slight softness
                  filter: knitProgress > 0 ? 'blur(0.3px)' : 'none',
                }}
              >
                {ch}
              </span>
              {/* Yarn strand trailing during enter */}
              {phase === 'enter' && knitProgress > 0.1 && knitProgress < 0.9 && (
                <svg
                  style={{
                    position: 'absolute',
                    right: -10,
                    top: `${(1 - knitProgress) * 80}%`,
                    width: 20,
                    height: 30,
                    pointerEvents: 'none',
                    overflow: 'visible',
                    zIndex: 3,
                  }}
                >
                  {/* Dangling yarn */}
                  <path
                    d={`M 10 0 C 12 8, 8 16, 14 24`}
                    stroke={color}
                    strokeWidth={2}
                    fill="none"
                    opacity={opacity * 0.5}
                    strokeLinecap="round"
                  />
                  {/* Knitting needle */}
                  <line
                    x1={6}
                    y1={-4}
                    x2={18}
                    y2={8}
                    stroke="#A0A0A0"
                    strokeWidth={2}
                    opacity={opacity * 0.7}
                    strokeLinecap="round"
                  />
                </svg>
              )}
              {/* Yarn fuzz / halo */}
              {knitProgress > 0.5 && (
                <div
                  style={{
                    position: 'absolute',
                    inset: '-4%',
                    boxShadow: `inset 0 0 10px ${color}15`,
                    borderRadius: 2,
                    pointerEvents: 'none',
                    opacity: opacity * 0.3,
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  },
}

function KnittedComponent(props: MotionGraphicProps<KnittedConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-knitted',
  title: 'Kinetic Knitted',
  description:
    'Letters formed from knit stitches with V-shaped stockinette pattern, yarn texture, cable-knit border, and knitting needle animation',
  tags: ['kinetic', 'typography', 'knit', 'knitted', 'yarn', 'wool', 'textile', 'fabric', 'craft', 'cozy', 'winter'],
  category: 'captions',
  component: KnittedComponent as any,
  defaultConfig: {
    words: ['KNIT', 'PURL', 'YARN', 'WOOL'],
    colors: ['#CC3333', '#336699', '#339966', '#CC9933'],
    bgColor: '#F5EDE0',
    cycleDuration: 1.3,
    yarnWeight: 1,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['KNIT', 'PURL', 'YARN', 'WOOL'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Yarn Colors',
      type: 'text-array',
      defaultValue: ['#CC3333', '#336699', '#339966', '#CC9933'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5EDE0', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.3,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    { key: 'yarnWeight', label: 'Yarn Weight', type: 'number', defaultValue: 1, min: 0.5, max: 3, group: 'Style' },
  ],
})
