import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface QRRevealConfig extends KineticBaseConfig {}

function seededRand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Generate a deterministic grid of 0/1 pixels from word seed */
function qrGrid(word: string, gridSize: number, seed: number): boolean[][] {
  const grid: boolean[][] = []
  for (let r = 0; r < gridSize; r++) {
    grid[r] = []
    for (let c = 0; c < gridSize; c++) {
      const v = seededRand(seed + r * 137 + c * 31 + word.charCodeAt((r + c) % word.length) * 7)
      grid[r][c] = v > 0.45
    }
  }
  // Force finder pattern corners (top-left, top-right, bottom-left) to be solid
  const fp = [[0, 0], [0, gridSize - 7], [gridSize - 7, 0]]
  for (const [fr, fc] of fp) {
    for (let dr = 0; dr < 7; dr++) {
      for (let dc = 0; dc < 7; dc++) {
        const r = fr + dr; const c = fc + dc
        if (r < gridSize && c < gridSize) {
          const outer = dr === 0 || dr === 6 || dc === 0 || dc === 6
          const inner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4
          grid[r][c] = outer || inner
        }
      }
    }
  }
  return grid
}

const GRID = 21
const CELL = 12 // px per cell → 252px QR

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Faint grid lines evoking scanner UI */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(0,200,100,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,100,0.025) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />
      {/* Corner brackets suggesting a QR scanner viewfinder */}
      {[['0%','0%','right','bottom'],['0%','100%','right','top'],['100%','0%','left','bottom'],['100%','100%','left','top']].map(([t, l, br, bb], i) => (
        <div key={i} style={{
          position: 'absolute', top: t as string, left: l as string,
          width: 36, height: 36,
          borderTop: i < 2 ? '3px solid rgba(0,220,100,0.35)' : 'none',
          borderBottom: i >= 2 ? '3px solid rgba(0,220,100,0.35)' : 'none',
          borderLeft: i % 2 === 0 ? '3px solid rgba(0,220,100,0.35)' : 'none',
          borderRight: i % 2 === 1 ? '3px solid rgba(0,220,100,0.35)' : 'none',
          margin: 12,
        }} />
      ))}
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 211 + 73
    const grid = qrGrid(word, GRID, seed)
    const qrSize = GRID * CELL

    // During enter: QR pixels resolve in random order → text fades in
    // Pixel reveal fraction determined by enterProgress
    const revealThreshold = phase === 'enter' ? enterProgress : phase === 'hold' ? 1 : 1 - exitProgress * 0.7

    const QRPixels = () => (
      <div style={{ position: 'relative', width: qrSize, height: qrSize }}>
        {grid.map((row, r) =>
          row.map((on, c) => {
            if (!on) return null
            // Each pixel has a deterministic reveal order
            const pixelSeed = seededRand(seed + r * 100 + c * 7)
            const revealed = pixelSeed < revealThreshold
            if (!revealed) return null
            return (
              <div key={`${r}-${c}`} style={{
                position: 'absolute',
                left: c * CELL, top: r * CELL,
                width: CELL - 1, height: CELL - 1,
                background: color,
                opacity: phase === 'hold' ? 1 : phase === 'enter' ? Math.min(1, (revealThreshold - pixelSeed) * 4) : 1,
              }} />
            )
          })
        )}
      </div>
    )

    const textOpacity = phase === 'enter'
      ? Math.max(0, (enterProgress - 0.65) / 0.35)
      : phase === 'hold' ? 1
      : 1 - exitProgress

    const qrOpacity = phase === 'enter'
      ? Math.max(0, 1 - (enterProgress - 0.55) / 0.35)
      : phase === 'hold' ? 0.08 + Math.sin(holdProgress * Math.PI * 3) * 0.03
      : Math.min(1, exitProgress * 2) * 0.6

    return (
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
        {/* QR code */}
        <div style={{ opacity: qrOpacity, margin: '0 auto' }}>
          <QRPixels />
        </div>
        {/* Text overlaid / replacing QR */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(36px, 9vw, 130px)',
          fontWeight: 700,
          color,
          whiteSpace: 'nowrap',
          letterSpacing: 4,
          opacity: textOpacity,
          textShadow: `0 0 20px ${color}60`,
        }}>
          {word}
        </div>
        {/* Scan line sweeping QR during enter */}
        {phase === 'enter' && enterProgress < 0.7 && (
          <div style={{
            position: 'absolute',
            left: 0, right: 0,
            top: enterProgress * qrSize * 0.8,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            boxShadow: `0 0 8px ${color}80`,
          }} />
        )}
      </div>
    )
  },
}

function QRRevealComponent(props: MotionGraphicProps<QRRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-qr-reveal',
  title: 'Kinetic QR Reveal',
  description: 'QR code pixels resolve deterministically under a scan line, then the mosaic dissolves into readable text',
  tags: ['kinetic', 'typography', 'qr', 'scan', 'decode', 'pixel', 'tech', 'digital'],
  category: 'captions',
  component: QRRevealComponent as any,
  defaultConfig: {
    words: ['SCAN', 'LINK', 'OPEN', 'GO'],
    colors: ['#00FF88', '#00DDAA', '#00FF88', '#00CC77'],
    bgColor: '#050f0a',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SCAN', 'LINK', 'OPEN', 'GO'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FF88', '#00DDAA', '#00FF88', '#00CC77'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050f0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.3, max: 5, group: 'Timing' },
  ],
})
