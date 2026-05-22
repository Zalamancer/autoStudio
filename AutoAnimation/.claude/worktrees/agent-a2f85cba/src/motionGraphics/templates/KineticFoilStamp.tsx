import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FoilStampConfig extends KineticBaseConfig {}

function hash(n: number): number {
  return ((Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    // Rich dark card stock with subtle leather grain
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Grain texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: [
              'radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.02) 0%, transparent 60%)',
              'radial-gradient(ellipse at 80% 30%, rgba(255,255,255,0.015) 0%, transparent 50%)',
            ].join(', '),
          }}
        />
        {/* Subtle border frame like invitation card */}
        <div
          style={{
            position: 'absolute',
            inset: 20,
            border: '1px solid rgba(212,175,55,0.08)',
            borderRadius: 2,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 103 + 41
    const chars = word.split('')

    // Foil shimmer angle: shifts over time to create metallic glint
    const shimmerAngle = (f * 2 + index * 45) % 360
    const shimmerOffset = Math.sin(f * 0.08 + index) * 20

    // Gold foil gradient (animated position for shimmer)
    const goldGradient = `linear-gradient(${shimmerAngle}deg, #B8860B ${shimmerOffset - 30}%, #FFD700 ${shimmerOffset}%, #FFF8DC ${shimmerOffset + 8}%, #FFD700 ${shimmerOffset + 20}%, #B8860B ${shimmerOffset + 50}%)`
    const silverGradient = `linear-gradient(${shimmerAngle}deg, #808080 ${shimmerOffset - 30}%, #C0C0C0 ${shimmerOffset}%, #FFFFFF ${shimmerOffset + 8}%, #C0C0C0 ${shimmerOffset + 20}%, #808080 ${shimmerOffset + 50}%)`

    const foilGradient = color.toLowerCase().includes('silver') || color === '#C0C0C0'
      ? silverGradient
      : goldGradient

    let pressDepth = 0 // how hard the die is pressing
    let foilOpacity = 0
    let shimmerIntensity = 0
    let scaleY = 1
    let translateY = 0

    if (phase === 'enter') {
      const t = enterProgress
      // Hot foil stamp press: die comes down, heat transfers foil
      if (t < 0.4) {
        // Die approaching
        const approach = t / 0.4
        pressDepth = approach * 0.3
        foilOpacity = 0
        scaleY = 1 + (1 - approach) * 0.02
        translateY = (1 - approach) * -15
      } else if (t < 0.6) {
        // Contact! Foil transfers with burst of heat
        const contact = (t - 0.4) / 0.2
        pressDepth = 0.3 + contact * 0.7
        foilOpacity = contact
        shimmerIntensity = contact * 2 // bright flash on contact
        scaleY = 1
        translateY = 0
      } else {
        // Die lifts, foil settles
        const lift = (t - 0.6) / 0.4
        pressDepth = 1 - lift * 0.3
        foilOpacity = 1
        shimmerIntensity = Math.max(0, 2 - lift * 1.5)
        scaleY = 1
        translateY = 0
      }
    } else if (phase === 'hold') {
      // Full foil with gentle shimmer
      pressDepth = 0.7
      foilOpacity = 1
      shimmerIntensity = 0.5 + Math.sin(holdProgress * Math.PI * 2) * 0.3
      scaleY = 1
      translateY = 0
    } else {
      // Exit: foil peels/cracks
      const t = exitProgress
      pressDepth = 0.7 * (1 - t * 0.5)
      foilOpacity = 1 - t
      shimmerIntensity = (1 - t) * 0.4
      scaleY = 1 - t * 0.02
      translateY = t * 5
    }

    // Emboss shadow for the stamped impression
    const embossShadow = [
      `0 ${pressDepth * 2}px ${pressDepth * 1.5}px rgba(0,0,0,${pressDepth * 0.4})`,
      `0 ${-pressDepth * 0.5}px ${pressDepth}px rgba(255,255,255,${pressDepth * 0.1})`,
      `0 0 ${shimmerIntensity * 15}px rgba(255,215,0,${shimmerIntensity * 0.3})`,
    ].join(', ')

    const renderedChars = chars.map((ch, ci) => {
      const charDelay = ci / chars.length * 0.3
      const charShimmer = Math.sin(f * 0.15 + ci * 0.8) * 0.1

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            background: foilGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            opacity: Math.min(1, foilOpacity + charShimmer),
            filter: `brightness(${1 + shimmerIntensity * 0.3 + charShimmer})`,
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
          transform: `translate(-50%, calc(-50% + ${translateY}px)) scaleY(${scaleY})`,
        }}
      >
        <div
          style={{
            fontFamily: "'Didot', 'Bodoni MT', 'Georgia', serif",
            fontSize: 'clamp(46px, 13vw, 170px)',
            fontWeight: 700,
            letterSpacing: 8,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            textShadow: embossShadow,
          }}
        >
          {renderedChars}
        </div>
        {/* Faint embossed shadow underneath for depth */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            fontFamily: "'Didot', 'Bodoni MT', 'Georgia', serif",
            fontSize: 'clamp(46px, 13vw, 170px)',
            fontWeight: 700,
            letterSpacing: 8,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            color: 'rgba(0,0,0,0.08)',
            transform: `translate(${pressDepth * 1.5}px, ${pressDepth * 2}px)`,
            pointerEvents: 'none',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function FoilStampComponent(props: MotionGraphicProps<FoilStampConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-foil-stamp',
  title: 'Kinetic Foil Stamp',
  description: 'Hot foil stamp press with metallic gold/silver shimmer reveal — die presses down, heat transfers foil to paper',
  tags: ['kinetic', 'typography', 'foil', 'stamp', 'metallic', 'gold', 'luxury', 'emboss'],
  category: 'captions',
  component: FoilStampComponent as any,
  defaultConfig: {
    words: ['GOLD', 'FOIL', 'LUXE', 'STAMP'],
    colors: ['#FFD700', '#FFD700', '#C0C0C0', '#FFD700'],
    bgColor: '#1a1520',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GOLD', 'FOIL', 'LUXE', 'STAMP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD700', '#FFD700', '#C0C0C0', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1520', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
