import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DataPulseConfig extends KineticBaseConfig {
  pulseSpeed: number
}

/* ---------- Easing ---------- */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
function easeInQuad(t: number): number {
  return t * t
}
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

/* ---------- Deterministic pseudo-random ---------- */
function seededRand(seed: number): number {
  return ((Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1
}

// Character pool for noise resolve — alphanumeric chaos
const NOISE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&'

function noiseChar(seed: number): string {
  const idx = Math.floor(seededRand(seed) * NOISE_CHARS.length)
  return NOISE_CHARS[idx] ?? '?'
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Faint ambient data particles — dots that appear and fade at random positions
    // Purely atmospheric: could be bokeh, stars, dust, or data — context-agnostic
    const particleCount = 12

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Particle field */}
        {Array.from({ length: particleCount }, (_, i) => {
          const px = seededRand(i * 17 + 3) * width
          const py = seededRand(i * 23 + 7) * height
          const phase = (time * (0.4 + seededRand(i * 11) * 0.6) + seededRand(i * 7)) % 1
          const opacity = Math.sin(phase * Math.PI) * 0.12
          const size = 1 + seededRand(i * 5 + 1) * 2
          return (
            <div
              key={`p-${i}`}
              style={{
                position: 'absolute',
                left: px,
                top: py,
                width: size,
                height: size,
                borderRadius: '50%',
                background: `rgba(255, 255, 255, ${opacity})`,
              }}
            />
          )
        })}

        {/* Subtle horizontal rhythm lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 7px,
              rgba(255, 255, 255, 0.012) 7px,
              rgba(255, 255, 255, 0.012) 8px
            )`,
            pointerEvents: 'none',
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
    frame,
    fps,
  }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const fontSize = Math.min(width / (totalChars * 0.62), 140)

    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 2,
          }}
        >
          {chars.map((targetChar, ci) => {
            // Each character has a staggered resolve window
            const stagger = ci * (0.7 / Math.max(totalChars, 1))
            let displayChar = targetChar
            let charOpacity = 1
            let charColor = color
            let charScale = 1
            let charBlur = 0
            let charTranslateY = 0
            let noiseOpacity = 0

            if (phase === 'enter') {
              // Characters resolve from noise → real, staggered left to right
              const localT = Math.max(0, Math.min(1, (enterProgress - stagger) / (0.85 - stagger)))
              const resolveEased = easeOutCubic(localT)

              if (localT <= 0) {
                // Not yet started: invisible
                charOpacity = 0
                displayChar = noiseChar(ci * 71 + index * 53 + Math.floor(time * 20))
              } else if (resolveEased < 0.85) {
                // Resolving: flickering noise characters with increasing stability
                const noiseT = 1 - resolveEased / 0.85
                // Flip between noise and real char — more stable as resolveEased grows
                const flipSeed = ci * 37 + Math.floor(time * 18) * 13 + index * 7
                const showNoise = seededRand(flipSeed) < noiseT * 0.75
                displayChar = showNoise ? noiseChar(flipSeed) : targetChar
                charOpacity = 0.3 + resolveEased * 0.7
                charColor = showNoise ? `rgba(${hexToRgb(color)}, 0.5)` : color
                charBlur = showNoise ? 1 : 0
              } else {
                // Fully resolved — snap in with a micro-overshoot
                displayChar = targetChar
                charOpacity = 1
                charScale = easeOutBack(Math.min(1, (resolveEased - 0.85) / 0.15))
              }
            } else if (phase === 'hold') {
              // Data-heartbeat: a pulse ripple travels across the word
              // Pulse wave position travels 0→1 across the word over holdProgress
              const wavePos = holdProgress % 1  // 0..1 across the hold
              const charPos = ci / Math.max(totalChars - 1, 1)  // 0..1 across the word
              const waveDist = Math.abs(wavePos - charPos)
              const pulseAmt = Math.max(0, 1 - waveDist * 5) // narrow bell
              charScale = 1 + pulseAmt * 0.06
              charOpacity = 1
              charColor = color
            } else {
              // Exit: rapid dissolve — chars scramble back to noise and fade
              const localT = Math.max(0, Math.min(1, (exitProgress - stagger * 0.4) / (0.9 - stagger * 0.4)))
              const eased = easeInQuad(localT)

              if (eased > 0.4) {
                const scrambleSeed = ci * 41 + Math.floor(time * 24) * 17 + index * 11
                const showNoise = seededRand(scrambleSeed) < (eased - 0.4) / 0.6
                displayChar = showNoise ? noiseChar(scrambleSeed) : targetChar
                charColor = showNoise ? `rgba(${hexToRgb(color)}, 0.4)` : color
              }
              charOpacity = 1 - eased
              charTranslateY = eased * -8
            }

            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Courier New', 'Courier', monospace",
                  fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                  fontWeight: 700,
                  color: charColor,
                  letterSpacing: '0.08em',
                  opacity: charOpacity,
                  transform: `translateY(${charTranslateY}px) scale(${charScale})`,
                  filter: charBlur > 0.1 ? `blur(${charBlur}px)` : undefined,
                  textShadow: `0 0 16px ${color}60`,
                  minWidth: '0.62em',
                  textAlign: 'center',
                  // Monospace feel: fixed slot per char so noise swaps don't shift layout
                }}
              >
                {displayChar}
              </span>
            )
          })}
        </div>
      </div>
    )
  },
}

/* Utility: parse a hex color to an RGB string for use in rgba() */
function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '')
  if (clean.length === 3) {
    const r = parseInt(clean[0]! + clean[0]!, 16)
    const g = parseInt(clean[1]! + clean[1]!, 16)
    const b = parseInt(clean[2]! + clean[2]!, 16)
    return `${r}, ${g}, ${b}`
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16)
    const g = parseInt(clean.substring(2, 4), 16)
    const b = parseInt(clean.substring(4, 6), 16)
    return `${r}, ${g}, ${b}`
  }
  return '255, 255, 255'
}

function DataPulseComponent(props: MotionGraphicProps<DataPulseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-data-pulse',
  title: 'Data Pulse',
  description:
    'Characters resolve from randomized noise into the real text — each letter stabilizes in a staggered left-to-right cascade. Hold phase: a heartbeat pulse ripples across the word. Exit: characters scramble back to noise and dissolve. Monospace slots keep layout stable during noise swaps. Works equally well for drama, suspense, reveals, or any moment that needs a "signal locking in" feel.',
  tags: [
    'kinetic',
    'typography',
    'data',
    'noise',
    'resolve',
    'glitch',
    'digital',
    'pulse',
    'reveal',
    'scramble',
    'tech',
    'versatile',
  ],
  category: 'captions',
  component: DataPulseComponent as any,
  defaultConfig: {
    words: ['LOCKED', 'SIGNAL', 'FOUND', 'YES'],
    colors: ['#00FF88', '#FFFFFF', '#00E0FF', '#00FF88'],
    bgColor: '#040810',
    cycleDuration: 1.3,
    pulseSpeed: 1,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['LOCKED', 'SIGNAL', 'FOUND', 'YES'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#00FF88', '#FFFFFF', '#00E0FF', '#00FF88'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#040810', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.3,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'pulseSpeed',
      label: 'Pulse Speed',
      type: 'number',
      defaultValue: 1,
      min: 0.2,
      max: 4,
      group: 'Animation',
    },
  ],
})
