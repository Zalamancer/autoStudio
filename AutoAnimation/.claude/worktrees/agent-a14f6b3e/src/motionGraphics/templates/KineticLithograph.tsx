import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LithographConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function hash(n: number): number {
  return ((Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Limestone texture spots
    const spots: React.ReactNode[] = []
    for (let i = 0; i < 40; i++) {
      const x = hash(i * 41 + 3) * 100
      const y = hash(i * 67 + 19) * 100
      const size = 4 + hash(i * 29) * 12
      const opacity = 0.02 + hash(i * 53) * 0.04
      spots.push(
        <div
          key={`spot-${i}`}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            borderRadius: '50%',
            background: `rgba(160,150,130,${opacity})`,
          }}
        />
      )
    }

    // Rolling press indicator
    const rollX = ((time * 80) % (width + 100)) - 50

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Limestone grain texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 3px,
              rgba(140,130,115,0.03) 3px,
              rgba(140,130,115,0.03) 4px
            ), repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 5px,
              rgba(140,130,115,0.02) 5px,
              rgba(140,130,115,0.02) 6px
            )`,
          }}
        />
        {/* Stone surface spots */}
        {spots}
        {/* Rolling press bar */}
        <div
          style={{
            position: 'absolute',
            left: rollX,
            top: 0,
            width: 6,
            height: '100%',
            background: 'linear-gradient(to right, rgba(80,80,80,0.03), rgba(80,80,80,0.08), rgba(80,80,80,0.03))',
            pointerEvents: 'none',
          }}
        />
        {/* Stone edge darkening */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 60px rgba(100,90,70,0.12)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, frame }: WordRenderProps) => {
    const chars = word.split('')
    const f = frame ?? 0

    // The rolling press transfers ink from stone to paper
    const renderedChars = chars.map((ch, ci) => {
      const charSeed = ci * 73 + index * 41
      const charDelay = ci / (chars.length + 1) * 0.3
      // Ink accumulation variation per character
      const inkWeight = 0.7 + hash(charSeed + 5) * 0.6

      let opacity = 0
      let inkDensity = 0
      let transferBlur = 0
      let yOffset = 0

      if (phase === 'enter') {
        // Rolling press transfers text: left-to-right reveal with ink accumulation
        const cp = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.5)))
        // Ink transfers in a rolling motion
        const rollEase = cp < 0.7 ? Math.pow(cp / 0.7, 0.5) : 1
        opacity = Math.min(cp / 0.2, 1)
        inkDensity = rollEase * inkWeight
        transferBlur = (1 - rollEase) * 2
        yOffset = (1 - rollEase) * 4
      } else if (phase === 'hold') {
        opacity = 1
        inkDensity = inkWeight * (1 + holdProgress * 0.15)
        transferBlur = 0
        yOffset = 0
      } else {
        const cp = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.15) / 0.85))
        opacity = 1 - cp * 0.85
        inkDensity = inkWeight * (1 - cp * 0.4)
        transferBlur = cp * 1.5
        yOffset = cp * -6
      }

      // Lithographic ink look: slightly uneven, greasy quality
      const inkBleed = inkDensity * 0.6
      const shadows = [
        `0 0 ${inkBleed}px rgba(0,0,0,${inkDensity * 0.3})`,
        `${hash(charSeed + 11) * 1.5 - 0.7}px ${hash(charSeed + 13) * 1.5 - 0.7}px 0 rgba(0,0,0,${inkDensity * 0.15})`,
      ].join(', ')

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            opacity,
            color,
            textShadow: shadows,
            filter: transferBlur > 0 ? `blur(${transferBlur}px)` : undefined,
            transform: `translateY(${yOffset}px)`,
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
          fontSize: 'clamp(48px, 13vw, 170px)',
          fontWeight: 600,
          letterSpacing: 4,
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

function LithographComponent(props: MotionGraphicProps<LithographConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-lithograph',
  title: 'Kinetic Lithograph',
  description:
    'Lithographic stone printing with text drawn on limestone then transferred via rolling press action, ink accumulation and greasy transfer quality',
  tags: ['kinetic', 'typography', 'lithograph', 'stone', 'print', 'press', 'ink', 'vintage', 'fine-art'],
  category: 'captions',
  component: LithographComponent as any,
  defaultConfig: {
    words: ['STONE', 'DRAW', 'ROLL', 'PRINT'],
    colors: ['#1a1a1a', '#2b2218', '#1a1a1a', '#332b20'],
    bgColor: '#e8e0d0',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['STONE', 'DRAW', 'ROLL', 'PRINT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#2b2218', '#1a1a1a', '#332b20'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#e8e0d0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
