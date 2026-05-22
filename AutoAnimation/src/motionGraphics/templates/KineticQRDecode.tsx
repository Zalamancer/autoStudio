import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface QRDecodeConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const GS = 15 // grid size

/** Generate QR-like grid with finder patterns in 3 corners */
function qrGrid(word: string, seed: number): boolean[][] {
  const g: boolean[][] = Array.from({ length: GS }, (_, r) =>
    Array.from(
      { length: GS },
      (_, c) => rand(seed + r * 97 + c * 31 + word.charCodeAt((r * GS + c) % word.length)) > 0.45,
    ),
  )
  // Finder patterns — 3x3 borders in 3 corners
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) {
      const edge = r === 0 || r === 2 || c === 0 || c === 2
      g[r][c] = edge
      g[r][GS - 1 - c] = edge
      g[GS - 1 - r][c] = edge
    }
  g[1][1] = true
  g[1][GS - 2] = true
  g[GS - 2][1] = true
  return g
}

/** Render QR cells as absolute-positioned divs */
function QRCells({
  grid,
  cellPx,
  color,
  opacity,
  scatter,
}: {
  grid: boolean[][]
  cellPx: number
  color: string
  opacity: number
  scatter?: number
}) {
  const seed = 42
  return (
    <>
      {grid.flatMap((row, r) =>
        row.map((filled, c) => {
          if (!filled) return null
          const dx = scatter ? Math.cos(rand(seed + r * 13 + c * 41) * Math.PI * 2) * scatter : 0
          const dy = scatter ? Math.sin(rand(seed + r * 13 + c * 41) * Math.PI * 2) * scatter : 0
          return (
            <div
              key={`qr-${r}-${c}`}
              style={{
                position: 'absolute',
                left: c * cellPx + dx,
                top: r * cellPx + dy,
                width: cellPx - 1,
                height: cellPx - 1,
                background: color,
                opacity,
              }}
            />
          )
        }),
      )}
    </>
  )
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const pulse = 0.05 + Math.sin((frame / fps) * 3) * 0.03

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Camera scan corners */}
        {[
          {
            top: '20%',
            left: '20%',
            borderTop: `2px solid rgba(0,200,255,${pulse})`,
            borderLeft: `2px solid rgba(0,200,255,${pulse})`,
          },
          {
            top: '20%',
            right: '20%',
            borderTop: `2px solid rgba(0,200,255,${pulse})`,
            borderRight: `2px solid rgba(0,200,255,${pulse})`,
          },
          {
            bottom: '20%',
            left: '20%',
            borderBottom: `2px solid rgba(0,200,255,${pulse})`,
            borderLeft: `2px solid rgba(0,200,255,${pulse})`,
          },
          {
            bottom: '20%',
            right: '20%',
            borderBottom: `2px solid rgba(0,200,255,${pulse})`,
            borderRight: `2px solid rgba(0,200,255,${pulse})`,
          },
        ].map((s, i) => (
          <div key={i} style={{ position: 'absolute', width: 30, height: 30, ...s } as any} />
        ))}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: 'rgba(0,200,255,0.1)',
          }}
        >
          SCANNING...
        </div>
      </div>
    )
  },

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
  }: WordRenderProps) => {
    const seed = index * 199 + 61
    const grid = qrGrid(word, seed)
    const gridPx = Math.min(width * 0.5, height * 0.6, 240)
    const cellPx = gridPx / GS

    const textStyle = (op: number): React.CSSProperties => ({
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontFamily: "'Courier New', monospace",
      fontSize: 'clamp(36px, 10vw, 140px)',
      fontWeight: 700,
      color,
      whiteSpace: 'nowrap',
      opacity: op,
      textShadow: `0 0 12px ${color}40`,
      letterSpacing: 4,
    })

    if (phase === 'enter') {
      const assemble = Math.min(1, enterProgress / 0.55)
      const morph = enterProgress < 0.55 ? 0 : (enterProgress - 0.55) / 0.45
      const qrOp = 1 - Math.max(0, (morph - 0.3) / 0.7)
      const txtOp = Math.max(0, (morph - 0.2) / 0.8)

      // Build cells with staggered appearance from center outward
      const cells = grid.flatMap((row, r) =>
        row.map((filled, c) => {
          if (!filled) return null
          const dist = Math.sqrt((r - GS / 2) ** 2 + (c - GS / 2) ** 2) / (GS * 0.7)
          const p = Math.max(0, Math.min(1, (assemble - dist * 0.6) / 0.4))
          if (p <= 0) return null
          return (
            <div
              key={`ent-${r}-${c}`}
              style={{
                position: 'absolute',
                left: c * cellPx,
                top: r * cellPx,
                width: cellPx - 1,
                height: cellPx - 1,
                background: color,
                opacity: p * qrOp,
                transform: `scale(${p})`,
              }}
            />
          )
        }),
      )

      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <div
            style={{
              position: 'relative',
              width: gridPx,
              height: gridPx,
              transform: `scale(${1 - morph * 0.3})`,
              opacity: qrOp,
            }}
          >
            {cells}
          </div>
          <div style={textStyle(txtOp)}>{word}</div>
        </div>
      )
    } else if (phase === 'hold') {
      const ghostA = 0.04 + Math.sin(holdProgress * Math.PI * 2) * 0.02
      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: gridPx,
              height: gridPx,
            }}
          >
            <QRCells grid={grid} cellPx={cellPx} color={color} opacity={ghostA} />
          </div>
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 10vw, 140px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              textShadow: `0 0 8px ${color}30`,
              letterSpacing: 4,
            }}
          >
            {word}
          </div>
        </div>
      )
    } else {
      const pixelate = Math.min(1, exitProgress / 0.4)
      const scatter = exitProgress < 0.4 ? 0 : (exitProgress - 0.4) / 0.6
      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <div style={{ position: 'relative', width: gridPx, height: gridPx }}>
            <QRCells
              grid={grid}
              cellPx={cellPx}
              color={color}
              opacity={pixelate * (1 - scatter)}
              scatter={scatter * 80}
            />
          </div>
          <div style={textStyle(1 - pixelate)}>{word}</div>
        </div>
      )
    }
  },
}

function QRDecodeComponent(props: MotionGraphicProps<QRDecodeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-qr-decode',
  title: 'Kinetic QR Decode',
  description:
    'QR code grid assembles cell by cell then morphs into readable text, with camera scan UI corners and ghost QR pattern',
  tags: ['kinetic', 'typography', 'qr', 'code', 'scan', 'digital', 'decode', 'data', 'pixel'],
  category: 'captions',
  component: QRDecodeComponent as any,
  defaultConfig: {
    words: ['SCAN', 'LINK', 'OPEN', 'ACCESS'],
    colors: ['#FFFFFF', '#EEEEEE', '#FFFFFF', '#DDDDDD'],
    bgColor: '#0a0a10',
    cycleDuration: 1.6,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SCAN', 'LINK', 'OPEN', 'ACCESS'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#EEEEEE', '#FFFFFF', '#DDDDDD'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a10', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
