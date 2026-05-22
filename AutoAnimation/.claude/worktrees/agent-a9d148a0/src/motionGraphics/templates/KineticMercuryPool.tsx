import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MercuryPoolConfig extends KineticBaseConfig {
  surfaceTension: number
}

function easeOutExpo(t: number): number { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t) }
function easeOutBack(t: number): number {
  const c = 1.70158
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}
function easeInCubic(t: number): number { return t * t * t }
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Mercury shimmer reflections across background */}
        {[0.2, 0.5, 0.8].map((x, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: '50%',
            left: `${x * 100}%`,
            width: 2,
            height: `${15 + Math.sin(time * 2 + i) * 5}%`,
            background: `linear-gradient(180deg, transparent, rgba(220,225,235,${0.06 + Math.sin(time * 3 + i) * 0.03}), transparent)`,
            transform: 'translateY(-50%)',
          }} />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width }: WordRenderProps) => {
    const chars = word.split('')

    return (
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
      }}>
        {chars.map((ch, ci) => {
          const seed = index * 100 + ci
          const charFraction = chars.length > 1 ? ci / (chars.length - 1) : 0.5
          // Mercury droplets arrive from random positions and coalesce
          const startX = (seededRandom(seed) - 0.5) * width * 0.9
          const startY = (seededRandom(seed + 10) - 0.5) * 80

          let translateX = 0
          let translateY = 0
          let scaleX = 1
          let scaleY = 1
          let opacity = 1
          let blur = 0

          if (phase === 'enter') {
            // Scattered mercury blobs coalesce into text
            // Stagger: blobs from outside-in converge
            const stagger = charFraction * 0.2
            const p = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger)))
            const coalesce = easeOutExpo(p)

            translateX = startX * (1 - coalesce)
            translateY = startY * (1 - coalesce)

            // Mercury droplets are round blobs that flatten into letter form
            scaleX = 0.3 + coalesce * 0.7 + (1 - coalesce) * 0.5  // round → normal width
            scaleY = 1.2 - coalesce * 0.2  // slightly tall blob → normal

            // Surface tension snap: slight overshoot when coalescing
            if (p > 0.8) {
              const snapT = (p - 0.8) / 0.2
              const snap = Math.sin(snapT * Math.PI) * 0.08
              scaleX += snap
              scaleY -= snap * 0.5
            }

            blur = (1 - coalesce) * 3
            opacity = Math.min(1, p * 4)
          } else if (phase === 'hold') {
            // Mercury surface shimmer — slight metallic pulse
            const shimmer = Math.sin(holdProgress * Math.PI * 6 + ci * 0.8) * 0.025
            scaleX = 1 + shimmer
            scaleY = 1 - shimmer * 0.4
          } else {
            // Shatter into droplets — scatter back out
            const ep = easeInCubic(exitProgress)
            translateX = startX * ep * 0.5
            translateY = startY * ep * 0.5
            blur = ep * 4
            opacity = 1 - ep
          }

          return (
            <span key={ci} style={{
              display: 'inline-block',
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(44px, 11vw, 150px)',
              fontWeight: 900,
              color,
              transform: `translate(${translateX}px, ${translateY}px) scaleX(${scaleX}) scaleY(${scaleY})`,
              transformOrigin: 'center center',
              opacity,
              filter: [
                blur > 0.5 ? `blur(${blur}px)` : '',
                `drop-shadow(0 2px 4px rgba(200,210,220,0.4))`,
              ].filter(Boolean).join(' '),
              whiteSpace: 'pre',
              textShadow: `0 0 20px rgba(200,220,240,0.5), inset 0 1px 0 rgba(255,255,255,0.8)`,
              lineHeight: 1,
            }}>
              {ch}
            </span>
          )
        })}
      </div>
    )
  },
}

function MercuryPoolComponent(props: MotionGraphicProps<MercuryPoolConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-mercury-pool',
  title: 'Kinetic Mercury Pool',
  description: 'Scattered mercury droplets converge from random positions, coalescing into text with liquid surface tension — shimmering metallic letters reform from a pooled liquid state',
  tags: ['kinetic', 'typography', 'mercury', 'liquid', 'pool', 'coalesce', 'metal', 'fluid', 'surface-tension'],
  category: 'captions',
  component: MercuryPoolComponent as any,
  defaultConfig: {
    words: ['LIQUID', 'METAL', 'POOL', 'MERGE'],
    colors: ['#D0D8E4', '#B8C4D2', '#E8EAED', '#A8B8C8'],
    bgColor: '#0F1923',
    cycleDuration: 1.6,
    surfaceTension: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LIQUID', 'METAL', 'POOL', 'MERGE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D0D8E4', '#B8C4D2', '#E8EAED', '#A8B8C8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F1923', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'surfaceTension', label: 'Surface Tension', type: 'number', defaultValue: 1, min: 0.2, max: 3, group: 'Animation' },
  ],
})
