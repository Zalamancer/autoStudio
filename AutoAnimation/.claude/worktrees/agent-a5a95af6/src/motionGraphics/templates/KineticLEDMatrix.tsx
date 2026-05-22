import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LEDMatrixConfig extends KineticBaseConfig {}

// 5x7 dot matrix font for uppercase letters and digits
const CHAR_MAP: Record<string, number[]> = {
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f],
  H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11],
  N: [0x11, 0x11, 0x19, 0x15, 0x13, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d],
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0e, 0x11, 0x10, 0x0e, 0x01, 0x11, 0x0e],
  T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x1b, 0x11],
  X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  '0': [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e],
  '1': [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  '2': [0x0e, 0x11, 0x01, 0x06, 0x08, 0x10, 0x1f],
  '3': [0x0e, 0x11, 0x01, 0x06, 0x01, 0x11, 0x0e],
  '4': [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02],
  '5': [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  '6': [0x06, 0x08, 0x10, 0x1e, 0x11, 0x11, 0x0e],
  '7': [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  '8': [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e],
  '9': [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x0c],
  ' ': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
}

function getCharDots(ch: string): boolean[][] {
  const rows = CHAR_MAP[ch.toUpperCase()] ?? CHAR_MAP[' ']!
  return rows.map((row) => {
    const bits: boolean[] = []
    for (let col = 4; col >= 0; col--) {
      bits.push(((row >> col) & 1) === 1)
    }
    return bits
  })
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, borderRadius: 8, overflow: 'hidden' }}>
        {/* Subtle LED panel border */}
        <div
          style={{
            position: 'absolute',
            inset: 4,
            border: '2px solid rgba(40, 40, 40, 0.6)',
            borderRadius: 6,
            pointerEvents: 'none',
          }}
        />
        {/* Panel inner shadow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.4)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const chars = word.toUpperCase().split('')
    const charCount = chars.length

    // Compute dot matrix layout
    const dotsPerCharCol = 5
    const dotsPerCharRow = 7
    const charGap = 1 // gap columns between characters
    const totalCols = charCount * dotsPerCharCol + (charCount - 1) * charGap
    const totalRows = dotsPerCharRow

    // Dot sizing - responsive
    const maxDotW = (width * 0.75) / totalCols
    const maxDotH = (height * 0.5) / totalRows
    const dotSize = Math.min(maxDotW, maxDotH, 16)
    const dotGap = Math.max(1, dotSize * 0.2)
    const effectiveDot = dotSize - dotGap

    // Total grid pixel size for centering
    const gridW = totalCols * dotSize
    const gridH = totalRows * dotSize
    const offsetX = (width - gridW) / 2
    const offsetY = (height - gridH) / 2

    // Build all dots
    const dots: React.ReactNode[] = []
    let colOffset = 0

    for (let ci = 0; ci < charCount; ci++) {
      const charDots = getCharDots(chars[ci])
      for (let row = 0; row < dotsPerCharRow; row++) {
        for (let col = 0; col < dotsPerCharCol; col++) {
          const isOn = charDots[row][col]
          const globalCol = colOffset + col
          const dotIndex = globalCol + row * totalCols

          // Animation progress per dot
          let dotOn = isOn
          let dotOpacity = 1

          if (phase === 'enter') {
            // Scroll/reveal from right to left, column by column
            const revealCol = Math.floor(enterProgress * (totalCols + 2))
            if (globalCol > revealCol) {
              dotOn = false
            } else {
              // Recently activated dots are brighter
              const age = revealCol - globalCol
              dotOpacity = Math.min(1, age / 3 + 0.4)
            }
          } else if (phase === 'hold') {
            // Slight per-dot brightness variation for realism
            const flicker = Math.sin(f * 0.05 + dotIndex * 0.7) * 0.05
            dotOpacity = 0.95 + flicker
          } else {
            // Exit: dots turn off column by column from left
            const offCol = Math.floor(exitProgress * (totalCols + 2))
            if (globalCol < offCol) {
              dotOn = false
            }
          }

          const x = offsetX + globalCol * dotSize
          const y = offsetY + row * dotSize

          dots.push(
            <div
              key={`${ci}-${row}-${col}`}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: effectiveDot,
                height: effectiveDot,
                borderRadius: '50%',
                background: dotOn ? color : 'rgba(60, 20, 20, 0.15)',
                opacity: dotOn ? dotOpacity : 0.3,
                boxShadow: dotOn
                  ? `0 0 ${effectiveDot * 0.4}px ${color}, 0 0 ${effectiveDot * 0.8}px ${color}40`
                  : 'none',
              }}
            />,
          )
        }
      }
      colOffset += dotsPerCharCol + charGap
    }

    return <>{dots}</>
  },
}

function LEDMatrixComponent(props: MotionGraphicProps<LEDMatrixConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-led-matrix',
  title: 'Kinetic LED Matrix',
  description:
    'LED dot matrix sign with individual dot activation, column-by-column reveal, 5x7 pixel font, and warm LED bloom',
  tags: ['kinetic', 'typography', 'led', 'matrix', 'dots', 'sign', 'digital', 'retro'],
  category: 'captions',
  component: LEDMatrixComponent as any,
  defaultConfig: {
    words: ['OPEN', 'SALE', 'LIVE', 'EXIT'],
    colors: ['#ff2020', '#ff4400', '#ff2020', '#ffaa00'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.3,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['OPEN', 'SALE', 'LIVE', 'EXIT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#ff2020', '#ff4400', '#ff2020', '#ffaa00'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.3,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
