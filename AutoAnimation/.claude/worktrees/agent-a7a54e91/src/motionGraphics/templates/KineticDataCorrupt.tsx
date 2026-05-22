import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DataCorruptConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Mojibake character sets — real Unicode corruption patterns
const MOJIBAKE_LATIN =
  '\u00C3\u00A9\u00C3\u00A0\u00C3\u00BC\u00C3\u00B1\u00C2\u00A7\u00C2\u00AB\u00C2\u00BB\u00C3\u0178\u00C3\u0192\u00C3\u201E'
const MOJIBAKE_CJK = '\u7E41\u4F53\u5B57\u6587\u5316\u5B57\u5E55\u8A9E\u8A00\u6A21'
const MOJIBAKE_SYMBOLS = '\u2588\u2591\u2592\u2593\u25A0\u25A1\u25CF\u25CB\u2666\u2663\u2660\u2665'

function mojibakeChar(seed: number): string {
  const pool = MOJIBAKE_LATIN + MOJIBAKE_CJK + MOJIBAKE_SYMBOLS
  return pool[Math.abs(Math.floor(rand(seed) * pool.length)) % pool.length]
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Corrupted file header display
    const headerBytes = 12
    const bytes: { text: string; x: number; y: number; corrupted: boolean }[] = []

    for (let i = 0; i < headerBytes; i++) {
      const row = Math.floor(i / 4)
      const col = i % 4
      const isCorrupted = rand(i * 37 + Math.floor(time * 2)) < 0.3
      const hexVal = isCorrupted
        ? 'FF'
        : Math.floor(rand(i * 91 + Math.floor(time * 0.5)) * 256)
            .toString(16)
            .toUpperCase()
            .padStart(2, '0')
      bytes.push({
        text: hexVal,
        x: 10 + col * 28,
        y: height - 60 + row * 14,
        corrupted: isCorrupted,
      })
    }

    // File corruption progress bar
    const corruptPct = 40 + Math.sin(time * 0.8) * 30

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Hex byte display */}
        {bytes.map((b, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: b.x,
              top: b.y,
              fontFamily: "'Courier New', monospace",
              fontSize: 9,
              color: b.corrupted ? 'rgba(255, 60, 60, 0.15)' : 'rgba(100, 200, 255, 0.08)',
              whiteSpace: 'nowrap',
            }}
          >
            {b.text}
          </div>
        ))}
        {/* Corruption indicator */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: 'rgba(255, 80, 80, 0.12)',
          }}
        >
          FILE INTEGRITY: {Math.floor(100 - corruptPct)}%
        </div>
        {/* Corrupt scan line */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${(time * 15) % 100}%`,
            height: 2,
            background: 'rgba(255, 50, 50, 0.06)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 157 + 83
    const chars = word.split('')
    const totalChars = chars.length

    if (phase === 'enter') {
      // Start as fully mojibake text, characters resolve one by one into real text
      const rendered = chars.map((realCh, ci) => {
        // Each char resolves at a different time, with rapid cycling before settling
        const resolvePoint = 0.3 + (ci / totalChars) * 0.6
        const charProgress = Math.max(
          0,
          Math.min(1, (enterProgress - resolvePoint * 0.5) / (resolvePoint * 0.5 + 0.001)),
        )

        if (charProgress >= 1) {
          return (
            <span key={ci} style={{ color, display: 'inline-block' }}>
              {realCh}
            </span>
          )
        }

        // Cycle through mojibake characters rapidly
        const cycleRate = Math.max(1, Math.floor((1 - charProgress) * 6))
        const moji = mojibakeChar(ci * 53 + seed + Math.floor(f / cycleRate))
        const charColor = charProgress > 0.6 ? color : '#FF4466'

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              color: charColor,
              opacity: 0.5 + charProgress * 0.5,
              transform: `scaleX(${0.8 + charProgress * 0.2})`,
            }}
          >
            {moji}
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
            fontSize: 'clamp(36px, 10vw, 140px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
          }}
        >
          {rendered}
        </div>
      )
    } else if (phase === 'hold') {
      // Mostly stable but periodic corruption bursts — a few chars randomly turn mojibake
      const burstActive = (holdProgress > 0.2 && holdProgress < 0.28) || (holdProgress > 0.55 && holdProgress < 0.62)

      const rendered = chars.map((ch, ci) => {
        const isCorrupted = burstActive && rand(seed + ci * 41 + Math.floor(holdProgress * 15)) < 0.35

        if (isCorrupted) {
          const moji = mojibakeChar(ci * 67 + f)
          return (
            <span key={ci} style={{ display: 'inline-block', color: '#FF3366' }}>
              {moji}
            </span>
          )
        }

        return (
          <span key={ci} style={{ display: 'inline-block', color }}>
            {ch}
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
            fontSize: 'clamp(36px, 10vw, 140px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
            textShadow: burstActive ? `2px 0 #FF3366, -2px 0 #3366FF, 0 0 12px ${color}` : `0 0 8px ${color}30`,
          }}
        >
          {rendered}
        </div>
      )
    } else {
      // Exit: text corrupts back to mojibake, then fades
      const rendered = chars.map((realCh, ci) => {
        const corruptPoint = (ci / totalChars) * 0.5
        const corrupted = exitProgress > corruptPoint

        if (corrupted) {
          const moji = mojibakeChar(ci * 83 + f)
          const alpha = Math.max(0, 1 - (exitProgress - corruptPoint) * 2)
          return (
            <span key={ci} style={{ display: 'inline-block', color: '#FF4466', opacity: alpha }}>
              {moji}
            </span>
          )
        }

        return (
          <span key={ci} style={{ display: 'inline-block', color }}>
            {realCh}
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
            fontSize: 'clamp(36px, 10vw, 140px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
          }}
        >
          {rendered}
        </div>
      )
    }
  },
}

function DataCorruptComponent(props: MotionGraphicProps<DataCorruptConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-data-corrupt',
  title: 'Kinetic Data Corrupt',
  description:
    'Corrupted file aesthetic with mojibake Unicode characters that cycle and resolve into readable text, hex byte display, file integrity indicator',
  tags: ['kinetic', 'typography', 'corrupt', 'mojibake', 'digital', 'data', 'glitch', 'unicode'],
  category: 'captions',
  component: DataCorruptComponent as any,
  defaultConfig: {
    words: ['CORRUPT', 'ERROR', 'BROKEN', 'REPAIR'],
    colors: ['#FF6688', '#FF4466', '#FF8866', '#FFAA66'],
    bgColor: '#080010',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['CORRUPT', 'ERROR', 'BROKEN', 'REPAIR'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF6688', '#FF4466', '#FF8866', '#FFAA66'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080010', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
