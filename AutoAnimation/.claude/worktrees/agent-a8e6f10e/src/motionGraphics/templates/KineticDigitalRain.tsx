import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DigitalRainConfig extends KineticBaseConfig {}

const RAIN_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789'

function rainChar(seed: number): string {
  return RAIN_CHARS[Math.abs(Math.floor(Math.sin(seed * 127.1 + 311.7) * 43758.5453)) % RAIN_CHARS.length]
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    const columns = 22
    const colWidth = width / columns
    const charH = 16

    const drops = Array.from({ length: columns }, (_, i) => {
      const speed = 1.5 + (((i * 53 + 29) % 10) / 10) * 3
      const yOffset = ((frame * speed + i * 71) % (height + 300)) - 200
      const numChars = 8 + ((i * 37) % 12)
      const chars: string[] = []
      for (let j = 0; j < numChars; j++) {
        chars.push(rainChar(i * 97 + j * 23 + frame * 3 + Math.floor(j / 2)))
      }
      return { x: i * colWidth + colWidth / 2, chars, yOffset }
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {drops.map((drop, i) => (
          <div key={i} style={{ position: 'absolute', left: drop.x, top: drop.yOffset }}>
            {drop.chars.map((c, j) => {
              const isCyan = ((i + j) * 31) % 5 === 0
              const alpha = j === 0 ? 0.95 : Math.max(0.03, 0.7 - j * 0.06)
              const col = j === 0 ? '#FFFFFF'
                : isCyan ? `rgba(0,255,255,${alpha})`
                : `rgba(0,255,170,${alpha})`

              return (
                <div
                  key={j}
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 12,
                    color: col,
                    lineHeight: `${charH}px`,
                    textAlign: 'center',
                    width: colWidth,
                    textShadow: j === 0 ? '0 0 8px rgba(0,255,255,0.8)' : 'none',
                  }}
                >
                  {c}
                </div>
              )
            })}
          </div>
        ))}
        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0

    if (phase === 'enter') {
      // Text materializes from rain characters
      const chars = word.split('').map((realCh, ci) => {
        const charDelay = ci / (word.length + 1) * 0.5
        const prog = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.5))

        if (prog < 0.7) {
          const cycleSpeed = Math.max(1, Math.floor((1 - prog) * 6))
          const ch = rainChar(ci * 83 + f * 2 + Math.floor(f / cycleSpeed))
          return (
            <span key={ci} style={{ color: '#00FFaa', opacity: 0.4 + prog * 0.6 }}>
              {ch}
            </span>
          )
        }
        return (
          <span key={ci} style={{ color, textShadow: `0 0 10px ${color}` }}>
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
            fontSize: 'clamp(44px, 12vw, 160px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
          }}
        >
          {chars}
        </div>
      )
    } else if (phase === 'hold') {
      // Stable with occasional char glitch
      const chars = word.split('').map((ch, ci) => {
        const glitchCycle = Math.sin(f * 0.15 + ci * 3.7)
        const isGlitched = glitchCycle > 0.92

        return (
          <span
            key={ci}
            style={{
              color: isGlitched ? '#00FFAA' : color,
              textShadow: `0 0 10px ${color}, 0 0 25px ${color}30`,
            }}
          >
            {isGlitched ? rainChar(ci * 41 + f) : ch}
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
            fontSize: 'clamp(44px, 12vw, 160px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
          }}
        >
          {chars}
          {/* Subtle glow backdrop */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '120%',
              height: '200%',
              background: `radial-gradient(ellipse, ${color}08, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
        </div>
      )
    } else {
      // Exit: dissolve back into rain chars falling down
      const chars = word.split('').map((ch, ci) => {
        const charDelay = ci / (word.length + 1) * 0.3
        const prog = Math.max(0, Math.min(1, (exitProgress - charDelay) / 0.7))
        const yDrift = prog * 30
        const charOpacity = 1 - prog

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              transform: `translateY(${yDrift}px)`,
              opacity: charOpacity,
              color: prog > 0.3 ? '#00FFAA' : color,
            }}
          >
            {prog > 0.3 ? rainChar(ci * 67 + f) : ch}
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
            fontSize: 'clamp(44px, 12vw, 160px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
          }}
        >
          {chars}
        </div>
      )
    }
  },
}

function DigitalRainComponent(props: MotionGraphicProps<DigitalRainConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-digital-rain',
  title: 'Kinetic Digital Rain',
  description: 'Matrix-style digital rain with Japanese katakana characters, text materializes from falling code streams',
  tags: ['kinetic', 'typography', 'matrix', 'digital', 'rain', 'cyberpunk', 'hacker', 'code'],
  category: 'captions',
  component: DigitalRainComponent as any,
  defaultConfig: {
    words: ['DECODE', 'MATRIX', 'ENTER', 'VOID'],
    colors: ['#00FFAA', '#00FFFF', '#00FFAA', '#00FFFF'],
    bgColor: '#030805',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DECODE', 'MATRIX', 'ENTER', 'VOID'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFAA', '#00FFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#030805', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
