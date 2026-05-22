import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NeonTubeConfig extends KineticBaseConfig {
  flickerIntensity: number
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
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Brick wall texture */}
        {Array.from({ length: 8 }, (_, row) => {
          const y = row * (height / 8)
          const brickW = width / 5
          const offset = row % 2 === 0 ? 0 : brickW / 2
          return Array.from({ length: 7 }, (_, col) => {
            const x = col * brickW + offset - brickW / 2
            return (
              <div
                key={`${row}-${col}`}
                style={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  width: brickW - 3,
                  height: height / 8 - 3,
                  background: `rgba(60,40,35,${0.15 + rand(row * 13 + col * 7) * 0.1})`,
                  borderRadius: 1,
                }}
              />
            )
          })
        }).flat()}
        {/* Mortar lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(0deg, rgba(30,20,15,0.3) 0px, rgba(30,20,15,0.3) 2px, transparent 2px, transparent ${height / 8}px),
              repeating-linear-gradient(90deg, rgba(30,20,15,0.15) 0px, rgba(30,20,15,0.15) 1px, transparent 1px, transparent ${width / 5}px)
            `,
            pointerEvents: 'none',
          }}
        />
        {/* Ambient glow on wall from neon */}
        <div
          style={{
            position: 'absolute',
            left: '20%',
            right: '20%',
            top: '30%',
            bottom: '30%',
            background: 'radial-gradient(ellipse at center, rgba(255,100,150,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(20px)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const f = frame ?? 0
    const seed = index * 97 + 41

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
          const charDelay = ci / (totalChars + 1) * 0.6
          let tubeOpacity = 0
          let glowIntensity = 0
          let bendProgress = 0
          let gasProgress = 0
          let flickering = false

          if (phase === 'enter') {
            // Phase 1: Glass tube bends into shape (character outline appears)
            // Phase 2: Gas fills and flickers on
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.5)))

            if (p < 0.5) {
              // Tube bending — outline traces in
              bendProgress = easeOutQuad(p / 0.5)
              tubeOpacity = bendProgress * 0.3
              glowIntensity = 0
            } else {
              // Gas filling + flicker ignition
              bendProgress = 1
              gasProgress = (p - 0.5) / 0.5
              // Flicker pattern during ignition
              const flickerSeed = ci * 53 + f
              const flickerChance = rand(flickerSeed)
              flickering = gasProgress < 0.7 && flickerChance < (0.5 - gasProgress * 0.7)
              tubeOpacity = flickering ? 0.15 : (0.3 + gasProgress * 0.7)
              glowIntensity = flickering ? 0.1 : gasProgress
            }
          } else if (phase === 'hold') {
            bendProgress = 1
            gasProgress = 1
            // Realistic neon idle — occasional brief flicker
            const flickerSeed = ci * 37 + f
            const flicker = rand(flickerSeed)
            flickering = flicker < 0.02
            tubeOpacity = flickering ? 0.6 : (0.9 + rand(flickerSeed + 1) * 0.1)
            glowIntensity = flickering ? 0.4 : (0.85 + Math.sin(holdProgress * Math.PI * 4 + ci) * 0.15)
          } else {
            bendProgress = 1
            // Power down — flickers then dies
            const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.3) / (1 - charDelay * 0.2)))
            const flickerSeed = ci * 71 + f
            if (p < 0.5) {
              flickering = rand(flickerSeed) < p
              tubeOpacity = flickering ? 0.2 : (1 - p * 0.5)
              glowIntensity = flickering ? 0.1 : (1 - p)
              gasProgress = 1
            } else {
              tubeOpacity = Math.max(0.05, (1 - p) * 0.4)
              glowIntensity = 0
              gasProgress = 1 - (p - 0.5) * 2
            }
          }

          // Neon color + glow layers
          const glowSize = glowIntensity * 25
          const outerGlow = glowIntensity * 40

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
              }}
            >
              {/* Tube outline — always visible once bent */}
              {bendProgress > 0.1 && (
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    fontFamily: "'Arial Rounded MT Bold', 'Nunito', sans-serif",
                    fontSize: 'clamp(40px, 12vw, 150px)',
                    fontWeight: 700,
                    color: 'transparent',
                    WebkitTextStroke: `2px rgba(200,200,200,${bendProgress * 0.15})`,
                    opacity: tubeOpacity > 0 ? 0.3 : bendProgress * 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {ch}
                </span>
              )}
              {/* Gas fill — the lit neon */}
              <span
                style={{
                  fontFamily: "'Arial Rounded MT Bold', 'Nunito', sans-serif",
                  fontSize: 'clamp(40px, 12vw, 150px)',
                  fontWeight: 700,
                  color: glowIntensity > 0.3 ? '#FFFFFF' : color,
                  opacity: tubeOpacity,
                  textShadow: glowIntensity > 0
                    ? `0 0 ${glowSize * 0.3}px ${color},
                       0 0 ${glowSize}px ${color},
                       0 0 ${outerGlow}px ${color},
                       0 0 ${outerGlow * 1.5}px ${color}80`
                    : 'none',
                  display: 'inline-block',
                  lineHeight: 1,
                }}
              >
                {ch}
              </span>
              {/* Wall glow reflection per character */}
              {glowIntensity > 0.3 && (
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 80 + glowIntensity * 40,
                    height: 80 + glowIntensity * 40,
                    transform: 'translate(-50%, -50%)',
                    background: `radial-gradient(ellipse at center, ${color}${Math.floor(glowIntensity * 15).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
                    pointerEvents: 'none',
                    filter: 'blur(15px)',
                    zIndex: -1,
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

function NeonTubeComponent(props: MotionGraphicProps<NeonTubeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-neon-tube',
  title: 'Kinetic Neon Tube',
  description: 'Glass neon tube bending into letter shapes with gas filling and flicker-on ignition against a brick wall backdrop',
  tags: ['kinetic', 'typography', 'neon', 'tube', 'glass', 'glow', 'sign', 'craft', 'bar'],
  category: 'captions',
  component: NeonTubeComponent as any,
  defaultConfig: {
    words: ['OPEN', 'NEON', 'GLOW', 'SIGN'],
    colors: ['#FF6B9D', '#00E5FF', '#FFD93D', '#C56CF0'],
    bgColor: '#0D0D0D',
    cycleDuration: 1.5,
    flickerIntensity: 50,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['OPEN', 'NEON', 'GLOW', 'SIGN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6B9D', '#00E5FF', '#FFD93D', '#C56CF0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D0D0D', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
    { key: 'flickerIntensity', label: 'Flicker Intensity', type: 'number', defaultValue: 50, min: 0, max: 100, group: 'Animation' },
  ],
})
