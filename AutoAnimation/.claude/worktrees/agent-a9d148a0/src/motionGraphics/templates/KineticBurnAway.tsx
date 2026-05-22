import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BurnAwayConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 from integer seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Flickering firelight ambience
    const flicker1 = Math.sin(frame * 0.15) * 0.03
    const flicker2 = Math.sin(frame * 0.23 + 1.7) * 0.02
    const glowOpacity = 0.05 + flicker1 + flicker2
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 60%, rgba(255, 80, 0, ${glowOpacity}), transparent 70%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 131 + 47
    const chars = word.split('')

    // Ember particles
    const embers: { x: number; y: number; size: number; opacity: number; color: string }[] = []
    const emberCount = phase === 'exit' ? 20 : phase === 'enter' ? 15 : 6
    for (let i = 0; i < emberCount; i++) {
      const progress = phase === 'enter' ? enterProgress : phase === 'exit' ? exitProgress : holdProgress
      const life = (progress * 3 + i * 0.17 + rand(i * 31 + seed) * 0.5) % 1
      const charSpread = chars.length * 20
      embers.push({
        x: (rand(i * 53 + seed) - 0.5) * charSpread * 2,
        y: -life * 120 - rand(i * 19 + seed) * 40,
        size: 1.5 + rand(i * 7 + seed) * 3 * (1 - life),
        opacity: (1 - life) * 0.8,
        color: rand(i * 11 + seed) > 0.5 ? '#FF6600' : '#FFAA00',
      })
    }

    const charElements = chars.map((ch, ci) => {
      // Each char has a burn progress offset from edges inward
      const edgeDist = Math.min(ci, chars.length - 1 - ci) / Math.max(chars.length - 1, 1)
      let charOpacity = 1
      let charColor = color
      let charFilter = 'none'
      let ty = 0

      if (phase === 'enter') {
        // Chars materialize from embers: edges first, center last
        const charDelay = edgeDist * 0.4
        const charProgress = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.6))
        const eased = 1 - Math.pow(1 - charProgress, 2)
        charOpacity = eased
        // Glow from orange to final color
        if (charProgress < 0.6) {
          const t = charProgress / 0.6
          charColor = t < 0.3 ? '#FF4400' : t < 0.6 ? '#FF8800' : '#FFCC00'
        }
        if (charProgress < 0.8) {
          charFilter = `brightness(${1.2 + (1 - charProgress) * 0.8})`
        }
      } else if (phase === 'hold') {
        // Subtle heat shimmer on characters
        const shimmer = Math.sin(holdProgress * Math.PI * 6 + ci * 1.3) * 0.5
        ty = shimmer
        charOpacity = 0.9 + Math.sin(holdProgress * Math.PI * 4 + ci * 0.7) * 0.1
      } else {
        // Burn away from edges inward
        const charDelay = (1 - edgeDist) * 0.4
        const burnProgress = Math.max(0, Math.min(1, (exitProgress - charDelay) / 0.6))

        if (burnProgress > 0.8) {
          charOpacity = Math.max(0, 1 - (burnProgress - 0.8) / 0.2)
          charColor = '#331100'
        } else if (burnProgress > 0.4) {
          const t = (burnProgress - 0.4) / 0.4
          charColor = `rgb(${Math.round(255 - t * 200)}, ${Math.round(100 - t * 80)}, 0)`
          charFilter = `brightness(${1.5 - t * 0.8})`
          ty = rand(ci * 37 + f) * 2 * burnProgress
        } else if (burnProgress > 0) {
          charColor = '#FF6600'
          charFilter = `brightness(${1.3 + burnProgress})`
        }
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color: charColor,
            opacity: charOpacity,
            transform: `translateY(${ty}px)`,
            filter: charFilter,
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
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          letterSpacing: 3,
        }}
      >
        {charElements}
        {/* Ember particles rising */}
        {embers.map((e, i) => (
          <div
            key={`e-${i}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: e.size,
              height: e.size,
              borderRadius: '50%',
              background: e.color,
              opacity: e.opacity,
              transform: `translate(${e.x}px, ${e.y}px)`,
              boxShadow: `0 0 4px ${e.color}`,
            }}
          />
        ))}
      </div>
    )
  },
}

function BurnAwayComponent(props: MotionGraphicProps<BurnAwayConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-burn-away',
  title: 'Kinetic Burn Away',
  description:
    'Text burns from the edges inward with glowing embers, charred edges, and rising ember particles. Characters transition through fire colors before crumbling to ash.',
  tags: ['kinetic', 'typography', 'fire', 'burn', 'embers', 'destruction', 'dramatic'],
  category: 'captions',
  component: BurnAwayComponent as any,
  defaultConfig: {
    words: ['BURN', 'ASHES', 'EMBER', 'FLAME'],
    colors: ['#FF4400', '#FF8800', '#FFCC00', '#FF6600'],
    bgColor: '#0a0400',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BURN', 'ASHES', 'EMBER', 'FLAME'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF4400', '#FF8800', '#FFCC00', '#FF6600'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0400', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
