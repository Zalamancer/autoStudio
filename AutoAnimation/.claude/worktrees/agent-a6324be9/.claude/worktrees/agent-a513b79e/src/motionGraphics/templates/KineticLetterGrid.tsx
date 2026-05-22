import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LetterGridConfig extends KineticBaseConfig {
  gridCols: number
  gridRows: number
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function gridLetter(seed: number): string {
  return ALPHABET[Math.floor(rand(seed) * ALPHABET.length)]
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    width,
    height,
    frame,
  }: WordRenderProps) => {
    const cols = 12
    const rows = 8
    const f = frame ?? 0
    const cellW = width / cols
    const cellH = height / rows

    // Word letters spread across center row
    const wordLen = word.length
    const startCol = Math.floor((cols - wordLen) / 2)
    const wordRow = Math.floor(rows / 2)

    // Build a set of "word positions" for quick lookup
    const wordPositions = new Set<string>()
    for (let i = 0; i < wordLen; i++) {
      wordPositions.add(`${wordRow}-${startCol + i}`)
    }

    const cells: React.ReactNode[] = []

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cellSeed = index * 997 + r * 53 + c * 17
        const key = `${r}-${c}`
        const isWordCell = wordPositions.has(key)
        const wordCharIdx = c - startCol

        let cellChar = gridLetter(cellSeed + Math.floor(f / 4))
        let cellColor = ''
        let cellOpacity = 1
        let fontWeight: number | string = 400
        let scale = 1

        if (isWordCell) {
          const trueChar = word[wordCharIdx] ?? ''

          if (phase === 'enter') {
            // Char-staggered reveal: each word char unlocks left-to-right
            const charDelay = wordCharIdx / (wordLen + 1) * 0.6
            const charProgress = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.4))
            if (charProgress >= 1) {
              cellChar = trueChar
              cellColor = color
              fontWeight = 800
              scale = 1 + Math.sin((enterProgress - charDelay) * Math.PI) * 0.25
            } else {
              // Still flickering through random chars
              cellChar = gridLetter(cellSeed + Math.floor(f / 2) + wordCharIdx)
              cellColor = charProgress > 0.3 ? `rgba(${hexToRgb(color)}, ${0.4 + charProgress * 0.6})` : 'rgba(200,200,200,0.3)'
              fontWeight = 400
            }
          } else if (phase === 'hold') {
            cellChar = trueChar
            cellColor = color
            fontWeight = 800
            // Gentle pulse on hold
            scale = 1 + Math.sin(holdProgress * Math.PI * 2) * 0.04
          } else {
            cellChar = trueChar
            cellColor = color
            fontWeight = 800
            cellOpacity = 1 - exitProgress * exitProgress
            scale = 1 + exitProgress * 0.3
          }
        } else {
          // Background noise cells
          if (phase === 'enter') {
            cellOpacity = 0.06 + rand(cellSeed + Math.floor(f / 6)) * 0.1
            cellColor = 'rgba(200,200,200,1)'
          } else if (phase === 'hold') {
            // Dim BG cells gradually during hold
            const dimFactor = 0.04 + rand(cellSeed) * 0.06
            cellOpacity = dimFactor
            cellColor = 'rgba(200,200,200,1)'
          } else {
            cellOpacity = 0.04 + rand(cellSeed) * 0.05 * (1 - exitProgress)
            cellColor = 'rgba(200,200,200,1)'
          }
        }

        cells.push(
          <div
            key={key}
            style={{
              position: 'absolute',
              left: c * cellW,
              top: r * cellH,
              width: cellW,
              height: cellH,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
              fontSize: `clamp(10px, ${Math.min(cellW, cellH) * 0.5}px, 32px)`,
              fontWeight,
              color: cellColor,
              opacity: cellOpacity,
              transform: `scale(${scale})`,
              letterSpacing: 0,
              userSelect: 'none',
            }}
          >
            {cellChar}
          </div>
        )
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {cells}
      </div>
    )
  },
}

/** Convert 6-char hex to "r,g,b" string for rgba() */
function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `${r},${g},${b}`
}

function LetterGridComponent(props: MotionGraphicProps<LetterGridConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-letter-grid',
  title: 'Letter Grid',
  description:
    'A full grid of random letters fills the canvas. The correct letters light up one by one to spell the word while all other cells remain as dim noise.',
  tags: ['kinetic', 'typography', 'grid', 'letters', 'reveal', 'pattern', 'matrix', 'highlight'],
  category: 'captions',
  component: LetterGridComponent as any,
  defaultConfig: {
    words: ['GRID', 'TYPE', 'FIND', 'WORD'],
    colors: ['#FFD700', '#00E5FF', '#FF4081', '#69FF47'],
    bgColor: '#0e0e14',
    cycleDuration: 2.0,
    gridCols: 12,
    gridRows: 8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['GRID', 'TYPE', 'FIND', 'WORD'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFD700', '#00E5FF', '#FF4081', '#69FF47'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0e0e14', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.0,
      min: 0.8,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'gridCols',
      label: 'Grid Columns',
      type: 'number',
      defaultValue: 12,
      min: 6,
      max: 20,
      group: 'Layout',
    },
    {
      key: 'gridRows',
      label: 'Grid Rows',
      type: 'number',
      defaultValue: 8,
      min: 4,
      max: 16,
      group: 'Layout',
    },
  ],
})
