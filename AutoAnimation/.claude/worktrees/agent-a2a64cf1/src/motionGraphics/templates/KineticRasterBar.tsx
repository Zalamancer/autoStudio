import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RasterBarConfig extends KineticBaseConfig {}

// Classic demoscene raster bar color palettes
const RASTER_PALETTES = [
  // Copper gradient: dark red -> bright red -> yellow -> white -> yellow -> bright red -> dark red
  ['#200000', '#400000', '#800000', '#CC0000', '#FF0000', '#FF4400', '#FF8800', '#FFCC00', '#FFFF44', '#FFFFFF',
   '#FFFF44', '#FFCC00', '#FF8800', '#FF4400', '#FF0000', '#CC0000', '#800000', '#400000', '#200000'],
  // Blue copper gradient
  ['#000020', '#000040', '#000080', '#0000CC', '#0000FF', '#0044FF', '#0088FF', '#00CCFF', '#44FFFF', '#FFFFFF',
   '#44FFFF', '#00CCFF', '#0088FF', '#0044FF', '#0000FF', '#0000CC', '#000080', '#000040', '#000020'],
  // Green copper gradient
  ['#002000', '#004000', '#008000', '#00CC00', '#00FF00', '#44FF00', '#88FF00', '#CCFF00', '#FFFF44', '#FFFFFF',
   '#FFFF44', '#CCFF00', '#88FF00', '#44FF00', '#00FF00', '#00CC00', '#008000', '#004000', '#002000'],
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Multiple raster bars scrolling at different speeds
    const barCount = 4
    const barHeight = 38
    const lineHeight = barHeight / 19 // one line per palette entry

    const bars: React.ReactNode[] = []
    for (let b = 0; b < barCount; b++) {
      const palette = RASTER_PALETTES[b % RASTER_PALETTES.length]
      const speed = 40 + b * 15
      const phase = b * 1.8
      const barY = (Math.sin(time * 1.5 + phase) * 0.5 + 0.5) * (height - barHeight)

      // Each bar is a stack of single-pixel-height gradient lines
      palette.forEach((color, lineIdx) => {
        bars.push(
          <div
            key={`bar-${b}-${lineIdx}`}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: barY + lineIdx * lineHeight,
              height: lineHeight + 0.5,
              background: color,
              opacity: 0.35,
              pointerEvents: 'none',
            }}
          />
        )
      })
    }

    // Starfield background (common in demoscene)
    const starCount = 30
    const stars: React.ReactNode[] = []
    for (let s = 0; s < starCount; s++) {
      const seed = s * 73.37
      const sx = ((seed * 137.5 + time * (10 + s * 2)) % width)
      const sy = (seed * 241.3) % height
      const brightness = (Math.sin(seed + time * 3) * 0.5 + 0.5) * 0.3
      stars.push(
        <div
          key={`star-${s}`}
          style={{
            position: 'absolute',
            left: sx,
            top: sy,
            width: 2,
            height: 2,
            background: '#FFFFFF',
            opacity: brightness,
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {stars}
        {bars}

        {/* Demo party scroll text at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 6,
            left: 0,
            right: 0,
            overflow: 'hidden',
            height: 14,
          }}
        >
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 10,
              color: '#888',
              opacity: 0.2,
              whiteSpace: 'nowrap',
              transform: `translateX(${width - (time * 50) % (width * 2)}px)`,
            }}
          >
            {'--- GREETINGS TO ALL DEMO GROUPS WORLDWIDE --- CODED IN 2026 --- RASTER BARS FOREVER ---'}
          </div>
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame, width: w, height: h }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30

    // Raster bar behind the text (follows the text position)
    const textBarPalette = RASTER_PALETTES[0]
    const textBarHeight = 60
    const lineH = textBarHeight / textBarPalette.length

    if (phase === 'enter') {
      // Sine wave entrance: text swings in from the side with raster bar
      const swingX = (1 - enterProgress) * w * 0.8
      const sineY = Math.sin(enterProgress * Math.PI * 2) * 30

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${swingX}px), calc(-50% + ${sineY}px))`,
          }}
        >
          {/* Raster bar behind text */}
          <div style={{ position: 'absolute', left: -w, right: -w, top: -textBarHeight / 2, height: textBarHeight, overflow: 'hidden', pointerEvents: 'none' }}>
            {textBarPalette.map((barColor, li) => (
              <div
                key={`tbar-${li}`}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: li * lineH,
                  height: lineH + 0.5,
                  background: barColor,
                  opacity: 0.5 * enterProgress,
                }}
              />
            ))}
          </div>
          <div
            style={{
              position: 'relative',
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textShadow: `0 0 10px ${color}, 2px 2px 0 rgba(0,0,0,0.8)`,
              textAlign: 'center',
            }}
          >
            {word}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Demoscene sine scroller: text characters wave up and down
      const chars = word.split('')
      const elements = chars.map((ch, ci) => {
        const sineOffset = Math.sin(time * 3 + ci * 0.6) * 12
        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              transform: `translateY(${sineOffset}px)`,
              color,
              textShadow: `0 0 8px ${color}, 0 0 20px ${color}40`,
            }}
          >
            {ch}
          </span>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Raster bar behind text */}
          <div style={{ position: 'absolute', left: -w, right: -w, top: -textBarHeight / 2, height: textBarHeight, overflow: 'hidden', pointerEvents: 'none' }}>
            {textBarPalette.map((barColor, li) => (
              <div
                key={`tbar-${li}`}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: li * lineH + Math.sin(time * 2 + li * 0.3) * 2,
                  height: lineH + 0.5,
                  background: barColor,
                  opacity: 0.5,
                }}
              />
            ))}
          </div>
          <div
            style={{
              position: 'relative',
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textAlign: 'center',
            }}
          >
            {elements}
          </div>
        </div>
      )
    } else {
      // Exit: text scrolls off with sine wave, raster bars fade
      const swingX = exitProgress * w * -0.8
      const sineY = Math.sin(exitProgress * Math.PI * 2) * 30
      const fade = 1 - exitProgress

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${swingX}px), calc(-50% + ${sineY}px))`,
            opacity: fade,
          }}
        >
          {/* Raster bar behind text */}
          <div style={{ position: 'absolute', left: -w, right: -w, top: -textBarHeight / 2, height: textBarHeight, overflow: 'hidden', pointerEvents: 'none' }}>
            {textBarPalette.map((barColor, li) => (
              <div
                key={`tbar-${li}`}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: li * lineH,
                  height: lineH + 0.5,
                  background: barColor,
                  opacity: 0.5 * fade,
                }}
              />
            ))}
          </div>
          <div
            style={{
              position: 'relative',
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textShadow: `0 0 10px ${color}, 2px 2px 0 rgba(0,0,0,0.8)`,
              textAlign: 'center',
            }}
          >
            {word}
          </div>
        </div>
      )
    }
  },
}

function RasterBarComponent(props: MotionGraphicProps<RasterBarConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-raster-bar',
  title: 'Kinetic Raster Bar',
  description:
    'Demoscene raster bars with copper gradient horizontal bars scrolling behind text, sine wave character animation, starfield, and demo party scroll text',
  tags: ['kinetic', 'typography', 'raster', 'demoscene', 'copper', 'amiga', 'retro', 'computing', 'demo'],
  category: 'captions',
  component: RasterBarComponent as any,
  defaultConfig: {
    words: ['DEMO', 'SCENE', 'CODER', 'PARTY'],
    colors: ['#FFFFFF', '#FFFF44', '#44FFFF', '#FF44FF'],
    bgColor: '#000000',
    cycleDuration: 1.4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['DEMO', 'SCENE', 'CODER', 'PARTY'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#FFFF44', '#44FFFF', '#FF44FF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000000', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
