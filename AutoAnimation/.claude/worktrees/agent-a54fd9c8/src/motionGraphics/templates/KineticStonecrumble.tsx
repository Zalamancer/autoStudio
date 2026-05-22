import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StonecrumbleConfig extends KineticBaseConfig {}

// Stone debris fragments that fall from the crumbling text
function StoneDebris({ progress, color, seed }: { progress: number; color: string; seed: number }) {
  if (progress <= 0) return null

  const fragments = Array.from({ length: 10 }, (_, i) => {
    const angle = ((seed * i * 137) % 360) * (Math.PI / 180)
    const speed = 0.8 + ((seed * (i + 1) * 31) % 10) / 10
    const dist = progress * speed * 80
    const cx = Math.cos(angle) * dist * 1.5
    const cy = Math.sin(angle) * dist * 0.7 + progress * 60 * speed  // gravity
    const size = (2 + ((seed + i * 5) % 6)) * (1 - progress * 0.7)
    const rot = progress * ((seed * i) % 360)
    const frag_opacity = progress < 0.3
      ? progress / 0.3
      : (1 - (progress - 0.3) / 0.7) * 0.8
    return { cx, cy, size, rot, opacity: frag_opacity }
  })

  return (
    <svg
      style={{ position: 'absolute', top: '50%', left: '50%', overflow: 'visible', pointerEvents: 'none' }}
      width={1}
      height={1}
    >
      {fragments.map((f, i) => (
        <rect
          key={i}
          x={f.cx - f.size}
          y={f.cy - f.size / 2}
          width={Math.max(0.5, f.size * 2)}
          height={Math.max(0.5, f.size)}
          fill={color}
          opacity={f.opacity}
          transform={`rotate(${f.rot}, ${f.cx}, ${f.cy})`}
        />
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
        background: `linear-gradient(180deg, ${bgColor} 0%, #3a3020 100%)`,
      }}
    >
      {/* Stone texture via repeating crosshatch */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0,0,0,0.04) 20px, rgba(0,0,0,0.04) 21px)',
            'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,0,0,0.04) 20px, rgba(0,0,0,0.04) 21px)',
          ].join(', '),
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 71 + 13

    let opacity = 0
    let scale = 1
    let blur = 0
    let translateY = 0
    let debris = 0

    if (phase === 'enter') {
      // Carved from stone: materialize from slight blur with dust puff
      opacity = Math.min(1, enterProgress * 2)
      scale = 0.9 + enterProgress * 0.1
      blur = (1 - enterProgress) * 4
      debris = enterProgress < 0.4 ? enterProgress / 0.4 * 0.5 : 0
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Micro-cracks: very slight scale pulse
      scale = 1 + Math.sin(holdProgress * Math.PI * 3) * 0.005
    } else {
      // Crumble: fracture and fall
      opacity = 1 - exitProgress
      blur = exitProgress * 3
      scale = 1 - exitProgress * 0.05
      translateY = exitProgress * 15
      debris = exitProgress
    }

    // Stone texture on the text itself via textShadow depth layers
    const depth1 = `2px 2px 0 #5D4E37`
    const depth2 = `4px 4px 0 #4A3728`
    const depth3 = `6px 6px 8px rgba(0,0,0,0.5)`
    const crack = phase === 'exit'
      ? `, 0 0 ${exitProgress * 15}px rgba(255,200,100,${exitProgress * 0.3})`
      : ''

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
        }}
      >
        <StoneDebris progress={debris} color={color} seed={seed} />
        <div
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color,
            textShadow: `${depth1}, ${depth2}, ${depth3}${crack}`,
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

function StonecrumbleComponent(props: MotionGraphicProps<StonecrumbleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-stonecrumble',
  title: 'Kinetic Stone Crumble',
  description: 'Text carved in stone with 3D depth shadows — fractures with falling debris fragments on exit',
  tags: ['kinetic', 'typography', 'stone', 'crumble', 'rock', 'ancient', 'ruin', 'organic'],
  category: 'captions',
  component: StonecrumbleComponent as any,
  defaultConfig: {
    words: ['ANCIENT', 'STONE', 'RUIN', 'FALL'],
    colors: ['#C2B280', '#A0916A', '#D4C5A0', '#8B7355'],
    bgColor: '#5C4A30',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ANCIENT', 'STONE', 'RUIN', 'FALL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C2B280', '#A0916A', '#D4C5A0', '#8B7355'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#5C4A30', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.4, max: 6, group: 'Timing' },
  ],
})
