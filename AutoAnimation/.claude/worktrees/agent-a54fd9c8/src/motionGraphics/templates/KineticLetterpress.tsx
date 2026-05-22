import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LetterpressConfig extends KineticBaseConfig {}

/** Pseudo-random 0..1 from seed */
function hash(n: number): number {
  return ((Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    // Aged cotton paper with subtle fiber texture
    const fibers: React.ReactNode[] = []
    for (let i = 0; i < 30; i++) {
      const x = hash(i * 37 + 11) * width
      const y = hash(i * 53 + 7) * height
      const len = 20 + hash(i * 19) * 40
      const angle = hash(i * 71) * 180
      const opacity = 0.03 + hash(i * 23) * 0.04
      fibers.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: len,
            height: 1,
            background: '#8B7355',
            opacity,
            transform: `rotate(${angle}deg)`,
          }}
        />
      )
    }
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Slight vignette for aged paper */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(139,115,85,0.08) 100%)',
          }}
        />
        {fibers}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    const chars = word.split('')

    // Per-character letterpress animation
    const renderedChars = chars.map((ch, ci) => {
      const charSeed = ci * 83 + index * 47
      const charDelay = ci / (chars.length + 1)
      // Slight random pressure variation per character
      const pressureVariation = 0.85 + hash(charSeed + 3) * 0.3
      const inkSpreadMax = 0.4 + hash(charSeed + 11) * 0.6 // how far ink bleeds

      let indent = 0 // depth of the letterpress indent (px)
      let inkSpread = 0 // blur of ink bleed
      let opacity = 0
      let yOffset = 0
      let inkOpacity = 0

      if (phase === 'enter') {
        // Press action: letter comes down from above, stamps into paper
        const charProgress = Math.max(0, Math.min(1, (enterProgress - charDelay * 0.3) / 0.7))
        // Ease: fast slam then settle
        const eased = charProgress < 0.6
          ? Math.pow(charProgress / 0.6, 0.3) // fast approach
          : 1 - Math.pow(1 - charProgress, 3) * 0.05 // slight overshoot settle

        yOffset = (1 - eased) * -30 * pressureVariation
        indent = eased * 3 * pressureVariation
        inkSpread = eased * inkSpreadMax * 0.6
        opacity = Math.min(charProgress / 0.2, 1)
        inkOpacity = eased * 0.7
      } else if (phase === 'hold') {
        // Fully pressed — ink slowly bleeds outward
        opacity = 1
        indent = 3 * pressureVariation
        inkSpread = inkSpreadMax * (0.6 + holdProgress * 0.4)
        inkOpacity = 0.7 + holdProgress * 0.15
        yOffset = 0
      } else {
        // Exit: the type block lifts, leaving the impression
        const charProgress = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.2) / 0.8))
        opacity = 1 - charProgress * 0.8 // impression fades but doesn't fully vanish
        indent = 3 * pressureVariation * (1 - charProgress * 0.3)
        inkSpread = inkSpreadMax * (1 - charProgress * 0.5)
        inkOpacity = (0.85 - charProgress * 0.6)
        yOffset = charProgress * -8
      }

      // Letterpress emboss effect: light from top-left, shadow bottom-right
      const shadowDepth = indent
      const embossShadow = [
        `${-shadowDepth * 0.5}px ${-shadowDepth * 0.5}px ${shadowDepth * 0.3}px rgba(255,255,255,0.5)`,
        `${shadowDepth * 0.7}px ${shadowDepth * 0.7}px ${shadowDepth * 0.5}px rgba(0,0,0,0.25)`,
        `0 0 ${inkSpread * 2}px rgba(0,0,0,${inkOpacity * 0.15})`,
      ].join(', ')

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            transform: `translateY(${yOffset}px)`,
            opacity,
            color,
            textShadow: embossShadow,
            filter: `blur(${inkSpread * 0.15}px)`,
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
          fontSize: 'clamp(48px, 14vw, 180px)',
          fontWeight: 700,
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

function LetterpressComponent(props: MotionGraphicProps<LetterpressConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-letterpress',
  title: 'Kinetic Letterpress',
  description: 'Text pressed into paper with deep emboss indent and ink spread on contact — classic letterpress printing aesthetic',
  tags: ['kinetic', 'typography', 'letterpress', 'print', 'emboss', 'vintage', 'press', 'ink'],
  category: 'captions',
  component: LetterpressComponent as any,
  defaultConfig: {
    words: ['PRESS', 'TYPE', 'INK', 'BOLD'],
    colors: ['#1a1a1a', '#2c1810', '#1a1a1a', '#3d2b1f'],
    bgColor: '#f5f0e8',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PRESS', 'TYPE', 'INK', 'BOLD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#2c1810', '#1a1a1a', '#3d2b1f'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f5f0e8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
