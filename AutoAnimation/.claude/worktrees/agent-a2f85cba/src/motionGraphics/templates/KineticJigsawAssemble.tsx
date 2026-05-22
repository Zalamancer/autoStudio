import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface JigsawAssembleConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 from integer seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Generate jigsaw piece start position */
function pieceOrigin(charIndex: number, seed: number) {
  const r1 = rand(charIndex * 89 + seed)
  const r2 = rand(charIndex * 67 + seed + 100)
  const r3 = rand(charIndex * 43 + seed + 200)
  const angle = r1 * Math.PI * 2
  const dist = 200 + r2 * 200
  return {
    startX: Math.cos(angle) * dist,
    startY: Math.sin(angle) * dist,
    startRotation: (r3 - 0.5) * 360,
    delay: r1 * 0.4,
  }
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 181 + 53
    const chars = word.split('')

    const charElements = chars.map((ch, ci) => {
      const origin = pieceOrigin(ci, seed)
      let tx = 0
      let ty = 0
      let rotation = 0
      let opacity = 1
      let scale = 1
      let borderStyle = 'none'
      let shadowStyle = 'none'

      if (phase === 'enter') {
        // Pieces fly in from scattered positions and click into place
        const charDelay = origin.delay
        const charProgress = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.6))

        if (charProgress < 1) {
          // Ease with overshoot for click effect
          const t = charProgress
          const overshoot = t < 0.8 ? t / 0.8 : 1 + Math.sin((t - 0.8) / 0.2 * Math.PI) * 0.05
          const eased = Math.min(1, overshoot)

          tx = origin.startX * (1 - eased)
          ty = origin.startY * (1 - eased)
          rotation = origin.startRotation * (1 - eased)
          scale = 0.6 + eased * 0.4
          opacity = Math.min(1, charProgress * 2.5)
          shadowStyle = `0 4px 15px rgba(0,0,0,${0.3 * (1 - eased)})`
        }

        // Click flash when piece lands
        if (charProgress > 0.78 && charProgress < 0.88) {
          borderStyle = `1px solid rgba(255,255,255,0.5)`
          shadowStyle = `0 0 12px ${color}80`
        }
      } else if (phase === 'hold') {
        // Settled with subtle breathing pulse
        const pulse = Math.sin(holdProgress * Math.PI * 4 + ci * 0.6) * 0.02
        scale = 1 + pulse
        opacity = 1

        // Subtle jigsaw edge glow
        if (ci > 0) {
          const glow = 0.05 + Math.sin(holdProgress * Math.PI * 2 + ci * 1.1) * 0.05
          shadowStyle = `inset 1px 0 0 rgba(255,255,255,${glow})`
        }
      } else {
        // Exit: pieces pop out and scatter
        const charDelay = rand(ci * 59 + seed) * 0.3
        const exitProg = Math.max(0, Math.min(1, (exitProgress - charDelay) / 0.7))

        if (exitProg > 0) {
          const eased = Math.pow(exitProg, 1.5)
          tx = -origin.startX * eased * 0.8
          ty = -origin.startY * eased * 0.8
          rotation = -origin.startRotation * eased * 0.6
          scale = 1 - eased * 0.4
          opacity = Math.max(0, 1 - eased * 1.3)
          shadowStyle = `0 4px 15px rgba(0,0,0,${0.3 * eased})`
        }
      }

      // Jigsaw edge visual: alternating puzzle tab/blank indicators
      const hasLeftTab = ci > 0
      const hasRightTab = ci < chars.length - 1
      const tabIndicator = hasLeftTab || hasRightTab
        ? `0 0 0 1px rgba(255,255,255,0.08)`
        : 'none'

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity,
            transform: `translate(${tx}px, ${ty}px) rotate(${rotation}deg) scale(${scale})`,
            padding: '4px 2px',
            background: phase === 'enter' || phase === 'exit'
              ? `rgba(255,255,255,0.03)`
              : 'transparent',
            borderRadius: 3,
            border: borderStyle,
            boxShadow: shadowStyle !== 'none' ? shadowStyle : tabIndicator,
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
          fontFamily: "'Trebuchet MS', 'Arial', sans-serif",
          fontSize: 'clamp(40px, 12vw, 150px)',
          fontWeight: 800,
          whiteSpace: 'nowrap',
          letterSpacing: 1,
          textShadow: `0 2px 8px rgba(0,0,0,0.3)`,
        }}
      >
        {charElements}
      </div>
    )
  },
}

function JigsawAssembleComponent(props: MotionGraphicProps<JigsawAssembleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-jigsaw-assemble',
  title: 'Kinetic Jigsaw Assemble',
  description:
    'Text assembles from scattered jigsaw puzzle pieces that fly in and click into place with a satisfying overshoot snap. Pieces scatter on exit.',
  tags: ['kinetic', 'typography', 'jigsaw', 'puzzle', 'assemble', 'pieces', 'click'],
  category: 'captions',
  component: JigsawAssembleComponent as any,
  defaultConfig: {
    words: ['PUZZLE', 'PIECE', 'CLICK', 'FIT'],
    colors: ['#4FC3F7', '#81C784', '#FFB74D', '#E57373'],
    bgColor: '#121825',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PUZZLE', 'PIECE', 'CLICK', 'FIT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#4FC3F7', '#81C784', '#FFB74D', '#E57373'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#121825', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
