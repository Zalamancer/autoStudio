import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FlipDiscConfig extends KineticBaseConfig {}

function pRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// 5×7 pixel font — same encoding as LEDMatrix
const CHAR_MAP: Record<string, number[]> = {
  A:[0x0e,0x11,0x11,0x1f,0x11,0x11,0x11],
  B:[0x1e,0x11,0x11,0x1e,0x11,0x11,0x1e],
  C:[0x0e,0x11,0x10,0x10,0x10,0x11,0x0e],
  D:[0x1e,0x11,0x11,0x11,0x11,0x11,0x1e],
  E:[0x1f,0x10,0x10,0x1e,0x10,0x10,0x1f],
  F:[0x1f,0x10,0x10,0x1e,0x10,0x10,0x10],
  G:[0x0e,0x11,0x10,0x17,0x11,0x11,0x0f],
  H:[0x11,0x11,0x11,0x1f,0x11,0x11,0x11],
  I:[0x0e,0x04,0x04,0x04,0x04,0x04,0x0e],
  J:[0x07,0x02,0x02,0x02,0x02,0x12,0x0c],
  K:[0x11,0x12,0x14,0x18,0x14,0x12,0x11],
  L:[0x10,0x10,0x10,0x10,0x10,0x10,0x1f],
  M:[0x11,0x1b,0x15,0x15,0x11,0x11,0x11],
  N:[0x11,0x11,0x19,0x15,0x13,0x11,0x11],
  O:[0x0e,0x11,0x11,0x11,0x11,0x11,0x0e],
  P:[0x1e,0x11,0x11,0x1e,0x10,0x10,0x10],
  Q:[0x0e,0x11,0x11,0x11,0x15,0x12,0x0d],
  R:[0x1e,0x11,0x11,0x1e,0x14,0x12,0x11],
  S:[0x0e,0x11,0x10,0x0e,0x01,0x11,0x0e],
  T:[0x1f,0x04,0x04,0x04,0x04,0x04,0x04],
  U:[0x11,0x11,0x11,0x11,0x11,0x11,0x0e],
  V:[0x11,0x11,0x11,0x11,0x11,0x0a,0x04],
  W:[0x11,0x11,0x11,0x15,0x15,0x1b,0x11],
  X:[0x11,0x11,0x0a,0x04,0x0a,0x11,0x11],
  Y:[0x11,0x11,0x0a,0x04,0x04,0x04,0x04],
  Z:[0x1f,0x01,0x02,0x04,0x08,0x10,0x1f],
  ' ':[0,0,0,0,0,0,0],
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

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

// Flip disc: each disc is a circle that flips on its horizontal axis
// Black side = unset (inactive), colored side = set (active)
// Flip animation uses scaleY going from 1 → 0 → -1 (which makes it appear to flip)

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Steel panel texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 3px,
              rgba(255,255,255,0.02) 3px,
              rgba(255,255,255,0.02) 4px
            )`,
          }}
        />
        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const chars = word.toUpperCase().split('')
    const wordLen = chars.length

    const CHAR_COLS = 5
    const CHAR_ROWS = 7
    const CHAR_GAP = 1

    const totalCols = wordLen * (CHAR_COLS + CHAR_GAP) - CHAR_GAP
    const discSize = Math.min(
      Math.floor((width * 0.8) / totalCols),
      Math.floor((height * 0.62) / CHAR_ROWS),
      16,
    )
    const discGap = Math.max(1, discSize * 0.15)

    const totalW = totalCols * (discSize + discGap)
    const totalH = CHAR_ROWS * (discSize + discGap)
    const startX = (width - totalW) / 2
    const startY = (height - totalH) / 2

    // Flip wave: discs flip left-to-right across the display
    // Each disc at column globalCol flips at globalCol/totalCols * 0.7 progress
    // Flip duration = 0.25

    const nodes: React.ReactNode[] = []

    for (let ci = 0; ci < wordLen; ci++) {
      const pixelMap = getCharPixels(chars[ci])
      const charStartX = startX + ci * (CHAR_COLS + CHAR_GAP) * (discSize + discGap)

      for (let row = 0; row < CHAR_ROWS; row++) {
        for (let col = 0; col < CHAR_COLS; col++) {
          const targetOn = pixelMap[row][col]
          const globalCol = ci * (CHAR_COLS + CHAR_GAP) + col

          // Flip timing: wave sweeps left-to-right
          const flipDelay = (globalCol / (totalCols + 1)) * 0.65
          const flipDuration = 0.28

          // flipProgress: 0 = all black (unflipped), 1 = all shown (flipped)
          let flipProgress = 0
          let isOn = false

          if (phase === 'enter') {
            const fp = Math.max(0, Math.min(1, (enterProgress - flipDelay) / flipDuration))
            flipProgress = easeInOutQuad(fp)
            isOn = flipProgress > 0.5 ? targetOn : false
          } else if (phase === 'hold') {
            flipProgress = 1
            isOn = targetOn
            // Occasional random flicker for realism (1 in 400 discs per frame)
            if (pRand(globalCol * 73 + row * 31 + f * 7) < 0.003) {
              isOn = !targetOn
            }
          } else {
            // Exit: reverse wave right-to-left flip back to black
            const revDelay = (1 - globalCol / (totalCols + 1)) * 0.5
            const fp = Math.max(0, Math.min(1, (exitProgress - revDelay) / flipDuration))
            flipProgress = 1 - easeInOutQuad(fp)
            isOn = flipProgress > 0.5 ? targetOn : false
          }

          // scaleY animation for the flip — goes 1→0→-1 (halfway through shows color flip)
          // We simulate with scaleY: before mid = showing black, after mid = showing target color
          const halfwayThrough = isOn === targetOn
          const scaleY = flipProgress < 0.5
            ? 1 - flipProgress * 2
            : (flipProgress - 0.5) * 2

          const x = charStartX + col * (discSize + discGap)
          const y = startY + row * (discSize + discGap)
          const r = discSize / 2

          // disc colors
          const discColor = isOn ? color : '#1a1a1a'
          const discGlow = isOn ? `0 0 ${discSize * 0.6}px ${color}80` : 'none'

          nodes.push(
            <div
              key={`${ci}-${row}-${col}`}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: discSize,
                height: discSize,
                borderRadius: '50%',
                background: discColor,
                boxShadow: discGlow,
                transform: `scaleY(${scaleY})`,
                // Hardware border ring
                outline: `1px solid rgba(80,80,80,0.6)`,
              }}
            />,
          )
        }
      }
    }

    return <>{nodes}</>
  },
}

function FlipDiscComponent(props: MotionGraphicProps<FlipDiscConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-flip-disc',
  title: 'Kinetic Flip Disc',
  description: 'Flip-disc display: mechanical dots flip from black to colored in a sweeping wave to form text, with scaleY flip animation and occasional flicker noise',
  tags: ['kinetic', 'typography', 'flip-disc', 'mechanical', 'display', 'dots', 'wave', 'retro', 'sign'],
  category: 'captions',
  component: FlipDiscComponent as any,
  defaultConfig: {
    words: ['DEPART', 'ARRIVE', 'DELAY', 'GATE'],
    colors: ['#ffcc00', '#ff6600', '#00ccff', '#00ff88'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DEPART', 'ARRIVE', 'DELAY', 'GATE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffcc00', '#ff6600', '#00ccff', '#00ff88'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 6, group: 'Timing' },
  ],
})
