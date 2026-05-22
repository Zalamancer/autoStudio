import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CherryBlossomConfig extends KineticBaseConfig {}

// Generate deterministic petal particles
function seededPetals(count: number) {
  const petals: {
    x: number; speed: number; size: number; drift: number;
    driftSpeed: number; rotSpeed: number; phase: number; color: string
  }[] = []
  const pinkTones = ['#FFB7C5', '#FF9EBB', '#FFC0CB', '#FFD1DC', '#F4A7BB', '#E8899E']
  for (let i = 0; i < count; i++) {
    const h = (i * 2654435761) >>> 0
    petals.push({
      x: (h % 1000) / 10,
      speed: 25 + (h % 40),
      size: 5 + (h % 8),
      drift: 15 + (h % 25),
      driftSpeed: 0.3 + ((h >> 5) % 40) / 100,
      rotSpeed: 0.5 + ((h >> 10) % 50) / 100,
      phase: ((h >> 15) % 628) / 100,
      color: pinkTones[h % pinkTones.length],
    })
  }
  return petals
}

const PETALS = seededPetals(35)

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, #fce4ec 0%, ${bgColor} 40%, #f8bbd0 100%)`,
        }}
      >
        {/* Soft radial glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 30%, rgba(255,182,193,0.2), transparent 70%)',
          }}
        />

        {/* Falling petals */}
        {PETALS.map((petal, i) => {
          const cycleH = height + petal.size * 2
          const y = ((time * petal.speed + petal.phase * height) % cycleH) - petal.size
          const xDrift = Math.sin(time * petal.driftSpeed + petal.phase) * petal.drift
          const rotation = time * petal.rotSpeed * 60 + petal.phase * 180
          const sway = Math.sin(time * 0.8 + i) * 0.3

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `calc(${petal.x}% + ${xDrift}px)`,
                top: y,
                width: petal.size,
                height: petal.size * 0.6,
                borderRadius: `${petal.size}px ${petal.size}px 0 ${petal.size}px`,
                background: petal.color,
                opacity: 0.7 + sway * 0.3,
                transform: `rotate(${rotation}deg) scaleY(${0.5 + Math.abs(Math.sin(time * petal.rotSpeed + petal.phase)) * 0.5})`,
                boxShadow: `0 0 3px ${petal.color}66`,
              }}
            />
          )
        })}

        {/* Branch silhouette at top-right */}
        <svg
          style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '30%', opacity: 0.12 }}
          viewBox="0 0 200 100"
          preserveAspectRatio="xMaxYMin meet"
        >
          <path
            d="M200,10 Q160,15 140,30 Q125,40 100,42 Q80,43 60,50 M140,30 Q145,50 130,65 M100,42 Q95,55 85,60"
            stroke="#5D4037"
            strokeWidth={3}
            fill="none"
          />
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0
    let scale = 1

    if (phase === 'enter') {
      // Gentle fade-in with slight float
      opacity = enterProgress
      translateY = (1 - enterProgress) * 15
      scale = 0.9 + enterProgress * 0.1
    } else if (phase === 'hold') {
      opacity = 1
      translateY = Math.sin(holdProgress * Math.PI * 2) * 3
    } else {
      // Petals scatter as word fades
      opacity = 1 - exitProgress
      translateY = -exitProgress * 10
      scale = 1 - exitProgress * 0.05
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
          opacity,
          fontFamily: "'Georgia', 'Palatino', serif",
          fontStyle: 'italic',
          fontSize: 'clamp(42px, 11vw, 150px)',
          fontWeight: 400,
          color,
          textShadow: `0 0 12px ${color}44, 0 2px 8px rgba(0,0,0,0.2)`,
          whiteSpace: 'nowrap',
          letterSpacing: 8,
        }}
      >
        {word}
      </div>
    )
  },
}

function CherryBlossomComponent(props: MotionGraphicProps<CherryBlossomConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cherry-blossom',
  title: 'Kinetic Cherry Blossom',
  description: 'Soft pink background with falling cherry blossom petals drifting down in a gentle spring breeze',
  tags: ['kinetic', 'typography', 'cherry-blossom', 'sakura', 'spring', 'nature', 'romantic', 'japanese'],
  category: 'captions',
  component: CherryBlossomComponent as any,
  defaultConfig: {
    words: ['BLOOM', 'SPRING', 'GRACE', 'PETAL'],
    colors: ['#8B0045', '#AD1457', '#C62828', '#6A1B4D'],
    bgColor: '#FDE8EE',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BLOOM', 'SPRING', 'GRACE', 'PETAL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#8B0045', '#AD1457', '#C62828', '#6A1B4D'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FDE8EE', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
