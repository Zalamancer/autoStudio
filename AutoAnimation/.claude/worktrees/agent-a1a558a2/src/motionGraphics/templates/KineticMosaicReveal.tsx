import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MosaicRevealConfig extends KineticBaseConfig {
  mosaicPalette: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

// Deterministic pseudo-random for consistent tile colors
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

const TILE_COLS = 16
const TILE_ROWS = 10
const PALETTE = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    const tileW = width / TILE_COLS
    const tileH = height / TILE_ROWS
    const centerX = TILE_COLS / 2
    const centerY = TILE_ROWS / 2

    const tiles: React.ReactNode[] = []

    for (let row = 0; row < TILE_ROWS; row++) {
      for (let col = 0; col < TILE_COLS; col++) {
        const dist = Math.sqrt(Math.pow(col - centerX, 2) + Math.pow(row - centerY, 2))
        const maxDist = Math.sqrt(centerX * centerX + centerY * centerY)
        const normDist = dist / maxDist

        // Tiles at edges shift colors; center area stays clear
        const seed = row * TILE_COLS + col
        const colorIndex = Math.floor(seededRandom(seed + Math.floor(time * 2)) * PALETTE.length)
        const tileColor = PALETTE[colorIndex]

        // Center tiles are transparent (clear area for text)
        const isCenterZone = Math.abs(col - centerX) < 3.5 && Math.abs(row - centerY) < 2
        const edgeShift = Math.sin(time * 1.5 + seed * 0.3) * 0.1

        tiles.push(
          <rect
            key={`${row}-${col}`}
            x={col * tileW}
            y={row * tileH}
            width={tileW + 0.5}
            height={tileH + 0.5}
            fill={tileColor}
            opacity={isCenterZone ? 0.03 : 0.12 + normDist * 0.15 + edgeShift}
          />
        )
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          {tiles}
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    let textOpacity = 0
    let textScale = 0.85

    // During enter: mosaic shuffles then clears center for text
    // During exit: mosaic covers text back
    if (phase === 'enter') {
      textOpacity = easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5))
      textScale = 0.85 + easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5)) * 0.15
    } else if (phase === 'hold') {
      textOpacity = 1
      textScale = 1
    } else {
      textOpacity = 1 - easeInCubic(exitProgress)
      textScale = 1 - easeInCubic(exitProgress) * 0.1
    }

    // Overlay tiles that cover/uncover text during enter/exit
    const overlayTiles: React.ReactNode[] = []
    const tileW = width / TILE_COLS
    const tileH = height / TILE_ROWS
    const centerX = TILE_COLS / 2
    const centerY = TILE_ROWS / 2

    for (let row = 0; row < TILE_ROWS; row++) {
      for (let col = 0; col < TILE_COLS; col++) {
        const dist = Math.sqrt(Math.pow(col - centerX, 2) + Math.pow(row - centerY, 2))
        const maxDist = Math.sqrt(centerX * centerX + centerY * centerY)
        const normDist = dist / maxDist

        const isCenterZone = Math.abs(col - centerX) < 4 && Math.abs(row - centerY) < 2.5

        if (!isCenterZone) continue

        const seed = row * TILE_COLS + col
        const colorIndex = Math.floor(seededRandom(seed) * PALETTE.length)
        const tileColor = PALETTE[colorIndex]

        let tileOpacity = 0
        if (phase === 'enter') {
          // Tiles clear from center outward
          const clearProgress = Math.max(0, (enterProgress - normDist * 0.5) / 0.5)
          tileOpacity = Math.max(0, 0.8 - easeOutCubic(clearProgress) * 0.8)
        } else if (phase === 'exit') {
          // Tiles fill from edges inward
          const fillProgress = Math.max(0, (exitProgress - (1 - normDist) * 0.4) / 0.6)
          tileOpacity = easeInCubic(fillProgress) * 0.8
        }

        if (tileOpacity > 0.01) {
          overlayTiles.push(
            <div
              key={`ov-${row}-${col}`}
              style={{
                position: 'absolute',
                left: col * tileW,
                top: row * tileH,
                width: tileW + 1,
                height: tileH + 1,
                background: tileColor,
                opacity: tileOpacity,
              }}
            />
          )
        }
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {overlayTiles}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${textScale})`,
            opacity: textOpacity,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            letterSpacing: '2px',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function MosaicRevealComponent(props: MotionGraphicProps<MosaicRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-mosaic-reveal',
  title: 'Kinetic Mosaic Reveal',
  description: 'Colorful mosaic tiles shuffle then clear the center to reveal text. Edges continue shifting during hold. Mosaic covers text on exit.',
  tags: ['kinetic', 'typography', 'mosaic', 'tiles', 'colorful', 'geometric', 'reveal', 'abstract'],
  category: 'captions',
  component: MosaicRevealComponent as any,
  defaultConfig: {
    words: ['MOSAIC', 'COLOR', 'TILES', 'ART'],
    colors: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
    bgColor: '#0a0a12',
    cycleDuration: 1.6,
    mosaicPalette: 'vibrant',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MOSAIC', 'COLOR', 'TILES', 'ART'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a12', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
    { key: 'mosaicPalette', label: 'Palette', type: 'text', defaultValue: 'vibrant', group: 'Animation' },
  ],
})
