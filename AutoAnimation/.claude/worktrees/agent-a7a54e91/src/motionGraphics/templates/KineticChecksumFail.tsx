import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ChecksumFailConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Fake CRC32 hex string based on seed */
function fakeCRC(seed: number): string {
  return Math.floor(rand(seed) * 0xFFFFFFFF).toString(16).toUpperCase().padStart(8, '0')
}

/** "Incorrect" CRC — differs from expected */
function badCRC(seed: number): string {
  return Math.floor(rand(seed + 999) * 0xFFFFFFFF).toString(16).toUpperCase().padStart(8, '0')
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Checksum verification table in background
    const chunkCount = 6
    const chunks: { name: string; expected: string; actual: string; ok: boolean }[] = []
    for (let i = 0; i < chunkCount; i++) {
      const isCorrupt = rand(i * 53 + Math.floor(time * 0.8) * 7) < 0.3
      chunks.push({
        name: `CHUNK_${String.fromCharCode(65 + i)}`,
        expected: fakeCRC(i * 100),
        actual: isCorrupt ? badCRC(i * 100) : fakeCRC(i * 100),
        ok: !isCorrupt,
      })
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 7,
            color: 'rgba(160, 220, 160, 0.10)',
            letterSpacing: 0.5,
          }}
        >
          CRC32 VERIFICATION
        </div>
        {chunks.map((chunk, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: 18 + i * 9,
              left: 10,
              fontFamily: "'Courier New', monospace",
              fontSize: 7,
              color: chunk.ok ? 'rgba(100, 220, 100, 0.08)' : 'rgba(255, 80, 80, 0.10)',
              whiteSpace: 'nowrap',
              letterSpacing: 0.5,
            }}
          >
            {chunk.name}: EXP={chunk.expected} GOT={chunk.actual} {chunk.ok ? 'OK' : 'FAIL'}
          </div>
        ))}
        {/* Verification scan line */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${(time * 20) % 100}%`,
            height: 1,
            background: 'rgba(140, 255, 140, 0.04)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 173 + 97
    const chars = word.split('')
    const totalChars = chars.length

    if (phase === 'enter') {
      // Characters appear with a "verify" progress: each char shows, flickers with a bad checksum color,
      // then a correction is applied and it locks to the correct color
      const rendered = chars.map((realCh, ci) => {
        const verifyStart = (ci / totalChars) * 0.7
        const verifyDuration = 0.2
        const charProgress = Math.max(0, (enterProgress - verifyStart) / verifyDuration)
        const arrived = enterProgress > verifyStart
        const verified = charProgress >= 1

        if (!arrived) {
          return (
            <span key={ci} style={{ display: 'inline-block', color: `${color}00` }}>
              {realCh}
            </span>
          )
        }

        // Verification phase: flickers between error red and correct color
        const verifyPhase = Math.min(1, charProgress)
        // During verify: alternate between error and correction
        const isChecking = verifyPhase < 1
        const checkCycle = Math.floor(f / 2 + ci) % 4
        const showError = isChecking && (checkCycle === 0 || checkCycle === 1)
        const displayColor = showError ? '#FF3040' : color
        const displayChar = showError
          ? String.fromCharCode(realCh.charCodeAt(0) ^ (ci + 1))  // XOR corruption
          : realCh

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              color: displayColor,
              opacity: 0.5 + verifyPhase * 0.5,
            }}
          >
            {displayChar.replace(/[^\x20-\x7E]/, '?')}
          </span>
        )
      })

      // Show CRC progress bar below text
      const verifyPct = Math.floor(enterProgress * 100)
      return (
        <div style={{ position: 'absolute', inset: 0 }}>
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
          <div
            style={{
              position: 'absolute',
              bottom: '25%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 9,
              color: `${color}50`,
              whiteSpace: 'nowrap',
              letterSpacing: 1,
            }}
          >
            CRC32: {verifyPct}%
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // All verified — stable display with a brief "recheck" flicker
      const recheck = holdProgress > 0.5 && holdProgress < 0.55
      const recheckFlash = recheck && (Math.floor(f / 2) % 3 === 0)

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
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
              color: recheckFlash ? '#FF3040' : color,
              textShadow: recheck
                ? `2px 0 #FF3040, -2px 0 ${color}, 0 0 12px ${color}`
                : `0 0 8px ${color}25`,
            }}
          >
            {word}
          </div>
          {holdProgress > 0.55 && (
            <div
              style={{
                position: 'absolute',
                bottom: '25%',
                left: '50%',
                transform: 'translateX(-50%)',
                fontFamily: "'Courier New', monospace",
                fontSize: 9,
                color: `${color}40`,
                whiteSpace: 'nowrap',
                letterSpacing: 1,
              }}
            >
              CRC32: OK
            </div>
          )}
        </div>
      )
    } else {
      // Exit: checksum is invalidated as it fades — error colors come back
      const invalidateProgress = exitProgress
      const rendered = chars.map((ch, ci) => {
        const invalidateAt = (ci / totalChars) * 0.6
        const isInvalid = invalidateProgress > invalidateAt
        const alpha = Math.max(0, 1 - (invalidateProgress - invalidateAt) * 2)
        const displayChar = isInvalid
          ? String.fromCharCode(ch.charCodeAt(0) ^ (ci + 1)).replace(/[^\x20-\x7E]/, '?')
          : ch

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              color: isInvalid ? '#FF3040' : color,
              opacity: alpha,
            }}
          >
            {displayChar}
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

function ChecksumFailComponent(props: MotionGraphicProps<ChecksumFailConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-checksum-fail',
  title: 'Kinetic Checksum Fail',
  description:
    'CRC32 checksum verification: each character appears with a verify-and-correct cycle, error colors resolve to clean text after passing checksum. CRC verification table background.',
  tags: ['kinetic', 'typography', 'glitch', 'checksum', 'crc', 'verify', 'error', 'digital'],
  category: 'captions',
  component: ChecksumFailComponent as any,
  defaultConfig: {
    words: ['VERIFY', 'CHECKSUM', 'FAIL', 'CORRECT'],
    colors: ['#80FF80', '#60E060', '#A0FFA0', '#40C040'],
    bgColor: '#020602',
    cycleDuration: 1.7,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['VERIFY', 'CHECKSUM', 'FAIL', 'CORRECT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#80FF80', '#60E060', '#A0FFA0', '#40C040'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020602', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.7, min: 0.3, max: 5, group: 'Timing' },
  ],
})
