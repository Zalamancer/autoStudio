import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TetrisStackConfig extends KineticBaseConfig {
  blockSize: number
  fallSpeed: number
}

function easeOutBounce(t: number): number {
  const n1 = 7.5625
  const d1 = 2.75
  if (t < 1 / d1) return n1 * t * t
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
  return n1 * (t -= 2.625 / d1) * t + 0.984375
}

function easeInCubic(t: number): number {
  return t * t * t
}

function pseudo(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Tetromino colors
const TETRO_COLORS = [
  '#FF0000', // I - red
  '#FF7F00', // L - orange
  '#FFFF00', // S - yellow
  '#00FF00', // Z - green
  '#00FFFF', // J - cyan
  '#0000FF', // O - blue
  '#9400D3', // T - purple
]

// Simple tetromino shapes (each is an array of [row, col] offsets)
const TETROMINOES = [
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
  ], // I
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [1, 2],
  ], // J
  [
    [0, 2],
    [1, 0],
    [1, 1],
    [1, 2],
  ], // L
  [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ], // O
  [
    [0, 1],
    [0, 2],
    [1, 0],
    [1, 1],
  ], // S
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
  ], // Z
  [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, 2],
  ], // T
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Tetris playfield border */}
      <div
        style={{
          position: 'absolute',
          top: '5%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '70%',
          height: '90%',
          border: '1px solid rgba(255,255,255,0.06)',
          boxSizing: 'border-box',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height, index }: WordRenderProps) => {
    const blockSize = 36
    const seed = index * 67

    // Number of piece drops = proportional to enterProgress
    const totalDrops = 12
    let stackP = 0
    let clearP = 0

    if (phase === 'enter') {
      stackP = enterProgress
    } else if (phase === 'hold') {
      stackP = 1
    } else {
      stackP = 1
      clearP = easeInCubic(exitProgress)
    }

    const pieces: React.ReactElement[] = []

    for (let i = 0; i < totalDrops; i++) {
      const pieceSeed = seed + i * 41
      const tetrominoIdx = Math.floor(pseudo(pieceSeed) * TETROMINOES.length)
      const tetromino = TETROMINOES[tetrominoIdx]
      const pieceColor = TETRO_COLORS[tetrominoIdx]

      // When this piece "drops" — staggered
      const dropThreshold = i / totalDrops
      if (stackP < dropThreshold) continue

      // How far through this piece's fall (0=top 1=landed)
      const pieceFallP = Math.min(1, (stackP - dropThreshold) / (1 / totalDrops))
      const easedFall = easeOutBounce(pieceFallP)

      // Position this piece in a stack area
      const baseX = (pseudo(pieceSeed + 1) - 0.5) * width * 0.55
      const baseY = height * 0.15 + (i / totalDrops) * height * 0.5

      // Start position (top of screen)
      const startY = -height * 0.5
      const curY = startY + (baseY - startY) * easedFall

      const pieceOpacity = Math.min(1, pieceFallP * 5) * (1 - clearP * (phase === 'exit' ? 1 : 0))

      tetromino.forEach(([dr, dc], bi) => {
        pieces.push(
          <div
            key={`${i}-${bi}`}
            style={{
              position: 'absolute',
              left: `calc(50% + ${baseX + dc * (blockSize + 1)}px)`,
              top: `calc(50% + ${curY + dr * (blockSize + 1)}px)`,
              width: blockSize,
              height: blockSize,
              background: pieceColor,
              border: `2px solid rgba(255,255,255,0.3)`,
              borderRadius: 2,
              boxShadow: `inset 2px 2px 0 rgba(255,255,255,0.3), inset -2px -2px 0 rgba(0,0,0,0.3)`,
              opacity: Math.max(0, pieceOpacity),
              transform: phase === 'exit' ? `translateY(${clearP * height * 0.3}px)` : undefined,
            }}
          />,
        )
      })
    }

    // Word text — appears when pieces complete a "line"
    const textOpacity = phase === 'enter' ? Math.max(0, (stackP - 0.7) / 0.3) : phase === 'hold' ? 1 : 1 - clearP

    return (
      <>
        {pieces}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: Math.max(0, textOpacity),
            whiteSpace: 'nowrap',
            mixBlendMode: 'screen',
          }}
        >
          <span
            style={{
              fontFamily: "'Press Start 2P', 'Courier New', monospace",
              fontSize: 'clamp(36px, 9vw, 120px)',
              fontWeight: 900,
              color,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              textShadow: `0 0 20px ${color}80, 3px 3px 0 rgba(0,0,0,0.5)`,
            }}
          >
            {word}
          </span>
        </div>
      </>
    )
  },
}

function TetrisStackComponent(props: MotionGraphicProps<TetrisStackConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-tetris-stack',
  title: 'Kinetic Tetris Stack',
  description:
    'Colorful tetromino pieces fall and bounce into a pile, stacking up to reveal the word — classic Tetris piece physics with satisfying bounce landing.',
  tags: ['kinetic', 'typography', 'tetris', 'stack', 'blocks', 'game', 'fall', 'bounce', 'pixel', 'assembly'],
  category: 'captions',
  component: TetrisStackComponent as any,
  defaultConfig: {
    words: ['STACK', 'DROP', 'LINE', 'CLEAR'],
    colors: ['#FFFFFF', '#FFFFFFCC', '#F0F0F0', '#E8E8E8'],
    bgColor: '#050510',
    cycleDuration: 2.2,
    blockSize: 36,
    fallSpeed: 1,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['STACK', 'DROP', 'LINE', 'CLEAR'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#FFFFFFCC', '#F0F0F0', '#E8E8E8'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050510', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.2,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'blockSize',
      label: 'Block Size (px)',
      type: 'number',
      defaultValue: 36,
      min: 20,
      max: 60,
      group: 'Animation',
    },
    { key: 'fallSpeed', label: 'Fall Speed', type: 'number', defaultValue: 1, min: 0.3, max: 3, group: 'Animation' },
  ],
})
