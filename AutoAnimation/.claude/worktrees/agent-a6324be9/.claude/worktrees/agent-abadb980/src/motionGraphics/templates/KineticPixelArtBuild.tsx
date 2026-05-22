import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PixelArtBuildConfig extends KineticBaseConfig {}

function pRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// 5×7 pixel font (same bit-pattern approach as LEDMatrix but rendered as colored squares)
const CHAR_MAP: Record<string, number[]> = {
  A: [0x0e,0x11,0x11,0x1f,0x11,0x11,0x11],
  B: [0x1e,0x11,0x11,0x1e,0x11,0x11,0x1e],
  C: [0x0e,0x11,0x10,0x10,0x10,0x11,0x0e],
  D: [0x1e,0x11,0x11,0x11,0x11,0x11,0x1e],
  E: [0x1f,0x10,0x10,0x1e,0x10,0x10,0x1f],
  F: [0x1f,0x10,0x10,0x1e,0x10,0x10,0x10],
  G: [0x0e,0x11,0x10,0x17,0x11,0x11,0x0f],
  H: [0x11,0x11,0x11,0x1f,0x11,0x11,0x11],
  I: [0x0e,0x04,0x04,0x04,0x04,0x04,0x0e],
  J: [0x07,0x02,0x02,0x02,0x02,0x12,0x0c],
  K: [0x11,0x12,0x14,0x18,0x14,0x12,0x11],
  L: [0x10,0x10,0x10,0x10,0x10,0x10,0x1f],
  M: [0x11,0x1b,0x15,0x15,0x11,0x11,0x11],
  N: [0x11,0x11,0x19,0x15,0x13,0x11,0x11],
  O: [0x0e,0x11,0x11,0x11,0x11,0x11,0x0e],
  P: [0x1e,0x11,0x11,0x1e,0x10,0x10,0x10],
  Q: [0x0e,0x11,0x11,0x11,0x15,0x12,0x0d],
  R: [0x1e,0x11,0x11,0x1e,0x14,0x12,0x11],
  S: [0x0e,0x11,0x10,0x0e,0x01,0x11,0x0e],
  T: [0x1f,0x04,0x04,0x04,0x04,0x04,0x04],
  U: [0x11,0x11,0x11,0x11,0x11,0x11,0x0e],
  V: [0x11,0x11,0x11,0x11,0x11,0x0a,0x04],
  W: [0x11,0x11,0x11,0x15,0x15,0x1b,0x11],
  X: [0x11,0x11,0x0a,0x04,0x0a,0x11,0x11],
  Y: [0x11,0x11,0x0a,0x04,0x04,0x04,0x04],
  Z: [0x1f,0x01,0x02,0x04,0x08,0x10,0x1f],
  ' ': [0,0,0,0,0,0,0],
}

function getCharPixels(ch: string): boolean[][] {
  const rows = CHAR_MAP[ch.toUpperCase()] ?? CHAR_MAP[' ']!
  return rows.map((row) => {
    const bits: boolean[] = []
    for (let col = 4; col >= 0; col--) {
      bits.push(((row >> col) & 1) === 1)
    }
    return bits
  })
}

