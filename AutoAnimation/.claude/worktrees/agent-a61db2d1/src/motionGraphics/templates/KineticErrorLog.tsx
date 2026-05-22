import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ErrorLogConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const ERROR_PREFIXES = [
  'ERR_FATAL:',
  'SEGFAULT:',
  'PANIC:',
  'EXCEPTION:',
  'ABORT:',
  'STACK_OVERFLOW:',
  'NULL_PTR:',
  'OUT_OF_BOUNDS:',
]

const ERROR_MESSAGES = [
  'core dumped at 0xFF',
  'invalid memory access',
  'unhandled exception',
  'stack trace follows',
  'process terminated',
  'buffer overflow detected',
  'assertion failed',
  'segmentation fault',
  'heap corruption',
  'thread deadlock',
  'permission denied',
  'resource exhausted',
]

function errorLine(seed: number): string {
  const prefix = ERROR_PREFIXES[Math.floor(rand(seed) * ERROR_PREFIXES.length)]
  const msg = ERROR_MESSAGES[Math.floor(rand(seed + 17) * ERROR_MESSAGES.length)]
  const lineNum = Math.floor(rand(seed + 31) * 9999)
  return `[${lineNum}] ${prefix} ${msg}`
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Cascading error log lines scrolling upward
    const logLineCount = 14
    const lineH = 14
    const scrollSpeed = 25
    const scrollOffset = (time * scrollSpeed) % (logLineCount * lineH)

    const logLines: { text: string; y: number; isError: boolean }[] = []
    for (let i = 0; i < logLineCount; i++) {
      const baseSeed = i * 97 + Math.floor(time * 1.5)
      const y = height - 20 - i * lineH + scrollOffset
      const isError = rand(baseSeed) < 0.7
      logLines.push({
        text: errorLine(baseSeed),
        y,
        isError,
      })
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Error log lines */}
        {logLines.map((l, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 8,
              top: l.y,
              fontFamily: "'Courier New', monospace",
              fontSize: 9,
              color: l.isError ? 'rgba(255, 60, 60, 0.1)' : 'rgba(255, 200, 60, 0.07)',
              whiteSpace: 'nowrap',
              opacity: Math.max(0, 1 - Math.abs(l.y - height / 2) / (height / 2)),
            }}
          >
            {l.text}
          </div>
        ))}
        {/* Red warning bar at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `rgba(255, 50, 50, ${0.1 + Math.sin(time * 6) * 0.05})`,
          }}
        />
        {/* Process status */}
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 8,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(255, 60, 60, 0.12)',
          }}
        >
          PID: {1024 + Math.floor(rand(Math.floor(time * 0.3)) * 8000)} [KILLED]
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 163 + 89

    if (phase === 'enter') {
      // Stack of error messages rapidly appear and cascade upward, clearing to reveal the word
      const errorCount = 6
      const clearProgress = Math.max(0, (enterProgress - 0.5) / 0.5)

      const errors: { text: string; y: number; opacity: number }[] = []
      for (let i = 0; i < errorCount; i++) {
        const errDelay = i / errorCount * 0.4
        const errProgress = Math.max(0, Math.min(1, (enterProgress - errDelay) / 0.3))
        if (errProgress <= 0) continue

        // Errors stack up from center, then clear upward
        const baseY = 0
        const stackY = baseY - i * 22
        const clearY = stackY - clearProgress * 200
        const errOpacity = errProgress * (1 - clearProgress)

        errors.push({
          text: errorLine(seed + i * 53),
          y: clearY,
          opacity: errOpacity,
        })
      }

      const textOpacity = Math.max(0, (enterProgress - 0.6) / 0.4)
      const textScale = 0.8 + textOpacity * 0.2

      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          {/* Error messages cascading */}
          {errors.map((err, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: err.y,
                transform: 'translateX(-50%)',
                fontFamily: "'Courier New', monospace",
                fontSize: 11,
                color: '#FF4444',
                whiteSpace: 'nowrap',
                opacity: err.opacity,
              }}
            >
              {err.text}
            </div>
          ))}
          {/* The actual word emerging */}
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 10vw, 140px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              opacity: textOpacity,
              transform: `scale(${textScale})`,
              textShadow: `0 0 12px ${color}40`,
              letterSpacing: 3,
            }}
          >
            {word}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Word is displayed with occasional error flashes — brief stack trace overlay
      const flashActive = (holdProgress > 0.25 && holdProgress < 0.32) || (holdProgress > 0.6 && holdProgress < 0.66)

      // Generate mini stack trace for flash
      const traceLines = flashActive
        ? Array.from({ length: 3 }, (_, i) => ({
            text: `  at 0x${Math.floor(rand(seed + i * 37 + f) * 0xFFFF).toString(16).padStart(4, '0')}  ${errorLine(seed + i * 71 + f)}`,
            y: 30 + i * 14,
          }))
        : []

      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          {/* Flash error traces */}
          {traceLines.map((t, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: t.y,
                transform: 'translateX(-50%)',
                fontFamily: "'Courier New', monospace",
                fontSize: 9,
                color: 'rgba(255, 60, 60, 0.3)',
                whiteSpace: 'nowrap',
              }}
            >
              {t.text}
            </div>
          ))}
          {/* Main word */}
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 10vw, 140px)',
              fontWeight: 700,
              color: flashActive ? '#FF4444' : color,
              whiteSpace: 'nowrap',
              textShadow: flashActive
                ? '2px 0 rgba(255,0,0,0.4), -2px 0 rgba(0,100,255,0.3), 0 0 15px rgba(255,0,0,0.3)'
                : `0 0 8px ${color}30, 0 0 20px ${color}15`,
              letterSpacing: 3,
            }}
          >
            {word}
          </div>
        </div>
      )
    } else {
      // Exit: word gets buried under cascading errors from below, then all fade
      const errorCount = 5
      const errors: { text: string; y: number; opacity: number }[] = []

      for (let i = 0; i < errorCount; i++) {
        const errDelay = i / errorCount * 0.4
        const errProgress = Math.max(0, Math.min(1, (exitProgress - errDelay) / 0.3))
        if (errProgress <= 0) continue

        const baseY = 80
        const riseY = baseY - errProgress * (80 + i * 20)

        errors.push({
          text: errorLine(seed + i * 67 + 200),
          y: riseY,
          opacity: errProgress * (1 - exitProgress * 0.5),
        })
      }

      const wordOpacity = 1 - exitProgress

      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          {/* Error messages rising to cover */}
          {errors.map((err, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: err.y,
                transform: 'translateX(-50%)',
                fontFamily: "'Courier New', monospace",
                fontSize: 11,
                color: '#FF4444',
                whiteSpace: 'nowrap',
                opacity: err.opacity,
              }}
            >
              {err.text}
            </div>
          ))}
          {/* Fading word */}
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 10vw, 140px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              opacity: wordOpacity,
              letterSpacing: 3,
            }}
          >
            {word}
          </div>
        </div>
      )
    }
  },
}

function ErrorLogComponent(props: MotionGraphicProps<ErrorLogConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-error-log',
  title: 'Kinetic Error Log',
  description: 'Cascading error messages and stack traces that clear to reveal the actual word — crash log aesthetic with scrolling error lines and PID status',
  tags: ['kinetic', 'typography', 'error', 'crash', 'log', 'stack', 'trace', 'digital', 'corruption'],
  category: 'captions',
  component: ErrorLogComponent as any,
  defaultConfig: {
    words: ['CRASH', 'FATAL', 'ABORT', 'PANIC'],
    colors: ['#FF6666', '#FF4444', '#FF8844', '#FF6644'],
    bgColor: '#0a0206',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CRASH', 'FATAL', 'ABORT', 'PANIC'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6666', '#FF4444', '#FF8844', '#FF6644'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0206', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
