import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BinaryStreamConfig extends KineticBaseConfig {}

function seededBit(seed: number): string {
  return Math.abs(Math.floor(Math.sin(seed * 12.9898 + 78.233) * 43758.5453)) % 2 === 0 ? '0' : '1'
}

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!?<>'

function scrambleChar(seed: number): string {
  return SCRAMBLE_CHARS[Math.abs(Math.floor(Math.sin(seed) * 1000)) % SCRAMBLE_CHARS.length]
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    const columns = 20
    const rows = 14
    const colW = width / columns
    const rowH = height / rows

    const bits: { x: number; y: number; char: string; opacity: number }[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const seed = r * columns + c
        const speed = 0.5 + ((seed * 31) % 10) / 10
        const char = seededBit(seed + Math.floor(frame * speed * 0.1))
        const opacity = 0.06 + ((seed * 17) % 10) / 100
        bits.push({ x: c * colW + colW / 2, y: r * rowH + rowH / 2, char, opacity })
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {bits.map((b, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: b.x,
              top: b.y,
              fontFamily: "'Courier New', monospace",
              fontSize: 11,
              color: `rgba(0, 255, 65, ${b.opacity})`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {b.char}
          </div>
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const totalChars = word.length

    if (phase === 'enter') {
      // Decode from random chars to real word
      const chars = word.split('').map((realChar, ci) => {
        const charProgress = Math.max(0, Math.min(1, (enterProgress * (totalChars + 2) - ci) / 2))
        if (charProgress >= 1) return realChar
        // Show scrambled char
        const f = frame ?? 0
        return scrambleChar(ci * 97 + index * 31 + f * 3)
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: Math.min(1, enterProgress * 3),
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 10px ${color}, 0 0 25px ${color}40`,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
          }}
        >
          {chars.join('')}
        </div>
      )
    } else if (phase === 'hold') {
      // Stable text with subtle glow pulse
      const pulse = 0.8 + Math.sin(holdProgress * Math.PI * 4) * 0.2

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 ${8 + pulse * 12}px ${color}, 0 0 ${20 + pulse * 15}px ${color}40`,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
          }}
        >
          {word}
        </div>
      )
    } else {
      // Re-encode to binary on exit
      const chars = word.split('').map((realChar, ci) => {
        const charProgress = Math.max(0, Math.min(1, (exitProgress * (totalChars + 2) - ci) / 2))
        if (charProgress >= 1) return seededBit(ci * 41 + index * 13)
        if (charProgress > 0) return scrambleChar(ci * 73 + (frame ?? 0))
        return realChar
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 1 - exitProgress * 0.7,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 10px ${color}`,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
          }}
        >
          {chars.join('')}
        </div>
      )
    }
  },
}

function BinaryStreamComponent(props: MotionGraphicProps<BinaryStreamConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-binary-stream',
  title: 'Kinetic Binary Stream',
  description: 'Binary 0/1 streaming background with word decode from random characters and re-encode on exit',
  tags: ['kinetic', 'typography', 'binary', 'digital', 'decode', 'tech'],
  category: 'captions',
  component: BinaryStreamComponent as any,
  defaultConfig: {
    words: ['DATA', 'BYTE', 'CODE', 'SYNC'],
    colors: ['#00FF41', '#00FFAA', '#00FF41', '#00FFAA'],
    bgColor: '#050510',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DATA', 'BYTE', 'CODE', 'SYNC'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FF41', '#00FFAA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050510', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
