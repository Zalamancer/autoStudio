import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MacroblockCrushConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// JPEG/H.264 macroblock compression — 8x8 or 16x16 pixel blocks
// At high compression: blocks become visible, colors average across block
// Classic "buffering" or "bad stream" artifact

const BLOCK_SIZE = 16 // 16x16 macroblock

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    const w = width ?? 400
    const h = height ?? 700
    const cols = Math.ceil(w / BLOCK_SIZE)
    const rows = Math.ceil(h / BLOCK_SIZE)

    // Background macroblocks — very subtle, some frozen from wrong frame
    const frozenBlocks = Array.from({ length: 8 }, (_, i) => {
      const col = Math.floor(rand(i * 37 + Math.floor(time * 0.3)) * cols)
      const row = Math.floor(rand(i * 43 + Math.floor(time * 0.3)) * rows)
      const hue = Math.floor(rand(i * 71) * 360)
      return { col, row, hue }
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {frozenBlocks.map((b, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: b.col * BLOCK_SIZE,
              top: b.row * BLOCK_SIZE,
              width: BLOCK_SIZE,
              height: BLOCK_SIZE,
              background: `hsl(${b.hue}, 60%, 40%)`,
              opacity: 0.06,
            }}
          />
        ))}
        {/* QP (quantization parameter) readout */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 12,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(255,180,0,0.25)',
            letterSpacing: 1,
          }}
        >
          QP: {Math.floor(28 + Math.sin(time * 0.8) * 23)} | BITRATE: {Math.floor(200 + Math.abs(Math.sin(time * 1.2)) * 800)}kbps
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 18,
            right: 12,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(255,100,0,0.18)',
          }}
        >
          I-FRAME LOSS  MBs CORRUPTED
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 149 + 83
    const w = width ?? 400
    const h = height ?? 700
    const cols = Math.ceil(w / BLOCK_SIZE)
    const rows = Math.ceil(h / BLOCK_SIZE)

    // Generate macroblocks covering the text area during corruption
    const getBlocks = (density: number, frameSeed: number) => {
      const blocks: { col: number; row: number; color: string }[] = []
      // Focus blocks around center where text is
      const textCols = Math.ceil(w * 0.8 / BLOCK_SIZE)
      const textRows = Math.ceil(h * 0.4 / BLOCK_SIZE)
      const startCol = Math.floor(cols * 0.1)
      const startRow = Math.floor(rows * 0.3)

      for (let r = 0; r < textRows; r++) {
        for (let c = 0; c < textCols; c++) {
          const s = c * 7 + r * 13 + frameSeed
          if (rand(s) < density) {
            // Macroblock color: averaged color from wrong frame
            const hue = Math.floor(rand(s + 1) * 360)
            const sat = Math.floor(rand(s + 2) * 80)
            const lit = Math.floor(rand(s + 3) * 60 + 20)
            blocks.push({
              col: startCol + c,
              row: startRow + r,
              color: `hsl(${hue}, ${sat}%, ${lit}%)`,
            })
          }
        }
      }
      return blocks
    }

    let blockDensity = 0
    let textOpacity = 1

    if (phase === 'enter') {
      // High compression on enter: massive macroblock crush, text emerges
      blockDensity = (1 - enterProgress) * 0.85
      textOpacity = enterProgress * 0.3 + enterProgress * enterProgress * 0.7
    } else if (phase === 'hold') {
      // Low but non-zero — occasional block dropout
      const dropout = holdProgress > 0.4 && holdProgress < 0.48
      blockDensity = dropout ? 0.5 : 0.05
      textOpacity = 1
    } else {
      blockDensity = exitProgress * 0.9
      textOpacity = 1 - exitProgress
    }

    const blocks = getBlocks(blockDensity, Math.floor(f * 2) + seed)

    return (
      <>
        {/* Macroblock overlay */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {blocks.map((b, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: b.col * BLOCK_SIZE,
                top: b.row * BLOCK_SIZE,
                width: BLOCK_SIZE,
                height: BLOCK_SIZE,
                background: b.color,
                opacity: 0.8,
              }}
            />
          ))}
        </div>
        {/* Text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 11vw, 160px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
            opacity: textOpacity,
            textShadow: `0 0 12px ${color}60`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function MacroblockCrushComponent(props: MotionGraphicProps<MacroblockCrushConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-macroblock-crush',
  title: 'Kinetic Macroblock Crush',
  description: 'JPEG/H.264 macroblock compression artifact — text emerges from a sea of 16x16 color blocks with bitrate and quantization readouts',
  tags: ['kinetic', 'typography', 'glitch', 'codec', 'compression', 'macroblock', 'jpeg', 'digital', 'stream'],
  category: 'captions',
  component: MacroblockCrushComponent as any,
  defaultConfig: {
    words: ['STREAM', 'BUFFER', 'DECODE', 'BITRATE'],
    colors: ['#FFE066', '#FFCC00', '#FFE066', '#FFDD44'],
    bgColor: '#080600',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['STREAM', 'BUFFER', 'DECODE', 'BITRATE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFE066', '#FFCC00', '#FFE066', '#FFDD44'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080600', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
