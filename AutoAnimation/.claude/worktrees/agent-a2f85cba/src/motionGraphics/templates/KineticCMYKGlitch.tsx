import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CMYKGlitchConfig extends KineticBaseConfig {}

/* --- deterministic hash for glitch randomness --- */
function hash(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/* --- snapping ease: steps with overshoot --- */
function easeSnapOut(t: number): number {
  /* quick ease with a sharp snap feel */
  if (t < 0.5) return 4 * t * t * t
  return 1 - Math.pow(-2 * t + 2, 3) / 2
}

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

/* CMYK channels */
const CMYK_CHANNELS = [
  { color: '#00FFFF', label: 'C' },
  { color: '#FF00FF', label: 'M' },
  { color: '#FFFF00', label: 'Y' },
  { color: '#000000', label: 'K' },
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    /* Paper texture grain */
    const grainCount = 50
    const grains = Array.from({ length: grainCount }, (_, i) => {
      const x = hash(i * 8.3) * 100
      const y = hash(i * 14.1 + 7) * 100
      const size = 1 + hash(i * 6.7) * 1.5
      const alpha = 0.02 + hash(i * 19.7) * 0.04
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            borderRadius: '50%',
            background: `rgba(255,255,255,${alpha})`,
            pointerEvents: 'none',
          }}
        />
      )
    })

    /* Glitch scanlines */
    const scanlineCount = 8
    const scanlines = Array.from({ length: scanlineCount }, (_, i) => {
      const yPos = hash(Math.floor(time * 6) * 7 + i * 13) * 100
      const w = 30 + hash(Math.floor(time * 8) * 3 + i * 19) * 70
      const xOff = hash(Math.floor(time * 7) * 11 + i * 23) * (100 - w)
      const alpha = 0.02 + hash(Math.floor(time * 5) * 17 + i * 31) * 0.03
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${xOff}%`,
            top: `${yPos}%`,
            width: `${w}%`,
            height: 1,
            background: `rgba(255,255,255,${alpha})`,
            pointerEvents: 'none',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {grains}
        {scanlines}
      </div>
    )
  },

  renderWord: ({ word, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')

    /* Maximum channel displacement in pixels */
    const maxDisplace = Math.min(width, height) * 0.06

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {CMYK_CHANNELS.map((channel, ci) => (
          <div
            key={ci}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mixBlendMode: 'multiply',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                fontFamily: "'Impact', 'Arial Black', sans-serif",
                fontSize: 'clamp(44px, 13vw, 170px)',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
                display: 'flex',
                color: channel.color,
              }}
            >
              {chars.map((ch, charIdx) => {
                /*
                 * Per-character, per-channel displacement.
                 * Enter: starts aligned, channels snap to random offsets then back.
                 * Hold: continuous random channel jitter per character.
                 * Exit: channels fly apart in random directions.
                 */
                let dx = 0
                let dy = 0
                let charOpacity = 1

                if (phase === 'enter') {
                  /*
                   * Glitch entrance: text fades in with random channel splits
                   * that resolve to alignment.
                   */
                  const charDelay = charIdx * 0.08
                  const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.5)))

                  /* During entry, channels glitch around then settle */
                  if (p < 0.7) {
                    /* Active glitching phase */
                    const glitchSeed = Math.floor(p * 12) * 17 + ci * 41 + charIdx * 7
                    const glitchIntensity = 1 - p / 0.7
                    dx = (hash(glitchSeed) - 0.5) * 2 * maxDisplace * glitchIntensity
                    dy = (hash(glitchSeed + 100) - 0.5) * 2 * maxDisplace * 0.5 * glitchIntensity
                  } else {
                    /* Settling to registration — ease residual jitter to zero */
                    const settle = easeSnapOut((p - 0.7) / 0.3)
                    const residual = (1 - settle) * maxDisplace * 0.1
                    dx = (hash(ci * 41 + charIdx * 7) - 0.5) * residual
                    dy = (hash(ci * 41 + charIdx * 7 + 100) - 0.5) * residual
                  }

                  charOpacity = Math.min(1, p * 3)
                } else if (phase === 'hold') {
                  /*
                   * Continuous random jitter: channels offset independently per character.
                   * Uses stepped time for that digital snap feel.
                   */
                  const stepTime = Math.floor(holdProgress * 20)
                  const jitterSeed = stepTime * 13 + ci * 37 + charIdx * 59

                  /* Some frames are clean, some are glitched */
                  const glitchChance = hash(stepTime * 7 + charIdx * 3)

                  if (glitchChance > 0.6) {
                    /* This frame is glitched for this char/channel combo */
                    const intensity = (glitchChance - 0.6) / 0.4
                    dx = (hash(jitterSeed) - 0.5) * 2 * maxDisplace * 0.7 * intensity
                    dy = (hash(jitterSeed + 200) - 0.5) * 2 * maxDisplace * 0.3 * intensity
                  }

                  charOpacity = 1
                } else {
                  /*
                   * Exit: channels fly apart — each channel for each character
                   * picks a random direction and accelerates outward.
                   */
                  const charDelay = charIdx * 0.05
                  const p = Math.max(0, Math.min(1, (exitProgress - charDelay) / (1 - charDelay * 0.5)))
                  const eased = easeOutQuint(p)

                  /* Random persistent direction per char+channel */
                  const dirSeed = ci * 100 + charIdx * 7
                  const dirAngle = hash(dirSeed) * Math.PI * 2
                  const flyDist = maxDisplace * 4 * eased

                  dx = Math.cos(dirAngle) * flyDist
                  dy = Math.sin(dirAngle) * flyDist

                  charOpacity = 1 - eased * 0.8
                }

                return (
                  <span
                    key={charIdx}
                    style={{
                      display: 'inline-block',
                      transform: `translate(${dx}px, ${dy}px)`,
                      opacity: charOpacity,
                    }}
                  >
                    {ch === ' ' ? '\u00A0' : ch}
                  </span>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  },
}

function CMYKGlitchComponent(props: MotionGraphicProps<CMYKGlitchConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cmyk-glitch',
  title: 'Kinetic CMYK Glitch',
  description:
    'Digital glitch on CMYK color separation. Text enters with channels snapping to random offsets per character then resolving. Hold phase: continuous random per-character channel jitter with stepped timing for a digital snap feel. Exit: channels fly apart in random per-character directions. Multiply blend for color overlap.',
  tags: ['kinetic', 'typography', 'cmyk', 'print', 'glitch', 'digital', 'distortion', 'chromatic'],
  category: 'captions',
  component: CMYKGlitchComponent as any,
  defaultConfig: {
    words: ['PRINT', 'CMYK', 'COLOR', 'PRESS'],
    colors: ['#00FFFF', '#FF00FF', '#FFFF00', '#000000'],
    bgColor: '#1a1a1a',
    cycleDuration: 1.1,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['PRINT', 'CMYK', 'COLOR', 'PRESS'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#00FFFF', '#FF00FF', '#FFFF00', '#000000'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a1a', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.1,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
