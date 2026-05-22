import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MatrixRainConfig extends KineticBaseConfig {}

const MATRIX_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*'

function seededChar(seed: number): string {
  return MATRIX_CHARS[Math.abs(seed) % MATRIX_CHARS.length]
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, width, height }: BackgroundRenderProps) => {
    const columns = 15
    const colWidth = width / columns
    const charHeight = 16

    const drops: { x: number; chars: string[]; yOffset: number }[] = []
    for (let i = 0; i < columns; i++) {
      const speed = 1.5 + (((i * 73 + 37) % 10) / 10) * 2
      const yOffset = ((frame * speed + i * 47) % (height + 200)) - 100
      const numChars = 8 + ((i * 31) % 8)
      const chars: string[] = []
      for (let j = 0; j < numChars; j++) {
        chars.push(seededChar(i * 97 + j * 13 + frame * 3 + Math.floor(j / 2)))
      }
      drops.push({ x: i * colWidth + colWidth / 2, chars, yOffset })
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {drops.map((drop, i) => (
          <div key={i} style={{ position: 'absolute', left: drop.x, top: drop.yOffset }}>
            {drop.chars.map((c, j) => (
              <div
                key={j}
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 12,
                  color: j === 0 ? '#FFFFFF' : `rgba(0, 255, 65, ${0.8 - j * 0.08})`,
                  lineHeight: `${charHeight}px`,
                  textAlign: 'center',
                  width: colWidth,
                }}
              >
                {c}
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 2)
      // Letter-by-letter scramble: each char resolves progressively
      const totalChars = word.length
      const revealedCount = Math.floor(enterProgress * (totalChars + 2))

      const chars = word.split('').map((realChar, ci) => {
        if (ci < revealedCount) return realChar
        // Scramble with pseudo-random char
        return seededChar(ci * 73 + index * 31 + Math.floor(enterProgress * 20))
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 10px ${color}, 0 0 30px rgba(0,255,65,0.3)`,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
          }}
        >
          {chars.join('')}
        </div>
      )
    } else if (phase === 'hold') {
      opacity = 1
      // Pulsing green glow
      const pulse = 0.7 + Math.sin(holdProgress * Math.PI * 6) * 0.3
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 ${10 + pulse * 15}px ${color}, 0 0 ${30 + pulse * 20}px rgba(0,255,65,0.4)`,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
          }}
        >
          {word}
        </div>
      )
    } else {
      opacity = 1 - exitProgress
      translateY = -exitProgress * 20

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translateY(${translateY}px)`,
            opacity,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 10px ${color}`,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
          }}
        >
          {word}
        </div>
      )
    }
  },
}

function MatrixRainComponent(props: MotionGraphicProps<MatrixRainConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-matrix-rain',
  title: 'Kinetic Matrix Rain',
  description: 'Matrix digital rain with falling green characters and letter-scramble word reveal',
  tags: ['kinetic', 'typography', 'matrix', 'digital', 'hacker'],
  category: 'captions',
  component: MatrixRainComponent as any,
  defaultConfig: {
    words: ['WAKE', 'UP', 'NEO', 'THE', 'MATRIX'],
    colors: ['#00FF41', '#00FF41', '#00FF41', '#00FF41', '#00FF41'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WAKE', 'UP', 'NEO', 'THE', 'MATRIX'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FF41'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
