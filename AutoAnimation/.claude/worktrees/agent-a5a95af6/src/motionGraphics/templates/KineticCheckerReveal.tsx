import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CheckerRevealConfig extends KineticBaseConfig {
  cols: number
  rows: number
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__checkerConfig ?? { cols: 8, rows: 6 }
    const cols = config.cols ?? 8
    const rows = config.rows ?? 6
    const cellW = width / cols
    const cellH = height / rows

    // Progress driving the reveal (enter) or cover (exit)
    const revealP = phase === 'hold' ? 1 : phase === 'enter' ? enterProgress : 1 - exitProgress

    const tiles: React.ReactNode[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Checkerboard pattern: alternate which cells are "dark"
        const isChecked = (r + c) % 2 === 0

        // Stagger index: diagonal wave ordering
        const diagIndex = (r + c) / (rows + cols - 2)
        const tileThreshold = diagIndex * 0.7

        // How far this tile has flipped (0 = fully covering, 1 = fully open)
        const raw = Math.max(0, Math.min(1, (revealP - tileThreshold) / 0.35))
        const openAmount = easeInOutQuad(raw)

        // Tile rotates around its horizontal axis (flip like a card)
        // When open (openAmount=1) the tile is rotated 90deg — invisible
        const rotateX = openAmount * 90

        // Color alternates with checkerboard: dark vs mid-dark tile
        const tileColor = isChecked ? 'rgba(255,255,255,0.92)' : 'rgba(180,180,190,0.85)'
        const tileOpacity = 1 - openAmount * 0.98

        tiles.push(
          <div
            key={`${r}-${c}`}
            style={{
              position: 'absolute',
              left: c * cellW,
              top: r * cellH,
              width: cellW + 1,
              height: cellH + 1,
              perspective: 400,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 1,
                background: tileColor,
                transformOrigin: 'top center',
                transform: `rotateX(${rotateX}deg)`,
                opacity: tileOpacity,
                boxShadow: tileOpacity > 0.1 ? '0 2px 4px rgba(0,0,0,0.25)' : 'none',
              }}
            />
          </div>,
        )
      }
    }

    const textOpacity = phase === 'hold' ? 1 : phase === 'enter' ? Math.min(1, enterProgress * 3) : Math.max(0, 1 - exitProgress * 3)

    return (
      <>
        {/* Text sits behind the checker tiles */}
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
        {/* Checker tiles on top */}
        {tiles}
      </>
    )
  },
}

function CheckerRevealComponent(props: MotionGraphicProps<CheckerRevealConfig>) {
  ;(globalThis as any).__checkerConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-checker-reveal',
  title: 'Kinetic Checker Reveal',
  description: 'Checkerboard tiles flip open in a diagonal wave to reveal text underneath, like cards turning face-up',
  tags: ['kinetic', 'typography', 'checkerboard', 'tiles', 'reveal', 'geometric', 'pattern', 'flip'],
  category: 'captions',
  component: CheckerRevealComponent as any,
  defaultConfig: {
    words: ['CHECK', 'BOARD', 'FLIP', 'TILES'],
    colors: ['#F8F8F8', '#FFD700', '#FF6B6B', '#4ECDC4'],
    bgColor: '#111111',
    cycleDuration: 1.4,
    cols: 8,
    rows: 6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CHECK', 'BOARD', 'FLIP', 'TILES'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F8F8F8', '#FFD700', '#FF6B6B', '#4ECDC4'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111111', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
    { key: 'cols', label: 'Columns', type: 'number', defaultValue: 8, min: 3, max: 20, group: 'Animation' },
    { key: 'rows', label: 'Rows', type: 'number', defaultValue: 6, min: 2, max: 16, group: 'Animation' },
  ],
})
