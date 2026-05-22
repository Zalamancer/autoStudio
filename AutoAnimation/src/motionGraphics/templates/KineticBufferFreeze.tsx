import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BufferFreezeConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Generate macro block grid for compression artifact simulation
function generateMacroBlocks(
  cols: number,
  rows: number,
  frameSeed: number,
  intensity: number
): { col: number; row: number; color: string; opacity: number }[] {
  const blocks: { col: number; row: number; color: string; opacity: number }[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const s = c * 7 + r * 13 + frameSeed
      if (rand(s) < intensity) {
        const hue = Math.floor(rand(s + 1) * 360)
        const sat = 40 + Math.floor(rand(s + 2) * 60)
        const lit = 20 + Math.floor(rand(s + 3) * 60)
        const opacity = 0.3 + rand(s + 4) * 0.5
        blocks.push({ col: c, row: r, color: `hsl(${hue},${sat}%,${lit}%)`, opacity })
      }
    }
  }
  return blocks
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const blockW = 32
    const blockH = 18
    const cols = Math.ceil(width / blockW)
    const rows = Math.ceil(height / blockH)

    // Scattered macro blocks at background level
    const bgBlocks = generateMacroBlocks(cols, rows, Math.floor(time * 4), 0.06)

    // Frozen row band — simulates a buffering artifact where a strip stops updating
    const frozenBandY = (rand(Math.floor(time * 0.5) * 31) * 80 + 10)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Background macro block artifacts */}
        {bgBlocks.map((b, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: b.col * blockW,
              top: b.row * blockH,
              width: blockW,
              height: blockH,
              background: b.color,
              opacity: b.opacity,
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Frozen frame band */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${frozenBandY}%`,
            height: `${3 + rand(Math.floor(time * 0.5) * 17) * 6}%`,
            background: 'rgba(0,0,0,0.5)',
            borderTop: '1px solid rgba(0,200,255,0.3)',
            borderBottom: '1px solid rgba(0,200,255,0.3)',
            pointerEvents: 'none',
          }}
        />
        {/* Buffering indicator overlay */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 16,
            fontFamily: "'Courier New', monospace",
            fontSize: 10,
            color: 'rgba(0,200,255,0.6)',
            letterSpacing: 1,
          }}
        >
          BUFFERING...
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 83 + 29
    const blockW = 32
    const blockH = 18

    let opacity = 1
    let blockIntensity = 0

    if (phase === 'enter') {
      opacity = enterProgress
      blockIntensity = (1 - enterProgress) * 0.8
    } else if (phase === 'hold') {
      opacity = 1
      // Occasional buffer re-freeze moments
      const freezeMoment = holdProgress > 0.4 && holdProgress < 0.5
      blockIntensity = freezeMoment ? 0.4 : 0.05
    } else {
      opacity = 1 - exitProgress
      blockIntensity = exitProgress * 0.9
    }

    const cols = Math.ceil((width ?? 400) / blockW)
    const rows = Math.ceil((height ?? 300) / blockH)
    const artBlocks = generateMacroBlocks(cols, rows, Math.floor(f * 3) + seed, blockIntensity)

    const fontSize = 'clamp(40px, 11vw, 160px)'
    const fontStyle: React.CSSProperties = {
      fontFamily: "'Arial Black', 'Impact', sans-serif",
      fontSize,
      fontWeight: 900,
      color,
      whiteSpace: 'nowrap',
      textTransform: 'uppercase',
      letterSpacing: 2,
    }

    // During enter/exit, simulate partial frame decode: text appears column by column
    const decodeProgress = phase === 'enter' ? enterProgress : phase === 'exit' ? 1 - exitProgress : 1
    const clipRight = Math.max(0, 100 - decodeProgress * 100)

    return (
      <>
        {/* Macro block overlay on the text region */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {artBlocks.map((b, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: b.col * blockW,
                top: b.row * blockH,
                width: blockW,
                height: blockH,
                background: b.color,
                opacity: b.opacity,
              }}
            />
          ))}
        </div>
        {/* Text with decode clip */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
            clipPath: `inset(0 ${clipRight}% 0 0)`,
            textShadow: `0 0 8px ${color}50`,
            ...fontStyle,
          }}
        >
          {word}
        </div>
        {/* Ghost duplicate — previous frozen frame */}
        {blockIntensity > 0.2 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${(rand(seed + f) - 0.5) * 6}px), calc(-50% + ${blockH / 2}px))`,
              opacity: blockIntensity * 0.4,
              color: 'rgba(0,180,255,0.8)',
              mixBlendMode: 'screen',
              ...fontStyle,
            }}
          >
            {word}
          </div>
        )}
      </>
    )
  },
}

function BufferFreezeComponent(props: MotionGraphicProps<BufferFreezeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-buffer-freeze',
  title: 'Kinetic Buffer Freeze',
  description: 'Video buffer freeze with MPEG macro block compression artifacts, partial frame decode reveal, and buffering overlay',
  tags: ['kinetic', 'typography', 'buffer', 'freeze', 'compression', 'artifacts', 'hardware', 'glitch', 'digital'],
  category: 'captions',
  component: BufferFreezeComponent as any,
  defaultConfig: {
    words: ['LOADING', 'BUFFER', 'STALL', 'DECODE'],
    colors: ['#00ccff', '#ffffff', '#00ccff', '#ccffff'],
    bgColor: '#080810',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LOADING', 'BUFFER', 'STALL', 'DECODE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00ccff', '#ffffff', '#00ccff', '#ccffff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080810', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
