import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface KernelPanicConfig extends KineticBaseConfig {}

function dRand(seed: number): number {
  return Math.abs(Math.sin(seed * 78.233 + 439.57) * 43758.5453) % 1
}

const PANIC_LINES = [
  'panic(cpu 0 caller 0xffffff80082b9c2e): "Kernel trap"',
  'Backtrace (CPU 0), Frame : Return Address',
  '0xffffff809e1ab560 : 0xffffff8007c1a2f5',
  '0xffffff809e1ab5b0 : 0xffffff8007d4e7a1',
  '0xffffff809e1ab600 : 0xffffff8007c35091',
  'BSD process name corresponding to current thread: kernel_task',
  'Mac OS X version: 99B999',
  'Kernel version: Darwin Kernel Version 23.0.0',
]

const HEX_CHARS = '0123456789ABCDEF'

function hexChar(seed: number): string {
  return HEX_CHARS[Math.floor(dRand(seed) * 16)]
}

function hexWord(seed: number, len: number): string {
  return Array.from({ length: len }, (_, i) => hexChar(seed * 17 + i * 7)).join('')
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const linesVisible = Math.min(PANIC_LINES.length, Math.floor(time * 4))

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Kernel panic dump text scrolling in corners */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            right: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(255,255,255,0.2)',
            lineHeight: 1.5,
          }}
        >
          {PANIC_LINES.slice(0, linesVisible).map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
        {/* Bottom hex dump */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 10,
            right: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(255,255,255,0.15)',
            lineHeight: 1.6,
          }}
        >
          {Array.from({ length: 3 }, (_, row) => {
            const addr = (0x7fff5000 + row * 0x10 + Math.floor(time) * 0x30).toString(16).toUpperCase()
            const bytes = Array.from({ length: 16 }, (_, bi) =>
              hexWord(row * 16 + bi + frame, 2)
            ).join(' ')
            return <div key={row}>{`0x${addr}: ${bytes}`}</div>
          })}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 223 + 71
    const chars = word.split('')

    if (phase === 'enter') {
      // Hex dump bytes gradually form into readable ASCII text
      const rendered = chars.map((realChar, ci) => {
        const resolveAt = 0.2 + (ci / chars.length) * 0.65
        const resolved = enterProgress >= resolveAt

        if (resolved) {
          // Show hex code briefly then flip to char
          const flipAt = resolveAt + 0.05
          const flipped = enterProgress >= flipAt
          if (flipped) {
            return <span key={ci} style={{ color }}>{realChar}</span>
          }
          // Hex representation of the char
          const hexCode = realChar.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')
          return (
            <span key={ci} style={{ color: '#FFFFFF', fontSize: 'clamp(14px, 3.5vw, 55px)' }}>
              {hexCode}
            </span>
          )
        }

        // Still as hex dump noise
        const noiseSeed = seed + ci * 31 + Math.floor(f / 2)
        return (
          <span key={ci} style={{ color: 'rgba(255,255,255,0.3)', fontSize: 'clamp(14px, 3.5vw, 55px)' }}>
            {hexWord(noiseSeed, 2)}
          </span>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 9vw, 140px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            opacity: 0.1 + enterProgress * 0.9,
          }}
        >
          {rendered}
        </div>
      )
    }

    if (phase === 'hold') {
      // Stable white text — brief invert flash (like kernel panic screen invert)
      const invertFlash = holdProgress > 0.3 && holdProgress < 0.34
      const textColor = invertFlash ? bgColor ?? '#000' : color
      const bgFlash = invertFlash ? color : 'transparent'

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 9vw, 140px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            color: textColor,
            background: bgFlash,
            padding: invertFlash ? '0 8px' : 0,
            textShadow: invertFlash ? 'none' : `0 0 8px ${color}50`,
          }}
        >
          {word}
        </div>
      )
    }

    // Exit: text dissolves back into hex bytes
    const rendered = chars.map((realChar, ci) => {
      const hexAt = (ci / chars.length) * 0.7
      const hexed = exitProgress >= hexAt

      if (hexed) {
        const hexProgress = (exitProgress - hexAt) / (1 - hexAt + 0.001)
        const noiseSeed = seed + ci * 31 + Math.floor(f / 2)
        const hexCode = realChar.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')
        // Transition: real hex → noise hex
        const showCode = hexProgress < 0.4
        return (
          <span key={ci} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 'clamp(14px, 3.5vw, 55px)', opacity: 1 - hexProgress * 0.7 }}>
            {showCode ? hexCode : hexWord(noiseSeed, 2)}
          </span>
        )
      }

      return <span key={ci} style={{ color }}>{realChar}</span>
    })

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(36px, 9vw, 140px)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          letterSpacing: 4,
          opacity: 1 - exitProgress * 0.7,
        }}
      >
        {rendered}
      </div>
    )
  },
}

function KernelPanicComponent(props: MotionGraphicProps<KernelPanicConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-kernel-panic',
  title: 'Kinetic Kernel Panic',
  description: 'Kernel panic crash dump: hex bytes and system addresses resolve into readable text, with crash log background',
  tags: ['kinetic', 'typography', 'glitch', 'kernel', 'panic', 'crash', 'hex', 'software', 'digital'],
  category: 'captions',
  component: KernelPanicComponent as any,
  defaultConfig: {
    words: ['PANIC', 'FAULT', 'HALT', 'DEAD'],
    colors: ['#FFFFFF', '#DDDDDD', '#FFFFFF', '#CCCCCC'],
    bgColor: '#000000',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PANIC', 'FAULT', 'HALT', 'DEAD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#DDDDDD', '#FFFFFF', '#CCCCCC'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000000', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.3, max: 5, group: 'Timing' },
  ],
})
