import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CrossStitchConfig extends KineticBaseConfig {
  gridSize: number
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Simple 5x7 pixel font for uppercase + digits */
const PIXEL_FONT: Record<string, number[]> = {
  A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  B: [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  C: [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
  D: [0b11100, 0b10010, 0b10001, 0b10001, 0b10001, 0b10010, 0b11100],
  E: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  F: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  G: [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01110],
  H: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  I: [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  J: [0b00111, 0b00010, 0b00010, 0b00010, 0b00010, 0b10010, 0b01100],
  K: [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  L: [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  M: [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
  N: [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
  O: [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  P: [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  Q: [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
  R: [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  S: [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
  T: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  U: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  V: [0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b01010, 0b00100],
  W: [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b11011, 0b10001],
  X: [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  Y: [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  Z: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
  ' ': [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
}

function getPixels(ch: string): boolean[][] {
  const rows = PIXEL_FONT[ch.toUpperCase()] ?? PIXEL_FONT[' '] ?? []
  return rows.map((row) => {
    const bits: boolean[] = []
    for (let b = 4; b >= 0; b--) bits.push(((row >> b) & 1) === 1)
    return bits
  })
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    const gridPx = Math.max(6, Math.floor(Math.min(width, height) / 60))
    const cols = Math.ceil(width / gridPx)
    const rows = Math.ceil(height / gridPx)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Aida cloth grid — horizontal lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(0deg, rgba(139,119,101,0.25) 0px, rgba(139,119,101,0.25) 1px, transparent 1px, transparent ${gridPx}px)`,
            pointerEvents: 'none',
          }}
        />
        {/* Aida cloth grid — vertical lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(90deg, rgba(139,119,101,0.25) 0px, rgba(139,119,101,0.25) 1px, transparent 1px, transparent ${gridPx}px)`,
            pointerEvents: 'none',
          }}
        />
        {/* Fabric weave texture — subtle diagonal hatching */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(45deg, transparent 0px, transparent ${gridPx * 2 - 1}px, rgba(200,180,160,0.06) ${gridPx * 2 - 1}px, rgba(200,180,160,0.06) ${gridPx * 2}px)`,
            pointerEvents: 'none',
          }}
        />
        {/* Fabric grain */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 40% 35%, rgba(255,255,255,0.04) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />
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
    frame,
  }: WordRenderProps) => {
    const chars = word.toUpperCase().split('')
    const f = frame ?? 0
    const gridPx = Math.max(6, Math.floor(Math.min(width, height) / 60))
    const charWidthCells = 5
    const charHeightCells = 7
    const charGapCells = 2
    const totalWidthCells = chars.length * (charWidthCells + charGapCells) - charGapCells
    const totalPixelW = totalWidthCells * gridPx
    const totalPixelH = charHeightCells * gridPx
    const startX = (width - totalPixelW) / 2
    const startY = (height - totalPixelH) / 2

    // Collect all stitch positions in order for sequential reveal
    const allStitches: { x: number; y: number; charIdx: number }[] = []
    chars.forEach((ch, ci) => {
      const pixels = getPixels(ch)
      const offsetX = ci * (charWidthCells + charGapCells)
      pixels.forEach((row, ry) => {
        row.forEach((on, cx) => {
          if (on) allStitches.push({ x: offsetX + cx, y: ry, charIdx: ci })
        })
      })
    })

    const totalStitches = allStitches.length

    // How many stitches visible based on phase
    let visibleCount = 0
    let masterOpacity = 1
    let needleIdx = -1

    if (phase === 'enter') {
      visibleCount = Math.floor(enterProgress * totalStitches)
      needleIdx = visibleCount
    } else if (phase === 'hold') {
      visibleCount = totalStitches
    } else {
      visibleCount = totalStitches
      masterOpacity = 1 - exitProgress
    }

    // Needle animation
    const needleStitch = allStitches[Math.min(needleIdx, totalStitches - 1)]

    return (
      <div style={{ position: 'absolute', inset: 0, opacity: masterOpacity }}>
        {/* Render each X-stitch */}
        {allStitches.map((st, si) => {
          if (si >= visibleCount) return null
          const sx = startX + st.x * gridPx
          const sy = startY + st.y * gridPx
          // Thread color variation
          const hueShift = rand(si * 17 + st.charIdx * 31) * 10 - 5
          // Stitch wobble during hold
          const wobble = phase === 'hold' ? Math.sin(holdProgress * Math.PI * 4 + si * 0.3) * 0.3 : 0

          return (
            <div key={si} style={{ position: 'absolute', left: sx, top: sy, width: gridPx, height: gridPx }}>
              {/* X stitch — two diagonal lines */}
              <div
                style={{
                  position: 'absolute',
                  inset: '10%',
                  transform: `rotate(${wobble}deg)`,
                }}
              >
                {/* First diagonal \ */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    width: '141%',
                    height: Math.max(1.5, gridPx * 0.18),
                    background: color,
                    transformOrigin: 'left center',
                    transform: 'rotate(45deg) translateY(-50%)',
                    borderRadius: 1,
                    filter: `hue-rotate(${hueShift}deg)`,
                    boxShadow: `0 0.5px 0 rgba(0,0,0,0.2)`,
                  }}
                />
                {/* Second diagonal / */}
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    width: '141%',
                    height: Math.max(1.5, gridPx * 0.18),
                    background: color,
                    transformOrigin: 'right center',
                    transform: 'rotate(-45deg) translateY(-50%)',
                    borderRadius: 1,
                    filter: `hue-rotate(${hueShift}deg)`,
                    boxShadow: `0 0.5px 0 rgba(0,0,0,0.15)`,
                  }}
                />
              </div>
            </div>
          )
        })}
        {/* Needle pulling animation */}
        {phase === 'enter' && needleStitch && (
          <div
            style={{
              position: 'absolute',
              left: startX + needleStitch.x * gridPx + gridPx / 2 - 1.5,
              top: startY + needleStitch.y * gridPx - 12 + Math.sin(f * 0.4) * 4,
              width: 3,
              height: 18,
              background: 'linear-gradient(180deg, #C0C0C0 0%, #888888 80%, #666666 100%)',
              borderRadius: '1px 1px 50% 50%',
              transform: `rotate(${10 + Math.sin(f * 0.3) * 8}deg)`,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            {/* Needle eye */}
            <div
              style={{
                position: 'absolute',
                top: 2,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 1.5,
                height: 2,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.4)',
              }}
            />
          </div>
        )}
        {/* Thread trailing from needle */}
        {phase === 'enter' && needleStitch && visibleCount > 0 && (
          <svg
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9 }}
          >
            <line
              x1={startX + needleStitch.x * gridPx + gridPx / 2}
              y1={startY + needleStitch.y * gridPx - 6}
              x2={startX + (allStitches[visibleCount - 1]?.x ?? needleStitch.x) * gridPx + gridPx / 2}
              y2={startY + (allStitches[visibleCount - 1]?.y ?? needleStitch.y) * gridPx + gridPx / 2}
              stroke={color}
              strokeWidth={1.2}
              opacity={0.5}
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>
    )
  },
}

function CrossStitchComponent(props: MotionGraphicProps<CrossStitchConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cross-stitch',
  title: 'Kinetic Cross Stitch',
  description: 'Text built pixel-by-pixel as X-shaped stitches on aida cloth grid with thread colors and needle pulling animation',
  tags: ['kinetic', 'typography', 'cross-stitch', 'craft', 'textile', 'fabric', 'needle', 'embroidery', 'pixel'],
  category: 'captions',
  component: CrossStitchComponent as any,
  defaultConfig: {
    words: ['KNIT', 'STAB', 'LOOP', 'PULL'],
    colors: ['#CC3333', '#3366AA', '#339933', '#CC9933'],
    bgColor: '#F5EDE0',
    cycleDuration: 1.4,
    gridSize: 8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['KNIT', 'STAB', 'LOOP', 'PULL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#CC3333', '#3366AA', '#339933', '#CC9933'], group: 'Style' },
    { key: 'bgColor', label: 'Cloth Color', type: 'color', defaultValue: '#F5EDE0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
    { key: 'gridSize', label: 'Grid Size', type: 'number', defaultValue: 8, min: 4, max: 16, group: 'Style' },
  ],
})
