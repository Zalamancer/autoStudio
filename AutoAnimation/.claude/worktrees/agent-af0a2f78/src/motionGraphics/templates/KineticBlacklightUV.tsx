import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BlacklightUVConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

/** Reactive fluorescent paint colors */
const REACTIVE_COLORS = [
  '#FF00FF', // Magenta
  '#00FF66', // Green
  '#FFFF00', // Yellow
  '#FF6600', // Orange
  '#00FFFF', // Cyan
  '#FF3388', // Hot pink
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // UV sweep position — moves across scene
    const sweepCycle = (time * 0.4) % 1
    const sweepX = sweepCycle * (width + 200) - 100

    // Random paint splatters on walls that glow under UV
    const splatters = Array.from({ length: 12 }, (_, i) => {
      const sx = rand(i * 37 + 5) * width
      const sy = rand(i * 53 + 11) * height
      const size = 8 + rand(i * 71 + 3) * 20
      const splatColor = REACTIVE_COLORS[i % REACTIVE_COLORS.length]
      // Only glow when UV sweep is near
      const distFromSweep = Math.abs(sx - sweepX)
      const uvStrength = Math.max(0, 1 - distFromSweep / 150)

      return {
        x: sx,
        y: sy,
        size,
        color: splatColor,
        glow: uvStrength,
      }
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* UV light source cone */}
        <div
          style={{
            position: 'absolute',
            left: sweepX - 80,
            top: 0,
            width: 160,
            height: '100%',
            background: 'linear-gradient(90deg, transparent 0%, rgba(80, 0, 160, 0.04) 30%, rgba(100, 0, 200, 0.06) 50%, rgba(80, 0, 160, 0.04) 70%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* UV fixture at top */}
        <div
          style={{
            position: 'absolute',
            left: sweepX - 25,
            top: 0,
            width: 50,
            height: 6,
            background: 'linear-gradient(90deg, transparent, rgba(120, 0, 255, 0.15), rgba(120, 0, 255, 0.2), rgba(120, 0, 255, 0.15), transparent)',
            borderRadius: '0 0 4px 4px',
            boxShadow: '0 2px 8px rgba(120, 0, 255, 0.1)',
          }}
        />
        {/* Reactive splatters on wall */}
        {splatters.map((sp, i) => (
          sp.glow > 0.05 && (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: sp.x - sp.size / 2,
                top: sp.y - sp.size / 2,
                width: sp.size,
                height: sp.size * 0.7,
                background: `radial-gradient(ellipse, ${sp.color}${Math.floor(sp.glow * 40).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
                borderRadius: '50%',
                filter: `blur(${2 + sp.size * 0.1}px)`,
                pointerEvents: 'none',
              }}
            />
          )
        ))}
        {/* Faint UV haze at bottom */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '15%',
            background: 'linear-gradient(0deg, rgba(60, 0, 120, 0.03) 0%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const f = frame ?? 0
    const fps = 30 // approximate
    const time = f / fps

    // UV sweep position synced with background
    const sweepCycle = (time * 0.4) % 1
    const sweepX = sweepCycle * (width + 200) - 100

    // Text center position
    const textCenterX = width / 2

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
          // Each character has its own reactive color
          const reactiveColor = REACTIVE_COLORS[(index * 3 + ci) % REACTIVE_COLORS.length]

          // Character approximate X position
          const fontSize = Math.min(width / (totalChars * 0.65), 140)
          const charX = textCenterX - (totalChars * fontSize * 0.35) + ci * fontSize * 0.7

          // UV illumination based on sweep proximity
          const distFromUV = Math.abs(charX - sweepX)
          let uvIllumination = Math.max(0, 1 - distFromUV / 120)

          // Phase modulation
          let opacity = 0
          let glowStrength = 0

          if (phase === 'enter') {
            // Text invisible until UV reveals it
            opacity = uvIllumination * enterProgress
            glowStrength = uvIllumination * easeOutQuad(enterProgress)
          } else if (phase === 'hold') {
            // UV sweeps and text glows reactively
            opacity = uvIllumination > 0.1 ? uvIllumination : 0.02
            glowStrength = uvIllumination
          } else {
            // UV recedes, paint fades back to invisible
            const fade = exitProgress
            opacity = uvIllumination * (1 - fade) * 0.8
            glowStrength = uvIllumination * (1 - fade)
          }

          const glowSize = glowStrength * 20
          const bloomSize = glowStrength * 40

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
              }}
            >
              {/* Invisible paint base — barely visible in darkness */}
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  fontFamily: "'Impact', 'Arial Black', sans-serif",
                  fontSize: `clamp(36px, 11vw, ${fontSize}px)`,
                  fontWeight: 900,
                  color: 'rgba(30, 25, 35, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textTransform: 'uppercase',
                }}
              >
                {ch}
              </span>
              {/* UV-reactive fluorescent glow */}
              {opacity > 0.03 && (
                <span
                  style={{
                    fontFamily: "'Impact', 'Arial Black', sans-serif",
                    fontSize: `clamp(36px, 11vw, ${fontSize}px)`,
                    fontWeight: 900,
                    color: glowStrength > 0.6 ? '#FFFFFF' : reactiveColor,
                    opacity: Math.min(1, opacity),
                    textShadow: glowStrength > 0.05
                      ? `0 0 ${glowSize * 0.5}px ${reactiveColor},
                         0 0 ${glowSize}px ${reactiveColor},
                         0 0 ${bloomSize}px ${reactiveColor},
                         0 0 ${bloomSize * 1.5}px ${reactiveColor}60`
                      : 'none',
                    display: 'inline-block',
                    lineHeight: 1,
                    textTransform: 'uppercase',
                  }}
                >
                  {ch}
                </span>
              )}
              {/* Floor drip from paint — also glows under UV */}
              {glowStrength > 0.4 && rand(ci * 97 + index * 13) < 0.4 && (
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '95%',
                    width: 3,
                    height: 8 + rand(ci * 41) * 12,
                    background: `linear-gradient(180deg, ${reactiveColor}${Math.floor(glowStrength * 30).toString(16).padStart(2, '0')}, transparent)`,
                    transform: 'translateX(-50%)',
                    borderRadius: '0 0 2px 2px',
                    pointerEvents: 'none',
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

function BlacklightUVComponent(props: MotionGraphicProps<BlacklightUVConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-blacklight-uv',
  title: 'Kinetic Blacklight UV',
  description: 'UV blacklight sweeps reveal invisible fluorescent reactive paint text in vivid neon colors against pure darkness',
  tags: ['kinetic', 'typography', 'blacklight', 'UV', 'fluorescent', 'reactive', 'paint', 'glow', 'neon', 'club'],
  category: 'captions',
  component: BlacklightUVComponent as any,
  defaultConfig: {
    words: ['GLOW', 'REACT', 'VIVID', 'RAVE'],
    colors: ['#FF00FF', '#00FF66', '#FFFF00', '#00FFFF'],
    bgColor: '#020004',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GLOW', 'REACT', 'VIVID', 'RAVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF00FF', '#00FF66', '#FFFF00', '#00FFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020004', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
