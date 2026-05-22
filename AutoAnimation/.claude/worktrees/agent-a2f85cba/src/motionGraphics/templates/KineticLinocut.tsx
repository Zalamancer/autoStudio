import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LinocutConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function hash(n: number): number {
  return ((Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Carved gouge marks — tool paths in the lino block
    const gougeMarks: React.ReactNode[] = []
    for (let i = 0; i < 35; i++) {
      const x = hash(i * 47 + 9) * 100
      const y = hash(i * 61 + 17) * 100
      const len = 10 + hash(i * 29) * 40
      const width_ = 2 + hash(i * 19) * 3
      const angle = hash(i * 73) * 180
      const opacity = 0.025 + hash(i * 37) * 0.035
      // V-gouge shape — pointed ends
      gougeMarks.push(
        <div
          key={`gouge-${i}`}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: len,
            height: width_,
            background: `rgba(255,255,255,${opacity})`,
            borderRadius: '50%',
            transform: `rotate(${angle}deg)`,
          }}
        />
      )
    }

    // Cross-hatch areas (carved-away zones)
    const hatches: React.ReactNode[] = []
    for (let i = 0; i < 8; i++) {
      const x = 10 + hash(i * 51 + 3) * 80
      const y = 10 + hash(i * 67 + 7) * 80
      const size = 20 + hash(i * 33) * 40
      hatches.push(
        <div
          key={`hatch-${i}`}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            backgroundImage: `repeating-linear-gradient(
              ${45 + hash(i * 41) * 30}deg,
              transparent 0px,
              transparent 3px,
              rgba(255,255,255,${0.015 + hash(i * 23) * 0.01}) 3px,
              rgba(255,255,255,${0.015 + hash(i * 23) * 0.01}) 4px
            )`,
            borderRadius: hash(i * 59) > 0.5 ? '50%' : 0,
          }}
        />
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Ink-rolled surface — slight texture variation */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 2px,
              rgba(255,255,255,0.008) 2px,
              rgba(255,255,255,0.008) 3px
            )`,
          }}
        />
        {/* Gouge marks */}
        {gougeMarks}
        {/* Cross-hatch carved areas */}
        {hatches}
        {/* Brayer roller edge marks */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '15%',
            height: 2,
            background: 'rgba(255,255,255,0.02)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: '15%',
            height: 2,
            background: 'rgba(255,255,255,0.02)',
          }}
        />
        {/* Paper texture overlay — simulating the printed paper */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.08) 100%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const chars = word.split('')
    const f = frame ?? 0

    const renderedChars = chars.map((ch, ci) => {
      const charSeed = ci * 83 + index * 59
      const charDelay = ci / (chars.length + 1) * 0.3

      // Linocut characteristics per character
      const inkVariation = 0.75 + hash(charSeed + 5) * 0.5
      const cutEdgeRoughness = hash(charSeed + 11) * 1.5
      const pullPressure = 0.8 + hash(charSeed + 17) * 0.4

      let opacity = 0
      let pressForce = 0
      let inkTransfer = 0
      let yOffset = 0

      if (phase === 'enter') {
        // Hand-pulled print: paper is pressed onto inked block and peeled
        const cp = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.45)))

        if (cp < 0.6) {
          // Burnishing — pressing paper onto block
          const pressP = cp / 0.6
          pressForce = Math.pow(pressP, 0.5) * pullPressure
          inkTransfer = pressP * 0.5
          opacity = pressP * 0.6
          yOffset = (1 - pressP) * 8
        } else {
          // Peeling paper — full reveal with ink variation
          const peelP = (cp - 0.6) / 0.4
          pressForce = pullPressure
          inkTransfer = 0.5 + peelP * 0.5 * inkVariation
          opacity = 0.6 + peelP * 0.4
          yOffset = 0
        }
      } else if (phase === 'hold') {
        opacity = inkVariation
        pressForce = pullPressure
        inkTransfer = inkVariation
        yOffset = 0
      } else {
        const cp = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.15) / 0.85))
        opacity = inkVariation * (1 - cp * 0.8)
        pressForce = pullPressure * (1 - cp * 0.3)
        inkTransfer = inkVariation * (1 - cp * 0.4)
        yOffset = cp * -12
      }

      // Bold graphic linocut look — heavy ink, rough carved edges
      const roughEdgeX = Math.sin(charSeed * 2.3) * cutEdgeRoughness
      const roughEdgeY = Math.cos(charSeed * 1.7) * cutEdgeRoughness

      const shadows = [
        // Bold ink mass
        `0 0 ${inkTransfer * 2}px rgba(0,0,0,${inkTransfer * 0.4})`,
        // Rough carved edge effect
        `${roughEdgeX}px ${roughEdgeY}px 0 ${color}${Math.round(inkTransfer * 30).toString(16).padStart(2, '0')}`,
        // Pressure variation
        `0 ${pressForce}px ${pressForce * 0.5}px rgba(0,0,0,${pressForce * 0.15})`,
      ].join(', ')

      // Ink coverage variation — some areas lighter (simulating hand-inking)
      const inkBrightness = 0.9 + (1 - inkVariation) * 0.2

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            opacity,
            color,
            textShadow: shadows,
            transform: `translateY(${yOffset}px)`,
            filter: `brightness(${inkBrightness})`,
            transition: 'none',
          }}
        >
          {ch}
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
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          fontSize: 'clamp(52px, 14vw, 190px)',
          fontWeight: 900,
          letterSpacing: 6,
          lineHeight: 1,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
        }}
      >
        {renderedChars}
      </div>
    )
  },
}

function LinocutComponent(props: MotionGraphicProps<LinocutConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-linocut',
  title: 'Kinetic Linocut',
  description:
    'Linocut relief print with bold graphic text, hand-pulled with visible tool gouge marks, ink variation, and burnish-then-peel action',
  tags: ['kinetic', 'typography', 'linocut', 'woodblock', 'relief', 'carve', 'bold', 'graphic', 'printmaking', 'art'],
  category: 'captions',
  component: LinocutComponent as any,
  defaultConfig: {
    words: ['CUT', 'ROLL', 'PULL', 'BOLD'],
    colors: ['#1a1a1a', '#0d0d0d', '#1a1a1a', '#0d0d0d'],
    bgColor: '#f0e8d8',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CUT', 'ROLL', 'PULL', 'BOLD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#0d0d0d', '#1a1a1a', '#0d0d0d'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f0e8d8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
