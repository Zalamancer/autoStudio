import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SubwayTileConfig extends KineticBaseConfig {}

const TILE_COLORS = ['#2b5797', '#1e3c6e', '#3a6baa', '#244e85']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    const tileSize = 18
    const cols = Math.ceil(width / tileSize) + 1
    const rows = Math.ceil(height / tileSize) + 1

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Ceramic subway tile grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(to right, rgba(0,0,0,0.12) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0,0,0,0.12) 1px, transparent 1px)
            `,
            backgroundSize: `${tileSize}px ${tileSize}px`,
          }}
        />
        {/* Tile glaze sheen */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 30%, rgba(255,255,255,0.02) 70%, transparent 100%)',
          }}
        />
        {/* Station name band — white tile strip */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: 0,
            right: 0,
            height: '40%',
            background: '#e8e0d0',
            borderTop: '4px solid #1a3a5c',
            borderBottom: '4px solid #1a3a5c',
          }}
        >
          {/* Hairline cracks in old tile */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `
                linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)
              `,
              backgroundSize: `${tileSize}px ${tileSize}px`,
            }}
          />
        </div>
        {/* Top color accent bar */}
        <div
          style={{
            position: 'absolute',
            top: '28%',
            left: 0,
            right: 0,
            height: 6,
            background: '#1e6b35',
          }}
        />
        {/* Bottom color accent bar */}
        <div
          style={{
            position: 'absolute',
            top: '72%',
            left: 0,
            right: 0,
            height: 6,
            background: '#1e6b35',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    const chars = word.toUpperCase().split('')
    const opacity = phase === 'exit' ? 1 - exitProgress * exitProgress : 1

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 3,
          opacity,
        }}
      >
        {chars.map((char, ci) => {
          // Staggered mosaic tile assembly
          const staggerDelay = ci * 0.1
          const charProgress = phase === 'enter'
            ? Math.max(0, Math.min(1, (enterProgress - staggerDelay) / (0.6)))
            : 1

          // Tile materializes: drops in from above and settles
          const tileOpacity = Math.min(1, charProgress * 3)
          const tileY = (1 - Math.min(1, charProgress * 1.5)) * -40
          const tileScale = charProgress < 0.3 ? 0.5 + charProgress * 1.67 : 1
          const tileRotate = (1 - charProgress) * (ci % 2 === 0 ? 15 : -15)

          // Pick a slightly varied tile background
          const tileBg = TILE_COLORS[ci % TILE_COLORS.length]

          if (char === ' ') {
            return <div key={ci} style={{ width: 'clamp(12px, 3vw, 30px)' }} />
          }

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                width: 'clamp(30px, 7vw, 78px)',
                height: 'clamp(38px, 9vw, 96px)',
                background: tileBg,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `translateY(${tileY}px) scale(${tileScale}) rotate(${tileRotate}deg)`,
                opacity: tileOpacity,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              {/* Tile glaze highlight */}
              <div
                style={{
                  position: 'absolute',
                  inset: 2,
                  borderRadius: 1,
                  background: 'linear-gradient(160deg, rgba(255,255,255,0.12) 0%, transparent 40%)',
                  pointerEvents: 'none',
                }}
              />
              {/* Mosaic character */}
              <span
                style={{
                  position: 'relative',
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontSize: 'clamp(22px, 5.5vw, 60px)',
                  fontWeight: 700,
                  color,
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                }}
              >
                {char}
              </span>
            </div>
          )
        })}
      </div>
    )
  },
}

function SubwayTileComponent(props: MotionGraphicProps<SubwayTileConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-subway-tile',
  title: 'Subway Station Tile',
  description:
    'NYC subway station mosaic tile letters assembling one by one onto a white ceramic tile band. Each letter is a colored tile that drops and settles into place.',
  tags: ['kinetic', 'typography', 'subway', 'tile', 'mosaic', 'nyc', 'station', 'signage', 'wayfinding'],
  category: 'captions',
  component: SubwayTileComponent as any,
  defaultConfig: {
    words: ['TIMES SQ', '42 ST', 'BROADWAY', 'UPTOWN'],
    colors: ['#f5f0e0', '#f5f0e0', '#f5f0e0', '#f5f0e0'],
    bgColor: '#d4cbb8',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TIMES SQ', '42 ST', 'BROADWAY', 'UPTOWN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#f5f0e0', '#f5f0e0', '#f5f0e0', '#f5f0e0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#d4cbb8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 5, group: 'Timing' },
  ],
})