// Multi-color palette per character — pixel art style
const PIXEL_PALETTES: string[][] = [
  ['#ff004d', '#ff77a8', '#ffccaa'],
  ['#00e436', '#29adff', '#fff1e8'],
  ['#ffa300', '#ffec27', '#fff1e8'],
  ['#7e2553', '#c2c3c7', '#00e436'],
  ['#1d2b53', '#29adff', '#fff1e8'],
  ['#008751', '#00e436', '#abef00'],
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        imageRendering: 'pixelated' as any,
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    const chars = word.toUpperCase().split('')
    const wordLen = chars.length
    const palette = PIXEL_PALETTES[index % PIXEL_PALETTES.length]

    const CHAR_COLS = 5
    const CHAR_ROWS = 7
    const CHAR_GAP = 1

    const totalCols = wordLen * (CHAR_COLS + CHAR_GAP) - CHAR_GAP
    const pixelSize = Math.min(
      Math.floor((width * 0.78) / totalCols),
      Math.floor((height * 0.65) / CHAR_ROWS),
      18,
    )

    const totalW = totalCols * pixelSize
    const totalH = CHAR_ROWS * pixelSize
    const startX = (width - totalW) / 2
    const startY = (height - totalH) / 2

    // Build a flat list of (x, y, color) for all "on" pixels with placement order
    type PixelDef = { x: number; y: number; pixColor: string; globalIdx: number }
    const allPixels: PixelDef[] = []
    let globalIdx = 0

    for (let ci = 0; ci < wordLen; ci++) {
      const pixelMap = getCharPixels(chars[ci])
      const charStartX = startX + ci * (CHAR_COLS + CHAR_GAP) * pixelSize

      for (let row = 0; row < CHAR_ROWS; row++) {
        for (let col = 0; col < CHAR_COLS; col++) {
          if (!pixelMap[row][col]) continue
          // Color varies by row to create pixel art shading effect
          const palIdx = Math.floor(pRand(ci * 31 + row * 7 + col * 13) * palette.length)
          const pixColor = row === 0 ? palette[2] : row < 3 ? palette[1] : palette[0]
          allPixels.push({
            x: charStartX + col * pixelSize,
            y: startY + row * pixelSize,
            pixColor,
            globalIdx,
          })
          globalIdx++
        }
      }
    }

    const totalPixels = allPixels.length

    // Pixels place one by one in a spiral/scanline order
    // Sort by placement order: top-to-bottom, left-to-right scanline
    const nodes: React.ReactNode[] = []

    for (let i = 0; i < totalPixels; i++) {
      const pix = allPixels[i]
      const placeThreshold = (i / totalPixels)

      let pixOpacity = 0
      let pixScale = 1

      if (phase === 'enter') {
        // Pixels place in order — each gets placed when enterProgress passes its threshold
        const appeared = enterProgress >= placeThreshold
        if (appeared) {
          // Brief "pop" on placement: scale from 1.8 → 1.0
          const age = enterProgress - placeThreshold
          const popDuration = 0.04
          const popProgress = Math.min(1, age / popDuration)
          pixScale = popProgress < 1 ? 1.8 - popProgress * 0.8 : 1
          pixOpacity = 1
        }
      } else if (phase === 'hold') {
        pixOpacity = 1
        pixScale = 1
      } else {
        // Exit: pixels dissolve out in reverse order
        const reverseThreshold = 1 - (i / totalPixels)
        const ep = Math.max(0, Math.min(1, (exitProgress - reverseThreshold * 0.5) / 0.5))
        pixOpacity = 1 - ep
        pixScale = 1 + ep * 0.4
      }

      const bSize = pixelSize - 1
      nodes.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: pix.x + (pixelSize - bSize * pixScale) / 2,
            top: pix.y + (pixelSize - bSize * pixScale) / 2,
            width: bSize * pixScale,
            height: bSize * pixScale,
            background: pix.pixColor,
            opacity: pixOpacity,
            imageRendering: 'pixelated' as any,
          }}
        />,
      )
    }

    // Pixel art completion sparkle ring
    if (phase === 'hold') {
      nodes.push(
        <div
          key="sparkle"
          style={{
            position: 'absolute',
            left: startX - 8,
            top: startY - 8,
            width: totalW + 16,
            height: totalH + 16,
            border: `2px solid ${palette[2]}`,
            opacity: 0.3,
            pointerEvents: 'none',
          }}
        />,
      )
    }

    return <>{nodes}</>
  },
}

function PixelArtBuildComponent(props: MotionGraphicProps<PixelArtBuildConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pixel-art-build',
  title: 'Kinetic Pixel Art Build',
  description: 'Pixel art: tiny colored squares place one by one in scanline order to build letters using a 5×7 pixel font with palette shading and pop animation',
  tags: ['kinetic', 'typography', 'pixel', 'art', 'build', 'game', '8bit', 'retro', 'squares'],
  category: 'captions',
  component: PixelArtBuildComponent as any,
  defaultConfig: {
    words: ['PIXEL', 'BUILD', 'ART', 'GAME'],
    colors: ['#ff004d', '#29adff', '#00e436', '#ffa300'],
    bgColor: '#1d2b53',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PIXEL', 'BUILD', 'ART', 'GAME'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ff004d', '#29adff', '#00e436', '#ffa300'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1d2b53', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 6, group: 'Timing' },
  ],
})
