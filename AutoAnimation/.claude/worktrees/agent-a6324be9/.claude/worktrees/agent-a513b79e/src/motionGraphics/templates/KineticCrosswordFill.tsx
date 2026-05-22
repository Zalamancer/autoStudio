import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CrosswordFillConfig extends KineticBaseConfig {}

function pRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const GRID_COLS = 10
const GRID_ROWS = 7

// Crossing delay: across letters fill left-to-right, down letters fill top-to-bottom offset by column
function getCrossDelay(charCol: number, row: number, wordLen: number): number {
  const centerRow = Math.floor(GRID_ROWS / 2)
  if (row === centerRow) {
    return (charCol / wordLen) * 0.55
  }
  const acrossDelay = (charCol / wordLen) * 0.4 + 0.1
  const verticalDelay = (Math.abs(row - centerRow) / (GRID_ROWS / 2)) * 0.35
  return acrossDelay + verticalDelay
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        backgroundImage: [
          'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          'linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
        ].join(', '),
        backgroundSize: '40px 40px',
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    const chars = word.toUpperCase().split('')
    const wordLen = chars.length

    const cellSize = Math.min(
      Math.floor((width * 0.72) / GRID_COLS),
      Math.floor((height * 0.72) / GRID_ROWS),
      52,
    )
    const centerRow = Math.floor(GRID_ROWS / 2)
    const wordStartCol = Math.floor((GRID_COLS - wordLen) / 2)

    type CellDef = { col: number; row: number; letter: string; isWord: boolean; charCol: number }
    const cells: CellDef[] = []

    // Main across word
    for (let ci = 0; ci < wordLen; ci++) {
      cells.push({ col: wordStartCol + ci, row: centerRow, letter: chars[ci], isWord: true, charCol: ci })
    }

    // Crossing down letters on odd columns
    for (let ci = 0; ci < wordLen; ci++) {
      if (ci % 2 !== 1) continue
      const col = wordStartCol + ci
      for (let r = 0; r < GRID_ROWS; r++) {
        if (r === centerRow) continue
        const crossLetter = ALPHA[Math.floor(pRand(index * 73 + ci * 31 + r * 17) * 26)]
        cells.push({ col, row: r, letter: crossLetter, isWord: false, charCol: ci })
      }
    }

    // Extra horizontal crossing rows above and below
    const crossRowTop = centerRow - 2
    const crossRowBot = centerRow + 2
    if (wordLen >= 3) {
      const crossStartCol = wordStartCol + 1
      const crossLen = Math.min(wordLen - 1, 5)
      for (let ci = 0; ci < crossLen; ci++) {
        const colT = crossStartCol + ci
        const colB = crossStartCol + ci
        if (colT < GRID_COLS) {
          cells.push({ col: colT, row: crossRowTop, letter: ALPHA[Math.floor(pRand(index * 53 + ci * 19 + 200) * 26)], isWord: false, charCol: ci })
        }
        if (colB < GRID_COLS) {
          cells.push({ col: colB, row: crossRowBot, letter: ALPHA[Math.floor(pRand(index * 91 + ci * 37 + 400) * 26)], isWord: false, charCol: ci })
        }
      }
    }

    const gridTotalW = GRID_COLS * cellSize
    const gridTotalH = GRID_ROWS * cellSize
    const offsetX = (width - gridTotalW) / 2
    const offsetY = (height - gridTotalH) / 2
    const inner = cellSize - 3

    const nodes: React.ReactNode[] = []

    // Black squares for unfilled grid cells
    const filledSet = new Set(cells.map((c) => `${c.col},${c.row}`))
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (filledSet.has(`${c},${r}`)) continue
        const blackOpacity =
          phase === 'enter' ? Math.min(1, enterProgress * 3) :
          phase === 'exit' ? Math.max(0, 1 - exitProgress * 2) : 1
        nodes.push(
          <div
            key={`black-${c}-${r}`}
            style={{
              position: 'absolute',
              left: offsetX + c * cellSize + 1.5,
              top: offsetY + r * cellSize + 1.5,
              width: inner,
              height: inner,
              background: `rgba(0,0,0,${blackOpacity * 0.75})`,
              border: '1px solid rgba(0,0,0,0.3)',
            }}
          />,
        )
      }
    }

    // Letter cells
    for (const cell of cells) {
      const delay = Math.min(getCrossDelay(cell.charCol, cell.row, wordLen), 0.85)

      let bgOpacity = 0
      let letterOpacity = 0

      if (phase === 'enter') {
        const cellProgress = Math.max(0, Math.min(1, (enterProgress - delay) / 0.4))
        bgOpacity = Math.min(1, cellProgress * 2)
        letterOpacity = Math.max(0, (cellProgress - 0.4) / 0.6)
        // Cursor blink on last letter at the very end of enter
        if (cell.isWord && cell.charCol === wordLen - 1 && enterProgress > 0.85) {
          letterOpacity = Math.sin((enterProgress - 0.85) / 0.15 * Math.PI * 4) * 0.5 + 0.5
        }
      } else if (phase === 'hold') {
        bgOpacity = 1
        letterOpacity = 1
      } else {
        const revDelay = cell.isWord
          ? (1 - cell.charCol / wordLen) * 0.5
          : pRand(cell.col * 13 + cell.row * 7) * 0.4
        const ep = Math.max(0, Math.min(1, (exitProgress - revDelay) / 0.5))
        bgOpacity = 1 - ep
        letterOpacity = 1 - ep
      }

      const x = offsetX + cell.col * cellSize
      const y = offsetY + cell.row * cellSize
      const cellBg = cell.isWord
        ? `rgba(255,255,255,${bgOpacity * 0.92})`
        : `rgba(255,255,255,${bgOpacity * 0.6})`

      nodes.push(
        <div
          key={`${cell.col}-${cell.row}`}
          style={{
            position: 'absolute',
            left: x + 1.5,
            top: y + 1.5,
            width: inner,
            height: inner,
            background: cellBg,
            border: `2px solid rgba(255,255,255,${bgOpacity * 0.5})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: Math.round(cellSize * 0.55),
              fontWeight: 700,
              color: cell.isWord ? color : 'rgba(60,60,60,0.8)',
              opacity: letterOpacity,
              lineHeight: 1,
              userSelect: 'none',
              textTransform: 'uppercase',
            }}
          >
            {cell.letter}
          </span>
        </div>,
      )
    }

    return <>{nodes}</>
  },
}

function CrosswordFillComponent(props: MotionGraphicProps<CrosswordFillConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-crossword-fill',
  title: 'Kinetic Crossword Fill',
  description: 'Crossword grid: letters fill in one by one in crossing pattern — across word reveals left-to-right while down-crossing letters stagger in from intersections',
  tags: ['kinetic', 'typography', 'crossword', 'grid', 'puzzle', 'game', 'letters', 'fill'],
  category: 'captions',
  component: CrosswordFillComponent as any,
  defaultConfig: {
    words: ['ACROSS', 'DOWN', 'FILL', 'CLUE'],
    colors: ['#1a1aff', '#cc1414', '#1a1aff', '#cc1414'],
    bgColor: '#f5f0e8',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ACROSS', 'DOWN', 'FILL', 'CLUE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1aff', '#cc1414', '#1a1aff', '#cc1414'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f5f0e8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 6, group: 'Timing' },
  ],
})
