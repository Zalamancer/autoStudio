import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

/**
 * KineticInfraredNight — Infrared night-vision goggle display
 *
 * Metaphor: Looking through Gen-3 IR night-vision goggles. The scene is
 * rendered in green phosphor with an IR illuminator hotspot bloom at center.
 * Characters appear as bright IR reflections — they intensify from dim green
 * noise into saturated phosphor-green with CRT-style scan lines.
 *
 * Enter: characters emerge from noise floor — random green pixels coalesce
 *        into readable characters with IR bloom, per-char stagger.
 * Hold: phosphor breathing (brightness oscillates), CRT jitter, noise grain.
 * Exit: characters dissolve back into noise — phosphor decay, green dims to dark.
 */

interface InfraredNightConfig extends KineticBaseConfig {
  noiseLevel: number
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // IR noise dots (static green phosphor noise)
    const noiseCount = 24
    const noiseDots: React.ReactNode[] = []
    for (let i = 0; i < noiseCount; i++) {
      const seed = i * 89 + frame * 3 + 17 // changes each frame for live noise
      const nx = rand(seed) * width
      const ny = rand(seed + 1) * height
      const nSize = 1 + rand(seed + 2) * 3
      const nBright = 0.03 + rand(seed + 3) * 0.08
      noiseDots.push(
        <div
          key={`noise-${i}`}
          style={{
            position: 'absolute',
            left: nx,
            top: ny,
            width: nSize,
            height: nSize,
            borderRadius: '50%',
            background: `rgba(0,255,40,${nBright})`,
            pointerEvents: 'none',
          }}
        />,
      )
    }

