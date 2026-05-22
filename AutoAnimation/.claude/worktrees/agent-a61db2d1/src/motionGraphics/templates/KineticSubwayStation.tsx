import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SubwayStationConfig extends KineticBaseConfig {
  borderColor: string
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    // Subway tile grid dimensions
    const tileW = 28
    const tileH = 14
    const cols = Math.ceil(width / tileW) + 1
    const rows = Math.ceil(height / tileH) + 1

    return (
      <div style={{ position: 'absolute', inset: 0, background: '#e8e4da' }}>
        {/* White subway tile grid — subtle grout lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent ${tileH}px),
              repeating-linear-gradient(90deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent ${tileW}px)
            `,
            pointerEvents: 'none',
          }}
        />
        {/* Brick bond offset for every other row */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(0deg,
                transparent 0px, transparent ${tileH}px,
                rgba(0,0,0,0.03) ${tileH}px, rgba(0,0,0,0.03) ${tileH + 1}px,
                transparent ${tileH + 1}px, transparent ${tileH * 2}px
              )
            `,
            pointerEvents: 'none',
          }}
        />
        {/* Individual tile sheen — slight glaze variation */}
        {Array.from({ length: 12 }, (_, i) => {
          const tx = rand(i * 31) * width
          const ty = rand(i * 47 + 13) * height
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: tx,
                top: ty,
                width: tileW * 2,
                height: tileH,
                background: `rgba(255,255,255,${0.2 + rand(i * 67) * 0.15})`,
                pointerEvents: 'none',
              }}
            />
          )
        })}
        {/* Colored tile border band — top */}
        <div
          style={{
            position: 'absolute',
            top: '22%',
            left: 0,
            right: 0,
            height: tileH * 2,
            background: bgColor,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.1)`,
          }}
        />
        {/* Colored tile border band — bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '22%',
            left: 0,
            right: 0,
            height: tileH * 2,
            background: bgColor,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.1)`,
          }}
        />
        {/* Tile aging / patina spots */}
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={`patina-${i}`}
            style={{
              position: 'absolute',
              left: `${15 + rand(i * 53) * 70}%`,
              top: `${10 + rand(i * 79) * 80}%`,
              width: 40 + rand(i * 23) * 60,
              height: 20 + rand(i * 41) * 30,
              background: `rgba(180,170,140,${0.05 + rand(i * 11) * 0.06})`,
              borderRadius: 2,
              filter: 'blur(4px)',
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Fluorescent ceiling light reflection */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '20%',
            right: '20%',
            height: '15%',
            background: 'linear-gradient(180deg, rgba(255,255,240,0.08) 0%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    const chars = word.toUpperCase().split('')
    const totalChars = chars.length

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 'clamp(3px, 1vw, 10px)',
          whiteSpace: 'nowrap',
        }}
      >
        {chars.map((ch, ci) => {
          const charDelay = ci / (totalChars + 1) * 0.5

          let tileOpacity = 0
          let mosaicProgress = 0
          let groutVisible = false

          if (phase === 'enter') {
            // Mosaic tiles materialize — small tiles assemble into each letter
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.5)))
            const eased = easeOutQuad(p)
            tileOpacity = eased
            mosaicProgress = eased
            groutVisible = p > 0.3
          } else if (phase === 'hold') {
            tileOpacity = 1
            mosaicProgress = 1
            groutVisible = true
          } else {
            const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.3) / (1 - charDelay * 0.2)))
            tileOpacity = 1 - easeOutQuad(p)
            mosaicProgress = 1
            groutVisible = true
          }

          if (ch === ' ') {
            return <div key={ci} style={{ width: 'clamp(10px, 2.5vw, 24px)' }} />
          }

          // Each letter is rendered as colored mosaic tiles
          const tileColor = color
          const darkTile = `rgba(0,0,0,0.15)`

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
              }}
            >
              {/* Mosaic tile letter */}
              <span
                style={{
                  fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
                  fontSize: 'clamp(36px, 11vw, 140px)',
                  fontWeight: 900,
                  color: tileColor,
                  opacity: tileOpacity,
                  display: 'inline-block',
                  lineHeight: 1,
                  letterSpacing: 2,
                  // Tile texture overlay via text shadow to simulate grout depth
                  textShadow: groutVisible
                    ? '1px 1px 0 rgba(0,0,0,0.15), -1px -1px 0 rgba(255,255,255,0.1)'
                    : 'none',
                  // Slight inner shadow to create tile depth
                  filter: mosaicProgress > 0.5
                    ? 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))'
                    : 'none',
                }}
              >
                {ch}
              </span>
              {/* Tile edge / grout gap simulation — outline stroke */}
              {groutVisible && tileOpacity > 0.4 && (
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
                    fontSize: 'clamp(36px, 11vw, 140px)',
                    fontWeight: 900,
                    color: 'transparent',
                    WebkitTextStroke: '1px rgba(180,170,140,0.3)',
                    display: 'inline-block',
                    lineHeight: 1,
                    letterSpacing: 2,
                    pointerEvents: 'none',
                    opacity: tileOpacity * 0.6,
                  }}
                >
                  {ch}
                </span>
              )}
              {/* Glaze sheen on the tile surface */}
              {mosaicProgress > 0.7 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '10%',
                    left: '20%',
                    width: '30%',
                    height: '15%',
                    background: 'rgba(255,255,255,0.12)',
                    borderRadius: 1,
                    filter: 'blur(2px)',
                    pointerEvents: 'none',
                    opacity: tileOpacity,
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  },
}

function SubwayStationComponent(props: MotionGraphicProps<SubwayStationConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-subway-station',
  title: 'Subway Station Tile',
  description:
    'Text rendered as colored mosaic tile letters on a white subway tile wall. Features grout lines, tile glaze sheen, colored border bands, and fluorescent station lighting.',
  tags: ['kinetic', 'typography', 'subway', 'station', 'tile', 'mosaic', 'mta', 'underground', 'signage', 'transit'],
  category: 'captions',
  component: SubwayStationComponent as any,
  defaultConfig: {
    words: ['BROADWAY', 'DOWNTOWN', 'UPTOWN', 'EXPRESS'],
    colors: ['#003DA5', '#003DA5', '#009B3A', '#EE352E'],
    bgColor: '#003DA5',
    cycleDuration: 1.3,
    borderColor: '#003DA5',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BROADWAY', 'DOWNTOWN', 'UPTOWN', 'EXPRESS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#003DA5', '#003DA5', '#009B3A', '#EE352E'], group: 'Style' },
    { key: 'bgColor', label: 'Border Color', type: 'color', defaultValue: '#003DA5', group: 'Style' },
    { key: 'borderColor', label: 'Tile Band Color', type: 'color', defaultValue: '#003DA5', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
