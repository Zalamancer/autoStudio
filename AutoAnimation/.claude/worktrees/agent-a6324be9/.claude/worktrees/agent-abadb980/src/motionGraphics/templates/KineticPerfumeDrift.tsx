import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PerfumeDriftConfig extends KineticBaseConfig {
  haloOpacity: number
}

/* ---------- Easing curves ---------- */

// Fragrance dispersing — starts fast, long graceful tail
function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

// Vapor ascending — slight ease-in
function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

// Dissolve into air
function easeInQuart(t: number): number {
  return t * t * t * t
}

/* ---------- Deterministic pseudo-random ---------- */
function seededRand(seed: number): number {
  return (Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Soft atmospheric luminous halos drifting slowly — perfume bottle reflections
    const halo1X = width * 0.3 + Math.sin(time * 0.18) * width * 0.06
    const halo1Y = height * 0.4 + Math.cos(time * 0.22) * height * 0.04
    const halo2X = width * 0.72 + Math.cos(time * 0.15) * width * 0.05
    const halo2Y = height * 0.6 + Math.sin(time * 0.2) * height * 0.04

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Atmospheric halo 1 — warm champagne */}
        <div
          style={{
            position: 'absolute',
            left: halo1X - 120,
            top: halo1Y - 120,
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(220,195,140,0.06) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Atmospheric halo 2 — cool silver */}
        <div
          style={{
            position: 'absolute',
            left: halo2X - 100,
            top: halo2Y - 100,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(200,210,225,0.04) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Fine grain — luxury print texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 2px,
                rgba(255,255,255,0.006) 2px,
                rgba(255,255,255,0.006) 3px
              )
            `,
          }}
        />

        {/* Central luminous glow — studio light on glass bottle */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 48%, rgba(240,230,210,0.04) 0%, transparent 55%)`,
          }}
        />

        {/* Thin horizontal stripe — surface reflection of glass */}
        <div
          style={{
            position: 'absolute',
            top: height * 0.5 + Math.sin(time * 0.3) * 3,
            left: width * 0.2,
            right: width * 0.2,
            height: '0.5px',
            background: `rgba(240,230,210,${0.06 + Math.sin(time * 0.6) * 0.02})`,
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
  }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const fontSize = Math.min(width / (totalChars * 0.6), 138)

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 0,
          }}
        >
          {chars.map((char, ci) => {
            // Each character drifts from a slightly different vertical origin —
            // staggered so they appear to materialize out of mist at different moments.
            const charSeed = Math.abs(seededRand(ci * 127.1 + index * 311.7))
            const stagger = ci * 0.055
            // Alternate characters arrive from slightly above vs slightly below center
            const driftDir = charSeed > 0.5 ? 1 : -1
            const driftAmt = 18 + charSeed * 12

            let charOpacity = 0
            let yOffset = 0
            let charBlur = 0
            let charScale = 1

            if (phase === 'enter') {
              const t = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger * 0.6)))
              const eased = easeOutQuint(t)
              // Drifts upward into position from below (or above)
              yOffset = driftDir * driftAmt * (1 - eased)
              charOpacity = easeInOutSine(Math.min(1, t * 1.4))
              charBlur = (1 - eased) * 4
              charScale = 0.94 + eased * 0.06
            } else if (phase === 'hold') {
              // Imperceptible vertical float — vapor suspended in still air
              const floatPhase = holdProgress * Math.PI * 2 + ci * 0.5
              yOffset = Math.sin(floatPhase) * 1.2
              charOpacity = 1
              // Barely-there tracking pulse — luxury watches breathe
              charScale = 1 + Math.sin(holdProgress * Math.PI * 1.8 + ci * 0.3) * 0.003
            } else {
              // Exit: characters evaporate upward and dissolve — like scent dissipating
              const t = Math.max(0, Math.min(1, (exitProgress - stagger * 0.6) / (1 - stagger * 0.4)))
              const eased = easeInQuart(Math.min(1, t))
              yOffset = -eased * (driftAmt * 1.4)
              charOpacity = 1 - easeInOutSine(Math.min(1, t * 1.2))
              charBlur = eased * 3
              charScale = 1 - eased * 0.04
            }

            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Futura', 'Century Gothic', 'Trebuchet MS', sans-serif",
                  fontSize: `clamp(24px, 9vw, ${fontSize}px)`,
                  fontWeight: 300,
                  color,
                  letterSpacing: '0.28em',
                  opacity: charOpacity,
                  transform: `translateY(${yOffset}px) scale(${charScale})`,
                  filter: charBlur > 0.2 ? `blur(${charBlur}px)` : undefined,
                  textShadow: `0 0 30px ${color}18, 0 0 60px ${color}08`,
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            )
          })}
        </div>

        {/* Halo glow behind text — materializes with the word */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${Math.min(totalChars * fontSize * 0.6 + 80, width * 0.9)}px`,
            height: `${fontSize * 1.6}px`,
            borderRadius: '50%',
            background: `radial-gradient(ellipse at 50% 50%, ${color}06 0%, transparent 70%)`,
            opacity:
              phase === 'enter'
                ? easeOutQuint(enterProgress)
                : phase === 'hold'
                ? 1
                : 1 - easeInQuart(exitProgress),
            pointerEvents: 'none',
          }}
        />

        {/* Subtle dot separator — editorial refinement */}
        <div
          style={{
            position: 'absolute',
            top: `calc(50% + ${fontSize * 0.62}px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 8,
            opacity:
              phase === 'enter'
                ? easeOutQuint(Math.max(0, (enterProgress - 0.7) / 0.3))
                : phase === 'hold'
                ? 0.6 + Math.sin(holdProgress * Math.PI * 2) * 0.15
                : 1 - easeInQuart(exitProgress),
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 2,
                height: 2,
                borderRadius: '50%',
                background: color,
                opacity: i === 1 ? 0.5 : 0.2,
              }}
            />
          ))}
        </div>
      </div>
    )
  },
}

function PerfumeDriftComponent(props: MotionGraphicProps<PerfumeDriftConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-perfume-drift',
  title: 'Perfume Drift',
  description:
    'Characters materialize from mist at alternating vertical offsets — staggered like fragrance diffusing through still air. Futura light, atmospheric halos, float-in-hold, evaporate-on-exit. Haute couture, fragrance launches, luxury unboxing.',
  tags: [
    'kinetic',
    'typography',
    'luxury',
    'perfume',
    'fragrance',
    'editorial',
    'fashion',
    'drift',
    'atmospheric',
    'minimal',
    'couture',
    'brand',
    'premium',
  ],
  category: 'captions',
  component: PerfumeDriftComponent as any,
  defaultConfig: {
    words: ['NOIR', 'LUMIÈRE', 'PURETÉ', 'ESSENCE'],
    colors: ['#F0ECE4', '#E8E0D0', '#F4F0E8', '#EDE8DE'],
    bgColor: '#0E0D0B',
    cycleDuration: 1.9,
    haloOpacity: 0.06,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['NOIR', 'LUMIÈRE', 'PURETÉ', 'ESSENCE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#F0ECE4', '#E8E0D0', '#F4F0E8', '#EDE8DE'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0E0D0B', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.9,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'haloOpacity',
      label: 'Halo Intensity',
      type: 'number',
      defaultValue: 0.06,
      min: 0,
      max: 0.3,
      group: 'Style',
    },
  ],
})
