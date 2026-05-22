import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AutumnLeavesConfig extends KineticBaseConfig {}

const LEAF_COLORS = ['#D2691E', '#CD853F', '#B8860B', '#DAA520', '#CC5500', '#A0522D', '#E8A317', '#8B4513']

function seededLeaves(count: number) {
  const leaves: {
    x: number; speed: number; size: number; drift: number;
    driftSpeed: number; rotSpeed: number; phase: number; color: string; shape: number
  }[] = []
  for (let i = 0; i < count; i++) {
    const h = (i * 2654435761) >>> 0
    leaves.push({
      x: (h % 1000) / 10,
      speed: 18 + (h % 30),
      size: 8 + (h % 10),
      drift: 20 + (h % 30),
      driftSpeed: 0.2 + ((h >> 5) % 30) / 100,
      rotSpeed: 0.4 + ((h >> 10) % 40) / 100,
      phase: ((h >> 15) % 628) / 100,
      color: LEAF_COLORS[h % LEAF_COLORS.length],
      shape: h % 3,
    })
  }
  return leaves
}

const LEAVES = seededLeaves(28)

function LeafShape({ size, color, shape }: { size: number; color: string; shape: number }) {
  if (shape === 0) {
    // Oval leaf
    return (
      <div style={{
        width: size,
        height: size * 1.4,
        borderRadius: `${size}px ${size}px ${size * 0.3}px ${size}px`,
        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
      }} />
    )
  } else if (shape === 1) {
    // Rounded leaf
    return (
      <div style={{
        width: size * 1.1,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(ellipse at 40% 40%, ${color}, ${color}aa)`,
      }} />
    )
  }
  // Pointed leaf
  return (
    <div style={{
      width: size * 0.8,
      height: size * 1.5,
      borderRadius: `${size}px ${size * 0.2}px ${size}px ${size * 0.2}px`,
      background: `linear-gradient(180deg, ${color}, ${color}bb)`,
    }} />
  )
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, #E8A317 0%, ${bgColor} 40%, #5D3A1A 100%)`,
        }}
      >
        {/* Warm sunlight glow */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            left: '30%',
            width: '50%',
            height: '50%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,200,50,0.12), transparent 70%)',
            opacity: 0.8 + Math.sin(time * 0.3) * 0.2,
          }}
        />

        {/* Falling leaves */}
        {LEAVES.map((leaf, i) => {
          const cycleH = height + leaf.size * 3
          const y = ((time * leaf.speed + leaf.phase * height) % cycleH) - leaf.size * 2
          const xDrift = Math.sin(time * leaf.driftSpeed + leaf.phase) * leaf.drift
          const rotation = time * leaf.rotSpeed * 50 + leaf.phase * 200
          const tumble = Math.sin(time * leaf.rotSpeed * 2 + leaf.phase) * 0.4

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `calc(${leaf.x}% + ${xDrift}px)`,
                top: y,
                transform: `rotate(${rotation}deg) scaleX(${0.6 + Math.abs(tumble)})`,
                opacity: 0.75,
              }}
            >
              <LeafShape size={leaf.size} color={leaf.color} shape={leaf.shape} />
            </div>
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0

    if (phase === 'enter') {
      opacity = enterProgress
      translateY = -enterProgress * 0 + (1 - enterProgress) * 18
    } else if (phase === 'hold') {
      opacity = 1
      translateY = Math.sin(holdProgress * Math.PI * 2) * 3
    } else {
      opacity = 1 - exitProgress
      translateY = exitProgress * 12
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px))`,
          opacity,
          fontFamily: "'Georgia', 'Palatino', serif",
          fontSize: 'clamp(44px, 12vw, 160px)',
          fontWeight: 700,
          color,
          textShadow: `0 2px 6px rgba(0,0,0,0.3), 0 0 15px ${color}33`,
          whiteSpace: 'nowrap',
          letterSpacing: 4,
        }}
      >
        {word}
      </div>
    )
  },
}

function AutumnLeavesComponent(props: MotionGraphicProps<AutumnLeavesConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-autumn-leaves',
  title: 'Kinetic Autumn Leaves',
  description: 'Warm autumn gradient with colorful falling leaves drifting and tumbling down',
  tags: ['kinetic', 'typography', 'autumn', 'fall', 'leaves', 'nature', 'warm', 'cozy', 'seasonal'],
  category: 'captions',
  component: AutumnLeavesComponent as any,
  defaultConfig: {
    words: ['AUTUMN', 'GOLDEN', 'WARM', 'COZY'],
    colors: ['#FFF8DC', '#FFE4B5', '#FAEBD7', '#F5DEB3'],
    bgColor: '#8B4513',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['AUTUMN', 'GOLDEN', 'WARM', 'COZY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFF8DC', '#FFE4B5', '#FAEBD7', '#F5DEB3'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#8B4513', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
