import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GasTubeConfig extends KineticBaseConfig {
  gasType: 'neon' | 'argon' | 'krypton' | 'xenon'
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Noble gas colors — scientifically accurate discharge colors */
const GAS_PALETTES: Record<string, { glow: string; core: string; tube: string }> = {
  neon:    { glow: '#FF3300', core: '#FF6644', tube: 'rgba(255, 80, 40, 0.08)' },
  argon:   { glow: '#8833CC', core: '#BB66FF', tube: 'rgba(140, 60, 200, 0.08)' },
  krypton: { glow: '#DDDDFF', core: '#FFFFFF', tube: 'rgba(200, 200, 255, 0.06)' },
  xenon:   { glow: '#6688FF', core: '#AABBFF', tube: 'rgba(100, 130, 255, 0.07)' },
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Laboratory bench surface
    const benchTop = height * 0.7

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Lab wall — subtle tile grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            bottom: height - benchTop,
            backgroundImage: `
              repeating-linear-gradient(0deg, rgba(100,110,120,0.04) 0px, rgba(100,110,120,0.04) 1px, transparent 1px, transparent 50px),
              repeating-linear-gradient(90deg, rgba(100,110,120,0.04) 0px, rgba(100,110,120,0.04) 1px, transparent 1px, transparent 50px)
            `,
            pointerEvents: 'none',
          }}
        />
        {/* Lab bench surface */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: benchTop,
            bottom: 0,
            background: 'linear-gradient(180deg, rgba(30, 35, 40, 0.4) 0%, rgba(25, 28, 32, 0.5) 100%)',
            borderTop: '2px solid rgba(60, 65, 70, 0.3)',
          }}
        />
        {/* Electrode connectors on bench */}
        {[0.25, 0.75].map((xp, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${xp * 100}%`,
              top: benchTop - 6,
              width: 12,
              height: 18,
              background: 'rgba(80, 75, 70, 0.25)',
              borderRadius: '2px 2px 0 0',
              transform: 'translateX(-50%)',
            }}
          />
        ))}
        {/* Power supply indicator */}
        <div
          style={{
            position: 'absolute',
            right: 15,
            bottom: 12,
            fontFamily: "'Courier New', monospace",
            fontSize: 7,
            color: 'rgba(100, 200, 120, 0.2)',
            letterSpacing: 1,
          }}
        >
          HV: 15kV | I: 30mA
        </div>
        {/* Lab label */}
        <div
          style={{
            position: 'absolute',
            left: 12,
            top: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 7,
            color: 'rgba(150, 155, 160, 0.15)',
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          Gas Discharge Spectroscopy
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const f = frame ?? 0

    // Cycle through gas types per word
    const gasTypes = ['neon', 'argon', 'krypton', 'xenon']
    const gasType = gasTypes[index % gasTypes.length]
    const gas = GAS_PALETTES[gasType] || GAS_PALETTES.neon

    return (
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 8,
          whiteSpace: 'nowrap',
        }}
      >
        {chars.map((ch, ci) => {
          const charDelay = ci / (totalChars + 1) * 0.5

          let tubeOpacity = 0
          let gasGlow = 0
          let ionization = 0

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.5)))

            if (p < 0.3) {
              // Pre-ionization: tube heats, faint glow at electrodes
              ionization = p / 0.3
              tubeOpacity = 0.1 + ionization * 0.1
              gasGlow = 0
            } else if (p < 0.6) {
              // Townsend discharge: gas starts to glow unevenly
              const discharge = (p - 0.3) / 0.3
              ionization = 1
              const flickerSeed = ci * 41 + f
              const flicker = rand(flickerSeed) < (0.3 - discharge * 0.3)
              tubeOpacity = flicker ? 0.15 : (0.2 + discharge * 0.4)
              gasGlow = flicker ? 0.05 : discharge * 0.5
            } else {
              // Full glow discharge established
              const fullP = easeOutCubic((p - 0.6) / 0.4)
              ionization = 1
              tubeOpacity = 0.6 + fullP * 0.4
              gasGlow = 0.5 + fullP * 0.5
            }
          } else if (phase === 'hold') {
            ionization = 1
            // Stable glow discharge with subtle plasma oscillation
            const plasmaOsc = Math.sin(holdProgress * Math.PI * 6 + ci * 1.2) * 0.06
            const microFlicker = rand(ci * 53 + f) < 0.02 ? -0.08 : 0
            tubeOpacity = 0.9 + plasmaOsc + microFlicker
            gasGlow = 0.85 + plasmaOsc + microFlicker
          } else {
            // Deionization — plasma fades
            const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.3) / (1 - charDelay * 0.2)))
            ionization = 1 - p
            tubeOpacity = Math.max(0.05, (1 - easeOutCubic(p)))
            gasGlow = Math.max(0, (1 - easeOutCubic(p)) * 0.9)
          }

          const glowRadius = gasGlow * 22
          const outerRadius = gasGlow * 38

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
              }}
            >
              {/* Glass tube outline */}
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  fontFamily: "'Arial Rounded MT Bold', 'Nunito', sans-serif",
                  fontSize: 'clamp(36px, 11vw, 140px)',
                  fontWeight: 700,
                  color: 'transparent',
                  WebkitTextStroke: `2px rgba(180, 190, 200, ${0.06 + ionization * 0.04})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {ch}
              </span>
              {/* Gas tube fill color */}
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  fontFamily: "'Arial Rounded MT Bold', 'Nunito', sans-serif",
                  fontSize: 'clamp(36px, 11vw, 140px)',
                  fontWeight: 700,
                  color: gas.tube,
                  opacity: tubeOpacity * 0.4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  filter: 'blur(3px)',
                }}
              >
                {ch}
              </span>
              {/* Gas discharge glow */}
              <span
                style={{
                  fontFamily: "'Arial Rounded MT Bold', 'Nunito', sans-serif",
                  fontSize: 'clamp(36px, 11vw, 140px)',
                  fontWeight: 700,
                  color: gasGlow > 0.5 ? gas.core : gas.glow,
                  opacity: tubeOpacity,
                  textShadow: gasGlow > 0
                    ? `0 0 ${glowRadius * 0.4}px ${gas.glow},
                       0 0 ${glowRadius}px ${gas.glow},
                       0 0 ${outerRadius}px ${gas.glow},
                       0 0 ${outerRadius * 1.4}px ${gas.glow}50`
                    : 'none',
                  display: 'inline-block',
                  lineHeight: 1,
                }}
              >
                {ch}
              </span>
              {/* Electrode glow at terminals */}
              {ionization > 0.3 && (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      left: -2,
                      top: '50%',
                      width: 4,
                      height: 4,
                      transform: 'translateY(-50%)',
                      background: `radial-gradient(circle, ${gas.core}${Math.floor(ionization * 40).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
                      borderRadius: '50%',
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      right: -2,
                      top: '50%',
                      width: 4,
                      height: 4,
                      transform: 'translateY(-50%)',
                      background: `radial-gradient(circle, ${gas.core}${Math.floor(ionization * 40).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
                      borderRadius: '50%',
                      pointerEvents: 'none',
                    }}
                  />
                </>
              )}
            </div>
          )
        })}
      </div>
    )
  },
}

function GasTubeComponent(props: MotionGraphicProps<GasTubeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-gas-tube',
  title: 'Kinetic Gas Tube',
  description: 'Scientific noble gas discharge tubes with accurate neon red, argon purple, krypton white colors, ionization phases, and laboratory bench backdrop',
  tags: ['kinetic', 'typography', 'gas', 'tube', 'neon', 'argon', 'krypton', 'science', 'lab', 'discharge'],
  category: 'captions',
  component: GasTubeComponent as any,
  defaultConfig: {
    words: ['NEON', 'ARGON', 'KRYPTON', 'XENON'],
    colors: ['#FF3300', '#8833CC', '#DDDDFF', '#6688FF'],
    bgColor: '#0C0E12',
    cycleDuration: 1.5,
    gasType: 'neon',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['NEON', 'ARGON', 'KRYPTON', 'XENON'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF3300', '#8833CC', '#DDDDFF', '#6688FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0C0E12', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
    { key: 'gasType', label: 'Gas Type', type: 'select', defaultValue: 'neon', options: ['neon', 'argon', 'krypton', 'xenon'], group: 'Animation' },
  ],
})
