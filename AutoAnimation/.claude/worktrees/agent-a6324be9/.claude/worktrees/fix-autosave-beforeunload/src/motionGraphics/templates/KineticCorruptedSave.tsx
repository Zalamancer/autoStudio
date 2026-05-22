import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CorruptedSaveConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Save file garbage data characters
const SAVE_GARBAGE = '£¬§±°²³µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏ\x00\x01\x02\x03\x04\x05\xFF\xFE\xFD'
const NULL_BYTES = '\u2400\u2401\u2402\u2403\u2404\u2405\u2406\u2407'

function garbageChar(seed: number): string {
  const pool = SAVE_GARBAGE + NULL_BYTES + '??????????????????'
  return pool[Math.abs(Math.floor(rand(seed) * pool.length)) % pool.length]
}

function hexByte(seed: number): string {
  return Math.floor(rand(seed) * 256).toString(16).toUpperCase().padStart(2, '0')
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Scrolling hex dump of corrupted save file data
    const lineCount = 5
    const lines: string[] = []
    for (let li = 0; li < lineCount; li++) {
      const addr = ((Math.floor(time * 4) + li) * 16) & 0xFFFF
      const addrStr = addr.toString(16).toUpperCase().padStart(4, '0')
      const bytes = Array.from({ length: 16 }, (_, bi) => {
        const isCorrupt = rand(li * 31 + bi * 17 + Math.floor(time * 3)) < 0.4
        return isCorrupt ? 'FF' : hexByte(li * 200 + bi + Math.floor(time * 0.3))
      }).join(' ')
      lines.push(`${addrStr}: ${bytes}`)
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {lines.map((line, li) => (
          <div
            key={li}
            style={{
              position: 'absolute',
              bottom: 8 + li * 11,
              left: 10,
              fontFamily: "'Courier New', monospace",
              fontSize: 7,
              color: `rgba(255, 100, 50, ${0.05 + li * 0.015})`,
              letterSpacing: 0.5,
              whiteSpace: 'nowrap',
            }}
          >
            {line}
          </div>
        ))}
        {/* Save state label */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(255, 80, 30, 0.12)',
          }}
        >
          SAVE DATA: CORRUPTED — ATTEMPTING RECOVERY
        </div>
        {/* Periodic error flash */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `rgba(255, 60, 20, ${0.04 + Math.sin(time * 7) * 0.02})`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 149 + 61
    const chars = word.split('')
    const totalChars = chars.length

    if (phase === 'enter') {
      // Garbled data slowly resolves into readable characters
      // Characters recover from right to left in blocks, like a checksum repair
      const rendered = chars.map((realCh, ci) => {
        // Recovery spreads from left to right with some scatter
        const recoverAt = (ci / totalChars) * 0.65 + rand(seed + ci * 7) * 0.15
        const charProgress = Math.max(0, (enterProgress - recoverAt) / (0.35 + rand(seed + ci) * 0.2))
        const charDone = charProgress >= 1

        if (charDone) {
          return (
            <span key={ci} style={{ color, display: 'inline-block' }}>
              {realCh}
            </span>
          )
        }

        // Show garbage data cycling, slowing as it approaches the real char
        const cycleRate = Math.max(1, Math.floor((1 - charProgress) * 7))
        const gc = garbageChar(ci * 61 + seed + Math.floor(f / cycleRate))
        const garbleColor = charProgress > 0.5 ? color : '#FF5020'

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              color: garbleColor,
              opacity: 0.4 + charProgress * 0.6,
              transform: `skewX(${(1 - charProgress) * (rand(seed + ci + 1) - 0.5) * 15}deg)`,
            }}
          >
            {gc}
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
            fontSize: 'clamp(38px, 11vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
          }}
        >
          {rendered}
        </div>
      )
    } else if (phase === 'hold') {
      // Stable with occasional brief corruption "relapse"
      const relapse1 = holdProgress > 0.22 && holdProgress < 0.27
      const relapse2 = holdProgress > 0.58 && holdProgress < 0.62
      const isRelapsing = relapse1 || relapse2

      const rendered = chars.map((ch, ci) => {
        const corrupt = isRelapsing && rand(seed + ci * 29 + Math.floor(holdProgress * 20)) < 0.3
        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              color: corrupt ? '#FF3010' : color,
              transform: corrupt
                ? `translateY(${(rand(seed + ci) - 0.5) * 6}px)`
                : 'none',
            }}
          >
            {corrupt ? garbageChar(ci * 47 + f) : ch}
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
            fontSize: 'clamp(38px, 11vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            textShadow: isRelapsing
              ? `2px 0 #FF2000, -2px 0 #FF6040, 0 0 15px #FF3020`
              : `0 0 8px ${color}25`,
          }}
        >
          {rendered}
        </div>
      )
    } else {
      // Exit: text corrupts back into garbled data, fading
      const rendered = chars.map((realCh, ci) => {
        const corruptAt = (ci / totalChars) * 0.5
        const isCorrupt = exitProgress > corruptAt
        const alpha = isCorrupt ? Math.max(0, 1 - (exitProgress - corruptAt) * 2.5) : 1
        const gc = isCorrupt ? garbageChar(ci * 53 + f) : realCh

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              color: isCorrupt ? '#FF4020' : color,
              opacity: alpha,
            }}
          >
            {gc}
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
            fontSize: 'clamp(38px, 11vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
          }}
        >
          {rendered}
        </div>
      )
    }
  },
}

function CorruptedSaveComponent(props: MotionGraphicProps<CorruptedSaveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-corrupted-save',
  title: 'Kinetic Corrupted Save',
  description:
    'Corrupted save file: garbled data characters recover character by character into readable text, scrolling hex dump background, relapse corruption bursts.',
  tags: ['kinetic', 'typography', 'glitch', 'save', 'corrupt', 'recovery', 'data', 'hex'],
  category: 'captions',
  component: CorruptedSaveComponent as any,
  defaultConfig: {
    words: ['CORRUPT', 'SAVE', 'RESTORE', 'LOADED'],
    colors: ['#FF6030', '#FF4020', '#FF8050', '#FFA060'],
    bgColor: '#070400',
    cycleDuration: 1.7,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CORRUPT', 'SAVE', 'RESTORE', 'LOADED'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6030', '#FF4020', '#FF8050', '#FFA060'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#070400', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.7, min: 0.3, max: 5, group: 'Timing' },
  ],
})
