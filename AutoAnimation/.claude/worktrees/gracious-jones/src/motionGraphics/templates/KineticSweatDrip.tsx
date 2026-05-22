import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SweatDripConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Hot gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(255,100,0,0.06) 0%, transparent 40%, rgba(0,80,200,0.04) 100%)',
          }}
        />
        {/* Dripping drops in background */}
        {Array.from({ length: 8 }).map((_, i) => {
          const startX = rand(i * 31) * 100
          const speed = 1.5 + rand(i * 47) * 2
          const dropY = ((time * speed * 30 + rand(i * 73) * 200) % 120) - 10
          const dropOpacity = dropY > 80 ? 1 - (dropY - 80) / 30 : dropY < 5 ? dropY / 5 : 0.4

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${startX}%`,
                top: `${dropY}%`,
                width: 'clamp(2px, 0.4vw, 4px)',
                height: 'clamp(10px, 2vw, 18px)',
                borderRadius: '50% 50% 50% 50% / 30% 30% 70% 70%',
                background: `rgba(100,180,255,${dropOpacity * 0.15})`,
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    frame,
    fps,
  }: WordRenderProps) => {
    const time = (frame ?? 0) / (fps ?? 30)
    let opacity = 1
    let translateY = 0

    if (phase === 'enter') {
      opacity = easeOutCubic(enterProgress)
      translateY = (1 - easeOutCubic(enterProgress)) * -40
    } else if (phase === 'hold') {
      opacity = 1
      // Slight downward drip movement
      translateY = Math.sin(holdProgress * Math.PI * 3) * 3
    } else {
      // Drip/melt downward on exit
      opacity = 1 - exitProgress
      translateY = exitProgress * 60
    }

    // Generate sweat drops on the text
    const numDrops = 5
    const drops = Array.from({ length: numDrops }).map((_, i) => {
      const dropSeed = index * 100 + i * 37
      const xPos = 10 + rand(dropSeed) * 80
      const dropSpeed = 0.8 + rand(dropSeed + 1) * 1.2
      const dropDelay = rand(dropSeed + 2) * 2

      let dropY: number
      let dropOpacity: number

      if (phase === 'hold') {
        const t = ((holdProgress * 4 + dropDelay) % 1)
        dropY = t * 50
        dropOpacity = t < 0.1 ? t / 0.1 : t > 0.7 ? 1 - (t - 0.7) / 0.3 : 0.8
      } else if (phase === 'exit') {
        dropY = exitProgress * 80
        dropOpacity = 1 - exitProgress
      } else {
        dropY = 0
        dropOpacity = 0
      }

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${xPos}%`,
            top: `calc(100% + ${dropY}px)`,
            width: 'clamp(3px, 0.6vw, 6px)',
            height: 'clamp(8px, 1.5vw, 14px)',
            borderRadius: '50% 50% 50% 50% / 30% 30% 70% 70%',
            background: `rgba(120,200,255,${dropOpacity * 0.7})`,
            filter: `blur(${dropOpacity < 0.3 ? 1 : 0}px)`,
          }}
        />
      )
    })

    // Wet sheen effect
    const sheenX = phase === 'hold' ? (holdProgress * 200 - 50) : -50

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px)`,
          opacity,
        }}
      >
        <div style={{ position: 'relative', overflow: 'visible' }}>
          <div
            style={{
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(44px, 13vw, 170px)',
              fontWeight: 900,
              color,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              textShadow: `
                0 2px 8px rgba(0,0,0,0.5),
                0 0 20px rgba(100,180,255,0.15)
              `,
              whiteSpace: 'nowrap',
              position: 'relative',
            }}
          >
            {word}
            {/* Wet highlight sheen */}
            <div
              style={{
                position: 'absolute',
                top: '15%',
                left: `${sheenX}%`,
                width: '30%',
                height: '70%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
                transform: 'skewX(-20deg)',
                pointerEvents: 'none',
              }}
            />
          </div>
          {/* Sweat drops */}
          {drops}
        </div>
      </div>
    )
  },
}

function SweatDripComponent(props: MotionGraphicProps<SweatDripConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sweat-drip',
  title: 'Sweat Drip',
  description:
    'Text dripping with animated sweat drops and wet sheen effect. Drops fall from letters during hold phase, melts downward on exit.',
  tags: ['kinetic', 'sweat', 'drip', 'fitness', 'gym', 'workout', 'wet', 'intense'],
  category: 'captions',
  component: SweatDripComponent as any,
  defaultConfig: {
    words: ['SWEAT', 'DRIP', 'GRIND', 'HUSTLE'],
    colors: ['#FF6633', '#FF4400', '#FF8844', '#CC3300'],
    bgColor: '#0a0a12',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SWEAT', 'DRIP', 'GRIND', 'HUSTLE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6633', '#FF4400', '#FF8844', '#CC3300'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a12', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
