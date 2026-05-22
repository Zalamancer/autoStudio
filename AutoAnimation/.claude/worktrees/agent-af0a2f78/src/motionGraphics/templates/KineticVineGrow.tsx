import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface VineGrowConfig extends KineticBaseConfig {}

// SVG vine/tendril decorations that grow as the word enters
function VineTendrils({ progress, color, seed }: { progress: number; color: string; seed: number }) {
  const len = progress * 60
  const curl = Math.sin(seed) * 30

  const paths: string[] = []
  for (let i = 0; i < 4; i++) {
    const angle = (seed * 0.7 + i * 90) * (Math.PI / 180)
    const cx = Math.cos(angle) * len * 0.5
    const cy = Math.sin(angle) * len * 0.5
    const ex = Math.cos(angle) * len + Math.cos(angle + 1.5) * curl * (1 - i * 0.15)
    const ey = Math.sin(angle) * len + Math.sin(angle + 1.5) * curl * (1 - i * 0.15)
    const opacity = progress * (1 - i * 0.2)
    if (opacity > 0) {
      paths.push(`M0,0 Q${cx},${cy} ${ex},${ey}`)
    }
  }

  return (
    <svg
      style={{ position: 'absolute', top: '50%', left: '50%', overflow: 'visible', pointerEvents: 'none' }}
      width={1}
      height={1}
    >
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke={color}
          strokeWidth={1.5 - i * 0.3}
          fill="none"
          opacity={progress * (1 - i * 0.2)}
          strokeLinecap="round"
        />
      ))}
      {/* Small leaf circles at tendril tips */}
      {paths.map((_, i) => {
        const angle = (seed * 0.7 + i * 90) * (Math.PI / 180)
        const ex = Math.cos(angle) * len + Math.cos(angle + 1.5) * (Math.sin(seed) * 30) * (1 - i * 0.15)
        const ey = Math.sin(angle) * len + Math.sin(angle + 1.5) * (Math.sin(seed) * 30) * (1 - i * 0.15)
        return (
          <ellipse
            key={`leaf-${i}`}
            cx={ex}
            cy={ey}
            rx={4 * progress}
            ry={2.5 * progress}
            fill={color}
            opacity={progress * 0.7}
            transform={`rotate(${angle * (180 / Math.PI) + 45}, ${ex}, ${ey})`}
          />
        )
      })}
    </svg>
  )
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at center bottom, #1a3a1a 0%, ${bgColor} 100%)`,
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 53 + 17

    let opacity = 0
    let scale = 1
    let translateY = 0
    let vineProgress = 0

    if (phase === 'enter') {
      // Sprout upward from below, growing into frame
      opacity = Math.min(1, enterProgress * 2.5)
      scale = 0.2 + enterProgress * 0.8
      translateY = (1 - enterProgress) * 40
      vineProgress = enterProgress
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Gentle swaying like a plant in the breeze
      translateY = Math.sin(holdProgress * Math.PI * 3) * 4
      vineProgress = 1
    } else {
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.1
      vineProgress = 1 - exitProgress * 0.6
    }

    // Organic green glow that pulses like a living plant
    const lifeGlow = phase === 'hold'
      ? 8 + Math.sin(holdProgress * Math.PI * 4) * 4
      : 6

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
        }}
      >
        <VineTendrils progress={vineProgress} color={color} seed={seed} />
        <div
          style={{
            fontFamily: "'Georgia', 'Palatino Linotype', serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 700,
            letterSpacing: 4,
            color,
            textShadow: [
              `0 0 ${lifeGlow}px ${color}`,
              `0 0 ${lifeGlow * 3}px ${color}55`,
              `0 2px 8px rgba(0,80,0,0.5)`,
            ].join(', '),
            whiteSpace: 'nowrap',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function VineGrowComponent(props: MotionGraphicProps<VineGrowConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-vine-grow',
  title: 'Kinetic Vine Grow',
  description: 'Text sprouts upward like a growing plant with SVG vines and leaves curling out from the letters',
  tags: ['kinetic', 'typography', 'vine', 'plant', 'grow', 'nature', 'organic'],
  category: 'captions',
  component: VineGrowComponent as any,
  defaultConfig: {
    words: ['GROW', 'BLOOM', 'THRIVE', 'RISE'],
    colors: ['#4CAF50', '#8BC34A', '#CDDC39', '#66BB6A'],
    bgColor: '#0d1f0d',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GROW', 'BLOOM', 'THRIVE', 'RISE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#4CAF50', '#8BC34A', '#CDDC39', '#66BB6A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d1f0d', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.4, max: 6, group: 'Timing' },
  ],
})
