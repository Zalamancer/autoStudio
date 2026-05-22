import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StarryNightConfig extends KineticBaseConfig {}

// Generate deterministic star positions using a simple hash
function seededStars(count: number) {
  const stars: { x: number; y: number; size: number; freq: number; phase: number }[] = []
  for (let i = 0; i < count; i++) {
    const h = (i * 2654435761) >>> 0
    stars.push({
      x: (h % 1000) / 10,
      y: ((h >> 10) % 1000) / 10,
      size: 1 + (h % 3),
      freq: 0.5 + ((h >> 5) % 30) / 10,
      phase: ((h >> 15) % 628) / 100,
    })
  }
  return stars
}

const STARS = seededStars(80)

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, #0a0e27 0%, #131852 40%, ${bgColor} 100%)`,
        }}
      >
        {STARS.map((star, i) => {
          const twinkle = 0.3 + 0.7 * ((Math.sin(time * star.freq + star.phase) + 1) / 2)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: star.size,
                height: star.size,
                borderRadius: '50%',
                background: '#fff',
                opacity: twinkle,
                boxShadow: `0 0 ${star.size * 2}px ${star.size}px rgba(255,255,255,${twinkle * 0.4})`,
              }}
            />
          )
        })}
        {/* Subtle shooting star */}
        {(() => {
          const shootCycle = 4
          const shootTime = time % shootCycle
          if (shootTime < 0.6) {
            const progress = shootTime / 0.6
            return (
              <div
                style={{
                  position: 'absolute',
                  left: `${20 + progress * 40}%`,
                  top: `${10 + progress * 20}%`,
                  width: 40,
                  height: 2,
                  borderRadius: 1,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8))',
                  transform: 'rotate(30deg)',
                  opacity: 1 - progress,
                }}
              />
            )
          }
          return null
        })()}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let glowIntensity = 12

    if (phase === 'enter') {
      opacity = enterProgress
      scale = 0.8 + enterProgress * 0.2
      glowIntensity = enterProgress * 12
    } else if (phase === 'hold') {
      opacity = 1
      glowIntensity = 12 + Math.sin(holdProgress * Math.PI * 4) * 6
    } else {
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.1
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          fontSize: 'clamp(44px, 12vw, 160px)',
          fontWeight: 700,
          color,
          textShadow: `0 0 ${glowIntensity}px ${color}, 0 0 ${glowIntensity * 2}px ${color}66, 0 2px 8px rgba(0,0,0,0.5)`,
          whiteSpace: 'nowrap',
          letterSpacing: 4,
        }}
      >
        {word}
      </div>
    )
  },
}

function StarryNightComponent(props: MotionGraphicProps<StarryNightConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-starry-night',
  title: 'Kinetic Starry Night',
  description: 'Twinkling starry sky background with glowing text that shines like a constellation',
  tags: ['kinetic', 'typography', 'stars', 'night', 'sky', 'nature', 'space', 'twinkle'],
  category: 'captions',
  component: StarryNightComponent as any,
  defaultConfig: {
    words: ['DREAM', 'STARS', 'NIGHT', 'SHINE'],
    colors: ['#E8E0FF', '#B8C4FF', '#FFD700', '#87CEEB'],
    bgColor: '#0f1535',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DREAM', 'STARS', 'NIGHT', 'SHINE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8E0FF', '#B8C4FF', '#FFD700', '#87CEEB'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f1535', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
