import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MonoprintConfig extends KineticBaseConfig {}

function hash(n: number): number {
  return ((Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    // Printmaking paper with light tooth
    const smudges: React.ReactNode[] = []
    for (let i = 0; i < 12; i++) {
      const x = hash(i * 29 + 3) * width
      const y = hash(i * 61 + 17) * height
      const size = 30 + hash(i * 43) * 60
      const opacity = 0.01 + hash(i * 71) * 0.02
      smudges.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: size,
            height: size * 0.4,
            borderRadius: '50%',
            background: '#2a2a2a',
            opacity,
            transform: `rotate(${hash(i * 53) * 360}deg)`,
            filter: 'blur(8px)',
          }}
        />
      )
    }
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {smudges}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 97 + 53
    const chars = word.split('')

    // Monoprint: ink is applied to a plate, paper pressed against it
    // Result: uneven ink transfer, pressure variations, unique texture every time

    let transferProgress = 0 // 0..1 how much ink has transferred
    let pressureBase = 0 // overall pressure
    let peelProgress = 0 // paper peeling off plate

    if (phase === 'enter') {
      const t = enterProgress
      if (t < 0.15) {
        // Paper contacts plate
        transferProgress = 0
        pressureBase = t / 0.15
      } else if (t < 0.7) {
        // Ink transfers under pressure — gradual, uneven
        const transfer = (t - 0.15) / 0.55
        transferProgress = transfer
        pressureBase = 1
      } else {
        // Paper peels away from plate, ink strings and settles
        const peel = (t - 0.7) / 0.3
        transferProgress = 1
        pressureBase = 1 - peel * 0.3
        peelProgress = peel
      }
    } else if (phase === 'hold') {
      transferProgress = 1
      pressureBase = 0.7
      peelProgress = 1
    } else {
      const t = exitProgress
      transferProgress = 1 - t * 0.7
      pressureBase = 0.7 * (1 - t)
      peelProgress = 1
    }

    // Per-character unique ink transfer (the heart of monoprint)
    const renderedChars = chars.map((ch, ci) => {
      const charSeed = seed + ci * 67
      // Each character has different pressure, creating unique ink density
      const charPressure = 0.5 + hash(charSeed) * 0.5
      const inkDensity = charPressure * transferProgress
      // Some chars get more ink, some less — the beauty of monoprint
      const inkThickness = 0.8 + hash(charSeed + 11) * 0.4

      // Transfer timing: center chars transfer first (more pressure there)
      const distFromCenter = Math.abs(ci - chars.length / 2) / (chars.length / 2)
      const charDelay = distFromCenter * 0.3
      const charTransfer = Math.max(0, Math.min(1, (transferProgress - charDelay) / (1 - charDelay + 0.001)))

      // Ink texture: some areas are solid, some are broken/textured
      const isTextured = hash(charSeed + 23) > 0.5
      const textureOpacity = isTextured
        ? 0.6 + charTransfer * 0.3
        : 0.8 + charTransfer * 0.2

      // Slight position jitter from uneven pressure
      const jitterX = (hash(charSeed + 37) - 0.5) * 3 * pressureBase
      const jitterY = (hash(charSeed + 41) - 0.5) * 2 * pressureBase

      // During peel: ink can string slightly
      const stringY = phase === 'enter' && peelProgress > 0 && peelProgress < 0.8
        ? -peelProgress * (2 + hash(charSeed + 59) * 3)
        : 0

      // Ink bleed edges — monoprint has soft, irregular edges
      const bleedAmount = inkDensity * inkThickness * 1.5
      const inkShadow = charTransfer > 0.1
        ? [
            `0 0 ${bleedAmount}px rgba(0,0,0,${inkDensity * 0.3})`,
            `${hash(charSeed + 47) * 2 - 1}px ${hash(charSeed + 53) * 2}px ${bleedAmount * 0.5}px rgba(0,0,0,${inkDensity * 0.15})`,
          ].join(', ')
        : 'none'

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            transform: `translate(${jitterX}px, ${jitterY + stringY}px)`,
            opacity: charTransfer * textureOpacity * (phase === 'exit' ? (1 - exitProgress) : 1),
            color,
            textShadow: inkShadow,
            // Varying thickness simulates uneven ink transfer
            filter: `contrast(${0.8 + inkDensity * 0.4}) brightness(${0.9 + (1 - inkDensity) * 0.2})`,
          }}
        >
          {ch}
        </span>
      )
    })

    // Ink ghost: faint reverse image (ink left on plate) visible during peel
    const ghostOpacity = phase === 'enter'
      ? peelProgress * 0.06
      : phase === 'hold'
        ? 0.06 - holdProgress * 0.03
        : 0.03 * (1 - exitProgress)

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Ghost/plate remnant offset */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(calc(-50% + 3px), calc(-50% + 3px))',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(48px, 13vw, 175px)',
            fontWeight: 700,
            letterSpacing: 4,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            color: '#1a1a1a',
            opacity: ghostOpacity,
            filter: 'blur(1px)',
          }}
        >
          {word}
        </div>
        {/* Main print */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(48px, 13vw, 175px)',
            fontWeight: 700,
            letterSpacing: 4,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
          }}
        >
          {renderedChars}
        </div>
      </div>
    )
  },
}

function MonoprintComponent(props: MotionGraphicProps<MonoprintConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-monoprint',
  title: 'Kinetic Monoprint',
  description: 'Unique one-off print with ink transfer texture and pressure variations — paper presses against inked plate, each character transfers differently',
  tags: ['kinetic', 'typography', 'monoprint', 'printmaking', 'ink', 'texture', 'unique', 'artisan'],
  category: 'captions',
  component: MonoprintComponent as any,
  defaultConfig: {
    words: ['MONO', 'PRINT', 'PRESS', 'PULL'],
    colors: ['#1a1a1a', '#2d1b0e', '#1a1a1a', '#0a1a2d'],
    bgColor: '#F2EDE3',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MONO', 'PRINT', 'PRESS', 'PULL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#2d1b0e', '#1a1a1a', '#0a1a2d'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F2EDE3', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
