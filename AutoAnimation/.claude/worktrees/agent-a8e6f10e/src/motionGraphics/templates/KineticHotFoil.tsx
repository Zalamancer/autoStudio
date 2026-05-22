import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HotFoilConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function hash(n: number): number {
  return ((Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Subtle heat shimmer offset
    const shimmerY = Math.sin(time * 2.5) * 1.5

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Dark leather-like textured surface */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(
              45deg,
              transparent 0px,
              transparent 2px,
              rgba(0,0,0,0.03) 2px,
              rgba(0,0,0,0.03) 4px
            )`,
          }}
        />
        {/* Subtle vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.35) 100%)',
          }}
        />
        {/* Heat distortion band at stamp zone */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `calc(45% + ${shimmerY}px)`,
            height: '12%',
            background: 'linear-gradient(to bottom, transparent, rgba(255,200,100,0.02), transparent)',
            pointerEvents: 'none',
          }}
        />
        {/* Pressure plate edge marks */}
        <div
          style={{
            position: 'absolute',
            left: '10%',
            right: '10%',
            top: '35%',
            bottom: '35%',
            border: '1px solid rgba(180,160,120,0.06)',
            borderRadius: 2,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const chars = word.split('')
    const f = frame ?? 0
    const time = f / 30

    const renderedChars = chars.map((ch, ci) => {
      const charSeed = ci * 59 + index * 31
      const charDelay = ci / (chars.length + 1) * 0.4

      // Foil crack randomness per character
      const crackIntensity = 0.5 + hash(charSeed + 7) * 0.5
      const foilShift = hash(charSeed + 19) * 20 - 10 // reflective angle shift

      let opacity = 0
      let pressDepth = 0 // how deep the stamp has pressed
      let heatGlow = 0
      let foilCrack = 0
      let shimmerAngle = 0

      if (phase === 'enter') {
        const cp = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.6)))
        // Hot press action: stamp comes down with heat
        const eased = cp < 0.5
          ? Math.pow(cp / 0.5, 0.4) // fast slam
          : 1 - (1 - cp) * 0.1 // settle
        opacity = Math.min(cp / 0.15, 1)
        pressDepth = eased * 2
        heatGlow = cp > 0.3 ? (1 - (cp - 0.3) / 0.7) * 0.8 : cp / 0.3 * 0.8
        foilCrack = eased * crackIntensity * 0.3
        shimmerAngle = time * 60 + foilShift
      } else if (phase === 'hold') {
        opacity = 1
        pressDepth = 2
        heatGlow = Math.max(0, 0.15 - holdProgress * 0.15)
        foilCrack = crackIntensity * (0.3 + holdProgress * 0.4)
        // Shimmer as viewing angle changes
        shimmerAngle = time * 40 + foilShift + holdProgress * 30
      } else {
        const cp = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.2) / 0.8))
        opacity = 1 - cp * 0.7
        pressDepth = 2 * (1 - cp * 0.3)
        foilCrack = crackIntensity * 0.7
        shimmerAngle = time * 40 + foilShift
      }

      // Metallic gold/silver gradient shimmer
      const shimmerX = 50 + Math.sin(shimmerAngle * Math.PI / 180) * 30
      const shimmerBright = 0.7 + Math.sin(shimmerAngle * Math.PI / 180) * 0.3

      // Foil crack texture via text-shadow
      const crackShadows = [
        `${pressDepth * 0.5}px ${pressDepth * 0.5}px ${pressDepth * 0.3}px rgba(0,0,0,0.3)`,
        `0 0 ${foilCrack * 3}px rgba(255,215,0,${0.2 * shimmerBright})`,
        `${Math.sin(charSeed) * foilCrack}px ${Math.cos(charSeed) * foilCrack}px 0 rgba(180,140,50,${foilCrack * 0.4})`,
      ].join(', ')

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            opacity,
            background: `linear-gradient(${shimmerAngle}deg, #C5993A ${shimmerX - 30}%, #F5E6A3 ${shimmerX}%, #D4A843 ${shimmerX + 30}%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: heatGlow > 0 ? `brightness(${1 + heatGlow * 0.5}) drop-shadow(0 0 ${heatGlow * 8}px rgba(255,180,50,${heatGlow}))` : undefined,
            textShadow: crackShadows,
            transform: `translateY(${phase === 'enter' ? (1 - Math.min(enterProgress / 0.3, 1)) * -15 : 0}px)`,
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
          fontSize: 'clamp(48px, 13vw, 170px)',
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

function HotFoilComponent(props: MotionGraphicProps<HotFoilConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-hot-foil',
  title: 'Kinetic Hot Foil',
  description:
    'Hot foil stamping with metallic gold/silver text pressed with heat, foil cracks, reflective shimmer, and pressure marks on dark surface',
  tags: ['kinetic', 'typography', 'foil', 'gold', 'metallic', 'stamp', 'luxury', 'print', 'emboss'],
  category: 'captions',
  component: HotFoilComponent as any,
  defaultConfig: {
    words: ['FOIL', 'GILT', 'STAMP', 'PRESS'],
    colors: ['#C5993A', '#D4A843', '#B8892E', '#E6C65A'],
    bgColor: '#1a1612',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FOIL', 'GILT', 'STAMP', 'PRESS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C5993A', '#D4A843', '#B8892E', '#E6C65A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1612', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
