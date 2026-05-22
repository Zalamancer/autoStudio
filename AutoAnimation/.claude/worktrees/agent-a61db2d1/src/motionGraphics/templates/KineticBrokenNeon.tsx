import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BrokenNeonConfig extends KineticBaseConfig {
  damageLevel: number
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

    // Roadside motel horizontal siding
    const sidingRows = 12
    const sidingH = height / sidingRows

    // Buzzing electrical hum — flickering ambient light
    const buzzFlicker = rand(frame * 7 + 3) < 0.08 ? 0.04 : 0
    const ambientGlow = 0.03 + Math.sin(time * 120) * 0.005

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Motel wall siding */}
        {Array.from({ length: sidingRows }, (_, row) => (
          <div
            key={row}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: row * sidingH,
              height: sidingH - 1,
              background: `rgba(${45 + rand(row * 17) * 12}, ${35 + rand(row * 23) * 8}, ${30 + rand(row * 31) * 6}, ${0.12 + rand(row * 41) * 0.06})`,
              borderBottom: '1px solid rgba(20, 15, 10, 0.15)',
            }}
          />
        ))}
        {/* Wall stain/weathering */}
        <div
          style={{
            position: 'absolute',
            left: '15%',
            top: '40%',
            width: '35%',
            height: '30%',
            background: 'radial-gradient(ellipse, rgba(40, 30, 20, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        {/* Electrical junction box */}
        <div
          style={{
            position: 'absolute',
            right: '8%',
            top: '15%',
            width: 18,
            height: 24,
            background: 'rgba(60, 55, 50, 0.2)',
            borderRadius: 1,
            border: '1px solid rgba(80, 70, 60, 0.15)',
          }}
        />
        {/* Wire running from junction to sign area */}
        <div
          style={{
            position: 'absolute',
            right: '8%',
            top: 'calc(15% + 24px)',
            width: 1,
            height: '20%',
            background: 'rgba(40, 35, 30, 0.12)',
          }}
        />
        {/* Ambient neon spill on wall */}
        <div
          style={{
            position: 'absolute',
            left: '15%',
            right: '15%',
            top: '25%',
            bottom: '25%',
            background: `radial-gradient(ellipse at center, rgba(255, 80, 100, ${ambientGlow + buzzFlicker}) 0%, transparent 70%)`,
            pointerEvents: 'none',
            filter: 'blur(30px)',
          }}
        />
        {/* Moth near light */}
        {Math.sin(time * 2) > 0.3 && (
          <div
            style={{
              position: 'absolute',
              left: `${48 + Math.sin(time * 3.7) * 5}%`,
              top: `${35 + Math.cos(time * 2.9) * 4}%`,
              width: 3,
              height: 2,
              background: 'rgba(180, 160, 140, 0.15)',
              borderRadius: '50%',
            }}
          />
        )}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const f = frame ?? 0

    // Each character has a "damage state" — deterministic per letter
    // 0 = working, 1 = half-lit, 2 = dead segment, 3 = flickering short
    const charDamage = chars.map((_, ci) => {
      const damageSeed = rand(index * 97 + ci * 53 + 7)
      if (damageSeed < 0.35) return 0 // working
      if (damageSeed < 0.55) return 1 // half-lit
      if (damageSeed < 0.70) return 2 // dead
      return 3 // flickering short
    })

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
          const damage = charDamage[ci]
          const charDelay = ci / (totalChars + 1) * 0.4

          let tubeOpacity = 0
          let glowIntensity = 0
          let isShortCircuit = false

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.5)))

            if (damage === 2) {
              // Dead segment: tries to come on, fails
              if (p < 0.4) {
                tubeOpacity = 0
              } else if (p < 0.5) {
                tubeOpacity = 0.15 // brief attempt
              } else {
                tubeOpacity = 0.03 // barely visible outline
              }
              glowIntensity = 0
            } else if (damage === 1) {
              // Half-lit: comes on dim, partial
              tubeOpacity = easeOutQuad(p) * 0.35
              glowIntensity = easeOutQuad(p) * 0.25
            } else if (damage === 3) {
              // Flickering short: erratic
              const flickerSeed = ci * 67 + f
              isShortCircuit = rand(flickerSeed) < 0.35
              tubeOpacity = isShortCircuit ? (rand(flickerSeed + 1) * 0.8 + 0.2) : 0.08
              glowIntensity = isShortCircuit ? rand(flickerSeed + 2) * 0.9 : 0
            } else {
              // Working: normal power on
              const flickerSeed = ci * 37 + f
              const flickerChance = rand(flickerSeed)
              const flicker = p < 0.6 && flickerChance < (0.4 - p * 0.6)
              tubeOpacity = flicker ? 0.1 : easeOutQuad(p)
              glowIntensity = flicker ? 0.05 : easeOutQuad(p)
            }
          } else if (phase === 'hold') {
            if (damage === 2) {
              // Dead: stays dark, occasional twitch
              const twitch = rand(ci * 43 + f) < 0.015
              tubeOpacity = twitch ? 0.08 : 0.03
              glowIntensity = 0
            } else if (damage === 1) {
              // Half-lit: dim steady with micro-flickers
              const dimFlicker = rand(ci * 59 + f)
              tubeOpacity = dimFlicker < 0.06 ? 0.15 : 0.35
              glowIntensity = 0.25
            } else if (damage === 3) {
              // Flickering short: buzzing on/off rapidly
              const flickerSeed = ci * 71 + f
              isShortCircuit = rand(flickerSeed) < 0.4
              tubeOpacity = isShortCircuit ? (0.5 + rand(flickerSeed + 1) * 0.5) : 0.05
              glowIntensity = isShortCircuit ? (0.4 + rand(flickerSeed + 2) * 0.5) : 0
            } else {
              // Working: stable with occasional neon idle flicker
              const flickerSeed = ci * 29 + f
              const flicker = rand(flickerSeed) < 0.02
              tubeOpacity = flicker ? 0.5 : (0.85 + rand(flickerSeed + 1) * 0.15)
              glowIntensity = flicker ? 0.3 : (0.8 + Math.sin(holdProgress * Math.PI * 3 + ci) * 0.2)
            }
          } else {
            // Exit: everything powers down
            const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.3) / (1 - charDelay * 0.2)))

            if (damage === 2) {
              tubeOpacity = 0.03 * (1 - p)
              glowIntensity = 0
            } else if (damage === 3) {
              const flickerSeed = ci * 83 + f
              isShortCircuit = rand(flickerSeed) < (0.4 - p * 0.4)
              tubeOpacity = isShortCircuit ? rand(flickerSeed + 1) * 0.4 : 0.03 * (1 - p)
              glowIntensity = isShortCircuit ? rand(flickerSeed + 2) * 0.3 : 0
            } else {
              const flickerSeed = ci * 47 + f
              const flicker = p < 0.6 && rand(flickerSeed) < p * 0.6
              tubeOpacity = flicker ? 0.15 : Math.max(0.02, (1 - easeOutQuad(p)))
              glowIntensity = flicker ? 0.05 : Math.max(0, (1 - easeOutQuad(p)) * 0.8)
            }
          }

          const glowSize = glowIntensity * 20
          const outerGlow = glowIntensity * 35

          // Short circuit spark effect
          const sparkColor = isShortCircuit ? '#FFFFFF' : color

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
              }}
            >
              {/* Glass tube outline — always faintly visible */}
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  fontFamily: "'Arial Rounded MT Bold', 'Nunito', sans-serif",
                  fontSize: 'clamp(36px, 11vw, 140px)',
                  fontWeight: 700,
                  color: 'transparent',
                  WebkitTextStroke: `1.5px rgba(180, 170, 160, ${damage === 2 ? 0.08 : 0.05})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {ch}
              </span>
              {/* Lit neon gas */}
              <span
                style={{
                  fontFamily: "'Arial Rounded MT Bold', 'Nunito', sans-serif",
                  fontSize: 'clamp(36px, 11vw, 140px)',
                  fontWeight: 700,
                  color: glowIntensity > 0.4 ? '#FFFFFF' : (damage === 1 ? `${color}80` : color),
                  opacity: tubeOpacity,
                  textShadow: glowIntensity > 0
                    ? `0 0 ${glowSize * 0.3}px ${sparkColor},
                       0 0 ${glowSize}px ${color},
                       0 0 ${outerGlow}px ${color},
                       0 0 ${outerGlow * 1.3}px ${color}60`
                    : 'none',
                  display: 'inline-block',
                  lineHeight: 1,
                  // Half-lit letters get clipped to show partial illumination
                  clipPath: damage === 1 ? 'inset(0 0 40% 0)' : undefined,
                }}
              >
                {ch}
              </span>
              {/* Short circuit spark */}
              {isShortCircuit && (
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 4,
                    height: 4,
                    transform: 'translate(-50%, -50%)',
                    background: '#FFFFFF',
                    borderRadius: '50%',
                    boxShadow: `0 0 6px #FFFFFF, 0 0 12px ${color}, 0 0 20px ${color}`,
                    pointerEvents: 'none',
                  }}
                />
              )}
              {/* Wall glow per character */}
              {glowIntensity > 0.2 && (
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 60 + glowIntensity * 30,
                    height: 60 + glowIntensity * 30,
                    transform: 'translate(-50%, -50%)',
                    background: `radial-gradient(ellipse at center, ${color}${Math.floor(glowIntensity * 12).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
                    pointerEvents: 'none',
                    filter: 'blur(12px)',
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

function BrokenNeonComponent(props: MotionGraphicProps<BrokenNeonConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-broken-neon',
  title: 'Kinetic Broken Neon',
  description: 'Damaged roadside neon sign with half-lit letters, dead segments, electrical shorts, buzzing flicker, and motel wall backdrop',
  tags: ['kinetic', 'typography', 'neon', 'broken', 'motel', 'flicker', 'retro', 'roadside', 'damaged'],
  category: 'captions',
  component: BrokenNeonComponent as any,
  defaultConfig: {
    words: ['MOTEL', 'VACANCY', 'OPEN', 'DINER'],
    colors: ['#FF4466', '#FF6644', '#FF4466', '#FF8844'],
    bgColor: '#0A0908',
    cycleDuration: 1.5,
    damageLevel: 60,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MOTEL', 'VACANCY', 'OPEN', 'DINER'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF4466', '#FF6644', '#FF4466', '#FF8844'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0908', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
    { key: 'damageLevel', label: 'Damage Level', type: 'number', defaultValue: 60, min: 0, max: 100, group: 'Animation' },
  ],
})
