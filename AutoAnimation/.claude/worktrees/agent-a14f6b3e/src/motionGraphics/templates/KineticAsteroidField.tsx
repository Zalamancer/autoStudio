import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AsteroidFieldConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Asteroid rocks tumbling across the field
    const asteroids = Array.from({ length: 14 }, (_, i) => {
      const speed = 0.3 + ((i * 41) % 8) / 10
      const baseX = ((i * 73 + time * speed * 30 + 200) % (width + 200)) - 100
      const baseY = 10 + ((i * 59) % 80)
      const size = 8 + ((i * 37) % 30)
      const rotation = time * (20 + ((i * 19) % 40)) * (i % 2 === 0 ? 1 : -1)
      const opacity = 0.3 + ((i * 23) % 5) / 10
      const shade = 60 + ((i * 17) % 40)
      return { x: baseX, y: baseY, size, rotation, opacity, shade, i }
    })

    // Background stars
    const stars = Array.from({ length: 35 }, (_, i) => ({
      x: ((i * 71 + 17) % 100),
      y: ((i * 53 + 29) % 100),
      size: 1 + ((i * 11) % 2),
      opacity: 0.2 + ((i * 31) % 6) / 15,
    }))

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Faint nebula backdrop */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 60% 30%, rgba(50,30,80,0.08) 0%, transparent 60%)',
          }}
        />
        {/* Stars */}
        {stars.map((s, i) => (
          <div
            key={`s-${i}`}
            style={{
              position: 'absolute',
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              borderRadius: '50%',
              background: '#FFFFFF',
              opacity: s.opacity,
            }}
          />
        ))}
        {/* Asteroids */}
        {asteroids.map(({ x, y, size, rotation, opacity, shade, i }) => (
          <div
            key={`a-${i}`}
            style={{
              position: 'absolute',
              left: x,
              top: `${y}%`,
              width: size,
              height: size * 0.8,
              background: `linear-gradient(135deg, rgb(${shade + 20},${shade + 10},${shade}) 0%, rgb(${shade - 10},${shade - 15},${shade - 20}) 100%)`,
              borderRadius: `${30 + ((i * 23) % 20)}% ${40 + ((i * 11) % 25)}% ${35 + ((i * 7) % 20)}% ${25 + ((i * 31) % 30)}%`,
              transform: `rotate(${rotation}deg)`,
              opacity,
              boxShadow: `inset -2px -2px 4px rgba(0,0,0,0.5), inset 1px 1px 2px rgba(255,255,255,0.1)`,
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let translateX = 0
    let translateY = 0
    let rotation = 0
    let scale = 1

    if (phase === 'enter') {
      // Word tumbles in like an asteroid
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      opacity = eased
      translateX = (1 - eased) * 100
      translateY = (1 - eased) * -40
      rotation = (1 - eased) * 25
      scale = 0.7 + eased * 0.3
    } else if (phase === 'hold') {
      opacity = 1
      // Gentle floating tumble
      const t = Date.now() * 0.001 + index * 1.5
      translateY = Math.sin(t) * 5
      rotation = Math.sin(t * 0.7) * 2
    } else {
      // Word tumbles away
      const eased = exitProgress * exitProgress
      opacity = 1 - eased
      translateX = -eased * 120
      translateY = eased * 50
      rotation = eased * -30
      scale = 1 - eased * 0.3
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) rotate(${rotation}deg) scale(${scale})`,
          opacity,
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          fontSize: 'clamp(38px, 11vw, 140px)',
          fontWeight: 900,
          letterSpacing: 'clamp(3px, 1vw, 8px)',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          color: '#E8E0D8',
          textShadow: `0 0 15px ${color}50, 2px 2px 0px rgba(0,0,0,0.6), -1px -1px 0px rgba(255,255,255,0.1)`,
        }}
      >
        {word}
      </div>
    )
  },
}

function AsteroidFieldComponent(props: MotionGraphicProps<AsteroidFieldConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-asteroid-field',
  title: 'Kinetic Asteroid Field',
  description: 'Words tumble through a field of rotating asteroids with rocky textures on a starlit deep space background',
  tags: ['kinetic', 'typography', 'space', 'asteroid', 'rocks', 'tumble', 'astronomy'],
  category: 'captions',
  component: AsteroidFieldComponent as any,
  defaultConfig: {
    words: ['IMPACT', 'ROCK', 'ORBIT', 'DEBRIS'],
    colors: ['#9CA3AF', '#D1D5DB', '#A78BFA', '#6B7280'],
    bgColor: '#08080E',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['IMPACT', 'ROCK', 'ORBIT', 'DEBRIS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#9CA3AF', '#D1D5DB', '#A78BFA', '#6B7280'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#08080E', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
