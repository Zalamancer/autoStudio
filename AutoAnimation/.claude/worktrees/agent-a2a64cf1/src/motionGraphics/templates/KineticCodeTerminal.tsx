import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CodeTerminalConfig extends KineticBaseConfig {}

const KEYWORDS = ['const', 'let', 'function', 'return', 'import', 'export', 'class', 'if', 'else', 'for']

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const lineCount = 12
    const lineHeight = 18
    const startY = 40

    const lines: { text: string; color: string }[] = []
    for (let i = 0; i < lineCount; i++) {
      const seed = i * 137 + 29
      const kw = KEYWORDS[Math.abs(seed) % KEYWORDS.length]
      const varName = `_v${(seed * 7) % 100}`
      const val = Math.floor(seededRandom(seed + frame * 0.02) * 999)
      const lineText = `  ${kw} ${varName} = ${val};`
      const lineColor = `rgba(0, 255, 65, ${0.08 + (i % 3) * 0.03})`
      lines.push({ text: lineText, color: lineColor })
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Terminal header bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 28,
            background: 'rgba(0, 255, 65, 0.08)',
            borderBottom: '1px solid rgba(0, 255, 65, 0.15)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 10,
            gap: 6,
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F56' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27C93F' }} />
          <span
            style={{
              marginLeft: 12,
              fontFamily: "'Courier New', monospace",
              fontSize: 11,
              color: 'rgba(0, 255, 65, 0.4)',
            }}
          >
            terminal -- bash
          </span>
        </div>
        {/* Background code lines */}
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 12,
              top: startY + i * lineHeight,
              fontFamily: "'Courier New', monospace",
              fontSize: 11,
              color: line.color,
              whiteSpace: 'nowrap',
            }}
          >
            {line.text}
          </div>
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const totalChars = word.length
    const cursorFrame = frame ?? 0

    if (phase === 'enter') {
      // Typed in char-by-char
      const visibleChars = Math.floor(enterProgress * (totalChars + 1))
      const displayText = word.substring(0, visibleChars)
      const showCursor = Math.floor(cursorFrame * 0.15) % 2 === 0

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 8px ${color}, 0 0 20px ${color}40`,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ color: 'rgba(0, 255, 65, 0.6)', marginRight: 8 }}>&gt;</span>
          {displayText}
          {showCursor && (
            <span style={{ color, opacity: 0.9 }}>_</span>
          )}
        </div>
      )
    } else if (phase === 'hold') {
      const showCursor = Math.floor(cursorFrame * 0.1) % 2 === 0
      // Syntax highlight effect: color certain characters
      const chars = word.split('').map((ch, ci) => {
        let charColor = color
        if (ci < 3) charColor = '#FF79C6' // keyword color
        else if (ci >= 3 && ci < 5) charColor = '#F8F8F2' // white
        return (
          <span key={ci} style={{ color: charColor }}>
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
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 700,
            textShadow: `0 0 8px ${color}40, 0 0 20px ${color}20`,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ color: 'rgba(0, 255, 65, 0.6)', marginRight: 8 }}>&gt;</span>
          {chars}
          {showCursor && (
            <span style={{ color, opacity: 0.9 }}>_</span>
          )}
        </div>
      )
    } else {
      // Exit: fade out
      const opacity = 1 - exitProgress

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 8px ${color}`,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ color: 'rgba(0, 255, 65, 0.6)', marginRight: 8 }}>&gt;</span>
          {word}
        </div>
      )
    }
  },
}

function CodeTerminalComponent(props: MotionGraphicProps<CodeTerminalConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-code-terminal',
  title: 'Kinetic Code Terminal',
  description: 'Code editor terminal aesthetic with char-by-char typing, syntax highlighting, blinking cursor, and green-on-black terminal look',
  tags: ['kinetic', 'typography', 'code', 'terminal', 'hacker', 'tech'],
  category: 'captions',
  component: CodeTerminalComponent as any,
  defaultConfig: {
    words: ['DEPLOY', 'BUILD', 'COMMIT', 'PUSH'],
    colors: ['#00FF41', '#00FF41', '#00FF41', '#00FF41'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DEPLOY', 'BUILD', 'COMMIT', 'PUSH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FF41'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
