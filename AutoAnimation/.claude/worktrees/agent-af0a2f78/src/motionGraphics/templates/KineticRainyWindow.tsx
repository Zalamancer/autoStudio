import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RainyWindowConfig extends KineticBaseConfig {}

// Deterministic rain drops
function seededDrops(count: number) {
  const drops: { x: number; speed: number; length: number; delay: number; opacity: number }[] = []
  for (let i = 0; i < count; i++) {
    const h = (i * 2654435761) >>> 0
    drops.push({
      x: (h % 1000) / 10,
      speed: 120 + (h % 200),
      length: 15 + (h % 25),
      delay: ((h >> 10) % 100) / 100,
      opacity: 0.15 + ((h >> 5) % 40) / 100,
    })
  }
  return drops
}

const DROPS = seededDrops(50)

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, #2c3e50 0%, ${bgColor} 50%, #1a252f 100%)`,
        }}
      >
        {/* Frosted glass overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(200,210,220,0.06)',
            backdropFilter: 'blur(1px)',
          }}
        />
        {/* Rain streaks */}
        {DROPS.map((drop, i) => {
          const cycleHeight = height + drop.length
          const y = ((time * drop.speed + drop.delay * cycleHeight) % cycleHeight) - drop.length
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${drop.x}%`,
                top: y,
                width: 1.5,
                height: drop.length,
                borderRadius: 1,
                background: `linear-gradient(180deg, transparent, rgba(180,200,220,${drop.opacity}))`,
              }}
            />
          )
        })}
        {/* Water droplet on glass — fixed positions */}
        {[15, 35, 62, 78, 88].map((x, i) => {
          const h = (i * 7919) >>> 0
          const yBase = 20 + (h % 60)
          const driftY = Math.sin(time * 0.3 + i) * 2
          const size = 4 + (h % 5)
          return (
            <div
              key={`droplet-${i}`}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${yBase + driftY}%`,
                width: size,
                height: size * 1.2,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.25), rgba(180,200,220,0.08))',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0
    let blur = 0

    if (phase === 'enter') {
      opacity = enterProgress
      translateY = (1 - enterProgress) * 12
      blur = (1 - enterProgress) * 3
    } else if (phase === 'hold') {
      opacity = 1
      translateY = Math.sin(holdProgress * Math.PI * 2) * 2
    } else {
      opacity = 1 - exitProgress
      blur = exitProgress * 4
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px))`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontSize: 'clamp(44px, 12vw, 160px)',
          fontWeight: 300,
          fontFamily: "'Georgia', serif",
          fontStyle: 'italic',
          color,
          textShadow: `0 0 20px ${color}44, 0 2px 8px rgba(0,0,0,0.6)`,
          whiteSpace: 'nowrap',
          letterSpacing: 6,
        }}
      >
        {word}
      </div>
    )
  },
}

function RainyWindowComponent(props: MotionGraphicProps<RainyWindowConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-rainy-window',
  title: 'Kinetic Rainy Window',
  description: 'Moody rain streaks on a frosted window with warm atmospheric text',
  tags: ['kinetic', 'typography', 'rain', 'window', 'moody', 'weather', 'atmospheric', 'nature'],
  category: 'captions',
  component: RainyWindowComponent as any,
  defaultConfig: {
    words: ['RAIN', 'DREAM', 'PEACE', 'CALM'],
    colors: ['#F5DEB3', '#FFE4B5', '#FFDAB9', '#EEE8AA'],
    bgColor: '#1e2d3d',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RAIN', 'DREAM', 'PEACE', 'CALM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F5DEB3', '#FFE4B5', '#FFDAB9', '#EEE8AA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1e2d3d', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
