import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ArgonGlowConfig extends KineticBaseConfig {
  bloomIntensity: number
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Deep ethereal purple ambient
    const breathe = Math.sin(time * 0.8) * 0.01

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Ethereal violet ambient bloom */}
        <div
          style={{
            position: 'absolute',
            left: '30%',
            right: '30%',
            top: '20%',
            bottom: '20%',
            background: `radial-gradient(ellipse at center, rgba(120, 50, 180, ${0.04 + breathe}) 0%, rgba(80, 30, 140, 0.02) 50%, transparent 80%)`,
            pointerEvents: 'none',
            filter: 'blur(40px)',
          }}
        />
        {/* Secondary softer bloom — offset */}
        <div
          style={{
            position: 'absolute',
            left: '20%',
            right: '40%',
            top: '35%',
            bottom: '35%',
            background: `radial-gradient(ellipse at 40% 50%, rgba(150, 80, 220, ${0.025 + breathe * 0.5}) 0%, transparent 70%)`,
            pointerEvents: 'none',
            filter: 'blur(50px)',
          }}
        />
        {/* Glass tube mounting brackets — faint horizontal guides */}
        {[0.38, 0.62].map((yp, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '15%',
              right: '15%',
              top: `${yp * 100}%`,
              height: 1,
              background: 'rgba(100, 80, 120, 0.06)',
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Glass tube bend points — small mounting clips */}
        {Array.from({ length: 6 }, (_, i) => {
          const xp = 0.2 + i * 0.12
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${xp * 100}%`,
                top: '49%',
                width: 6,
                height: 10,
                background: 'rgba(80, 70, 90, 0.08)',
                borderRadius: 1,
                transform: 'translateX(-50%)',
              }}
            />
          )
        })}
        {/* Faint electrical hum visualization — low frequency wave */}
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <path
            d={`M 0 ${height * 0.85} ${Array.from({ length: 20 }, (_, i) => {
              const x = (i / 19) * width
              const y = height * 0.85 + Math.sin(time * 60 + i * 0.8) * 1.5
              return `L ${x} ${y}`
            }).join(' ')}`}
            fill="none"
            stroke="rgba(120, 60, 180, 0.06)"
            strokeWidth={0.5}
          />
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const f = frame ?? 0

    // Argon specific: deep violet/purple palette
    const argonViolet = '#9933FF'
    const argonDeep = '#6B22B8'
    const argonCore = '#CC88FF'

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
          const charDelay = ci / (totalChars + 1) * 0.4

          let tubeOpacity = 0
          let glowIntensity = 0
          let bloomStrength = 0

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.5)))

            if (p < 0.4) {
              // Argon ionization — slow ethereal build
              const ionize = easeInOutSine(p / 0.4)
              tubeOpacity = ionize * 0.25
              glowIntensity = ionize * 0.15
              bloomStrength = ionize * 0.3
            } else {
              // Full argon glow with bloom expansion
              const glow = easeInOutSine((p - 0.4) / 0.6)
              tubeOpacity = 0.25 + glow * 0.75
              glowIntensity = 0.15 + glow * 0.85
              bloomStrength = 0.3 + glow * 0.7
            }
          } else if (phase === 'hold') {
            // Stable argon discharge — soft ethereal pulsing
            const pulse = Math.sin(holdProgress * Math.PI * 4 + ci * 0.9) * 0.08
            const hum = Math.sin(f * 0.15 + ci * 2.1) * 0.03
            tubeOpacity = 0.88 + pulse + hum
            glowIntensity = 0.85 + pulse
            bloomStrength = 0.9 + pulse * 0.5
          } else {
            // Deionization — argon afterglow lingers longer than other gases
            const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.2) / (1 - charDelay * 0.15)))
            const fade = easeInOutSine(p)
            tubeOpacity = Math.max(0.03, 1 - fade)
            // Argon afterglow — characteristic slow purple fade
            glowIntensity = Math.max(0, (1 - fade) * 0.9)
            bloomStrength = Math.max(0, (1 - fade * 0.8) * 0.5)
          }

          const innerGlow = glowIntensity * 18
          const midGlow = glowIntensity * 32
          const outerGlow = bloomStrength * 50
          const farGlow = bloomStrength * 75

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
              }}
            >
              {/* Far bloom layer — ethereal soft spread */}
              {bloomStrength > 0.2 && (
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    fontFamily: "'Arial Rounded MT Bold', 'Nunito', sans-serif",
                    fontSize: 'clamp(36px, 11vw, 140px)',
                    fontWeight: 700,
                    color: argonDeep,
                    opacity: bloomStrength * 0.25,
                    filter: `blur(${bloomStrength * 12}px)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {ch}
                </span>
              )}
              {/* Glass tube outline — clear glass bends visible */}
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  fontFamily: "'Arial Rounded MT Bold', 'Nunito', sans-serif",
                  fontSize: 'clamp(36px, 11vw, 140px)',
                  fontWeight: 700,
                  color: 'transparent',
                  WebkitTextStroke: `2px rgba(160, 140, 180, ${0.06 + glowIntensity * 0.03})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {ch}
              </span>
              {/* Argon gas discharge */}
              <span
                style={{
                  fontFamily: "'Arial Rounded MT Bold', 'Nunito', sans-serif",
                  fontSize: 'clamp(36px, 11vw, 140px)',
                  fontWeight: 700,
                  color: glowIntensity > 0.6 ? argonCore : argonViolet,
                  opacity: tubeOpacity,
                  textShadow: glowIntensity > 0
                    ? `0 0 ${innerGlow}px ${argonViolet},
                       0 0 ${midGlow}px ${argonDeep},
                       0 0 ${outerGlow}px ${argonDeep},
                       0 0 ${farGlow}px ${argonDeep}40`
                    : 'none',
                  display: 'inline-block',
                  lineHeight: 1,
                }}
              >
                {ch}
              </span>
              {/* Bloom reflection on mounting surface */}
              {bloomStrength > 0.3 && (
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '110%',
                    width: 40 + bloomStrength * 30,
                    height: 20 + bloomStrength * 15,
                    transform: 'translateX(-50%)',
                    background: `radial-gradient(ellipse at center top, ${argonDeep}${Math.floor(bloomStrength * 10).toString(16).padStart(2, '0')} 0%, transparent 80%)`,
                    pointerEvents: 'none',
                    filter: 'blur(10px)',
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

function ArgonGlowComponent(props: MotionGraphicProps<ArgonGlowConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-argon-glow',
  title: 'Kinetic Argon Glow',
  description: 'Deep violet argon gas discharge with ethereal soft bloom, visible glass tube bends, electrical hum, and lingering purple afterglow',
  tags: ['kinetic', 'typography', 'argon', 'purple', 'glow', 'gas', 'ethereal', 'bloom', 'violet'],
  category: 'captions',
  component: ArgonGlowComponent as any,
  defaultConfig: {
    words: ['ARGON', 'VIOLET', 'GLOW', 'ETHER'],
    colors: ['#9933FF', '#7722DD', '#AA44FF', '#6B22B8'],
    bgColor: '#08060E',
    cycleDuration: 1.4,
    bloomIntensity: 70,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ARGON', 'VIOLET', 'GLOW', 'ETHER'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#9933FF', '#7722DD', '#AA44FF', '#6B22B8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#08060E', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
    { key: 'bloomIntensity', label: 'Bloom Intensity', type: 'number', defaultValue: 70, min: 0, max: 100, group: 'Animation' },
  ],
})
