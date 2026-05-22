import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LoomWeaveConfig extends KineticBaseConfig {
  warpColor: string
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const threadSpacing = Math.max(4, Math.floor(Math.min(width, height) / 80))

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Loom frame — dark wood borders */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: '6%',
            background: 'linear-gradient(180deg, #5C3A1E 0%, #4A2E16 100%)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            zIndex: 2,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '6%',
            background: 'linear-gradient(0deg, #5C3A1E 0%, #4A2E16 100%)',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.4)',
            zIndex: 2,
          }}
        />
        {/* Warp threads (vertical) — taut on the loom */}
        <div
          style={{
            position: 'absolute',
            inset: '6% 0',
            backgroundImage: `repeating-linear-gradient(90deg, rgba(180,160,120,0.4) 0px, rgba(180,160,120,0.4) 1px, transparent 1px, transparent ${threadSpacing}px)`,
            pointerEvents: 'none',
          }}
        />
        {/* Woven weft rows (background weave already done) */}
        <div
          style={{
            position: 'absolute',
            inset: '6% 0',
            backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent ${threadSpacing - 1}px, rgba(140,120,90,0.12) ${threadSpacing - 1}px, rgba(140,120,90,0.12) ${threadSpacing}px)`,
            pointerEvents: 'none',
          }}
        />
        {/* Shuttle — moving back and forth */}
        {(() => {
          const shuttleY = 50 + Math.sin(time * 1.5) * 30
          const shuttleX = ((time * 60) % (width * 2)) > width
            ? width - ((time * 60) % width)
            : (time * 60) % width
          return (
            <div
              style={{
                position: 'absolute',
                left: shuttleX - 20,
                top: `${shuttleY}%`,
                width: 40,
                height: 10,
                background: 'linear-gradient(90deg, #8B6914 0%, #A07830 50%, #8B6914 100%)',
                borderRadius: '50% / 40%',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                zIndex: 3,
                pointerEvents: 'none',
              }}
            >
              {/* Thread on shuttle */}
              <div
                style={{
                  position: 'absolute',
                  left: '30%',
                  right: '30%',
                  top: '30%',
                  bottom: '30%',
                  borderRadius: '50%',
                  background: 'rgba(200,100,50,0.6)',
                }}
              />
            </div>
          )
        })()}
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
    const threadSpacing = Math.max(4, Math.floor(Math.min(width, height) / 80))

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
          let weaveProgress = 0
          let opacity = 0
          let shuttleOffset = 0

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.5)))
            weaveProgress = easeInOutCubic(p)
            opacity = p > 0 ? Math.min(1, p * 3) : 0
            // Shuttle passing effect — character revealed row by row
            shuttleOffset = p < 1 ? (1 - p) * 6 : 0
          } else if (phase === 'hold') {
            weaveProgress = 1
            opacity = 1
            // Slight tension wobble like fabric on a loom
            shuttleOffset = Math.sin(holdProgress * Math.PI * 2 + ci * 1.2) * 0.5
          } else {
            const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.3) / (1 - charDelay * 0.2)))
            weaveProgress = 1
            // Threads unravel downward
            opacity = 1 - p
            shuttleOffset = p * 15
          }

          // Weft-line reveal: character appears as horizontal thread rows build up
          const weftRowCount = 14
          const visibleRows = Math.ceil(weaveProgress * weftRowCount)

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
              }}
            >
              {/* Weft thread lines that form the letter shape */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}
              >
                {Array.from({ length: weftRowCount }, (_, ri) => {
                  if (ri >= visibleRows) return null
                  const rowY = (ri / weftRowCount) * 100
                  // Alternating over/under pattern
                  const isOver = ri % 2 === 0
                  const rowOpacity = ri < visibleRows - 1 ? opacity : opacity * Math.min(1, (weaveProgress * weftRowCount - ri) * 2)
                  return (
                    <div
                      key={ri}
                      style={{
                        position: 'absolute',
                        left: isOver ? '-3%' : '0%',
                        right: isOver ? '0%' : '-3%',
                        top: `${rowY}%`,
                        height: `${100 / weftRowCount + 1}%`,
                        background: `linear-gradient(${isOver ? '90deg' : '270deg'}, ${color}88 0%, ${color} 15%, ${color} 85%, ${color}88 100%)`,
                        opacity: rowOpacity * 0.2,
                        borderRadius: 0.5,
                      }}
                    />
                  )
                })}
              </div>
              {/* Main character text — woven appearance */}
              <span
                style={{
                  fontFamily: "'Georgia', 'Courier New', serif",
                  fontSize: 'clamp(36px, 10vw, 130px)',
                  fontWeight: 700,
                  color: weaveProgress > 0.2 ? color : 'transparent',
                  opacity,
                  display: 'inline-block',
                  transform: `translateX(${shuttleOffset}px)`,
                  // Clip from top to bottom to simulate row-by-row weaving
                  clipPath: `inset(0 0 ${Math.max(0, (1 - weaveProgress) * 100)}% 0)`,
                  letterSpacing: 2,
                  lineHeight: 1,
                  textShadow: weaveProgress > 0.6 ? `1px 1px 0 rgba(0,0,0,0.15)` : 'none',
                }}
              >
                {ch}
              </span>
              {/* Interlace shadow — warp threads crossing over the letter */}
              {weaveProgress > 0.5 && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `repeating-linear-gradient(90deg, transparent 0px, transparent ${threadSpacing - 1}px, rgba(0,0,0,0.06) ${threadSpacing - 1}px, rgba(0,0,0,0.06) ${threadSpacing}px)`,
                    pointerEvents: 'none',
                    opacity: opacity * 0.7,
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

function LoomWeaveComponent(props: MotionGraphicProps<LoomWeaveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-loom-weave',
  title: 'Kinetic Loom Weave',
  description: 'Text emerges as warp and weft threads interlace on a loom, shuttle passes back and forth building letter shapes',
  tags: ['kinetic', 'typography', 'loom', 'weave', 'textile', 'fabric', 'shuttle', 'warp', 'weft', 'craft'],
  category: 'captions',
  component: LoomWeaveComponent as any,
  defaultConfig: {
    words: ['WARP', 'WEFT', 'LOOM', 'SPIN'],
    colors: ['#8B4513', '#B87333', '#CD853F', '#A0522D'],
    bgColor: '#F5E6D0',
    cycleDuration: 1.4,
    warpColor: '#C8B896',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WARP', 'WEFT', 'LOOM', 'SPIN'], group: 'Content' },
    { key: 'colors', label: 'Thread Colors', type: 'text-array', defaultValue: ['#8B4513', '#B87333', '#CD853F', '#A0522D'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5E6D0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
    { key: 'warpColor', label: 'Warp Thread Color', type: 'color', defaultValue: '#C8B896', group: 'Style' },
  ],
})
