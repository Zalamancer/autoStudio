import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TetrisDropConfig extends KineticBaseConfig {}

function pRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Simple 4x4 Tetris-style block shapes (each shape is array of [col,row] offsets)
const TETROMINOS: Array<Array<[number, number]>> = [
  [[0,0],[1,0],[2,0],[3,0]],   // I
  [[0,0],[1,0],[2,0],[2,1]],   // L
  [[0,0],[1,0],[2,0],[0,1]],   // J
  [[0,0],[1,0],[1,1],[2,1]],   // S
  [[1,0],[2,0],[0,1],[1,1]],   // Z
  [[0,0],[1,0],[0,1],[1,1]],   // O
  [[1,0],[0,1],[1,1],[2,1]],   // T
]

function easeOutBounce(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75 }
  if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375 }
  t -= 2.625 / 2.75; return 7.5625 * t * t + 0.984375
}

const TETRIS_COLORS = ['#00f0f0', '#f0a000', '#0000f0', '#f00000', '#00f000', '#a000f0', '#f0f000']
const BLOCK_COLS = 10
const BLOCK_ROWS = 8

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Tetris grid lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: [
              'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
              'linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            ].join(', '),
            backgroundSize: `${100 / BLOCK_COLS}% ${100 / BLOCK_ROWS}%`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const chars = word.toUpperCase().split('')
    const wordLen = chars.length

    const blockW = Math.floor(width * 0.8 / BLOCK_COLS)
    const blockH = Math.floor(height * 0.8 / BLOCK_ROWS)
    const blockSize = Math.min(blockW, blockH, 40)
    const gridW = BLOCK_COLS * blockSize
    const gridH = BLOCK_ROWS * blockSize
    const offsetX = (width - gridW) / 2
    const offsetY = (height - gridH) / 2

    // Each character occupies one "column slot", rendered as a stack of blocks
    // Letters are drawn as 3×5 pixel font using blocks
    const CHAR_PIXELS: Record<string, number[][]> = {
      A: [[0,1,0],[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
      B: [[1,1,0],[1,0,1],[1,1,0],[1,0,1],[1,1,0]],
      C: [[0,1,1],[1,0,0],[1,0,0],[1,0,0],[0,1,1]],
      D: [[1,1,0],[1,0,1],[1,0,1],[1,0,1],[1,1,0]],
      E: [[1,1,1],[1,0,0],[1,1,0],[1,0,0],[1,1,1]],
      F: [[1,1,1],[1,0,0],[1,1,0],[1,0,0],[1,0,0]],
      G: [[0,1,1],[1,0,0],[1,0,1],[1,0,1],[0,1,1]],
      H: [[1,0,1],[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
      I: [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[1,1,1]],
      J: [[0,0,1],[0,0,1],[0,0,1],[1,0,1],[0,1,1]],
      K: [[1,0,1],[1,1,0],[1,0,0],[1,1,0],[1,0,1]],
      L: [[1,0,0],[1,0,0],[1,0,0],[1,0,0],[1,1,1]],
      M: [[1,0,1],[1,1,1],[1,1,1],[1,0,1],[1,0,1]],
      N: [[1,0,1],[1,1,1],[1,1,1],[1,1,1],[1,0,1]],
      O: [[0,1,0],[1,0,1],[1,0,1],[1,0,1],[0,1,0]],
      P: [[1,1,0],[1,0,1],[1,1,0],[1,0,0],[1,0,0]],
      Q: [[0,1,0],[1,0,1],[1,0,1],[1,1,1],[0,1,1]],
      R: [[1,1,0],[1,0,1],[1,1,0],[1,1,0],[1,0,1]],
      S: [[0,1,1],[1,0,0],[0,1,0],[0,0,1],[1,1,0]],
      T: [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[0,1,0]],
      U: [[1,0,1],[1,0,1],[1,0,1],[1,0,1],[0,1,1]],
      V: [[1,0,1],[1,0,1],[1,0,1],[0,1,0],[0,1,0]],
      W: [[1,0,1],[1,0,1],[1,1,1],[1,1,1],[1,0,1]],
      X: [[1,0,1],[1,0,1],[0,1,0],[1,0,1],[1,0,1]],
      Y: [[1,0,1],[1,0,1],[0,1,0],[0,1,0],[0,1,0]],
      Z: [[1,1,1],[0,0,1],[0,1,0],[1,0,0],[1,1,1]],
      ' ': [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],
    }

    const CHAR_W = 3
    const CHAR_H = 5
    const charGap = 1
    const totalCharCols = wordLen * (CHAR_W + charGap) - charGap

    const charBlockSize = Math.min(
      Math.floor((width * 0.75) / totalCharCols),
      Math.floor((height * 0.65) / CHAR_H),
      36,
    )

    const totalW = totalCharCols * charBlockSize
    const totalH = CHAR_H * charBlockSize
    const startX = (width - totalW) / 2
    const startY = (height - totalH) / 2

    // Line clear flash: triggers at end of enter phase
    const lineClearFlash = phase === 'enter' && enterProgress > 0.88
      ? Math.sin((enterProgress - 0.88) / 0.12 * Math.PI * 6) * 0.5 + 0.5
      : 0

    const nodes: React.ReactNode[] = []

    for (let ci = 0; ci < wordLen; ci++) {
      const charKey = chars[ci] in CHAR_PIXELS ? chars[ci] : ' '
      const pixelMap = CHAR_PIXELS[charKey]
      const charX = startX + ci * (CHAR_W + charGap) * charBlockSize

      // Each character drops in as a Tetromino piece — stagger by character index
      // Use deterministic tetromino shape for each character
      const tetrominoIdx = Math.floor(pRand(index * 53 + ci * 17) * TETROMINOS.length)
      const tetroColor = TETRIS_COLORS[Math.floor(pRand(index * 37 + ci * 23) * TETRIS_COLORS.length)]

      // Drop delay per character (left to right)
      const dropDelay = ci / wordLen * 0.55
      const dropDuration = 0.35

      for (let row = 0; row < CHAR_H; row++) {
        for (let col = 0; col < CHAR_W; col++) {
          const isOn = pixelMap[row]?.[col] === 1
          if (!isOn) continue

          // Each block drops with slight stagger within character
          const blockDelay = dropDelay + (row / CHAR_H) * 0.08
          const blockProgress = Math.max(0, Math.min(1, (enterProgress - blockDelay) / dropDuration))
          const bounced = easeOutBounce(blockProgress)

          const finalX = charX + col * charBlockSize
          const finalY = startY + row * charBlockSize

          // Drop from above the grid
          const dropY = finalY - height * 0.6 * (1 - bounced)

          let blockOpacity = 0
          let blockY = dropY

          if (phase === 'enter') {
            blockOpacity = Math.min(1, blockProgress * 4)
            blockY = dropY
          } else if (phase === 'hold') {
            blockOpacity = 1
            blockY = finalY
          } else {
            // Exit: blocks slide off sideways
            blockOpacity = 1 - exitProgress * 1.2
            blockY = finalY + exitProgress * height * 0.3
          }

          const bSize = charBlockSize - 2
          nodes.push(
            <div
              key={`${ci}-${row}-${col}`}
              style={{
                position: 'absolute',
                left: finalX + 1,
                top: blockY + 1,
                width: bSize,
                height: bSize,
                background: tetroColor,
                opacity: Math.max(0, Math.min(1, blockOpacity)),
                boxShadow: `inset -2px -2px 0 rgba(0,0,0,0.3), inset 2px 2px 0 rgba(255,255,255,0.4)`,
              }}
            />,
          )
        }
      }
    }

    // Line clear flash overlay
    if (lineClearFlash > 0) {
      nodes.push(
        <div
          key="line-clear"
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(255,255,255,${lineClearFlash * 0.6})`,
            pointerEvents: 'none',
          }}
        />,
      )
    }

    return <>{nodes}</>
  },
}

function TetrisDropComponent(props: MotionGraphicProps<TetrisDropConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-tetris-drop',
  title: 'Kinetic Tetris Drop',
  description: 'Tetris blocks fall and stack to spell out text in a pixel font — each character drops as a colored piece with bounce, ending with a line-clear flash',
  tags: ['kinetic', 'typography', 'tetris', 'blocks', 'drop', 'game', 'pixel', 'stack'],
  category: 'captions',
  component: TetrisDropComponent as any,
  defaultConfig: {
    words: ['TETRIS', 'DROP', 'STACK', 'CLEAR'],
    colors: ['#00f0f0', '#f0a000', '#00f0f0', '#f0a000'],
    bgColor: '#0d0d1a',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TETRIS', 'DROP', 'STACK', 'CLEAR'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00f0f0', '#f0a000', '#00f0f0', '#f0a000'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 6, group: 'Timing' },
  ],
})
