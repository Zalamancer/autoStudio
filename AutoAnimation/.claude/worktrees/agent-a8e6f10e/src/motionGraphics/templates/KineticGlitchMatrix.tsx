import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GlitchMatrixConfig extends KineticBaseConfig {}

const MATRIX_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!?<>{}[]|/\\'
const GLITCH_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`'

function matrixChar(seed: number): string {
  return MATRIX_CHARS[Math.abs(Math.floor(Math.sin(seed * 127.1 + 311.7) * 43758.5453)) % MATRIX_CHARS.length]
}

function glitchChar(seed: number): string {
  return GLITCH_CHARS[Math.abs(Math.floor(Math.sin(seed * 43.7 + 92.1) * 19283.7)) % GLITCH_CHARS.length]
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Matrix rain columns
    const columns = 18
    const colWidth = width / columns
    const charHeight = 14

    const drops: { x: number; chars: string[]; yOffset: number }[] = []
    for (let i = 0; i < columns; i++) {
      const speed = 1.2 + (((i * 67 + 41) % 10) / 10) * 2.5
      const yOffset = ((frame * speed + i * 53) % (height + 250)) - 150
      const numChars = 6 + ((i * 29) % 10)
      const chars: string[] = []
      for (let j = 0; j < numChars; j++) {
        chars.push(matrixChar(i * 83 + j * 17 + frame * 2 + Math.floor(j / 3)))
      }
      drops.push({ x: i * colWidth + colWidth / 2, chars, yOffset })
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {drops.map((drop, i) => (
          <div key={i} style={{ position: 'absolute', left: drop.x, top: drop.yOffset }}>
            {drop.chars.map((c, j) => {
              const isCyan = ((i + j) * 37) % 7 === 0
              const baseColor = isCyan ? 'rgba(0, 255, 255,' : 'rgba(0, 255, 65,'
              const alpha = j === 0 ? '0.9)' : `${Math.max(0.04, 0.6 - j * 0.06)})`
              return (
                <div
                  key={j}
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 11,
                    color: j === 0 ? '#FFFFFF' : `${baseColor}${alpha}`,
                    lineHeight: `${charHeight}px`,
                    textAlign: 'center',
                    width: colWidth,
                  }}
                >
                  {c}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const totalChars = word.length
    const f = frame ?? 0
    const seed = index * 173 + 59

    if (phase === 'enter') {
      // Intense glitch decode: random chars settle into real word
      const chars = word.split('').map((realChar, ci) => {
        const charDelay = ci / (totalChars + 1) * 0.5
        const charProgress = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.5))

        if (charProgress >= 1) {
          return (
            <span key={ci} style={{ color }}>
              {realChar}
            </span>
          )
        }

        // Fast cycling through glitch chars
        const cycleSpeed = Math.max(1, Math.floor((1 - charProgress) * 8))
        const currentChar = glitchChar(ci * 97 + seed + Math.floor(f / cycleSpeed))
        const charColor = charProgress > 0.5 ? color : '#00FFAA'

        return (
          <span key={ci} style={{ color: charColor, opacity: 0.4 + charProgress * 0.6 }}>
            {currentChar}
          </span>
        )
      })

      // Horizontal glitch offset during enter
      const glitchX = enterProgress < 0.7 ? Math.sin(f * 0.7 + seed) * 4 * (1 - enterProgress) : 0

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${glitchX}px), -50%)`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            textShadow: `0 0 10px ${color}40`,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
          }}
        >
          {chars}
        </div>
      )
    } else if (phase === 'hold') {
      // Stable with periodic glitch bursts
      const glitchBurst1 = holdProgress > 0.25 && holdProgress < 0.3
      const glitchBurst2 = holdProgress > 0.6 && holdProgress < 0.65

      const isGlitching = glitchBurst1 || glitchBurst2
      const glitchX = isGlitching ? ((seed * 7) % 10) - 5 : 0

      const chars = word.split('').map((ch, ci) => {
        if (isGlitching && (ci + Math.floor(holdProgress * 20)) % 3 === 0) {
          return (
            <span key={ci} style={{ color: '#00FFFF' }}>
              {glitchChar(ci * 41 + f)}
            </span>
          )
        }
        return (
          <span key={ci} style={{ color }}>
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
            transform: `translate(calc(-50% + ${glitchX}px), -50%)`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            textShadow: isGlitching
              ? `3px 0 ${color}, -3px 0 #00FFFF, 0 0 15px ${color}`
              : `0 0 10px ${color}, 0 0 25px ${color}30`,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
          }}
        >
          {chars}
        </div>
      )
    } else {
      // Exit: dissolve back into glitch chars
      const chars = word.split('').map((realChar, ci) => {
        const charDelay = ci / (totalChars + 1) * 0.3
        const charProgress = Math.max(0, Math.min(1, (exitProgress - charDelay) / 0.7))

        if (charProgress >= 1) {
          return (
            <span key={ci} style={{ color, opacity: 0.1 }}>
              {matrixChar(ci * 31 + f)}
            </span>
          )
        }
        if (charProgress > 0) {
          return (
            <span key={ci} style={{ color: '#00FFFF', opacity: 1 - charProgress * 0.6 }}>
              {glitchChar(ci * 73 + f)}
            </span>
          )
        }
        return (
          <span key={ci} style={{ color }}>
            {realChar}
          </span>
        )
      })

      const glitchX = exitProgress > 0.3 ? Math.sin(f * 0.5) * exitProgress * 6 : 0

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${glitchX}px), -50%)`,
            opacity: 1 - exitProgress * 0.5,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            textShadow: `0 0 10px ${color}40`,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
          }}
        >
          {chars}
        </div>
      )
    }
  },
}

function GlitchMatrixComponent(props: MotionGraphicProps<GlitchMatrixConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-glitch-matrix',
  title: 'Kinetic Glitch Matrix',
  description: 'Matrix rain combined with intense glitch effects: falling characters, random char substitution that settles, green/cyan on black',
  tags: ['kinetic', 'typography', 'glitch', 'matrix', 'hacker', 'tech', 'digital'],
  category: 'captions',
  component: GlitchMatrixComponent as any,
  defaultConfig: {
    words: ['BREACH', 'HACK', 'ROOT', 'ACCESS'],
    colors: ['#00FF41', '#00FFAA', '#00FF41', '#00FFFF'],
    bgColor: '#050505',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BREACH', 'HACK', 'ROOT', 'ACCESS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FF41', '#00FFAA', '#00FFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050505', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
