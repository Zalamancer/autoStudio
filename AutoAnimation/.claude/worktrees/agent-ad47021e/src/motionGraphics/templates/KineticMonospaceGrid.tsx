import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MonospaceGridConfig extends KineticBaseConfig {}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:!?@#$%^&*'

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function noisyChar(seed: number): string {
  return CHARS[Math.floor(rand(seed) * CHARS.length)]
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const COLS = 36
const ROWS = 20

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

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
    const f = frame ?? 0
    const cellW = width / COLS
    const cellH = height / ROWS

    // Place word centered in the grid
    const wordLen = word.length
    const wordCol = Math.floor((COLS - wordLen) / 2)
    const wordRow = Math.floor(ROWS / 2)

    // A "wave" of clarity sweeps left-to-right over the word columns
    const waveFront = easeOutExpo(enterProgress) * (wordLen + 2) - 1

    const cells: React.ReactNode[] = []

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const isWordRow = r === wordRow
        const isWordChar = isWordRow && c >= wordCol && c < wordCol + wordLen
        const wordCharIdx = c - wordCol
        const baseSeed = index * 991 + r * 47 + c * 13

        let char: string
        let charColor: string
        let charOpacity: number
        let charWeight: number | string = 400

        if (isWordChar) {
          const trueChar = word[wordCharIdx] ?? ''
          const charSwept = wordCharIdx < waveFront

          if (phase === 'enter') {
            if (charSwept) {
              char = trueChar
              charColor = color
              charOpacity = easeOutExpo(Math.max(0, (waveFront - wordCharIdx) / 1.5))
              charWeight = 700
            } else {
              char = noisyChar(baseSeed + Math.floor(f / 3))
              charColor = `rgba(180,180,180,0.5)`
              charOpacity = 0.4
            }
          } else if (phase === 'hold') {
            char = trueChar
            charColor = color
            charOpacity = 1
            charWeight = 700
          } else {
            char = trueChar
            charColor = color
            charOpacity = 1 - exitProgress
            charWeight = 700
          }
        } else {
          // Background matrix characters
          const scrollSpeed = 0.5 + rand(baseSeed) * 1.5
          const scrolledSeed = baseSeed + Math.floor(f * scrollSpeed * 0.04)

          char = noisyChar(scrolledSeed)
          const distFromWord = isWordRow
            ? Math.abs(c - (wordCol + wordLen / 2)) / (COLS / 2)
            : 0.3 + rand(baseSeed + 1) * 0.7

          if (phase === 'hold') {
            charOpacity = 0.03 + rand(baseSeed) * 0.04
          } else {
            charOpacity = 0.04 + rand(baseSeed) * 0.08
          }
          charColor = 'rgba(160,200,160,1)'
        }

        cells.push(
          <div
            key={`${r}-${c}`}
            style={{
              position: 'absolute',
              left: c * cellW,
              top: r * cellH,
              width: cellW,
              height: cellH,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
              fontSize: Math.min(cellW * 0.7, cellH * 0.65, 14),
              fontWeight: charWeight,
              color: charColor,
              opacity: charOpacity,
              userSelect: 'none',
              lineHeight: 1,
            }}
          >
            {char}
          </div>
        )
      }
    }

    return <div style={{ position: 'absolute', inset: 0 }}>{cells}</div>
  },
}

function MonospaceGridComponent(props: MotionGraphicProps<MonospaceGridConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-monospace-grid',
  title: 'Monospace Grid',
  description:
    'Dense monospace character matrix fills the entire canvas. A clarity wave sweeps across the center row, resolving noise characters into the real word while the surrounding matrix keeps scrolling.',
  tags: ['kinetic', 'typography', 'monospace', 'grid', 'matrix', 'code', 'reveal', 'wave'],
  category: 'captions',
  component: MonospaceGridComponent as any,
  defaultConfig: {
    words: ['EMERGE', 'SIGNAL', 'NOISE', 'CLEAR'],
    colors: ['#00FF88', '#00E5FF', '#FFD700', '#FF6B6B'],
    bgColor: '#040408',
    cycleDuration: 2.0,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['EMERGE', 'SIGNAL', 'NOISE', 'CLEAR'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#00FF88', '#00E5FF', '#FFD700', '#FF6B6B'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#040408', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.0,
      min: 0.8,
      max: 6,
      group: 'Timing',
    },
  ],
})
