import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CrystalFacetConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// Crystal facet angles — each reflects text at a different angle
const FACETS = [
  { angle: 0, offsetX: 0, offsetY: 0, opacity: 1, color: '#FFFFFF' },
  { angle: -18, offsetX: -28, offsetY: -18, opacity: 0.55, color: '#FF88CC' },
  { angle: 18, offsetX: 28, offsetY: -22, opacity: 0.45, color: '#88CCFF' },
  { angle: -8, offsetX: -14, offsetY: 20, opacity: 0.35, color: '#CCFF88' },
  { angle: 12, offsetX: 18, offsetY: 24, opacity: 0.3, color: '#FFCC88' },
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Rotating spectral rays from center
    const rays: React.ReactNode[] = []
    const rayColors = ['#FF88CC30', '#88CCFF28', '#CCFF8824', '#FFCC8820', '#CC88FF26']
    for (let i = 0; i < 5; i++) {
      const rot = (i / 5) * 360 + time * 12
      rays.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100%',
            height: 3,
            background: `linear-gradient(90deg, ${rayColors[i]}, transparent)`,
            transformOrigin: 'left center',
            transform: `rotate(${rot}deg)`,
          }}
        />,
      )
    }
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {rays}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.6)',
            boxShadow: '0 0 20px 10px rgba(255,255,255,0.08)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const time = (frame ?? 0) / 30
    const eased = easeOutExpo(Math.min(enterProgress, 1))
    const backEased = easeOutBack(Math.min(enterProgress, 1))

    // Facets converge from scattered positions into unified crystal
    const convergence = phase === 'enter' ? eased : phase === 'exit' ? 1 - easeOutExpo(exitProgress) : 1
    const scatterScale = phase === 'enter' ? 0.5 + backEased * 0.5 : phase === 'exit' ? 1 - exitProgress * 0.3 : 1

    // Hold: slow rotation of the facet pattern
    const holdRotation = phase === 'hold' ? Math.sin(time * 0.8) * 4 : 0

    return (
      <div style={{ position: 'absolute', inset: 0, transform: `rotate(${holdRotation}deg)` }}>
        {FACETS.map((facet, i) => {
          const offsetX = facet.offsetX * (1 - convergence) * 2.5
          const offsetY = facet.offsetY * (1 - convergence) * 2.5
          const facetOpacity = i === 0 ? convergence * 0.95 + 0.05 : facet.opacity * convergence
          const blur = i === 0 ? 0 : (1 - convergence) * 3 + i * 0.4

          // Subtle prismatic breathing on hold
          const holdBreathe = phase === 'hold' ? Math.sin(time * 2.1 + i * 0.8) * 2 : 0

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${offsetX + (i > 0 ? holdBreathe : 0)}px), calc(-50% + ${offsetY}px)) rotate(${facet.angle * (1 - convergence)}deg) scale(${scatterScale})`,
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(44px, 13vw, 170px)',
                fontWeight: 800,
                color: i === 0 ? color : facet.color,
                whiteSpace: 'nowrap',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                opacity: facetOpacity,
                mixBlendMode: i === 0 ? 'normal' : 'screen',
                filter: blur > 0 ? `blur(${blur}px)` : undefined,
              }}
            >
              {word}
            </div>
          )
        })}
      </div>
    )
  },
}

function CrystalFacetComponent(props: MotionGraphicProps<CrystalFacetConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-crystal-facet',
  title: 'Kinetic Crystal Facet',
  description:
    'Text fragments scatter across crystal facet angles then converge — each face reflects the word in a different spectral color with screen blending',
  tags: ['kinetic', 'typography', 'crystal', 'facet', 'refraction', 'prism', 'optical', 'spectral'],
  category: 'captions',
  component: CrystalFacetComponent as any,
  defaultConfig: {
    words: ['GEM', 'CRYSTAL', 'SHINE', 'SPARK'],
    colors: ['#FFFFFF', '#FFE0F0', '#E0F0FF', '#F0FFE0'],
    bgColor: '#0A0510',
    cycleDuration: 1.6,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['GEM', 'CRYSTAL', 'SHINE', 'SPARK'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFE0F0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0510', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
