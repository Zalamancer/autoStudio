import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EmbroideryHoopConfig extends KineticBaseConfig {
  hoopColor: string
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
    const size = Math.min(width, height) * 0.88
    const cx = width / 2
    const cy = height / 2

    return (
      <div style={{ position: 'absolute', inset: 0, background: '#3B2F2F' }}>
        {/* Wooden table / dark background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(175deg, transparent 0px, transparent 20px, rgba(60,45,30,0.08) 20px, rgba(60,45,30,0.08) 21px)',
            pointerEvents: 'none',
          }}
        />
        {/* Outer hoop ring (wood) */}
        <div
          style={{
            position: 'absolute',
            left: cx - size / 2,
            top: cy - size / 2,
            width: size,
            height: size,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #C4913B 0%, #A07030 30%, #8B6914 60%, #C4913B 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,220,150,0.3)',
          }}
        >
          {/* Inner hoop ring */}
          <div
            style={{
              position: 'absolute',
              inset: '3.5%',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #B8832E 0%, #9A6828 50%, #B8832E 100%)',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3)',
            }}
          >
            {/* Fabric circle inside hoop */}
            <div
              style={{
                position: 'absolute',
                inset: '3%',
                borderRadius: '50%',
                background: bgColor,
                overflow: 'hidden',
              }}
            >
              {/* Fabric weave — horizontal threads */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(180,170,150,0.15) 3px, rgba(180,170,150,0.15) 4px)',
                  pointerEvents: 'none',
                }}
              />
              {/* Fabric weave — vertical threads */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, transparent 3px, rgba(180,170,150,0.15) 3px, rgba(180,170,150,0.15) 4px)',
                  pointerEvents: 'none',
                }}
              />
              {/* Fabric tension wrinkle highlight */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(ellipse at 45% 40%, rgba(255,255,255,0.06) 0%, transparent 50%)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>
        </div>
        {/* Hoop screw/tightener at top */}
        <div
          style={{
            position: 'absolute',
            left: cx - 8,
            top: cy - size / 2 - 10,
            width: 16,
            height: 20,
            background: 'linear-gradient(180deg, #A08040 0%, #806020 100%)',
            borderRadius: '3px 3px 0 0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          {/* Screw grooves */}
          {[4, 8, 12].map((y) => (
            <div
              key={y}
              style={{
                position: 'absolute',
                left: 3,
                right: 3,
                top: y,
                height: 1,
                background: 'rgba(0,0,0,0.2)',
              }}
            />
          ))}
        </div>
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
          gap: 2,
          whiteSpace: 'nowrap',
        }}
      >
        {chars.map((ch, ci) => {
          const charDelay = (ci / (totalChars + 1)) * 0.65
          let opacity = 0
          let fillProgress = 0
          let threadTension = 0

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.6)))
            fillProgress = easeOutQuad(p)
            opacity = p > 0 ? Math.min(1, p * 2.5) : 0
            threadTension = p < 0.8 ? Math.sin(p * Math.PI * 4) * 2 : 0
          } else if (phase === 'hold') {
            opacity = 1
            fillProgress = 1
            // Gentle fabric sway
            threadTension = Math.sin(holdProgress * Math.PI * 2 + ci * 0.8) * 0.5
          } else {
            const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.3) / (1 - charDelay * 0.2)))
            opacity = 1 - easeOutQuad(p)
            fillProgress = 1
          }

          // Satin stitch effect — multiple horizontal lines filling the character
          const stitchCount = 10
          const stitchLines = Array.from({ length: stitchCount }, (_, si) => {
            const stitchP = si / stitchCount
            const visible = fillProgress > stitchP
            const stitchOpacity = visible ? Math.min(1, (fillProgress - stitchP) * stitchCount) : 0
            const yOffset = (stitchP - 0.5) * 100
            // Slight angle variation for satin stitch realism
            const angle = (rand(ci * 23 + si * 7) - 0.5) * 4
            return { stitchOpacity, yOffset, angle, visible }
          })

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
                transform: `translateY(${threadTension}px)`,
              }}
            >
              {/* Satin stitch fill lines behind the character */}
              <div
                style={{
                  position: 'absolute',
                  inset: '5% 0',
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}
              >
                {stitchLines.map((st, si) =>
                  st.visible ? (
                    <div
                      key={si}
                      style={{
                        position: 'absolute',
                        left: '-5%',
                        right: '-5%',
                        top: `${(si / stitchCount) * 100}%`,
                        height: Math.max(1.5, 2),
                        background: color,
                        opacity: st.stitchOpacity * 0.3,
                        transform: `rotate(${st.angle}deg)`,
                        borderRadius: 1,
                      }}
                    />
                  ) : null
                )}
              </div>
              {/* Main character — embroidery look */}
              <span
                style={{
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontSize: 'clamp(36px, 9vw, 120px)',
                  fontWeight: 700,
                  color: fillProgress > 0.3 ? color : 'transparent',
                  opacity,
                  display: 'inline-block',
                  textShadow: fillProgress > 0.5
                    ? `0 1px 0 rgba(0,0,0,0.2), 0 0 2px ${color}`
                    : 'none',
                  // Thread texture via stroke
                  WebkitTextStroke: fillProgress > 0.1 && fillProgress < 0.5 ? `1.5px ${color}` : 'none',
                  letterSpacing: 3,
                  lineHeight: 1,
                }}
              >
                {ch}
              </span>
              {/* Stitch holes along character edges */}
              {fillProgress > 0.4 &&
                Array.from({ length: 4 }, (_, hi) => {
                  const hx = (rand(ci * 13 + hi * 19) - 0.5) * 10
                  const hy = (rand(ci * 7 + hi * 31) - 0.5) * 20
                  return (
                    <div
                      key={hi}
                      style={{
                        position: 'absolute',
                        left: `calc(50% + ${hx}px)`,
                        top: `calc(50% + ${hy}px)`,
                        width: 1.5,
                        height: 1.5,
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.15)',
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

function EmbroideryHoopComponent(props: MotionGraphicProps<EmbroideryHoopConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-embroidery-hoop',
  title: 'Kinetic Embroidery Hoop',
  description: 'Text stitched within circular wooden hoop with satin stitch fill, thread tension, and visible fabric weave',
  tags: ['kinetic', 'typography', 'embroidery', 'hoop', 'satin-stitch', 'craft', 'textile', 'fabric', 'thread'],
  category: 'captions',
  component: EmbroideryHoopComponent as any,
  defaultConfig: {
    words: ['HOOP', 'SILK', 'FILL', 'BIND'],
    colors: ['#CC4466', '#44AA88', '#8855CC', '#DD8833'],
    bgColor: '#FAF0E6',
    cycleDuration: 1.3,
    hoopColor: '#B8832E',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HOOP', 'SILK', 'FILL', 'BIND'], group: 'Content' },
    { key: 'colors', label: 'Thread Colors', type: 'text-array', defaultValue: ['#CC4466', '#44AA88', '#8855CC', '#DD8833'], group: 'Style' },
    { key: 'bgColor', label: 'Fabric Color', type: 'color', defaultValue: '#FAF0E6', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
    { key: 'hoopColor', label: 'Hoop Color', type: 'color', defaultValue: '#B8832E', group: 'Style' },
  ],
})
