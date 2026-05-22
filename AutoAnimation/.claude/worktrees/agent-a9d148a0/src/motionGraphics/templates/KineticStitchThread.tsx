import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StitchThreadConfig extends KineticBaseConfig {
  threadColor: string
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
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Woven fabric texture via repeating gradients */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 7px, rgba(255,255,255,0.04) 7px, rgba(255,255,255,0.04) 8px),
          repeating-linear-gradient(90deg, transparent 0px, transparent 7px, rgba(255,255,255,0.04) 7px, rgba(255,255,255,0.04) 8px)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 60% 40%, rgba(255,255,255,0.03) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

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
    const threadColor = '#CC3333' // default red thread

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
          const charDelay = (ci / (totalChars + 1)) * 0.7
          let opacity = 0
          let stitchProgress = 0
          let needleY = 0
          let needleVisible = false
          let threadTrailOpacity = 0

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.6)))
            stitchProgress = easeOutBack(Math.min(1, p))
            opacity = p > 0 ? Math.min(1, p * 3) : 0
            // Needle leads the stitch — visible when this char is being stitched
            needleVisible = p > 0.05 && p < 0.85
            needleY = needleVisible ? Math.sin(p * Math.PI * 3) * 12 : 0
            threadTrailOpacity = p < 0.9 ? (1 - p) * 0.6 : 0
          } else if (phase === 'hold') {
            opacity = 1
            stitchProgress = 1
            // Gentle sway like fabric in breeze
            needleY = Math.sin(holdProgress * Math.PI * 3 + ci * 0.7) * 2
          } else {
            const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.4) / (1 - charDelay * 0.3)))
            opacity = 1 - p
            stitchProgress = 1 - p * 0.5
            // Thread unraveling
            needleY = p * 20
          }

          // Stitch dash pattern — the character is revealed by stitching
          const dashOffset = (1 - stitchProgress) * 100

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
              }}
            >
              {/* Main stitched character */}
              <span
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(40px, 11vw, 150px)',
                  fontWeight: 700,
                  color: 'transparent',
                  WebkitTextStroke: `2px ${color}`,
                  opacity,
                  display: 'inline-block',
                  transform: `translateY(${needleY}px)`,
                  // Stitch dash effect via text shadow layers
                  textShadow: stitchProgress > 0.3 ? `0 0 0 ${color}` : 'none',
                  filter: stitchProgress < 1 ? `opacity(${stitchProgress})` : 'none',
                }}
              >
                {ch}
              </span>
              {/* Stitch holes — dots along the character outline */}
              {stitchProgress > 0.1 &&
                Array.from({ length: 6 }, (_, si) => {
                  const angle = (si / 6) * Math.PI * 2
                  const radius = 3
                  const dotX = Math.cos(angle) * radius + (rand(ci * 31 + si * 7) - 0.5) * 8
                  const dotY = Math.sin(angle) * radius + (rand(ci * 47 + si * 11) - 0.5) * 16
                  const dotOpacity = stitchProgress > si / 6 ? opacity * 0.5 : 0
                  return (
                    <div
                      key={si}
                      style={{
                        position: 'absolute',
                        left: `calc(50% + ${dotX}px)`,
                        top: `calc(50% + ${dotY}px)`,
                        width: 2,
                        height: 2,
                        borderRadius: '50%',
                        background: color,
                        opacity: dotOpacity,
                        pointerEvents: 'none',
                      }}
                    />
                  )
                })}
              {/* Thread trail from needle */}
              {needleVisible && (
                <div
                  style={{
                    position: 'absolute',
                    right: -8,
                    top: `calc(50% + ${needleY - 4}px)`,
                    width: 16,
                    height: 2,
                    background: threadColor,
                    opacity: threadTrailOpacity,
                    borderRadius: 1,
                    transform: `rotate(${needleY * 3}deg)`,
                    pointerEvents: 'none',
                  }}
                />
              )}
              {/* Needle */}
              {needleVisible && (
                <div
                  style={{
                    position: 'absolute',
                    right: -14,
                    top: `calc(50% + ${needleY - 8}px)`,
                    width: 3,
                    height: 16,
                    background: 'linear-gradient(180deg, #C0C0C0 0%, #808080 100%)',
                    borderRadius: '1px 1px 0 0',
                    opacity: opacity * 0.9,
                    transform: `rotate(${15 + needleY}deg)`,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
          )
        })}
        {/* Connecting thread between characters */}
        {phase !== 'exit' && (
          <svg
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              overflow: 'visible',
            }}
          >
            {chars.slice(0, -1).map((_, ci) => {
              const charDelay = (ci / (totalChars + 1)) * 0.7
              const p =
                phase === 'enter' ? Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.6))) : 1
              if (p < 0.5) return null
              const threadOp = phase === 'hold' ? 0.3 : p * 0.3
              return (
                <line
                  key={ci}
                  x1={`${((ci + 0.8) / totalChars) * 100}%`}
                  y1="52%"
                  x2={`${((ci + 1.2) / totalChars) * 100}%`}
                  y2="48%"
                  stroke={threadColor}
                  strokeWidth={1.5}
                  opacity={threadOp}
                  strokeDasharray="3 4"
                />
              )
            })}
          </svg>
        )}
      </div>
    )
  },
}

function StitchThreadComponent(props: MotionGraphicProps<StitchThreadConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-stitch-thread',
  title: 'Kinetic Stitch Thread',
  description:
    'Text stitched by running thread with needle pulling through fabric texture, cross-stitch reveal with embroidery feel',
  tags: ['kinetic', 'typography', 'stitch', 'thread', 'fabric', 'craft', 'sewing', 'embroidery'],
  category: 'captions',
  component: StitchThreadComponent as any,
  defaultConfig: {
    words: ['STITCH', 'WEAVE', 'BIND', 'SEW'],
    colors: ['#D4A574', '#8B6914', '#CC6633', '#A0522D'],
    bgColor: '#2C1810',
    cycleDuration: 1.4,
    threadColor: '#CC3333',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['STITCH', 'WEAVE', 'BIND', 'SEW'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#D4A574', '#8B6914', '#CC6633'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2C1810', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    { key: 'threadColor', label: 'Thread Color', type: 'color', defaultValue: '#CC3333', group: 'Style' },
  ],
})
