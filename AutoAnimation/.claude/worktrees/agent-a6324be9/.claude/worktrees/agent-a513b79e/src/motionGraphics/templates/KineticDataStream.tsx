import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DataStreamConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const BAR_COLORS = [
  'rgba(0, 200, 255, 0.2)',
  'rgba(100, 255, 200, 0.15)',
  'rgba(160, 100, 255, 0.15)',
  'rgba(255, 200, 0, 0.12)',
  'rgba(0, 255, 100, 0.18)',
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    const barCount = 18
    const bars: { y: number; barWidth: number; speed: number; color: string; barHeight: number }[] = []

    for (let i = 0; i < barCount; i++) {
      const seed = i * 137 + 43
      const y = (i / barCount) * height
      const barW = 40 + seededRand(seed) * 200
      const speed = 0.5 + seededRand(seed + 1) * 3
      const color = BAR_COLORS[i % BAR_COLORS.length]
      const barH = 2 + seededRand(seed + 2) * 4
      bars.push({ y, barWidth: barW, speed, color, barHeight: barH })
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {bars.map((bar, i) => {
          const xOffset = ((frame * bar.speed + i * 50) % (width + bar.barWidth + 100)) - bar.barWidth - 50
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: bar.y,
                left: xOffset,
                width: bar.barWidth,
                height: bar.barHeight,
                background: bar.color,
                borderRadius: 1,
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 1

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 2)
      const translateY = (1 - enterProgress) * 15

      return (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Readability blur backdrop */}
          <div
            style={{
              position: 'absolute',
              top: '35%',
              left: '10%',
              right: '10%',
              bottom: '35%',
              background: 'rgba(5, 8, 20, 0.7)',
              borderRadius: 8,
              opacity: opacity * 0.9,
            }}
          />
          <div
            style={{
              position: 'relative',
              transform: `translateY(${translateY}px)`,
              opacity,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 10px ${color}, 0 0 30px ${color}30`,
              whiteSpace: 'nowrap',
              letterSpacing: 4,
            }}
          >
            {word}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      const pulse = 0.85 + Math.sin(holdProgress * Math.PI * 4) * 0.15

      return (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              position: 'absolute',
              top: '35%',
              left: '10%',
              right: '10%',
              bottom: '35%',
              background: 'rgba(5, 8, 20, 0.7)',
              borderRadius: 8,
            }}
          />
          <div
            style={{
              position: 'relative',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 ${8 + pulse * 12}px ${color}, 0 0 ${20 + pulse * 15}px ${color}30`,
              whiteSpace: 'nowrap',
              letterSpacing: 4,
            }}
          >
            {word}
          </div>
        </div>
      )
    } else {
      opacity = 1 - exitProgress
      const translateY = exitProgress * -15

      return (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              position: 'absolute',
              top: '35%',
              left: '10%',
              right: '10%',
              bottom: '35%',
              background: 'rgba(5, 8, 20, 0.7)',
              borderRadius: 8,
              opacity,
            }}
          />
          <div
            style={{
              position: 'relative',
              transform: `translateY(${translateY}px)`,
              opacity,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 10px ${color}`,
              whiteSpace: 'nowrap',
              letterSpacing: 4,
            }}
          >
            {word}
          </div>
        </div>
      )
    }
  },
}

function DataStreamComponent(props: MotionGraphicProps<DataStreamConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-data-stream',
  title: 'Kinetic Data Stream',
  description: 'Flowing horizontal data bars at varying speeds with centered text overlay and backdrop blur for readability',
  tags: ['kinetic', 'typography', 'data', 'stream', 'visualization', 'tech'],
  category: 'captions',
  component: DataStreamComponent as any,
  defaultConfig: {
    words: ['FLOW', 'DATA', 'LIVE', 'FEED'],
    colors: ['#00C8FF', '#64FFD2', '#A78BFA', '#FFD700'],
    bgColor: '#050814',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FLOW', 'DATA', 'LIVE', 'FEED'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00C8FF', '#64FFD2', '#A78BFA', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050814', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
