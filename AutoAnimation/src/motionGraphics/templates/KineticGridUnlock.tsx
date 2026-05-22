import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GridUnlockConfig extends KineticBaseConfig {
  cols: number
  rows: number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__gridUnlockConfig ?? { cols: 6, rows: 5 }
    const cols = config.cols ?? 6
    const rows = config.rows ?? 5
    const cellW = width / cols
    const cellH = height / rows

    const totalCells = cols * rows

    // Wave ordering: cells unlock in a left-to-right, row-by-row wave
    // (like a cascade/wave reading pattern)
    const cells: React.ReactNode[] = []

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cellIndex = r * cols + c
        // Normalised wave position 0..1
        const wavePos = cellIndex / (totalCells - 1)

        let openAmount = 0
        if (phase === 'enter') {
          // Wave sweeps 0..1 from first cell to last
          const raw = Math.max(0, Math.min(1, (enterProgress - wavePos * 0.6) / 0.45))
          openAmount = easeOutBack(Math.min(1, raw))
        } else if (phase === 'hold') {
          openAmount = 1
        } else {
          // Reverse wave for exit
          const reversePos = 1 - wavePos
          const raw = Math.max(0, Math.min(1, (exitProgress - reversePos * 0.5) / 0.55))
          openAmount = 1 - easeInQuad(Math.min(1, raw))
        }

        // Cell "unlocks" by scaling from 1 (full cover) to 0 (revealed)
        const coverScale = 1 - openAmount

        // Cell cover color alternates in a subtle pattern
        const tileVariant = (r + c) % 3
        const tileColors = ['rgba(40,40,50,0.95)', 'rgba(55,55,70,0.92)', 'rgba(30,30,40,0.97)']
        const tileColor = tileColors[tileVariant]

        // The grid line border shows even when open
        const borderOpacity = phase === 'hold' ? 0.15 : Math.max(0.05, 0.3 * openAmount)

        cells.push(
          <div
            key={`gul-${r}-${c}`}
            style={{
              position: 'absolute',
              left: c * cellW,
              top: r * cellH,
              width: cellW,
              height: cellH,
              border: `1px solid rgba(255,255,255,${borderOpacity})`,
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            {/* The cover that scales down to reveal text behind */}
            <div
              style={{
                position: 'absolute',
                inset: 2,
                background: tileColor,
                transform: `scale(${coverScale})`,
                transformOrigin: 'center',
                borderRadius: coverScale > 0.05 ? 4 : 0,
                transition: 'none',
              }}
            />
            {/* Small unlock icon: padlock shape via border */}
            {openAmount > 0.5 && openAmount < 0.95 && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 10,
                  height: 8,
                  border: `1.5px solid ${color}`,
                  borderRadius: 2,
                  opacity: ((openAmount - 0.5) / 0.45) * 0.6,
                }}
              />
            )}
          </div>,
        )
      }
    }

    const textOpacity =
      phase === 'hold' ? 1 : phase === 'enter' ? Math.min(1, enterProgress * 2) : Math.max(0, 1 - exitProgress * 2)

    return (
      <>
        {/* Text layer sits behind the grid */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: textOpacity,
          }}
        >
          {word}
        </div>
        {/* Grid cells on top */}
        {cells}
      </>
    )
  },
}

function GridUnlockComponent(props: MotionGraphicProps<GridUnlockConfig>) {
  ;(globalThis as any).__gridUnlockConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-grid-unlock',
  title: 'Kinetic Grid Unlock',
  description:
    'Grid cells shrink and vanish in a rolling wave pattern to reveal text underneath, like a security grid unlocking one cell at a time',
  tags: ['kinetic', 'typography', 'grid', 'unlock', 'reveal', 'geometric', 'pattern', 'wave', 'cells'],
  category: 'captions',
  component: GridUnlockComponent as any,
  defaultConfig: {
    words: ['UNLOCK', 'GRID', 'ACCESS', 'OPEN'],
    colors: ['#4ECDC4', '#FFD700', '#FF6B6B', '#A78BFA'],
    bgColor: '#0C0C14',
    cycleDuration: 1.5,
    cols: 6,
    rows: 5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['UNLOCK', 'GRID', 'ACCESS', 'OPEN'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#4ECDC4', '#FFD700', '#FF6B6B', '#A78BFA'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0C0C14', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    { key: 'cols', label: 'Columns', type: 'number', defaultValue: 6, min: 2, max: 16, group: 'Animation' },
    { key: 'rows', label: 'Rows', type: 'number', defaultValue: 5, min: 2, max: 12, group: 'Animation' },
  ],
})
