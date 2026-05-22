import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BlizzardConfig extends KineticBaseConfig {}

function BlizzardParticles({ frame, width, height }: { frame: number; width: number; height: number }) {
  const flakes = Array.from({ length: 60 }, (_, i) => {
    const seed = i * 97 + 31
    const speed = 1.5 + ((seed * 13) % 10) / 5
    const windSpeed = 2.5 + ((seed * 7) % 8) / 3
    const x = ((seed * 43 + frame * windSpeed) % (width + 100)) - 50
    const y = ((frame * speed + seed * 67) % (height + 60)) - 30
    const size = 1 + (i % 6)
    const opacity = 0.2 + ((seed * 11) % 6) / 10
    const drift = Math.sin(frame * 0.04 + i * 0.9) * 20

    return { x: x + drift, y, size, opacity }
  })

  return (
    <svg
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      width={width}
      height={height}
    >
      {flakes.map((f, i) => (
        <circle key={i} cx={f.x} cy={f.y} r={f.size} fill="#FFFFFF" opacity={f.opacity} />
      ))}
    </svg>
  )
}

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    const windShift = Math.sin(time * 0.4) * 3

    return (
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(${170 + windShift}deg, #b8c6d4 0%, #8a9aad 30%, #5c6d80 60%, #3a4a5c 100%)`,
      }}>
        {/* Swirling fog/wind layers */}
        {[...Array(4)].map((_, i) => {
          const layerX = Math.sin(time * (0.3 + i * 0.1) + i * 2) * 30
          const layerOpacity = 0.08 + Math.sin(time * 0.5 + i) * 0.03
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${-20 + i * 10}%`,
                top: `${10 + i * 18}%`,
                width: '140%',
                height: '35%',
                borderRadius: '50%',
                background: `radial-gradient(ellipse, rgba(255,255,255,${layerOpacity}), transparent 60%)`,
                transform: `translateX(${layerX}px) skewX(${Math.sin(time * 0.2 + i) * 5}deg)`,
              }}
            />
          )
        })}
        {/* Wind streak lines */}
        {[...Array(8)].map((_, i) => {
          const streakY = ((i * 137 + frame * 0.8) % height)
          const streakOpacity = 0.06 + Math.sin(time + i * 1.3) * 0.03
          return (
            <div
              key={`s${i}`}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: streakY,
                height: 1,
                background: `linear-gradient(90deg, transparent, rgba(255,255,255,${streakOpacity}) 30%, rgba(255,255,255,${streakOpacity * 0.5}) 70%, transparent)`,
              }}
            />
          )
        })}
        <BlizzardParticles frame={frame} width={width} height={height} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 1
    let translateX = 0
    let translateY = 0
    let blur = 0
    let scale = 1

    if (phase === 'enter') {
      // Blow in from the right with wind
      opacity = Math.min(1, enterProgress * 1.5)
      translateX = (1 - enterProgress) * 120
      blur = (1 - enterProgress) * 8
      scale = 0.9 + enterProgress * 0.1
    } else if (phase === 'hold') {
      opacity = 1
      // Buffeted by wind
      translateX = Math.sin(holdProgress * Math.PI * 6) * 4
      translateY = Math.sin(holdProgress * Math.PI * 8 + 1.5) * 3
      scale = 1 + Math.sin(holdProgress * Math.PI * 4) * 0.01
    } else {
      // Blow away left
      opacity = 1 - exitProgress
      translateX = -exitProgress * 150
      blur = exitProgress * 10
      scale = 1 - exitProgress * 0.1
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scale(${scale})`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontSize: 'clamp(44px, 12vw, 160px)',
          fontWeight: 800,
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#E8F0FF',
          textShadow: `
            0 0 20px rgba(200,220,255,0.5),
            0 0 40px rgba(150,180,220,0.3),
            2px 2px 4px rgba(0,0,0,0.2)
          `,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function BlizzardComponent(props: MotionGraphicProps<BlizzardConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-blizzard',
  title: 'Kinetic Blizzard',
  description: 'Text swirls through a fierce blizzard with dense snowfall and wind streaks',
  tags: ['kinetic', 'typography', 'blizzard', 'snow', 'weather', 'winter', 'wind', 'storm'],
  category: 'captions',
  component: BlizzardComponent as any,
  defaultConfig: {
    words: ['BLIZZARD', 'FREEZE', 'WINTER', 'STORM'],
    colors: ['#C8DDFF', '#A0B8D8', '#E0EEFF', '#8AA0C0'],
    bgColor: '#5c6d80',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BLIZZARD', 'FREEZE', 'WINTER', 'STORM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C8DDFF', '#A0B8D8', '#E0EEFF', '#8AA0C0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#5c6d80', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
