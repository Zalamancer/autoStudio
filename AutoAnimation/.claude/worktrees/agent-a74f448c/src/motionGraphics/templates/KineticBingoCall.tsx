import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BingoCallConfig extends KineticBaseConfig {}

function pRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  const p = 0.3
  return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1
}

// BINGO card layout: 5×5 grid, columns labeled B-I-N-G-O
// Numbers are deterministically assigned per word index
const BINGO_COLS = ['B', 'I', 'N', 'G', 'O']
const BINGO_RANGES = [[1,15],[16,30],[31,45],[46,60],[61,75]]

function getBingoCard(seed: number): number[][] {
  // Returns 5×5 grid of numbers (row-major, col[0..4] = B..O, FREE=0 at [2][2])
  const card: number[][] = Array.from({ length: 5 }, () => new Array(5).fill(0))
  for (let col = 0; col < 5; col++) {
    const [min, max] = BINGO_RANGES[col]
    const range = max - min + 1
    const used = new Set<number>()
    for (let row = 0; row < 5; row++) {
      if (col === 2 && row === 2) { card[row][col] = 0; continue } // FREE space
      let n: number
      do { n = min + Math.floor(pRand(seed + col * 53 + row * 17 + n!) * range) } while (used.has(n))
      used.add(n)
      card[row][col] = n
    }
  }
  return card
}

