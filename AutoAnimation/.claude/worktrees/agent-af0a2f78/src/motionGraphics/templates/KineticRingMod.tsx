import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RingModConfig extends KineticBaseConfig {
  carrierFreq: number
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Ring modulation: carrier * signal visualization
    // Shows concentric interference rings
    const ringCount = 8
    const cx = width / 2
    const cy = height / 2

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          {/* Interference rings expanding outward */}
          {Array.from({ length: ringCount }).map((_, i) => {
            const baseRadius = 30 + i * (Math.min(width, height) * 0.06)
            // Ring modulation: radius oscillates as product of two frequencies
            const carrierOsc = Math.sin(time * 4 + i * 0.5)
            const modulatorOsc = Math.sin(time * 5.7 + i * 0.8)
            const ringModulated = carrierOsc * modulatorOsc // multiplication = ring mod
            const radius = baseRadius + ringModulated * 15

            const opacity = 0.08 + Math.abs(ringModulated) * 0.12
            // Metallic color: silver/steel with interference hue shifts
            const hue = 200 + ringModulated * 40

            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={Math.max(1, radius)}
                fill="none"
                stroke={`hsl(${hue}, 40%, 65%)`}
                strokeWidth={1 + Math.abs(ringModulated) * 1.5}
                opacity={opacity}
              />
            )
          })}

          {/* Carrier frequency indicator wave (horizontal) */}
          {(() => {
            const points: string[] = []
            for (let i = 0; i <= 80; i++) {
              const normalX = i / 80
              const x = normalX * width
              const carrier = Math.sin(normalX * 12 * Math.PI + time * 8)
              const signal = Math.sin(normalX * 3 * Math.PI + time * 2)
              const ringMod = carrier * signal
              const y = height * 0.88 + ringMod * height * 0.04
              points.push(`${x},${y}`)
            }
            const pathD = `M ${points[0]} ` + points.slice(1).map((p) => `L ${p}`).join(' ')
            return (
              <path d={pathD} fill="none" stroke="#AABBCC" strokeWidth={1} opacity={0.25} />
            )
          })()}
        </svg>

        {/* Ring mod label */}
        <div
          style={{
            position: 'absolute',
            top: height * 0.06,
            left: width * 0.05,
            fontFamily: "'Courier New', monospace",
            fontSize: 10,
            color: '#8899AA55',
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}
        >
          RING MOD: CARRIER x SIGNAL
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, width, height, frame, index }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30
    const totalChars = word.length

    let masterOpacity = 1
    if (phase === 'enter') {
      masterOpacity = enterProgress
    } else if (phase === 'exit') {
      masterOpacity = 1 - exitProgress
    }

    // Ring modulation creates metallic/robotic overtones
    // Visualize as interference pattern on letter positions
    const carrierFreq = 6
    const signalFreq = 1.5

    let modIntensity = 0
    if (phase === 'enter') {
      modIntensity = enterProgress
    } else if (phase === 'hold') {
      modIntensity = 1
    } else {
      modIntensity = 1 - exitProgress
    }

    const chars = word.split('').map((ch, ci) => {
      const normalPos = ci / Math.max(1, totalChars - 1)
      // Ring modulation: product of carrier and signal
      const carrier = Math.sin(normalPos * carrierFreq * Math.PI * 2 + time * 8)
      const signal = Math.sin(normalPos * signalFreq * Math.PI * 2 + time * 2)
      const ringMod = carrier * signal * modIntensity

      // Displacement from ring modulation
      const yDisplace = ringMod * 15
      const xDisplace = ringMod * 5

      // Metallic/robotic: opacity pulsing at carrier frequency
      const carrierPulse = 0.6 + 0.4 * Math.abs(carrier)
      const charOpacity = carrierPulse * masterOpacity

      // Interference creates duplicated/ghost images
      const ghostOffset = ringMod * 4

      // Color shift: ring mod creates sideband frequencies -> color interference
      const hueShift = ringMod * 30

      return (
        <span key={ci} style={{ position: 'relative', display: 'inline-block' }}>
          {/* Ghost/sideband duplicate */}
          <span
            style={{
              position: 'absolute',
              left: ghostOffset,
              top: -ghostOffset * 0.5,
              color: '#AABBCC',
              opacity: Math.abs(ringMod) * 0.25,
              filter: `blur(${Math.abs(ringMod) * 2}px)`,
            }}
          >
            {ch}
          </span>
          {/* Main character with ring mod displacement */}
          <span
            style={{
              display: 'inline-block',
              transform: `translate(${xDisplace}px, ${yDisplace}px)`,
              opacity: charOpacity,
              color,
              filter: `hue-rotate(${hueShift}deg)`,
              textShadow: `
                0 0 10px ${color}50,
                ${ringMod * 3}px 0 6px rgba(170,187,204,0.3)
              `,
            }}
          >
            {ch}
          </span>
        </span>
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: masterOpacity,
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          fontSize: 'clamp(44px, 12vw, 160px)',
          fontWeight: 900,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          zIndex: 10,
        }}
      >
        {chars}
      </div>
    )
  },
}

function RingModComponent(props: MotionGraphicProps<RingModConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ring-mod',
  title: 'Kinetic Ring Mod',
  description:
    'Ring modulator effect: text multiplied with carrier frequency creating metallic/robotic interference patterns. Concentric rings, ghost duplicates, and Dalek voice aesthetic.',
  tags: ['kinetic', 'typography', 'ring', 'modulator', 'metallic', 'robotic', 'interference', 'dalek'],
  category: 'captions',
  component: RingModComponent as any,
  defaultConfig: {
    words: ['RING', 'VOID', 'ECHO', 'FLUX'],
    colors: ['#AABBCC', '#8899BB', '#CCDDEE', '#99AACC'],
    bgColor: '#08090C',
    cycleDuration: 1.3,
    carrierFreq: 6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RING', 'VOID', 'ECHO', 'FLUX'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#AABBCC', '#8899BB', '#CCDDEE', '#99AACC'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#08090C', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
