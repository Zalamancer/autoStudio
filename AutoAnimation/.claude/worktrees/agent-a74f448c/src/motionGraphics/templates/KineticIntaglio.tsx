import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface IntaglioConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function hash(n: number): number {
  return ((Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Etched metal plate scratches
    const scratches: React.ReactNode[] = []
    for (let i = 0; i < 25; i++) {
      const x = hash(i * 37 + 5) * 100
      const y = hash(i * 61 + 23) * 100
      const len = 30 + hash(i * 19) * 80
      const angle = hash(i * 43) * 180
      const opacity = 0.02 + hash(i * 31) * 0.03
      scratches.push(
        <div
          key={`sc-${i}`}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: len,
            height: 1,
            background: `rgba(200,200,200,${opacity})`,
            transform: `rotate(${angle}deg)`,
          }}
        />
      )
    }

    // Press pressure indicator — pulsing
    const pressPhase = (Math.sin(time * 1.5) + 1) / 2

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Copper plate base */}
        <div
          style={{
            position: 'absolute',
            inset: '6%',
            background: 'linear-gradient(135deg, #7B6B52 0%, #8C7A60 30%, #6E5E48 70%, #7B6B52 100%)',
            borderRadius: 3,
            boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          {scratches}
          {/* Beveled plate edge */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              border: '2px solid rgba(160,140,110,0.2)',
              borderRadius: 3,
              boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.08), inset -1px -1px 0 rgba(0,0,0,0.12)',
            }}
          />
        </div>
        {/* Press pressure glow */}
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '20%',
            right: '20%',
            height: '20%',
            background: `radial-gradient(ellipse, rgba(255,240,200,${0.02 * pressPhase}) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const chars = word.split('')
    const f = frame ?? 0

    const renderedChars = chars.map((ch, ci) => {
      const charSeed = ci * 83 + index * 53
      const charDelay = ci / (chars.length + 1) * 0.35

      // Groove depth variation per character
      const grooveDepth = 1.5 + hash(charSeed + 7) * 1.5
      const inkFill = 0.8 + hash(charSeed + 11) * 0.4

      let opacity = 0
      let carveDepth = 0
      let inkLevel = 0
      let pressReveal = 0
      let yOffset = 0

      if (phase === 'enter') {
        // Three-stage: carve groove -> fill ink -> press paper to reveal
        const cp = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.5)))

        if (cp < 0.4) {
          // Carving into metal plate
          const carveP = cp / 0.4
          carveDepth = carveP * grooveDepth
          inkLevel = 0
          pressReveal = 0
          opacity = carveP * 0.4
        } else if (cp < 0.7) {
          // Ink filling grooves
          const inkP = (cp - 0.4) / 0.3
          carveDepth = grooveDepth
          inkLevel = inkP * inkFill
          pressReveal = 0
          opacity = 0.4 + inkP * 0.3
        } else {
          // Paper pressed onto plate — reveals the text
          const pressP = (cp - 0.7) / 0.3
          carveDepth = grooveDepth
          inkLevel = inkFill
          pressReveal = pressP
          opacity = 0.7 + pressP * 0.3
          yOffset = (1 - pressP) * 3
        }
      } else if (phase === 'hold') {
        opacity = 1
        carveDepth = grooveDepth
        inkLevel = inkFill
        pressReveal = 1
        yOffset = 0
      } else {
        const cp = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.2) / 0.8))
        // Paper peels away from plate
        opacity = 1 - cp * 0.8
        carveDepth = grooveDepth
        inkLevel = inkFill * (1 - cp * 0.3)
        pressReveal = 1 - cp * 0.5
        yOffset = cp * -10
      }

      // Intaglio text: deep engraved lines, ink in grooves, slightly raised on paper
      const engraveInset = carveDepth * 0.5
      const inkDensity = inkLevel * 0.8
      const shadows = [
        // Carved groove shadow (inset effect)
        `${engraveInset}px ${engraveInset}px ${engraveInset * 0.5}px rgba(0,0,0,${0.35 * pressReveal})`,
        `${-engraveInset * 0.3}px ${-engraveInset * 0.3}px ${engraveInset * 0.3}px rgba(255,255,255,${0.12 * pressReveal})`,
        // Ink density in grooves
        `0 0 ${inkDensity * 2}px rgba(0,0,0,${inkDensity * 0.25})`,
      ].join(', ')

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            opacity,
            color: pressReveal > 0.5 ? color : 'rgba(60,50,40,0.5)',
            textShadow: shadows,
            transform: `translateY(${yOffset}px)`,
            // Slight ink bleed from pressure
            filter: pressReveal > 0 ? `blur(${(1 - pressReveal) * 1.2}px)` : 'blur(1.2px)',
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
          fontFamily: "'Georgia', 'Palatino Linotype', serif",
          fontSize: 'clamp(44px, 12vw, 160px)',
          fontWeight: 600,
          letterSpacing: 5,
          lineHeight: 1,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          fontStyle: 'italic',
        }}
      >
        {renderedChars}
      </div>
    )
  },
}

function IntaglioComponent(props: MotionGraphicProps<IntaglioConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-intaglio',
  title: 'Kinetic Intaglio',
  description:
    'Intaglio etching with text carved into metal plate, ink filling grooves, and paper press revealing reverse-carved letters with engraved depth',
  tags: ['kinetic', 'typography', 'intaglio', 'etching', 'engrave', 'copper', 'plate', 'print', 'fine-art'],
  category: 'captions',
  component: IntaglioComponent as any,
  defaultConfig: {
    words: ['ETCH', 'CARVE', 'PLATE', 'PULL'],
    colors: ['#1a1410', '#221a12', '#1a1410', '#2a2018'],
    bgColor: '#d8cfc0',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ETCH', 'CARVE', 'PLATE', 'PULL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1410', '#221a12', '#1a1410', '#2a2018'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#d8cfc0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
