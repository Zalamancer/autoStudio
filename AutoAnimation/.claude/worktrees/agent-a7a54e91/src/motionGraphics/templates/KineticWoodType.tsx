import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WoodTypeConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function hash(n: number): number {
  return ((Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    // Wood grain lines — visible on the surface
    const grainLines: React.ReactNode[] = []
    for (let i = 0; i < 50; i++) {
      const y = hash(i * 29 + 7) * 100
      const opacity = 0.02 + hash(i * 41) * 0.04
      const thickness = 1 + hash(i * 17) * 2
      const curve = hash(i * 53) * 10 - 5
      grainLines.push(
        <div
          key={`grain-${i}`}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${y}%`,
            height: thickness,
            background: `rgba(101,67,33,${opacity})`,
            transform: `rotate(${curve * 0.1}deg)`,
          }}
        />
      )
    }

    // Ink splatter spots on the work surface
    const splatters: React.ReactNode[] = []
    for (let i = 0; i < 12; i++) {
      const x = hash(i * 71 + 13) * 100
      const y = hash(i * 43 + 29) * 100
      const size = 3 + hash(i * 31) * 8
      splatters.push(
        <div
          key={`splat-${i}`}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            borderRadius: hash(i * 19) > 0.5 ? '50%' : '30%',
            background: `rgba(20,15,10,${0.03 + hash(i * 37) * 0.04})`,
          }}
        />
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Wood work surface grain */}
        {grainLines}
        {/* Ink splatters */}
        {splatters}
        {/* Chase/frame marks (type bed boundary) */}
        <div
          style={{
            position: 'absolute',
            left: '8%',
            right: '8%',
            top: '30%',
            bottom: '30%',
            border: '2px solid rgba(80,60,30,0.06)',
          }}
        />
        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(80,50,20,0.1) 100%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const chars = word.split('')
    const f = frame ?? 0

    const renderedChars = chars.map((ch, ci) => {
      const charSeed = ci * 89 + index * 47
      const charDelay = ci / (chars.length + 1) * 0.3

      // Wood type block characteristics per letter
      const woodGrainAngle = hash(charSeed + 3) * 30 - 15
      const blockWear = 0.85 + hash(charSeed + 7) * 0.3 // some blocks more worn
      const inkCoverage = 0.75 + hash(charSeed + 13) * 0.5
      const blockTilt = (hash(charSeed + 19) - 0.5) * 2 // slight rotation from hand-setting

      let opacity = 0
      let yOffset = 0
      let inkDensity = 0
      let pressImprint = 0

      if (phase === 'enter') {
        const cp = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.5)))
        // Block slams down, ink transfers
        const slamP = cp < 0.5 ? Math.pow(cp / 0.5, 0.3) : 1
        const inkP = cp < 0.5 ? 0 : (cp - 0.5) / 0.5

        opacity = Math.min(cp / 0.15, 1)
        yOffset = (1 - slamP) * -25
        inkDensity = slamP * inkCoverage * 0.6 + inkP * inkCoverage * 0.4
        pressImprint = slamP * blockWear
      } else if (phase === 'hold') {
        opacity = 1
        yOffset = 0
        inkDensity = inkCoverage
        pressImprint = blockWear
      } else {
        const cp = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.15) / 0.85))
        opacity = 1 - cp * 0.8
        yOffset = cp * -15
        inkDensity = inkCoverage * (1 - cp * 0.3)
        pressImprint = blockWear * (1 - cp * 0.4)
      }

      // Wood grain texture overlay via shadow patterns
      const grainShadow1 = `${Math.cos(woodGrainAngle * Math.PI / 180) * 0.5}px ${Math.sin(woodGrainAngle * Math.PI / 180) * 0.5}px 0 rgba(80,50,20,${inkDensity * 0.12})`
      const grainShadow2 = `${Math.cos((woodGrainAngle + 90) * Math.PI / 180) * 0.3}px ${Math.sin((woodGrainAngle + 90) * Math.PI / 180) * 0.3}px 0 rgba(0,0,0,${inkDensity * 0.08})`

      // Pressure imprint shadows
      const imprintShadow = `${pressImprint}px ${pressImprint * 1.2}px ${pressImprint * 0.5}px rgba(0,0,0,${pressImprint * 0.2})`

      // Uneven ink coverage
      const inkUnevenness = hash(charSeed + 31) > 0.6 ? `brightness(${0.95 + hash(charSeed + 33) * 0.1})` : undefined

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            opacity,
            color,
            transform: `translateY(${yOffset}px) rotate(${blockTilt * pressImprint}deg)`,
            textShadow: [grainShadow1, grainShadow2, imprintShadow].join(', '),
            filter: inkUnevenness,
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
          fontSize: 'clamp(56px, 15vw, 200px)',
          fontWeight: 900,
          letterSpacing: 8,
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

function WoodTypeComponent(props: MotionGraphicProps<WoodTypeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-wood-type',
  title: 'Kinetic Wood Type',
  description:
    'Large wood type blocks hand-inked and pressed with visible wood grain texture, uneven ink coverage, and hand-set letter tilts',
  tags: ['kinetic', 'typography', 'wood', 'type', 'block', 'poster', 'display', 'vintage', 'press', 'hand-set'],
  category: 'captions',
  component: WoodTypeComponent as any,
  defaultConfig: {
    words: ['BOLD', 'TYPE', 'WOOD', 'SHOW'],
    colors: ['#1a1008', '#221510', '#1a1008', '#2a1a10'],
    bgColor: '#e8dcc8',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BOLD', 'TYPE', 'WOOD', 'SHOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1008', '#221510', '#1a1008', '#2a1a10'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#e8dcc8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
