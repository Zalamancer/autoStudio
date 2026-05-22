import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PNGInterlaceConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/**
 * PNG Adam7 interlace passes — 7 passes with specific row/col sampling:
 * Pass 1: every 8th col, every 8th row (offset 0,0)
 * Pass 2: every 8th col offset 4, every 8th row
 * Pass 3: every 4th col, every 8th row offset 4
 * Pass 4: every 4th col offset 2, every 4th row
 * Pass 5: every 2nd col, every 4th row offset 2
 * Pass 6: every 2nd col offset 1, every 2nd row
 * Pass 7: every col, every 2nd row offset 1
 */
const ADAM7_PASSES = [
  { colStep: 8, colOff: 0, rowStep: 8, rowOff: 0 },
  { colStep: 8, colOff: 4, rowStep: 8, rowOff: 0 },
  { colStep: 4, colOff: 0, rowStep: 8, rowOff: 4 },
  { colStep: 4, colOff: 2, rowStep: 4, rowOff: 0 },
  { colStep: 2, colOff: 0, rowStep: 4, rowOff: 2 },
  { colStep: 2, colOff: 1, rowStep: 2, rowOff: 0 },
  { colStep: 1, colOff: 0, rowStep: 2, rowOff: 1 },
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Show PNG file header and IHDR/IDAT chunk info in corner
    const chunkLabel = ['IHDR', 'IDAT', 'IDAT', 'IDAT', 'IDAT', 'IEND'][Math.floor(time * 0.8) % 6]

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* PNG signature bytes */}
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(100, 200, 255, 0.12)',
            letterSpacing: 1,
          }}
        >
          89 50 4E 47 0D 0A 1A 0A — {chunkLabel}
        </div>
        {/* Interlace mode label */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(100, 200, 255, 0.10)',
          }}
        >
          INTERLACE TYPE 1 (ADAM7)
        </div>
        {/* Subtle grid lines suggesting scanlines */}
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${(i + 1) * (100 / 7)}%`,
              height: 1,
              background: 'rgba(100, 180, 255, 0.03)',
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 211 + 47

    // Determine which Adam7 pass is "loaded" based on progress
    const totalPasses = ADAM7_PASSES.length

    if (phase === 'enter') {
      // Each of 7 passes loads sequentially — text materialises in scan bands
      const passProgress = enterProgress * totalPasses
      const completedPasses = Math.floor(passProgress)

      // Clip path simulation: show only rows that correspond to completed passes
      // We layer the text 7 times with different clip-path to show pass-by-pass reveal
      const passLayers = ADAM7_PASSES.map((pass, pi) => {
        const passComplete = pi < completedPasses
        const passCurrent = pi === completedPasses
        const passPartial = passCurrent ? passProgress - completedPasses : 0

        if (!passComplete && !passCurrent) return null

        const opacity = passComplete ? 1 : passPartial
        // Blur decreases as more passes are loaded
        const blurPx = Math.max(0, (totalPasses - completedPasses - 1) * 0.6)
        // Early passes are very blocky (large pixelation)
        const pixelScale = Math.max(1, Math.pow(2, totalPasses - 1 - pi))

        return (
          <div
            key={pi}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%)`,
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(42px, 13vw, 170px)',
              fontWeight: 900,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              color,
              opacity: passComplete ? 1 : opacity,
              filter: blurPx > 0 ? `blur(${blurPx}px)` : undefined,
              imageRendering: pixelScale > 1 ? 'pixelated' : undefined,
            }}
          >
            {word}
          </div>
        )
      })

      // Pass indicator
      const passNum = Math.min(completedPasses + 1, totalPasses)
      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {passLayers}
          <div
            style={{
              position: 'absolute',
              bottom: 28,
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 9,
              color: `${color}60`,
              letterSpacing: 2,
              whiteSpace: 'nowrap',
            }}
          >
            PASS {passNum}/{totalPasses}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Fully loaded — sharp, stable
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(42px, 13vw, 170px)',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            color,
            textShadow: `0 0 10px ${color}30`,
          }}
        >
          {word}
        </div>
      )
    } else {
      // Exit: reverse interlace — text de-resolves back to coarse passes
      const depassProgress = exitProgress * totalPasses
      const remainingPasses = totalPasses - Math.floor(depassProgress)
      const blurPx = (totalPasses - remainingPasses) * 0.8

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(42px, 13vw, 170px)',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            color,
            opacity: Math.max(0, 1 - exitProgress * 1.2),
            filter: blurPx > 0 ? `blur(${blurPx}px)` : undefined,
          }}
        >
          {word}
        </div>
      )
    }
  },
}

function PNGInterlaceComponent(props: MotionGraphicProps<PNGInterlaceConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-png-interlace',
  title: 'Kinetic PNG Interlace',
  description:
    'PNG Adam7 interlaced loading: text appears pass by pass from coarse to fine resolution, simulating progressive scan image loading.',
  tags: ['kinetic', 'typography', 'glitch', 'png', 'interlace', 'progressive', 'digital', 'loading'],
  category: 'captions',
  component: PNGInterlaceComponent as any,
  defaultConfig: {
    words: ['LOADING', 'RENDER', 'PASS', 'SHARP'],
    colors: ['#40C8FF', '#20A0FF', '#60E0FF', '#0080FF'],
    bgColor: '#020810',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LOADING', 'RENDER', 'PASS', 'SHARP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#40C8FF', '#20A0FF', '#60E0FF', '#0080FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020810', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.3, max: 5, group: 'Timing' },
  ],
})
