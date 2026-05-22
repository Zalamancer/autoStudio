import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GranularConfig extends KineticBaseConfig {
  grainDensity: number
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Grain cloud visualization: tiny particles flowing
    const grainCount = 60

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Ambient grain particles floating */}
        {Array.from({ length: grainCount }).map((_, i) => {
          const seed = i * 73 + 17
          const baseX = rand(seed) * width
          const baseY = rand(seed + 1) * height
          const speed = 0.3 + rand(seed + 2) * 0.6
          const size = 1 + rand(seed + 3) * 2.5
          const drift = Math.sin(time * speed + rand(seed + 4) * Math.PI * 2) * 20

          const x = ((baseX + time * 15 * (0.5 + rand(seed + 5))) % (width + 20)) - 10
          const y = baseY + drift
          const opacity = 0.05 + rand(seed + 6) * 0.1

          // Grains have warm amber tones
          const hue = 30 + rand(seed + 7) * 30
          const lightness = 50 + rand(seed + 8) * 30

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: size,
                height: size,
                borderRadius: '50%',
                background: `hsl(${hue}, 60%, ${lightness}%)`,
                opacity,
              }}
            />
          )
        })}

        {/* Time-stretch indicator */}
        <div
          style={{
            position: 'absolute',
            top: height * 0.07,
            left: width * 0.05,
            fontFamily: "'Courier New', monospace",
            fontSize: 10,
            color: '#FF994455',
            letterSpacing: 2,
          }}
        >
          GRANULAR: DENSITY {Math.floor(40 + Math.sin(time * 0.5) * 20)} | SPREAD {(0.3 + Math.sin(time * 0.3) * 0.2).toFixed(2)}
        </div>

        {/* Grain envelope visualization at bottom */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          {/* Individual grain envelopes */}
          {Array.from({ length: 12 }).map((_, gi) => {
            const grainStart = (gi / 12 + time * 0.15) % 1
            const grainWidth = 0.06 + rand(gi * 31) * 0.04
            const grainHeight = height * 0.03 * (0.5 + rand(gi * 47) * 0.5)
            const grainY = height * 0.9

            const x1 = grainStart * width
            const x2 = x1 + grainWidth * width * 0.5
            const x3 = x1 + grainWidth * width

            return (
              <path
                key={gi}
                d={`M ${x1},${grainY} Q ${x2},${grainY - grainHeight} ${x3},${grainY}`}
                fill="none"
                stroke="#FF9944"
                strokeWidth={1}
                opacity={0.15}
              />
            )
          })}
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, width, height, frame, index }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30
    const totalChars = word.length

    let masterOpacity = 1
    if (phase === 'enter') {
      masterOpacity = Math.min(1, enterProgress * 1.5)
    } else if (phase === 'exit') {
      masterOpacity = Math.max(0, 1 - exitProgress * 1.2)
    }

    // Granular synthesis: each character is a "grain" that can scatter
    // During enter: grains assemble from scattered cloud
    // During hold: subtle grain shimmer
    // During exit: grains scatter into cloud

    const chars = word.split('').map((ch, ci) => {
      const charSeed = ci * 97 + index * 31
      let scatterX = 0
      let scatterY = 0
      let charOpacity = 1
      let charScale = 1
      let rotation = 0

      if (phase === 'enter') {
        // Grains converge from scattered positions
        const scatter = 1 - enterProgress
        scatterX = (rand(charSeed) - 0.5) * width * 0.6 * scatter
        scatterY = (rand(charSeed + 1) - 0.5) * height * 0.5 * scatter
        charOpacity = enterProgress
        charScale = 0.3 + 0.7 * enterProgress
        rotation = (rand(charSeed + 2) - 0.5) * 360 * scatter
      } else if (phase === 'hold') {
        // Subtle grain jitter - micro-scatter and reassemble
        const jitterPhase = holdProgress * 6 + ci * 0.8
        const jitterAmount = 0.02 + 0.03 * Math.sin(jitterPhase * Math.PI)
        scatterX = (rand(charSeed + f * 3) - 0.5) * width * jitterAmount
        scatterY = (rand(charSeed + f * 3 + 1) - 0.5) * height * jitterAmount
        charScale = 0.95 + 0.1 * rand(charSeed + Math.floor(f / 3))
        rotation = (rand(charSeed + Math.floor(f / 2)) - 0.5) * 4
        charOpacity = 0.85 + 0.15 * rand(charSeed + Math.floor(f / 2) + 1)
      } else {
        // Grains scatter outward
        const scatter = exitProgress
        const angle = rand(charSeed + 3) * Math.PI * 2
        const distance = scatter * Math.min(width, height) * 0.4
        scatterX = Math.cos(angle) * distance
        scatterY = Math.sin(angle) * distance
        charOpacity = 1 - scatter
        charScale = 1 - scatter * 0.6
        rotation = (rand(charSeed + 4) - 0.5) * 360 * scatter
      }

      // Each grain gets a slightly different tint (like different grain windows)
      const hueShift = (rand(charSeed + 5) - 0.5) * 20

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            transform: `translate(${scatterX}px, ${scatterY}px) scale(${charScale}) rotate(${rotation}deg)`,
            opacity: charOpacity,
            color,
            filter: `hue-rotate(${hueShift}deg)`,
            textShadow: `0 0 ${8 + Math.abs(scatterX) * 0.1}px ${color}50`,
          }}
        >
          {ch}
        </span>
      )
    })

    // During scatter phases, add extra grain fragments (half-characters, dots)
    const grainFragments: React.ReactNode[] = []
    if (phase === 'enter' || phase === 'exit') {
      const scatter = phase === 'enter' ? 1 - enterProgress : exitProgress
      if (scatter > 0.1) {
        const fragmentCount = Math.floor(scatter * 15)
        for (let i = 0; i < fragmentCount; i++) {
          const fSeed = i * 137 + index * 43 + f
          const fx = (rand(fSeed) - 0.5) * width * 0.7
          const fy = (rand(fSeed + 1) - 0.5) * height * 0.5
          const fSize = 4 + rand(fSeed + 2) * 12
          const fOpacity = scatter * 0.3 * rand(fSeed + 3)
          const fRotation = rand(fSeed + 4) * 360

          grainFragments.push(
            <div
              key={`frag-${i}`}
              style={{
                position: 'absolute',
                left: `calc(50% + ${fx}px)`,
                top: `calc(50% + ${fy}px)`,
                fontSize: fSize,
                color,
                opacity: fOpacity,
                transform: `rotate(${fRotation}deg)`,
                fontFamily: "'Courier New', monospace",
              }}
            >
              {word[Math.floor(rand(fSeed + 5) * word.length)]}
            </div>
          )
        }
      }
    }

    return (
      <>
        {grainFragments}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: masterOpacity,
            fontFamily: "'Courier New', 'Fira Code', monospace",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            zIndex: 10,
          }}
        >
          {chars}
        </div>
      </>
    )
  },
}

function GranularComponent(props: MotionGraphicProps<GranularConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-granular',
  title: 'Kinetic Granular',
  description:
    'Granular synthesis: text breaks into tiny grains that scatter and reassemble. Cloud of letter fragments with time-stretch aesthetic, grain envelope visualization, and warm amber tones.',
  tags: ['kinetic', 'typography', 'granular', 'synthesis', 'scatter', 'cloud', 'grains', 'ambient'],
  category: 'captions',
  component: GranularComponent as any,
  defaultConfig: {
    words: ['GRAIN', 'DUST', 'SWARM', 'MELT'],
    colors: ['#FF9944', '#FFBB66', '#FF7722', '#FFCC88'],
    bgColor: '#0A0806',
    cycleDuration: 1.5,
    grainDensity: 40,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GRAIN', 'DUST', 'SWARM', 'MELT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF9944', '#FFBB66', '#FF7722', '#FFCC88'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0806', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
