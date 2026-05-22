import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ShredderConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 from integer seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Number of horizontal strips per character */
const STRIP_COUNT = 6

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, height }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 163 + 71
    const chars = word.split('')
    const stripHeight = 100 / STRIP_COUNT // percentage of character height per strip

    if (phase === 'enter') {
      // Strips rise from below and assemble into text
      const strips: React.ReactNode[] = []
      for (let s = 0; s < STRIP_COUNT; s++) {
        const stripDelay = (s / STRIP_COUNT) * 0.4
        const stripProgress = Math.max(0, Math.min(1, (enterProgress - stripDelay) / 0.6))
        const eased = 1 - Math.pow(1 - stripProgress, 3)
        const fallOffset = (1 - eased) * (200 + s * 30)
        const wobble = Math.sin(stripProgress * Math.PI * 3 + s * 1.2) * (1 - stripProgress) * 8

        strips.push(
          <div
            key={`strip-${s}`}
            style={{
              position: 'absolute',
              top: `${s * stripHeight}%`,
              left: 0,
              right: 0,
              height: `${stripHeight + 0.5}%`,
              overflow: 'hidden',
              transform: `translateY(${fallOffset}px) translateX(${wobble}px)`,
              opacity: stripProgress,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: `-${s * stripHeight}%`,
                left: 0,
                right: 0,
                height: `${STRIP_COUNT * 100}%`,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                fontFamily: "'Courier New', 'Consolas', monospace",
                fontSize: 'clamp(40px, 12vw, 160px)',
                fontWeight: 700,
                color,
                whiteSpace: 'nowrap',
                letterSpacing: 3,
              }}
            >
              {word}
            </div>
          </div>,
        )
      }

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            height: 'clamp(60px, 15vw, 180px)',
          }}
        >
          {strips}
        </div>
      )
    }

    if (phase === 'hold') {
      // Paper feed jitter: slight vertical tremor as if paper being gripped
      const jitter = Math.sin(holdProgress * Math.PI * 8) * 1.5
      const pull = holdProgress > 0.7 ? (holdProgress - 0.7) / 0.3 * 3 : 0

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${jitter + pull}px))`,
            fontFamily: "'Courier New', 'Consolas', monospace",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            textShadow: '2px 2px 0 rgba(0,0,0,0.15)',
          }}
        >
          {word}
        </div>
      )
    }

    // Exit: shredder effect — text splits into horizontal strips that fall with different speeds
    const strips: React.ReactNode[] = []
    for (let s = 0; s < STRIP_COUNT; s++) {
      const stripDelay = (s % 2 === 0 ? s : STRIP_COUNT - s) / STRIP_COUNT * 0.2
      const stripProgress = Math.max(0, Math.min(1, (exitProgress - stripDelay) / 0.8))
      const eased = Math.pow(stripProgress, 1.8)

      // Each strip falls at slightly different speed with wobble
      const fallSpeed = 1 + rand(s * 37 + seed) * 0.8
      const fallDist = eased * height * 0.7 * fallSpeed
      const wobbleX = Math.sin(eased * Math.PI * 4 + s * 1.7) * (10 + eased * 15)
      const rotation = (rand(s * 19 + seed) - 0.5) * eased * 25

      strips.push(
        <div
          key={`strip-${s}`}
          style={{
            position: 'absolute',
            top: `${s * stripHeight}%`,
            left: 0,
            right: 0,
            height: `${stripHeight + 0.5}%`,
            overflow: 'hidden',
            transform: `translateY(${fallDist}px) translateX(${wobbleX}px) rotate(${rotation}deg)`,
            opacity: Math.max(0, 1 - eased * 1.2),
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: `-${s * stripHeight}%`,
              left: 0,
              right: 0,
              height: `${STRIP_COUNT * 100}%`,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              fontFamily: "'Courier New', 'Consolas', monospace",
              fontSize: 'clamp(40px, 12vw, 160px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
            }}
          >
            {word}
          </div>
        </div>,
      )
    }

    // Shredder mouth line
    const mouthOpacity = exitProgress < 0.6 ? 0.6 : 0.6 * (1 - (exitProgress - 0.6) / 0.4)

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          height: 'clamp(60px, 15vw, 180px)',
        }}
      >
        {strips}
        {/* Shredder line */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '-5%',
            width: '110%',
            height: 2,
            background: `linear-gradient(90deg, transparent 0%, rgba(150,150,150,${mouthOpacity}) 20%, rgba(200,200,200,${mouthOpacity}) 50%, rgba(150,150,150,${mouthOpacity}) 80%, transparent 100%)`,
          }}
        />
      </div>
    )
  },
}

function ShredderComponent(props: MotionGraphicProps<ShredderConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-shredder',
  title: 'Kinetic Shredder',
  description:
    'Text fed through a paper shredder: sliced into horizontal strips that fall with wobble and rotation. Strips assemble from below on entry, shred apart on exit.',
  tags: ['kinetic', 'typography', 'shredder', 'paper', 'strips', 'destruction', 'office'],
  category: 'captions',
  component: ShredderComponent as any,
  defaultConfig: {
    words: ['SHRED', 'DESTROY', 'CUT', 'SLICE'],
    colors: ['#E0E0E0', '#CCCCCC', '#B0B0B0', '#D4D4D4'],
    bgColor: '#1a1a1a',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SHRED', 'DESTROY', 'CUT', 'SLICE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E0E0E0', '#CCCCCC', '#B0B0B0', '#D4D4D4'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
