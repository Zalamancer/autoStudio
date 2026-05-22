import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GelliPlateConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function hash(n: number): number {
  return ((Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Gelli plate transfer residue — soft color blobs from previous prints
    const residueBlobs: React.ReactNode[] = []
    for (let i = 0; i < 15; i++) {
      const x = hash(i * 43 + 7) * 100
      const y = hash(i * 59 + 19) * 100
      const size = 30 + hash(i * 31) * 80
      const hue = hash(i * 67) * 360
      const opacity = 0.03 + hash(i * 23) * 0.04
      residueBlobs.push(
        <div
          key={`blob-${i}`}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size * (0.6 + hash(i * 37) * 0.8),
            borderRadius: '50%',
            background: `hsla(${hue}, 40%, 60%, ${opacity})`,
            filter: 'blur(8px)',
            transform: `rotate(${hash(i * 71) * 360}deg)`,
          }}
        />
      )
    }

    // Ghost print marks — faint text-like shapes
    const ghostMarks: React.ReactNode[] = []
    for (let i = 0; i < 5; i++) {
      const x = 15 + hash(i * 53 + 3) * 70
      const y = 20 + hash(i * 41 + 11) * 60
      ghostMarks.push(
        <div
          key={`gm-${i}`}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: 40 + hash(i * 29) * 60,
            height: 8 + hash(i * 17) * 12,
            background: `rgba(120,100,80,${0.02 + hash(i * 47) * 0.02})`,
            borderRadius: 4,
            filter: 'blur(3px)',
            transform: `rotate(${hash(i * 61) * 6 - 3}deg)`,
          }}
        />
      )
    }

    // Gelatin plate edge
    const plateSize = 0.85

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Work surface */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-conic-gradient(
              rgba(0,0,0,0.01) 0deg,
              transparent 1deg,
              transparent 89deg,
              rgba(0,0,0,0.01) 90deg
            )`,
          }}
        />
        {/* Gelli plate — translucent gelatin rectangle */}
        <div
          style={{
            position: 'absolute',
            left: `${(1 - plateSize) / 2 * 100}%`,
            top: `${(1 - plateSize) / 2 * 100}%`,
            width: `${plateSize * 100}%`,
            height: `${plateSize * 100}%`,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 6,
            border: '1px solid rgba(200,200,200,0.1)',
            boxShadow: 'inset 0 2px 12px rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.05)',
            overflow: 'hidden',
          }}
        >
          {residueBlobs}
          {ghostMarks}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const chars = word.split('')
    const f = frame ?? 0

    const renderedChars = chars.map((ch, ci) => {
      const charSeed = ci * 79 + index * 53
      const charDelay = ci / (chars.length + 1) * 0.3

      // Gelli plate transfer characteristics
      const softEdge = 0.5 + hash(charSeed + 3) * 1.0
      const transferCoverage = 0.6 + hash(charSeed + 9) * 0.4
      const colorLayerShift = hash(charSeed + 15) * 3 - 1.5

      let opacity = 0
      let blur = 0
      let transferP = 0
      let yOffset = 0
      let ghostOpacity = 0

      if (phase === 'enter') {
        // Paper pressed onto gelli plate — soft lift-off transfer
        const cp = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.45)))

        if (cp < 0.5) {
          // Pressing down onto plate
          const pressP = cp / 0.5
          opacity = pressP * 0.3
          blur = softEdge * 2 * (1 - pressP * 0.5)
          transferP = pressP * 0.3
          yOffset = (1 - pressP) * 5
        } else {
          // Peeling paper off — ink transfers
          const peelP = (cp - 0.5) / 0.5
          opacity = 0.3 + peelP * 0.7 * transferCoverage
          blur = softEdge * (1 - peelP * 0.6)
          transferP = 0.3 + peelP * 0.7
          yOffset = peelP * -3
          ghostOpacity = peelP * 0.15 // ghost print left on plate
        }
      } else if (phase === 'hold') {
        opacity = transferCoverage
        blur = softEdge * 0.4
        transferP = 1
        yOffset = 0
        ghostOpacity = 0.15 + holdProgress * 0.05
      } else {
        const cp = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.15) / 0.85))
        opacity = transferCoverage * (1 - cp * 0.7)
        blur = softEdge * (0.4 + cp * 1.5)
        transferP = 1 - cp * 0.5
        yOffset = cp * -8
        ghostOpacity = 0.2 * (1 - cp)
      }

      // Soft monoprint edges — characteristic of gelli plate
      const softShadows = [
        `0 0 ${blur * 3}px ${color}${Math.round(transferP * 40).toString(16).padStart(2, '0')}`,
        `${colorLayerShift}px ${colorLayerShift * 0.5}px 0 ${color}${Math.round(transferP * 20).toString(16).padStart(2, '0')}`,
      ].join(', ')

      return (
        <span
          key={ci}
          style={{
            position: 'relative',
            display: 'inline-block',
            opacity,
            color,
            textShadow: softShadows,
            filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
            transform: `translateY(${yOffset}px)`,
            transition: 'none',
          }}
        >
          {ch}
          {/* Ghost print layer behind */}
          {ghostOpacity > 0 && (
            <span
              style={{
                position: 'absolute',
                inset: 0,
                color,
                opacity: ghostOpacity,
                filter: 'blur(2px)',
                transform: `translate(${colorLayerShift}px, ${colorLayerShift * 0.5}px)`,
                pointerEvents: 'none',
              }}
            >
              {ch}
            </span>
          )}
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
          fontWeight: 700,
          letterSpacing: 5,
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

function GelliPlateComponent(props: MotionGraphicProps<GelliPlateConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-gelli-plate',
  title: 'Kinetic Gelli Plate',
  description:
    'Gelli plate monoprint with soft-edge text transferred from gelatin plate, ghost prints, layered color residue, and press-and-peel action',
  tags: ['kinetic', 'typography', 'gelli', 'monoprint', 'gelatin', 'craft', 'soft', 'transfer', 'art', 'printmaking'],
  category: 'captions',
  component: GelliPlateComponent as any,
  defaultConfig: {
    words: ['PEEL', 'PULL', 'MONO', 'MARK'],
    colors: ['#8B4513', '#CD853F', '#A0522D', '#D2691E'],
    bgColor: '#f5f0e6',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PEEL', 'PULL', 'MONO', 'MARK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#8B4513', '#CD853F', '#A0522D', '#D2691E'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f5f0e6', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
