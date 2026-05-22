import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface UnravelConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 from integer seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 149 + 67
    const chars = word.split('')

    // Thread/yarn trail segments
    const threadSegments: { x1: number; y1: number; x2: number; y2: number; opacity: number; thickness: number }[] = []

    const charElements = chars.map((ch, ci) => {
      // Unravel pulls from right to left (like pulling yarn from end)
      const charNorm = ci / Math.max(chars.length - 1, 1)
      let charOpacity = 1
      let tx = 0
      let ty = 0
      let scaleX = 1
      let scaleY = 1
      let rotation = 0

      if (phase === 'enter') {
        // Thread weaves in from bottom, characters knit together left to right
        const charDelay = charNorm * 0.5
        const charProgress = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.5))
        const eased = 1 - Math.pow(1 - charProgress, 2)

        // Character rises from a curved thread path
        const pathProgress = eased
        const swingX = Math.sin(pathProgress * Math.PI * 2 + ci * 0.5) * 30 * (1 - pathProgress)
        const swingY = (1 - pathProgress) * 80

        tx = swingX
        ty = swingY
        charOpacity = Math.min(1, charProgress * 2)
        scaleX = 0.3 + eased * 0.7
        scaleY = 0.3 + eased * 0.7

        // Thread trail during entry
        if (charProgress > 0 && charProgress < 1) {
          threadSegments.push({
            x1: ci * 48 + swingX - 20,
            y1: swingY + 10,
            x2: ci * 48,
            y2: 0,
            opacity: 0.5 * (1 - charProgress),
            thickness: 2,
          })
        }
      } else if (phase === 'hold') {
        // Gentle sway like hanging yarn
        const sway = Math.sin(holdProgress * Math.PI * 3 + ci * 0.9) * 3
        const bob = Math.sin(holdProgress * Math.PI * 2 + ci * 1.4) * 2
        tx = sway
        ty = bob
        charOpacity = 1
      } else {
        // Unravel: chars pull apart right to left like yarn being tugged
        const unravelDelay = ((chars.length - 1 - ci) / Math.max(chars.length - 1, 1)) * 0.4
        const unravelProgress = Math.max(0, Math.min(1, (exitProgress - unravelDelay) / 0.6))

        if (unravelProgress > 0) {
          const eased = Math.pow(unravelProgress, 1.5)
          // Character stretches and pulls down-right as if thread is being tugged
          scaleX = 1 + eased * 2
          scaleY = Math.max(0.1, 1 - eased * 0.8)
          rotation = eased * 15
          tx = eased * 60
          ty = eased * 100 + Math.sin(eased * Math.PI * 3) * 20

          charOpacity = Math.max(0, 1 - eased * 1.3)

          // Thread trailing behind unraveling chars
          if (unravelProgress < 0.9) {
            const threadLen = 3
            for (let t = 0; t < threadLen; t++) {
              const tNorm = t / threadLen
              threadSegments.push({
                x1: ci * 48 + tx - tNorm * 40,
                y1: ty - tNorm * 30,
                x2: ci * 48 + tx - (tNorm + 0.3) * 40,
                y2: ty - (tNorm + 0.3) * 30 + Math.sin(tNorm * Math.PI * 2) * 10,
                opacity: (1 - unravelProgress) * 0.6,
                thickness: 2 - tNorm,
              })
            }
          }
        }
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity,
            transform: `translate(${tx}px, ${ty}px) scaleX(${scaleX}) scaleY(${scaleY}) rotate(${rotation}deg)`,
            transformOrigin: 'center bottom',
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
          fontFamily: "'Palatino', 'Book Antiqua', serif",
          fontSize: 'clamp(40px, 12vw, 150px)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          letterSpacing: 4,
        }}
      >
        {charElements}
        {/* Thread/yarn segments */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            overflow: 'visible',
            pointerEvents: 'none',
          }}
        >
          {threadSegments.map((seg, i) => (
            <line
              key={`ts-${i}`}
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              stroke={color}
              strokeWidth={seg.thickness}
              opacity={seg.opacity}
              strokeLinecap="round"
            />
          ))}
        </svg>
      </div>
    )
  },
}

function UnravelComponent(props: MotionGraphicProps<UnravelConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-unravel',
  title: 'Kinetic Unravel',
  description:
    'Text unravels like thread being pulled from a sweater. Characters stretch and pull apart as yarn trails behind, with a weaving entry animation.',
  tags: ['kinetic', 'typography', 'unravel', 'thread', 'yarn', 'fabric', 'destruction', 'organic'],
  category: 'captions',
  component: UnravelComponent as any,
  defaultConfig: {
    words: ['UNWIND', 'PULL', 'THREAD', 'LOOSE'],
    colors: ['#E8A87C', '#D4789C', '#C56B91', '#85CDCA'],
    bgColor: '#1a1220',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['UNWIND', 'PULL', 'THREAD', 'LOOSE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8A87C', '#D4789C', '#C56B91', '#85CDCA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1220', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
