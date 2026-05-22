import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SegfaultConfig extends KineticBaseConfig {}

function dRand(seed: number): number {
  return Math.abs(Math.sin(seed * 201.7 + 53.11) * 43758.5453) % 1
}

function memAddr(seed: number): string {
  const base = 0x7fff0000
  const offset = Math.floor(dRand(seed) * 0xffff)
  return `0x${(base + offset).toString(16).toUpperCase()}`
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const addr = memAddr(Math.floor(time * 3))

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* SIGSEGV indicator */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: "'Courier New', monospace",
            fontSize: 10,
            color: 'rgba(255,60,60,0.5)',
            letterSpacing: 2,
          }}
        >
          Segmentation fault (core dumped)
        </div>
        {/* Memory address at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: 'rgba(255,60,60,0.3)',
            letterSpacing: 1,
          }}
        >
          {`[1]   ${Math.floor(time * 7 + 1000)} Segmentation fault  at ${addr}`}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 241 + 89
    const chars = word.split('')

    if (phase === 'enter') {
      // Characters scatter from memory addresses, reassemble to positions
      const assembled = chars.map((realChar, ci) => {
        const assembleAt = 0.1 + (ci / chars.length) * 0.7
        const assembled = enterProgress >= assembleAt
        const assembleProgress = assembled ? Math.min(1, (enterProgress - assembleAt) / 0.2) : 0

        // Source position: fragment flying in from a memory address location
        const fragSeed = seed + ci * 43
        const srcX = (dRand(fragSeed) - 0.5) * width * 1.2
        const srcY = (dRand(fragSeed + 7) - 0.5) * height * 0.8
        const curX = srcX * (1 - assembleProgress)
        const curY = srcY * (1 - assembleProgress)

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              transform: `translate(${curX}px, ${curY}px)`,
              color: assembleProgress > 0.8 ? color : '#FF4040',
              opacity: assembled ? 0.3 + assembleProgress * 0.7 : 0.5,
              fontSize: 'clamp(36px, 9vw, 140px)',
              transition: 'none',
            }}
          >
            {assembled ? realChar : memAddr(fragSeed).slice(-1)}
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
            letterSpacing: 3,
          }}
        >
          {assembled}
        </div>
      )
    }

    if (phase === 'hold') {
      // Stable — with brief "address validation" flicker showing mem address under each char
      const showAddr = holdProgress > 0.45 && holdProgress < 0.52

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
            letterSpacing: 3,
            color,
            textShadow: showAddr
              ? `0 0 12px #FF4040, 2px 2px 0 #FF4040`
              : `0 0 8px ${color}50`,
          }}
        >
          {word}
          {showAddr && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(8px, 1.5vw, 24px)',
                color: '#FF6060',
                opacity: 0.6,
                whiteSpace: 'nowrap',
                letterSpacing: 1,
              }}
            >
              {memAddr(seed + Math.floor(holdProgress * 30))}
            </div>
          )}
        </div>
      )
    }

    // Exit: characters shatter back into memory fragments and fly away
    const shattered = chars.map((realChar, ci) => {
      const shatterAt = (ci / chars.length) * 0.6
      const shattered = exitProgress >= shatterAt
      const shatterProgress = shattered ? Math.min(1, (exitProgress - shatterAt) / 0.4) : 0

      const fragSeed = seed + ci * 43 + 100
      const dstX = (dRand(fragSeed) - 0.5) * width * 1.2
      const dstY = (dRand(fragSeed + 7) - 0.5) * height * 0.8
      const curX = dstX * shatterProgress
      const curY = dstY * shatterProgress

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            transform: `translate(${curX}px, ${curY}px)`,
            color: shatterProgress > 0.3 ? '#FF4040' : color,
            opacity: 1 - shatterProgress * 0.8,
          }}
        >
          {shattered && shatterProgress > 0.5 ? memAddr(fragSeed).slice(-1) : realChar}
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
          letterSpacing: 3,
        }}
      >
        {shattered}
      </div>
    )
  },
}

function SegfaultComponent(props: MotionGraphicProps<SegfaultConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-segfault',
  title: 'Kinetic Segfault',
  description: 'Segmentation fault: text shatters into memory address fragments that scatter, then reassemble from their crash positions',
  tags: ['kinetic', 'typography', 'glitch', 'segfault', 'memory', 'crash', 'software', 'digital'],
  category: 'captions',
  component: SegfaultComponent as any,
  defaultConfig: {
    words: ['SIGSEGV', 'FAULT', 'DUMP', 'CORE'],
    colors: ['#FF4040', '#FF6060', '#FF4040', '#FF8080'],
    bgColor: '#090000',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SIGSEGV', 'FAULT', 'DUMP', 'CORE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF4040', '#FF6060', '#FF4040', '#FF8080'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#090000', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.3, max: 5, group: 'Timing' },
  ],
})
