import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SolarFlareConfig extends KineticBaseConfig {
  rayCount: number
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle at 50% 60%, #2a1a00, ${bgColor})`,
      }}
    />
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    frame = 0,
  }: WordRenderProps) => {
    let opacity = 1
    let textScale = 1
    let glowIntensity = 0

    if (phase === 'enter') {
      opacity = easeOutCubic(enterProgress)
      textScale = 0.3 + easeOutCubic(enterProgress) * 0.7
      glowIntensity = enterProgress * 25
    } else if (phase === 'hold') {
      textScale = 1 + Math.sin(holdProgress * Math.PI * 4) * 0.02
      glowIntensity = 20 + Math.sin(holdProgress * Math.PI * 6) * 12
    } else {
      opacity = 1 - exitProgress * exitProgress
      textScale = 1 + exitProgress * 0.5
      glowIntensity = 20 * (1 - exitProgress)
    }

    const time = frame * 0.035
    const rayCount = 12

    // Solar rays emanating outward
    const rays = Array.from({ length: rayCount }, (_, i) => {
      const angle = (i / rayCount) * 360
      const seed = index * 150 + i * 11
      const lengthBase = 60 + seededRandom(seed) * 80
      const lengthPulse = phase === 'hold'
        ? lengthBase + Math.sin(time * 2 + i * 0.5) * 30
        : phase === 'enter'
          ? lengthBase * easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7))
          : lengthBase * (1 - exitProgress)
      const rayOpacity = phase === 'hold'
        ? 0.2 + Math.sin(time * 3 + i * 0.8) * 0.12
        : phase === 'enter'
          ? easeOutCubic(Math.max(0, (enterProgress - 0.2) / 0.5)) * 0.25
          : 0.25 * (1 - exitProgress)
      const width = 2 + seededRandom(seed + 1) * 3

      return { angle, length: lengthPulse, opacity: rayOpacity, width }
    })

    // Core glow
    const coreSize = phase === 'hold'
      ? 180 + Math.sin(time * 1.5) * 20
      : phase === 'enter'
        ? easeOutCubic(enterProgress) * 180
        : 180 * (1 - exitProgress)

    // Solar flare arcs
    const flareActive = phase === 'hold' || (phase === 'enter' && enterProgress > 0.6)
    const flareOpacity = phase === 'enter'
      ? Math.max(0, (enterProgress - 0.6) / 0.4) * 0.3
      : phase === 'exit'
        ? 0.3 * (1 - exitProgress)
        : 0.15 + Math.sin(time * 1.8) * 0.12

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
        }}
      >
        {/* Core solar glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: `${coreSize}px`,
            height: `${coreSize}px`,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,183,77,0.35) 0%, rgba(255,152,0,0.1) 40%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Solar rays */}
        {rays.map((ray, i) => {
          const rad = (ray.angle * Math.PI) / 180
          const startDist = 40
          const x1 = Math.cos(rad) * startDist
          const y1 = Math.sin(rad) * startDist
          const x2 = Math.cos(rad) * (startDist + ray.length)
          const y2 = Math.sin(rad) * (startDist + ray.length)

          return (
            <div
              key={`ray-${i}`}
              style={{
                position: 'absolute',
                left: `calc(50% + ${x1}px)`,
                top: `calc(50% + ${y1}px)`,
                width: `${ray.length}px`,
                height: `${ray.width}px`,
                background: `linear-gradient(90deg, rgba(255,183,77,${ray.opacity}), transparent)`,
                transform: `rotate(${ray.angle}deg)`,
                transformOrigin: '0 50%',
                borderRadius: '2px',
                pointerEvents: 'none',
              }}
            />
          )
        })}

        {/* Solar flare arcs */}
        {flareActive && [0, 120, 240].map((baseAngle, i) => {
          const flareAngle = baseAngle + time * 15
          return (
            <div
              key={`flare-${i}`}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '120px',
                height: '60px',
                transform: `translate(-50%, -50%) rotate(${flareAngle}deg) translateX(70px)`,
                border: '2px solid transparent',
                borderTop: `2px solid rgba(255,183,77,${flareOpacity})`,
                borderRadius: '50%',
                pointerEvents: 'none',
                filter: 'blur(1px)',
              }}
            />
          )
        })}

        {/* Main text */}
        <div
          style={{
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 900,
            color,
            transform: `scale(${textScale})`,
            textShadow: `0 0 ${glowIntensity}px rgba(255,183,77,0.7), 0 0 ${glowIntensity * 2}px rgba(255,152,0,0.3)`,
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

function SolarFlareComponent(props: MotionGraphicProps<SolarFlareConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-solar-flare',
  title: 'Solar Flare',
  description:
    'Text with solar energy glow effect. Radiating rays pulse outward from the text with solar flare arcs and a warm core glow.',
  tags: ['kinetic', 'solar', 'sun', 'energy', 'eco', 'renewable', 'glow', 'warm'],
  category: 'captions',
  component: SolarFlareComponent as any,
  defaultConfig: {
    words: ['SOLAR', 'ENERGY', 'SHINE', 'POWER'],
    colors: ['#FFD54F', '#FFB74D', '#FFF176', '#FFCC80'],
    bgColor: '#1a0f00',
    cycleDuration: 1.5,
    rayCount: 12,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SOLAR', 'ENERGY', 'SHINE', 'POWER'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFD54F', '#FFB74D', '#FFF176', '#FFCC80'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0f00', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'rayCount',
      label: 'Ray Count',
      type: 'number',
      defaultValue: 12,
      min: 6,
      max: 24,
      group: 'Animation',
    },
  ],
})
