import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MatrixFormConfig extends KineticBaseConfig {}

const RAIN_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモ0123456789ABCDEF'

function rainChar(seed: number): string {
  return RAIN_CHARS[Math.abs(Math.floor(Math.sin(seed * 127.1 + 311.7) * 43758.5453)) % RAIN_CHARS.length]
}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Sparse ambient rain columns (fewer than DigitalRain -- this is about the text formation)
    const columns = 12
    const colWidth = width / columns
    const charH = 14

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {Array.from({ length: columns }, (_, i) => {
          const speed = 1 + (((i * 53 + 29) % 10) / 10) * 2
          const yOffset = ((frame * speed + i * 71) % (height + 200)) - 150
          const numChars = 4 + ((i * 37) % 6)

          return (
            <div key={i} style={{ position: 'absolute', left: i * colWidth + colWidth / 2, top: yOffset }}>
              {Array.from({ length: numChars }, (_, j) => (
                <div
                  key={j}
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 10,
                    color: `rgba(0, 255, 120, ${j === 0 ? 0.15 : 0.04})`,
                    lineHeight: `${charH}px`,
                    textAlign: 'center',
                    width: colWidth,
                  }}
                >
                  {rainChar(i * 97 + j * 23 + frame * 2)}
                </div>
              ))}
            </div>
          )
        })}
        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const chars = word.split('')
    const charCount = chars.length

    if (phase === 'enter') {
      // Each character position has a vertical rain column that converges INTO the letter
      // Rain streams down, then the correct character "locks in" from the stream
      const charElements = chars.map((ch, ci) => {
        const charDelay = ci / (charCount + 1) * 0.5
        const prog = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.5))

        if (prog < 0.6) {
          // Still streaming -- show falling rain chars at this position
          const streamPhase = prog / 0.6
          const numVisible = Math.ceil(streamPhase * 6)
          const streamChars: React.ReactNode[] = []

          for (let j = 0; j < numVisible; j++) {
            const charY = -20 + (streamPhase * 40) - j * 14
            const isHead = j === 0
            streamChars.push(
              <div
                key={`stream-${ci}-${j}`}
                style={{
                  position: 'absolute',
                  top: charY,
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(40px, 12vw, 160px)',
                  fontWeight: 700,
                  color: isHead ? '#FFFFFF' : `rgba(0, 255, 120, ${0.4 - j * 0.06})`,
                  textShadow: isHead ? '0 0 8px rgba(0, 255, 255, 0.8)' : 'none',
                }}
              >
                {rainChar(ci * 83 + j * 41 + f * 3 + Math.floor(f / Math.max(1, 4 - numVisible)))}
              </div>
            )
          }

          return (
            <span
              key={ci}
              style={{
                display: 'inline-block',
                position: 'relative',
                width: '0.6em',
                height: '1.2em',
                overflow: 'hidden',
                verticalAlign: 'middle',
              }}
            >
              {streamChars}
            </span>
          )
        }

        // Character resolved -- locked in with brief flash
        const lockFlash = prog < 0.75 ? (prog - 0.6) / 0.15 : 1
        const charColor = lockFlash < 0.5 ? '#FFFFFF' : color

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 12vw, 160px)',
              fontWeight: 700,
              color: charColor,
              textShadow: lockFlash < 0.5
                ? `0 0 12px rgba(0, 255, 255, 0.8)`
                : `0 0 8px ${color}, 0 0 20px ${color}30`,
              mixBlendMode: lockFlash < 0.5 ? 'screen' : 'normal',
            }}
          >
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
            whiteSpace: 'nowrap',
            letterSpacing: 6,
          }}
        >
          {charElements}
        </div>
      )
    } else if (phase === 'hold') {
      // Stable text with occasional rain char flicker on individual letters
      const charElements = chars.map((ch, ci) => {
        const glitchWave = Math.sin(f * 0.2 + ci * 4.1)
        const isRaining = glitchWave > 0.93

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              color: isRaining ? '#00FF78' : color,
              textShadow: `0 0 ${8 + Math.sin(f * 0.06 + ci) * 4}px ${color}, 0 0 20px ${color}20`,
              mixBlendMode: isRaining ? 'screen' : 'normal',
            }}
          >
            {isRaining ? rainChar(ci * 31 + f) : ch}
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
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
          }}
        >
          {charElements}
        </div>
      )
    } else {
      // Exit: each character dissolves into a downward rain stream, left to right
      const charElements = chars.map((ch, ci) => {
        const charDelay = ci / (charCount + 1) * 0.3
        const prog = Math.max(0, Math.min(1, (exitProgress - charDelay) / 0.7))

        if (prog < 0.3) {
          // Still showing but fading to rain color
          return (
            <span
              key={ci}
              style={{
                display: 'inline-block',
                color: prog > 0.15 ? '#00FF78' : color,
                textShadow: `0 0 6px ${color}`,
              }}
            >
              {prog > 0.15 ? rainChar(ci * 67 + f) : ch}
            </span>
          )
        }

        // Character melts downward as rain
        const fallProgress = (prog - 0.3) / 0.7
        const fallY = fallProgress * 60
        const fadeOpacity = 1 - fallProgress

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              transform: `translateY(${fallY}px)`,
              opacity: fadeOpacity,
              color: '#00FF78',
              textShadow: `0 0 4px rgba(0, 255, 120, ${fadeOpacity * 0.5})`,
              mixBlendMode: 'screen',
            }}
          >
            {rainChar(ci * 53 + f + Math.floor(prog * 5))}
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
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
          }}
        >
          {charElements}
        </div>
      )
    }
  },
}

function MatrixFormComponent(props: MotionGraphicProps<MatrixFormConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-matrix-form',
  title: 'Kinetic Matrix Form',
  description: 'Text forms FROM converging Matrix rain columns per character, each locking in with a flash, then dissolving back into falling code',
  tags: ['kinetic', 'typography', 'matrix', 'rain', 'converge', 'code', 'hacker', 'cyberpunk'],
  category: 'captions',
  component: MatrixFormComponent as any,
  defaultConfig: {
    words: ['WAKE', 'UP', 'NEO', 'FOLLOW'],
    colors: ['#00FF78', '#00FFAA', '#00FF78', '#AAFFDD'],
    bgColor: '#030806',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WAKE', 'UP', 'NEO', 'FOLLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FF78', '#00FFAA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#030806', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