// Which numbers get called to complete the winning row (row 2 = middle row)
// The winning row is row index 2 (the middle bingo row)
function getCalledNumbers(card: number[][], calledCount: number): Set<number> {
  const called = new Set<number>()
  // Call the middle row in order: left to right
  for (let col = 0; col < Math.min(calledCount, 5); col++) {
    called.add(card[2][col])
  }
  // Also randomly pre-fill some other numbers for realistic card
  // (deterministic using row/col seed — not the winning row)
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (r === 2) continue
      if (pRand(r * 31 + c * 17 + 99) < 0.35 && called.size < calledCount + 4) {
        called.add(card[r][c])
      }
    }
  }
  return called
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Subtle dot pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const card = getBingoCard(index * 1337)

    const cellSize = Math.min(
      Math.floor(width * 0.72 / 5),
      Math.floor(height * 0.75 / 6), // 6 rows including header
      56,
    )
    const cellGap = 3
    const cardW = 5 * cellSize + 4 * cellGap
    const cardH = 6 * cellSize + 5 * cellGap // header + 5 rows
    const offsetX = (width - cardW) / 2
    const offsetY = (height - cardH) / 2

    // How many numbers are called so far in enter phase
    // All 5 middle-row numbers called by enterProgress = 0.8
    // Then "BINGO!" appears
    const numCalled = phase === 'enter'
      ? Math.floor(enterProgress / 0.75 * 5)
      : phase === 'hold'
      ? 5
      : 5
    const calledSet = getCalledNumbers(card, numCalled)

    const nodes: React.ReactNode[] = []

    // Card background
    const cardOpacity = phase === 'enter' ? Math.min(1, enterProgress * 4) : phase === 'exit' ? 1 - exitProgress : 1
    nodes.push(
      <div
        key="card-bg"
        style={{
          position: 'absolute',
          left: offsetX - 6,
          top: offsetY - 6,
          width: cardW + 12,
          height: cardH + 12,
          background: '#fffef0',
          borderRadius: 8,
          border: '3px solid #e0c840',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          opacity: cardOpacity,
        }}
      />,
    )

    // BINGO header row
    for (let col = 0; col < 5; col++) {
      const x = offsetX + col * (cellSize + cellGap)
      const y = offsetY
      const headerColors = ['#cc0000','#ff6600','#009900','#0000cc','#9900cc']
      nodes.push(
        <div
          key={`header-${col}`}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: cellSize,
            height: cellSize,
            background: headerColors[col],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: cardOpacity,
            borderRadius: 3,
          }}
        >
          <span style={{ fontFamily: "'Impact', 'Arial Black', sans-serif", fontSize: cellSize * 0.65, fontWeight: 900, color: '#fff' }}>
            {BINGO_COLS[col]}
          </span>
        </div>,
      )
    }

    // Number cells
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const num = card[row][col]
        const isFree = col === 2 && row === 2
        const isCalled = isFree || calledSet.has(num)
        const isWinningRow = row === 2

        // Delay for each number appearing
        const cellDelay = pRand(row * 37 + col * 53) * 0.15
        const cellOpacity = phase === 'enter'
          ? Math.min(1, Math.max(0, (enterProgress - cellDelay) / 0.3))
          : phase === 'exit'
          ? 1 - exitProgress * 1.1
          : 1

        // Dab animation for called numbers
        const dabDelay = isWinningRow ? (col / 5) * 0.7 : 0
        const dabProg = phase === 'enter'
          ? Math.max(0, Math.min(1, (enterProgress - 0.05 - dabDelay) / 0.12))
          : isCalled
          ? 1
          : 0
        const dabScale = isCalled ? easeOutElastic(dabProg) : 0

        const x = offsetX + col * (cellSize + cellGap)
        const y = offsetY + (row + 1) * (cellSize + cellGap)

        nodes.push(
          <div
            key={`cell-${row}-${col}`}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: cellSize,
              height: cellSize,
              background: isFree ? '#FFD700' : '#fffef0',
              border: `1.5px solid #c8c870`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: cellOpacity,
              borderRadius: 2,
            }}
          >
            {/* Dab marker */}
            {isCalled && !isFree && (
              <div
                style={{
                  position: 'absolute',
                  inset: 3,
                  borderRadius: '50%',
                  background: isWinningRow ? color : 'rgba(100,100,255,0.5)',
                  transform: `scale(${dabScale})`,
                  opacity: 0.8,
                }}
              />
            )}
            <span
              style={{
                fontFamily: "'Arial', sans-serif",
                fontSize: isFree ? cellSize * 0.28 : cellSize * 0.42,
                fontWeight: 700,
                color: isCalled && !isFree ? '#fff' : '#333',
                position: 'relative',
                zIndex: 1,
                lineHeight: 1,
              }}
            >
              {isFree ? 'FREE' : num}
            </span>
          </div>,
        )
      }
    }

    // BINGO! text reveals when all 5 middle row numbers are called
    const bingoReveal = phase === 'enter'
      ? Math.max(0, Math.min(1, (enterProgress - 0.82) / 0.15))
      : phase === 'hold'
      ? 1
      : Math.max(0, 1 - exitProgress * 2)

    if (bingoReveal > 0) {
      const bingoScale = easeOutElastic(bingoReveal)
      nodes.push(
        <div
          key="bingo-text"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: `clamp(40px, 14vw, 120px)`,
              fontWeight: 900,
              color: '#fff',
              textShadow: `0 0 20px ${color}, 0 0 40px ${color}, 3px 3px 0 #000`,
              transform: `scale(${bingoScale}) rotate(-8deg)`,
              letterSpacing: 6,
              opacity: bingoReveal,
              whiteSpace: 'nowrap',
            }}
          >
            {word}!
          </div>
        </div>,
      )
    }

    return <>{nodes}</>
  },
}

function BingoCallComponent(props: MotionGraphicProps<BingoCallConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-bingo-call',
  title: 'Kinetic Bingo Call',
  description: 'Bingo card fills with dab markers row by row, the middle row completes, then the text bursts out as a BINGO! shout with elastic scale',
  tags: ['kinetic', 'typography', 'bingo', 'card', 'game', 'numbers', 'dab', 'celebration'],
  category: 'captions',
  component: BingoCallComponent as any,
  defaultConfig: {
    words: ['BINGO', 'WINNER', 'JACKPOT', 'LUCKY'],
    colors: ['#cc0000', '#ff6600', '#009900', '#9900cc'],
    bgColor: '#1a3a5c',
    cycleDuration: 2.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BINGO', 'WINNER', 'JACKPOT', 'LUCKY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#cc0000', '#ff6600', '#009900', '#9900cc'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a3a5c', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.4, min: 0.5, max: 6, group: 'Timing' },
  ],
})
