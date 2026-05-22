import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CrosswordBuildConfig extends KineticBaseConfig {
  cellSize: number
  showNumbers: boolean
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function pseudo(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    const cellW = 52
    const cellH = 52
    const seed = index * 113

    // Grid dimensions around the word
    const cols = word.length + 4
    const rows = 7
    const gridW = cols * cellW
    const gridH = rows * cellH
    const startCol = 2
    const wordRow = Math.floor(rows / 2)

    let fillP = 0
    let clearP = 0

    if (phase === 'enter') {
      fillP = Math.min(1, enterProgress * 1.2)
    } else if (phase === 'hold') {
      fillP = 1
    } else {
      fillP = 1
      clearP = easeInCubic(exitProgress)
    }

    const cells = []

    // Fill grid cells — crossword pattern
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cellSeed = seed + r * cols + c
        const isWordCell = r === wordRow && c >= startCol && c < startCol + word.length
        const letterIdx = isWordCell ? c - startCol : -1

        // Black-out every other cell in crossword pattern (except word row)
        const isBlocked = !isWordCell && pseudo(cellSeed) > 0.55

        // Stagger: word letters fill from left, surroundings stagger randomly
        let cellDelay: number
        if (isWordCell) {
          cellDelay = ((c - startCol) / word.length) * 0.45
        } else {
          cellDelay = pseudo(cellSeed + 0.3) * 0.5 + 0.1
        }

        const cellP = Math.max(0, Math.min(1, (fillP - cellDelay) / (1 - cellDelay + 0.01)))
        const easedCell = easeOutBack(cellP)
        const cellOpacity = Math.min(1, cellP * 5) * (1 - clearP)
        if (cellOpacity <= 0 && !isWordCell) continue

        const x = (c / cols) * gridW - gridW / 2
        const y = (r / rows) * gridH - gridH / 2
        const scaleY = easedCell

        // Word letter scramble before settling
        let displayChar = ''
        if (isWordCell && cellP > 0) {
          if (cellP < 0.6) {
            // Random letter scramble
            displayChar = LETTERS[Math.floor(pseudo(cellSeed + cellP * 100) * LETTERS.length)]
          } else {
            displayChar = word[letterIdx]
          }
        } else if (!isWordCell && !isBlocked && cellP > 0.3) {
          displayChar = LETTERS[Math.floor(pseudo(cellSeed * 3.14) * LETTERS.length)]
        }

        cells.push(
          <div
            key={`cwb-${r}-${c}`}
            style={{
              position: 'absolute',
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              width: cellW - 2,
              height: cellH * scaleY - 1,
              background: isBlocked
                ? `rgba(20,20,20,${cellOpacity})`
                : `rgba(255,255,255,${isWordCell ? cellOpacity * 0.12 : cellOpacity * 0.06})`,
              border: `1px solid rgba(255,255,255,${cellOpacity * 0.2})`,
              overflow: 'hidden',
              opacity: Math.max(0, cellOpacity),
            }}
          >
            {displayChar && (
              <span
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontFamily: "'Arial Black', sans-serif",
                  fontSize: isWordCell ? cellW * 0.65 : cellW * 0.4,
                  fontWeight: 900,
                  color: isWordCell ? color : `rgba(255,255,255,0.25)`,
                  lineHeight: 1,
                }}
              >
                {displayChar}
              </span>
            )}
            {/* Cell number in corner (crossword style) */}
            {isWordCell && c === startCol && cellP > 0.5 && (
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: 3,
                  fontSize: 9,
                  color: `rgba(255,255,255,0.4)`,
                  fontFamily: 'monospace',
                  lineHeight: 1,
                }}
              >
                1
              </span>
            )}
          </div>,
        )
      }
    }

    return <>{cells}</>
  },
}

function CrosswordBuildComponent(props: MotionGraphicProps<CrosswordBuildConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-crossword-build',
  title: 'Kinetic Crossword Build',
  description:
    'A crossword grid fills in cell by cell — surrounding black squares drop in while the word letters scramble then snap to their correct letters.',
  tags: ['kinetic', 'typography', 'crossword', 'grid', 'puzzle', 'cells', 'letters', 'build', 'word', 'game'],
  category: 'captions',
  component: CrosswordBuildComponent as any,
  defaultConfig: {
    words: ['WORD', 'CLUE', 'SOLVE', 'GRID'],
    colors: ['#FFE66D', '#FFCC00', '#FFD700', '#FFF0A0'],
    bgColor: '#111111',
    cycleDuration: 2.0,
    cellSize: 52,
    showNumbers: true,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['WORD', 'CLUE', 'SOLVE', 'GRID'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFE66D', '#FFCC00', '#FFD700', '#FFF0A0'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111111', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.0,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'cellSize',
      label: 'Cell Size (px)',
      type: 'number',
      defaultValue: 52,
      min: 32,
      max: 80,
      group: 'Animation',
    },
    { key: 'showNumbers', label: 'Show Numbers', type: 'boolean', defaultValue: true, group: 'Animation' },
  ],
})
