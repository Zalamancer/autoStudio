import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WordSearchConfig extends KineticBaseConfig {}

function pRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const GRID_SIZE = 9 // 9×9 grid

function gridLetter(col: number, row: number, seed: number): string {
  return ALPHA[Math.floor(pRand(seed + col * 31 + row * 97) * 26)]
}

// Place the word diagonally (top-left → bottom-right) near center
function getWordPlacement(word: string, gridSize: number): { startCol: number; startRow: number; dx: number; dy: number } {
  const len = word.length
  // Place diagonally: dx=1, dy=1 — always deterministic center start
  const startCol = Math.floor((gridSize - len) / 2)
  const startRow = Math.floor((gridSize - len) / 2)
  return { startCol, startRow, dx: 1, dy: 1 }
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const chars = word.toUpperCase().split('')
    const wordLen = chars.length

    const cellSize = Math.min(
      Math.floor(width * 0.82 / GRID_SIZE),
      Math.floor(height * 0.82 / GRID_SIZE),
      46,
    )
    const gridW = GRID_SIZE * cellSize
    const gridH = GRID_SIZE * cellSize
    const offsetX = (width - gridW) / 2
    const offsetY = (height - gridH) / 2

    const { startCol, startRow, dx, dy } = getWordPlacement(word, GRID_SIZE)
    const seedBase = index * 1337

    // Build grid with word placed diagonally
    const wordCells = new Map<string, string>()
    for (let i = 0; i < wordLen; i++) {
      const col = startCol + i * dx
      const row = startRow + i * dy
      wordCells.set(`${col},${row}`, chars[i])
    }

    // Highlight sweep progress for the diagonal word
    // Enters: grid letters appear first (random stagger), then highlight sweeps diagonally
    const gridRevealDone = 0.45 // grid finishes appearing at this enterProgress
    const highlightStart = 0.45
    const highlightEnd = 0.85

    let highlightProgress = 0
    let gridAlpha = 0

    if (phase === 'enter') {
      gridAlpha = Math.min(1, enterProgress / gridRevealDone)
      if (enterProgress > highlightStart) {
        highlightProgress = Math.min(1, (enterProgress - highlightStart) / (highlightEnd - highlightStart))
      }
    } else if (phase === 'hold') {
      gridAlpha = 1
      highlightProgress = 1
    } else {
      gridAlpha = 1 - exitProgress * 0.7
      highlightProgress = 1 - exitProgress
    }

    // Number of highlighted cells so far
    const highlightedCount = Math.floor(highlightProgress * (wordLen + 0.99))

    const nodes: React.ReactNode[] = []

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const key = `${col},${row}`
        const isWordCell = wordCells.has(key)
        const letter = isWordCell ? wordCells.get(key)! : gridLetter(col, row, seedBase)

        // Stagger reveal of background letters
        const cellSeed = pRand(col * 37 + row * 73 + seedBase)
        const cellDelay = cellSeed * 0.4
        const cellAlpha = Math.max(0, Math.min(1, (gridAlpha - cellDelay) / 0.6)) * (isWordCell ? 1 : 0.6)

        // Highlight: diagonal sweep — cell i is highlighted when highlightedCount > i
        let isHighlighted = false
        if (isWordCell) {
          for (let i = 0; i < wordLen; i++) {
            if (startCol + i * dx === col && startRow + i * dy === row) {
              isHighlighted = i < highlightedCount
              break
            }
          }
        }

        const x = offsetX + col * cellSize
        const y = offsetY + row * cellSize
        const pad = 2

        nodes.push(
          <div
            key={key}
            style={{
              position: 'absolute',
              left: x + pad,
              top: y + pad,
              width: cellSize - pad * 2,
              height: cellSize - pad * 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: isHighlighted ? '50%' : 0,
              background: isHighlighted
                ? `${color}cc`
                : 'transparent',
              transition: 'background 0.1s',
            }}
          >
            <span
              style={{
                fontFamily: "'Courier New', 'Lucida Console', monospace",
                fontSize: Math.round(cellSize * 0.52),
                fontWeight: 700,
                color: isHighlighted ? '#fff' : isWordCell ? color : 'rgba(200,200,200,0.85)',
                opacity: cellAlpha,
                userSelect: 'none',
                letterSpacing: 0,
                lineHeight: 1,
              }}
            >
              {letter}
            </span>
          </div>,
        )
      }
    }

    // Grid border lines
    nodes.push(
      <div
        key="grid-border"
        style={{
          position: 'absolute',
          left: offsetX,
          top: offsetY,
          width: gridW,
          height: gridH,
          border: `2px solid rgba(200,200,200,0.2)`,
          pointerEvents: 'none',
          opacity: gridAlpha,
        }}
      />,
    )

    // "FOUND!" label once fully highlighted
    if (phase === 'hold' && holdProgress > 0.05) {
      const labelAlpha = Math.min(1, (holdProgress - 0.05) / 0.15)
      nodes.push(
        <div
          key="found-label"
          style={{
            position: 'absolute',
            bottom: offsetY - 8,
            left: offsetX,
            width: gridW,
            textAlign: 'center',
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(12px, 2.5vw, 22px)',
            fontWeight: 900,
            color,
            opacity: labelAlpha,
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          FOUND!
        </div>,
      )
    }

    return <>{nodes}</>
  },
}

function WordSearchComponent(props: MotionGraphicProps<WordSearchConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-word-search',
  title: 'Kinetic Word Search',
  description: 'Word search grid: random letters fill in, then a diagonal highlight circle sweeps through to find and circle the hidden word',
  tags: ['kinetic', 'typography', 'word-search', 'grid', 'puzzle', 'game', 'highlight', 'diagonal'],
  category: 'captions',
  component: WordSearchComponent as any,
  defaultConfig: {
    words: ['SEARCH', 'FIND', 'SEEK', 'LOOK'],
    colors: ['#FFD700', '#FF6B35', '#FFD700', '#FF6B35'],
    bgColor: '#1a2744',
    cycleDuration: 2.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SEARCH', 'FIND', 'SEEK', 'LOOK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD700', '#FF6B35', '#FFD700', '#FF6B35'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a2744', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.2, min: 0.5, max: 6, group: 'Timing' },
  ],
})
