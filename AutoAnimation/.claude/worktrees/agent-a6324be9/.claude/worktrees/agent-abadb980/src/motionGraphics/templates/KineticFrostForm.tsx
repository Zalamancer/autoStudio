import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FrostFormConfig extends KineticBaseConfig {}

// SVG frost crystal branches that radiate out from letters
function FrostCrystals({ progress, color, seed }: { progress: number; color: string; seed: number }) {
  if (progress <= 0.02) return null

  const branches = 8
  const crystalOpacity = progress < 0.3
    ? progress / 0.3
    : progress > 0.8
      ? (1 - progress) / 0.2
      : 1

  const arms = Array.from({ length: branches }, (_, i) => {
    const angle = (i / branches) * Math.PI * 2 + seed * 0.5
    const length = progress * (50 + ((seed + i * 13) % 30))
    const x2 = Math.cos(angle) * length
    const y2 = Math.sin(angle) * length * 0.5
    // Sub-branches
    const branchLen = length * 0.4
    const b1angle = angle + Math.PI / 4
    const b2angle = angle - Math.PI / 4
    const midX = Math.cos(angle) * length * 0.5
    const midY = Math.sin(angle) * length * 0.5 * 0.5
    return { x2, y2, midX, midY, b1angle, b2angle, branchLen }
  })

  return (
    <svg
      style={{ position: 'absolute', top: '50%', left: '50%', overflow: 'visible', pointerEvents: 'none' }}
      width={1}
      height={1}
      opacity={crystalOpacity}
    >
      {arms.map((a, i) => (
        <g key={i}>
          <line x1={0} y1={0} x2={a.x2} y2={a.y2} stroke={color} strokeWidth={1} strokeOpacity={0.7} />
          <line
            x1={a.midX} y1={a.midY}
            x2={a.midX + Math.cos(a.b1angle) * a.branchLen}
            y2={a.midY + Math.sin(a.b1angle) * a.branchLen * 0.5}
            stroke={color} strokeWidth={0.6} strokeOpacity={0.5}
          />
          <line
            x1={a.midX} y1={a.midY}
            x2={a.midX + Math.cos(a.b2angle) * a.branchLen}
            y2={a.midY + Math.sin(a.b2angle) * a.branchLen * 0.5}
            stroke={color} strokeWidth={0.6} strokeOpacity={0.5}
          />
        </g>
      ))}
    </svg>
  )
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(145deg, #0a1520 0%, ${bgColor} 100%)`,
      }}
    >
      {/* Frost rime overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 20% 20%, rgba(150,210,255,0.04) 0%, transparent 40%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 61 + 19

    let opacity = 0
    let scale = 1
    let blur = 0
    let frostProgress = 0

    if (phase === 'enter') {
      // Frost forms over a surface: crystalline structures spread outward
      opacity = Math.min(1, enterProgress * 2)
      scale = 0.9 + enterProgress * 0.1
      blur = (1 - enterProgress) * 5
      frostProgress = enterProgress
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      frostProgress = 1
      // Crystals pulse in moonlight
      scale = 1 + Math.sin(holdProgress * Math.PI * 4 + seed) * 0.008
    } else {
      // Frost melts: crystals recede, text fades
      opacity = 1 - exitProgress
      frostProgress = 1 - exitProgress * 0.7
      blur = exitProgress * 6
    }

    const iceGlow = phase === 'hold'
      ? 18 + Math.sin(holdProgress * Math.PI * 5) * 7
      : 12

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
        }}
      >
        <FrostCrystals progress={frostProgress} color={color} seed={seed} />
        <div
          style={{
            fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 200,
            textTransform: 'uppercase',
            letterSpacing: 10,
            color,
            textShadow: [
              `0 0 ${iceGlow}px ${color}`,
              `0 0 ${iceGlow * 2}px ${color}66`,
              `0 0 ${iceGlow * 3}px rgba(150,220,255,0.3)`,
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

function FrostFormComponent(props: MotionGraphicProps<FrostFormConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-frost-form',
  title: 'Kinetic Frost Form',
  description: 'Ice crystals grow outward from the text in a snowflake branching pattern, then melt away',
  tags: ['kinetic', 'typography', 'frost', 'ice', 'crystal', 'winter', 'nature', 'snowflake'],
  category: 'captions',
  component: FrostFormComponent as any,
  defaultConfig: {
    words: ['FROST', 'ICE', 'FROZEN', 'COLD'],
    colors: ['#A8D8EA', '#B5EAD7', '#C7E8F3', '#7EC8E3'],
    bgColor: '#051525',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FROST', 'ICE', 'FROZEN', 'COLD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#A8D8EA', '#B5EAD7', '#C7E8F3', '#7EC8E3'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#051525', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.4, max: 6, group: 'Timing' },
  ],
})
