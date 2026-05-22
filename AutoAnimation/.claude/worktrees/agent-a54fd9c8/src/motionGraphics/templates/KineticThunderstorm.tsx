import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ThunderstormConfig extends KineticBaseConfig {}

// Deterministic rain drops
function seededRain(count: number) {
  const drops: { x: number; speed: number; len: number; offset: number; opacity: number }[] = []
  for (let i = 0; i < count; i++) {
    const h = (i * 2654435761) >>> 0
    drops.push({
      x: (h % 1000) / 10,
      speed: 200 + (h % 300),
      len: 10 + (h % 20),
      offset: ((h >> 10) % 1000) / 10,
      opacity: 0.1 + ((h >> 5) % 25) / 100,
    })
  }
  return drops
}

const RAIN = seededRain(60)

// Deterministic lightning flash pattern using frame math
function getLightningFlash(frame: number, fps: number): number {
  const time = frame / fps
  // Flashes at irregular intervals using prime-based modular arithmetic
  const a = Math.floor(time * 1000)
  const flash1 = (a % 2700) < 60 ? 1 : 0
  const flash2 = (a % 4300) < 40 ? 1 : 0
  const flash3 = (a % 6100) < 80 ? 1 : 0
  return Math.max(flash1, flash2, flash3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    const flash = getLightningFlash(frame, fps)
    const flashIntensity = flash * 0.7

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, #0d1117 0%, #1a1f2e 40%, ${bgColor} 100%)`,
        }}
      >
        {/* Dark cloud layers */}
        {[0, 1, 2].map(i => {
          const cloudY = 5 + i * 8
          const cloudDrift = Math.sin(time * 0.15 + i * 2) * 5
          return (
            <div
              key={`cloud-${i}`}
              style={{
                position: 'absolute',
                top: `${cloudY}%`,
                left: `${-10 + cloudDrift}%`,
                right: `${-10 - cloudDrift}%`,
                height: '18%',
                background: `radial-gradient(ellipse at ${50 + i * 15}% 50%, rgba(30,35,50,0.9), rgba(15,18,30,0.4), transparent)`,
                borderRadius: '50%',
              }}
            />
          )
        })}

        {/* Rain streaks */}
        {RAIN.map((drop, i) => {
          const cycleH = height + drop.len
          const y = ((time * drop.speed + drop.offset * height) % cycleH) - drop.len
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${drop.x}%`,
                top: y,
                width: 1,
                height: drop.len,
                background: `linear-gradient(180deg, transparent, rgba(150,170,200,${drop.opacity}))`,
                transform: 'rotate(5deg)',
              }}
            />
          )
        })}

        {/* Lightning flash overlay */}
        {flashIntensity > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `rgba(200,210,255,${flashIntensity})`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Lightning bolt (simplified) */}
        {flash > 0 && (
          <svg
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
          >
            <polyline
              points={`${width * 0.45},0 ${width * 0.42},${height * 0.2} ${width * 0.48},${height * 0.22} ${width * 0.44},${height * 0.45} ${width * 0.5},${height * 0.47} ${width * 0.46},${height * 0.7}`}
              stroke="rgba(200,220,255,0.9)"
              strokeWidth={2}
              fill="none"
            />
          </svg>
        )}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let glowSize = 8

    if (phase === 'enter') {
      // Dramatic entrance — scales up fast
      opacity = Math.min(1, enterProgress * 3)
      scale = 0.7 + enterProgress * 0.3
      glowSize = enterProgress * 15
    } else if (phase === 'hold') {
      opacity = 1
      // Flicker effect
      const flicker = Math.sin(holdProgress * Math.PI * 12) * 0.08
      opacity = 1 - flicker
      glowSize = 15 + Math.sin(holdProgress * Math.PI * 6) * 8
    } else {
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.1
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          fontSize: 'clamp(48px, 13vw, 170px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          color,
          textShadow: `0 0 ${glowSize}px ${color}, 0 0 ${glowSize * 2}px ${color}44, 0 4px 12px rgba(0,0,0,0.7)`,
          whiteSpace: 'nowrap',
          letterSpacing: 6,
        }}
      >
        {word}
      </div>
    )
  },
}

function ThunderstormComponent(props: MotionGraphicProps<ThunderstormConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-thunderstorm',
  title: 'Kinetic Thunderstorm',
  description: 'Dark stormy background with lightning flashes, rain streaks, and dramatic text appearance',
  tags: ['kinetic', 'typography', 'thunder', 'storm', 'lightning', 'rain', 'weather', 'dramatic', 'nature'],
  category: 'captions',
  component: ThunderstormComponent as any,
  defaultConfig: {
    words: ['STORM', 'POWER', 'STRIKE', 'FURY'],
    colors: ['#E0E8FF', '#B0C4DE', '#C8D8F0', '#DCDCDC'],
    bgColor: '#131825',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['STORM', 'POWER', 'STRIKE', 'FURY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E0E8FF', '#B0C4DE', '#C8D8F0', '#DCDCDC'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#131825', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