    // IR illuminator bloom (center hotspot)
    const bloomPulse = 0.85 + Math.sin(time * 1.8) * 0.15

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* CRT phosphor scan lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,40,0.018) 2px, rgba(0,255,40,0.018) 4px)',
            pointerEvents: 'none',
          }}
        />

        {/* Noise dots */}
        {noiseDots}

        {/* IR illuminator bloom */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: width * 0.7,
            height: height * 0.7,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(ellipse at center, rgba(0,200,40,${0.04 * bloomPulse}) 0%, rgba(0,150,30,${0.02 * bloomPulse}) 40%, transparent 70%)`,
            pointerEvents: 'none',
            filter: 'blur(30px)',
          }}
        />

        {/* Circular vignette — NV goggle tube */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at center, transparent 35%, rgba(0,0,0,0.3) 65%, rgba(0,0,0,0.7) 85%, rgba(0,0,0,0.95) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Subtle circular border (goggle rim) */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: Math.min(width, height) * 0.88,
            height: Math.min(width, height) * 0.88,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: '1px solid rgba(0,255,40,0.06)',
            pointerEvents: 'none',
          }}
        />

        {/* NV HUD markers */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 14,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(0,255,40,0.3)',
            letterSpacing: 1,
          }}
        >
          IR&nbsp;&bull;&nbsp;GEN3
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: 14,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(0,255,40,0.3)',
            letterSpacing: 1,
          }}
        >
          NV&nbsp;ACTIVE&nbsp;&bull;&nbsp;{Math.floor(time * 10) % 100}
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
    frame,
  }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const f = frame ?? 0
    const seed = index * 67 + 31

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
          const charSeed = seed + ci * 41
          const charDelay = (ci / (totalChars + 1)) * 0.25

          let phosphorBright = 0 // 0=dark, 1=full phosphor green
          let noiseBlend = 0 // how much noise vs clean char
          let charOpacity = 0
          let jitterX = 0
          let jitterY = 0
          let bloomRadius = 0

          if (phase === 'enter') {
            // Emerge from noise: random green pixels -> coherent character
            const p = Math.max(
              0,
              Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.5)),
            )

            if (p < 0.35) {
              // Noise phase: random scattered pixels, char barely visible
              const local = p / 0.35
              phosphorBright = local * 0.2
              noiseBlend = 1 - local * 0.3
              charOpacity = local * 0.4
              jitterX = (rand(charSeed + f) - 0.5) * 4 * (1 - local)
              jitterY = (rand(charSeed + f + 1) - 0.5) * 3 * (1 - local)
            } else if (p < 0.7) {
              // Coalescence: noise resolves into character shape
              const local = (p - 0.35) / 0.35
              phosphorBright = 0.2 + easeOutCubic(local) * 0.5
              noiseBlend = 0.7 - local * 0.6
              charOpacity = 0.4 + local * 0.4
              jitterX = (rand(charSeed + f) - 0.5) * 1.5 * (1 - local)
              jitterY = (rand(charSeed + f + 1) - 0.5) * 1 * (1 - local)
              bloomRadius = local * 8
            } else {
              // Full IR reflection — bright phosphor
              const local = (p - 0.7) / 0.3
              phosphorBright = 0.7 + local * 0.3
              noiseBlend = Math.max(0, 0.1 - local * 0.1)
              charOpacity = 0.8 + local * 0.2
              bloomRadius = 8 + local * 6
            }
          } else if (phase === 'hold') {
            // Phosphor breathing + CRT jitter + grain
            const breathe = Math.sin(holdProgress * Math.PI * 5 + ci * 0.8) * 0.1
            phosphorBright = 0.85 + breathe
            noiseBlend = 0.02 + rand(charSeed + f) * 0.03 // very subtle grain
            charOpacity = 1
            // CRT micro-jitter
            jitterX = Math.sin(f * 0.25 + ci * 2.3) * 0.8
            jitterY = Math.sin(f * 0.18 + ci * 1.9) * 0.5
            bloomRadius = 12 + Math.sin(holdProgress * Math.PI * 3 + ci) * 4
          } else {
            // Phosphor decay: character dissolves back into noise
            const p = Math.max(
              0,
              Math.min(1, (exitProgress - charDelay * 0.3) / (1 - charDelay * 0.2)),
            )

            if (p < 0.3) {
              // Brightness drops, noise starts creeping in
              const local = p / 0.3
              phosphorBright = 1 - local * 0.4
              noiseBlend = local * 0.4
              charOpacity = 1 - local * 0.15
              bloomRadius = Math.max(0, 14 - local * 10)
              jitterX = (rand(charSeed + f) - 0.5) * local * 3
              jitterY = (rand(charSeed + f + 1) - 0.5) * local * 2
            } else if (p < 0.65) {
              // Character fragmenting into noise
              const local = (p - 0.3) / 0.35
              phosphorBright = 0.6 - local * 0.4
              noiseBlend = 0.4 + local * 0.4
              charOpacity = 0.85 - local * 0.4
              bloomRadius = 0
              jitterX = (rand(charSeed + f) - 0.5) * 3
              jitterY = (rand(charSeed + f + 1) - 0.5) * 2.5
            } else {
              // Final fade to dark noise floor
              const local = (p - 0.65) / 0.35
              phosphorBright = Math.max(0, 0.2 - easeInExpo(local) * 0.25)
              noiseBlend = 0.8 + local * 0.2
              charOpacity = Math.max(0, 0.45 - easeInExpo(local) * 0.5)
              jitterX = (rand(charSeed + f) - 0.5) * 4
              jitterY = (rand(charSeed + f + 1) - 0.5) * 3
            }
          }

          // Phosphor green color with brightness
          const g = Math.floor(120 + phosphorBright * 135)
          const r = Math.floor(phosphorBright * 40)
          const b = Math.floor(phosphorBright * 20)
          const charColor = `rgb(${r}, ${g}, ${b})`
          const glowGreen = `rgba(0, ${g}, 20, 0.4)`

          return (
            <div key={ci} style={{ position: 'relative', display: 'inline-block' }}>
              {/* IR bloom halo */}
              {bloomRadius > 2 && (
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 30 + bloomRadius * 4,
                    height: 30 + bloomRadius * 4,
                    transform: 'translate(-50%, -50%)',
                    background: `radial-gradient(ellipse at center, rgba(0,${g},30,${0.12 * phosphorBright}) 0%, transparent 70%)`,
                    filter: 'blur(8px)',
                    pointerEvents: 'none',
                    mixBlendMode: 'screen',
                    zIndex: -1,
                  }}
                />
              )}

              {/* Noise layer (overlapping semi-random characters) */}
              {noiseBlend > 0.05 && (
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    fontFamily: "'Courier New', monospace",
                    fontSize: 'clamp(42px, 12vw, 150px)',
                    fontWeight: 700,
                    color: `rgba(0,${80 + Math.floor(rand(charSeed + f * 2) * 60)},20,${noiseBlend * 0.4})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: `translate(${(rand(charSeed + f * 3) - 0.5) * 6}px, ${(rand(charSeed + f * 3 + 1) - 0.5) * 4}px)`,
                    pointerEvents: 'none',
                    letterSpacing: 0,
                  }}
                >
                  {String.fromCharCode(33 + Math.floor(rand(charSeed + f) * 90))}
                </span>
              )}

              {/* Phosphor outline (dim green stroke visible during transitions) */}
              {phosphorBright > 0.05 && phosphorBright < 0.6 && (
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    fontFamily: "'Courier New', monospace",
                    fontSize: 'clamp(42px, 12vw, 150px)',
                    fontWeight: 700,
                    color: 'transparent',
                    WebkitTextStroke: `1px rgba(0,${g},20,${phosphorBright + 0.2})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  {ch}
                </span>
              )}

              {/* Main character — phosphor green */}
              <span
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(42px, 12vw, 150px)',
                  fontWeight: 700,
                  color: charColor,
                  opacity: charOpacity,
                  display: 'inline-block',
                  lineHeight: 1,
                  transform: `translate(${jitterX}px, ${jitterY}px)`,
                  textShadow:
                    phosphorBright > 0.3
                      ? `0 0 ${phosphorBright * 8}px ${glowGreen}, 0 0 ${phosphorBright * 18}px rgba(0,${g},10,0.2)`
                      : 'none',
                }}
              >
                {ch}
              </span>
            </div>
          )
        })}
      </div>
    )
  },
}

function InfraredNightComponent(props: MotionGraphicProps<InfraredNightConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-infrared-night',
  title: 'Kinetic Infrared Night',
  description:
    'Gen-3 infrared night-vision goggle display: characters emerge from green phosphor noise with IR illuminator bloom, CRT scan lines, circular vignette tube, and phosphor decay exit.',
  tags: [
    'kinetic',
    'typography',
    'infrared',
    'night',
    'vision',
    'nvg',
    'phosphor',
    'green',
    'military',
    'thermal',
    'crt',
  ],
  category: 'captions',
  component: InfraredNightComponent as any,
  defaultConfig: {
    words: ['DARK', 'SEEK', 'HUNT', 'EYES'],
    colors: ['#00FF40', '#00DD30', '#00FF50', '#00CC28'],
    bgColor: '#010804',
    cycleDuration: 1.4,
    noiseLevel: 60,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['DARK', 'SEEK', 'HUNT', 'EYES'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#00FF40', '#00DD30', '#00FF50', '#00CC28'],
      group: 'Style',
    },
    {
      key: 'bgColor',
      label: 'Background',
      type: 'color',
      defaultValue: '#010804',
      group: 'Style',
    },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'noiseLevel',
      label: 'Noise Level',
      type: 'number',
      defaultValue: 60,
      min: 0,
      max: 100,
      group: 'Animation',
    },
  ],
})
