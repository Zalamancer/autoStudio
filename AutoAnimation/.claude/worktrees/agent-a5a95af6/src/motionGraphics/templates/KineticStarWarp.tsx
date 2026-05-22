import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StarWarpConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Generate warp star streaks from center
    const stars = Array.from({ length: 80 }, (_, i) => {
      const angle = ((i * 137.5 + 23) % 360) * (Math.PI / 180)
      const speed = 0.6 + ((i * 47) % 10) / 10
      const baseRadius = 5 + ((i * 31) % 40)
      const radius = baseRadius + ((time * speed * 60 + i * 19) % (Math.max(width, height) * 0.7))
      const length = 2 + radius * 0.08
      const x = width / 2 + Math.cos(angle) * radius
      const y = height / 2 + Math.sin(angle) * radius
      const opacity = Math.min(1, radius / 100) * (0.3 + ((i * 13) % 7) / 10)
      return { x, y, angle, length, opacity, i }
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Deep space radial glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, rgba(60,20,120,0.15) 0%, rgba(10,5,30,0.3) 40%, transparent 70%)',
          }}
        />
        {/* Warp streaks */}
        {stars.map(({ x, y, angle, length, opacity, i }) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: length,
              height: 1.5,
              background: `linear-gradient(90deg, rgba(180,200,255,${opacity}), rgba(255,255,255,${opacity * 0.3}))`,
              transform: `rotate(${angle}rad)`,
              transformOrigin: '0 50%',
              borderRadius: 1,
            }}
          />
        ))}
        {/* Central blue glow for hyperspace origin */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 80,
            height: 80,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(100,140,255,0.25) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let translateZ = 0
    let blur = 0

    if (phase === 'enter') {
      // Word flies in from far away (hyperspace approach)
      const eased = 1 - Math.pow(1 - enterProgress, 4)
      opacity = eased
      scale = 0.1 + eased * 0.9
      translateZ = (1 - eased) * 200
      blur = (1 - eased) * 8
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1 + Math.sin(Date.now() * 0.003 + index) * 0.02
    } else {
      // Word stretches and zooms past camera
      const eased = exitProgress * exitProgress
      opacity = 1 - eased
      scale = 1 + eased * 3
      blur = eased * 6
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) perspective(600px) translateZ(${translateZ}px)`,
          opacity,
          fontFamily: "'Arial Black', 'Impact', sans-serif",
          fontSize: 'clamp(40px, 12vw, 150px)',
          fontWeight: 900,
          letterSpacing: 'clamp(4px, 1.5vw, 12px)',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          color: 'transparent',
          backgroundImage: `linear-gradient(180deg, #ffffff 0%, ${color} 50%, #6B8CFF 100%)`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: blur > 0 ? `blur(${blur}px) drop-shadow(0 0 20px ${color}60)` : `drop-shadow(0 0 20px ${color}60)`,
        }}
      >
        {word}
      </div>
    )
  },
}

function StarWarpComponent(props: MotionGraphicProps<StarWarpConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-star-warp',
  title: 'Kinetic Star Warp',
  description: 'Text appears through hyperspace warp with star streaks radiating from center, deep space blues and stellar whites',
  tags: ['kinetic', 'typography', 'space', 'warp', 'hyperspace', 'stars', 'astronomy'],
  category: 'captions',
  component: StarWarpComponent as any,
  defaultConfig: {
    words: ['WARP', 'SPEED', 'STARS', 'BEYOND'],
    colors: ['#6B8CFF', '#A78BFA', '#60A5FA', '#818CF8'],
    bgColor: '#050510',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WARP', 'SPEED', 'STARS', 'BEYOND'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#6B8CFF', '#A78BFA', '#60A5FA', '#818CF8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050510', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
