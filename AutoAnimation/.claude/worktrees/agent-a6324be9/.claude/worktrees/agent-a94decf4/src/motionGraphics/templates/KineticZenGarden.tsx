import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ZenGardenConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Sand base with warm tint */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(194,178,158,0.03) 0%, rgba(194,178,158,0.08) 100%)',
          }}
        />

        {/* Raked sand lines */}
        {Array.from({ length: 14 }, (_, i) => {
          const y = (i / 13) * 100
          const waveOffset = Math.sin(time * 0.3 + i * 0.4) * 3
          const opacity = 0.04 + Math.sin(i * 0.5) * 0.015

          return (
            <div
              key={`line-${i}`}
              style={{
                position: 'absolute',
                left: '5%',
                right: '5%',
                top: `${y + waveOffset}%`,
                height: 1,
                background: `rgba(194,178,158,${opacity})`,
                borderRadius: 1,
              }}
            />
          )
        })}

        {/* Raked circles around stones */}
        {[
          { x: 25, y: 35, size: 0.08 },
          { x: 72, y: 65, size: 0.06 },
          { x: 50, y: 80, size: 0.05 },
        ].map((stone, idx) => (
          <div key={`stone-group-${idx}`}>
            {/* Concentric rake marks */}
            {Array.from({ length: 4 }, (_, ringIdx) => {
              const ringSize = Math.min(width, height) * stone.size * (1.5 + ringIdx * 0.6)
              return (
                <div
                  key={`ring-${idx}-${ringIdx}`}
                  style={{
                    position: 'absolute',
                    left: `${stone.x}%`,
                    top: `${stone.y}%`,
                    width: ringSize,
                    height: ringSize,
                    transform: 'translate(-50%, -50%)',
                    borderRadius: '50%',
                    border: `1px solid rgba(194,178,158,${0.04 - ringIdx * 0.008})`,
                  }}
                />
              )
            })}
            {/* Stone */}
            <div
              style={{
                position: 'absolute',
                left: `${stone.x}%`,
                top: `${stone.y}%`,
                width: Math.min(width, height) * stone.size,
                height: Math.min(width, height) * stone.size * 0.7,
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                background: `linear-gradient(135deg, rgba(120,110,100,0.15) 0%, rgba(80,75,70,0.25) 100%)`,
                boxShadow: '2px 3px 6px rgba(0,0,0,0.1)',
              }}
            />
          </div>
        ))}

        {/* Small bamboo accent */}
        <div
          style={{
            position: 'absolute',
            right: '10%',
            top: '10%',
            width: 3,
            height: Math.min(width, height) * 0.2,
            background: 'linear-gradient(180deg, rgba(107,142,35,0.08) 0%, rgba(107,142,35,0.15) 100%)',
            borderRadius: 2,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0
    let scale = 1

    if (phase === 'enter') {
      // Stone placement — drops from above and settles
      const eased = easeOutBack(Math.min(1, enterProgress / 0.8))
      opacity = Math.min(1, enterProgress * 2.5)
      translateY = (1 - eased) * -40
      scale = 0.85 + eased * 0.15
    } else if (phase === 'hold') {
      opacity = 1
      // Very subtle resting motion
      translateY = Math.sin(holdProgress * Math.PI * 2) * 1.5
    } else {
      // Sink into sand
      const eased = easeOutCubic(exitProgress)
      opacity = 1 - eased
      translateY = eased * 15
      scale = 1 - eased * 0.08
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '48%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
          textAlign: 'center',
        }}
      >
        {/* Main word */}
        <div
          style={{
            fontFamily: "'Georgia', 'Cambria', serif",
            fontSize: 'clamp(36px, 10vw, 120px)',
            fontWeight: 300,
            letterSpacing: 10,
            whiteSpace: 'nowrap',
            color,
            textTransform: 'uppercase',
            textShadow: `0 2px 8px rgba(0,0,0,0.2)`,
          }}
        >
          {word}
        </div>

        {/* Decorative line underneath */}
        <div
          style={{
            width: 'clamp(40px, 10vw, 100px)',
            height: 1,
            background: `${color}40`,
            margin: 'clamp(8px, 1.5vw, 14px) auto 0',
            transform: `scaleX(${phase === 'enter' ? easeOutCubic(enterProgress) : phase === 'exit' ? 1 - exitProgress : 1})`,
          }}
        />
      </div>
    )
  },
}

function ZenGardenComponent(props: MotionGraphicProps<ZenGardenConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-zen-garden',
  title: 'Kinetic Zen Garden',
  description: 'Words appear like stones placed in a zen garden, with raked sand lines, concentric rake marks, and stone elements',
  tags: ['kinetic', 'typography', 'meditation', 'zen-garden', 'stones', 'sand', 'mindfulness', 'nature', 'calm'],
  category: 'captions',
  component: ZenGardenComponent as any,
  defaultConfig: {
    words: ['PEACE', 'SIMPLE', 'NATURE', 'STILL'],
    colors: ['#C2B29E', '#A69882', '#8B7D6B', '#D4C5B0'],
    bgColor: '#12110e',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PEACE', 'SIMPLE', 'NATURE', 'STILL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C2B29E', '#A69882', '#8B7D6B', '#D4C5B0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#12110e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
