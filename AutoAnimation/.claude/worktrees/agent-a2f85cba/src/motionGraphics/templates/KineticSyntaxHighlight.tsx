import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SyntaxHighlightConfig extends KineticBaseConfig {}

// VS Code Dracula-inspired token colors
const TOKEN_COLORS = [
  '#ff79c6', // keyword (pink)
  '#50fa7b', // string (green)
  '#ffb86c', // number/constant (orange)
  '#8be9fd', // type/class (cyan)
  '#f1fa8c', // function call (yellow)
  '#bd93f9', // variable (purple)
  '#ff5555', // error/important (red)
  '#6272a4', // comment (muted blue)
]

function tokenColor(charIndex: number, wordIndex: number): string {
  // Deterministic token color per character position and word index
  const colorIdx = ((charIndex * 3 + wordIndex * 7) % TOKEN_COLORS.length)
  return TOKEN_COLORS[colorIdx]
}

// Background: faded code lines with syntax colors
const CODE_LINES = [
  { tokens: [
    { text: 'function ', color: '#cc99cd' },
    { text: 'render', color: '#6699cc' },
    { text: '(', color: '#cccccc' },
    { text: 'props', color: '#f2777a' },
    { text: ') {', color: '#cccccc' },
  ]},
  { tokens: [
    { text: '  const ', color: '#cc99cd' },
    { text: 'value ', color: '#f2777a' },
    { text: '= ', color: '#cccccc' },
    { text: '"hello"', color: '#99cc99' },
    { text: ';', color: '#cccccc' },
  ]},
  { tokens: [
    { text: '  return ', color: '#cc99cd' },
    { text: '<div', color: '#6699cc' },
    { text: ' className', color: '#ffcc66' },
    { text: '=', color: '#cccccc' },
    { text: '"wrap"', color: '#99cc99' },
    { text: '>', color: '#6699cc' },
  ]},
  { tokens: [
    { text: '    <span', color: '#6699cc' },
    { text: ' id', color: '#ffcc66' },
    { text: '=', color: '#cccccc' },
    { text: '{"id"}', color: '#f2777a' },
    { text: '>', color: '#6699cc' },
    { text: '{value}', color: '#f2777a' },
    { text: '</span>', color: '#6699cc' },
  ]},
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* VS Code tab bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 30,
            background: 'rgba(0,0,0,0.2)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'stretch',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 14,
              paddingRight: 14,
              borderRight: '1px solid rgba(255,255,255,0.08)',
              background: bgColor,
              borderTop: '1px solid rgba(100,150,255,0.4)',
            }}
          >
            <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              index.tsx
            </span>
          </div>
        </div>

        {/* Background code */}
        {CODE_LINES.map((line, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: 38 + i * 18,
              left: 0,
              display: 'flex',
            }}
          >
            <span
              style={{
                width: 36,
                textAlign: 'right',
                paddingRight: 12,
                fontFamily: "'Fira Code', monospace",
                fontSize: 10,
                color: 'rgba(255,255,255,0.06)',
                flexShrink: 0,
              }}
            >
              {i + 1}
            </span>
            {line.tokens.map((tok, j) => (
              <span
                key={j}
                style={{
                  fontFamily: "'Fira Code', monospace",
                  fontSize: 10,
                  color: tok.color,
                  opacity: 0.06,
                  whiteSpace: 'pre',
                }}
              >
                {tok.text}
              </span>
            ))}
          </div>
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const chars = word.split('')

    if (phase === 'enter') {
      // Characters appear one by one, each gaining its syntax color
      const visibleCount = Math.floor(enterProgress * (chars.length + 1))

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Fira Code', 'JetBrains Mono', 'Courier New', monospace",
            fontSize: 'clamp(32px, 9vw, 120px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
          }}
        >
          {chars.map((ch, ci) => {
            if (ci >= visibleCount) return null
            const isJustAppeared = ci === visibleCount - 1
            const charColor = isJustAppeared ? '#ffffff' : tokenColor(ci, index)
            const charOpacity = isJustAppeared ? 1 : 0.7 + (ci / chars.length) * 0.3

            return (
              <span
                key={ci}
                style={{
                  color: charColor,
                  opacity: charOpacity,
                  textShadow: isJustAppeared ? `0 0 14px ${charColor}` : undefined,
                  transition: 'color 0.15s',
                }}
              >
                {ch}
              </span>
            )
          })}
          {/* Blinking cursor */}
          {visibleCount <= chars.length && Math.floor(f * 0.14) % 2 === 0 && (
            <span
              style={{
                display: 'inline-block',
                width: 'clamp(8px, 2vw, 24px)',
                height: 'clamp(28px, 7vw, 100px)',
                background: 'rgba(255,255,255,0.7)',
                verticalAlign: 'middle',
              }}
            />
          )}
        </div>
      )
    } else if (phase === 'hold') {
      // All chars colored; a "tokenize" pulse sweeps through word to word
      const pulsePos = holdProgress * (chars.length + 2) - 1

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Fira Code', 'JetBrains Mono', 'Courier New', monospace",
            fontSize: 'clamp(32px, 9vw, 120px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
          }}
        >
          {chars.map((ch, ci) => {
            const charColor = tokenColor(ci, index)
            const isNearPulse = Math.abs(ci - pulsePos) < 1.5
            const brightness = isNearPulse ? 1 : 0.75

            return (
              <span
                key={ci}
                style={{
                  color: charColor,
                  opacity: brightness,
                  textShadow: isNearPulse ? `0 0 16px ${charColor}` : `0 0 6px ${charColor}30`,
                }}
              >
                {ch}
              </span>
            )
          })}
        </div>
      )
    } else {
      // Exit: colors desaturate back to white, then fade
      const desaturate = exitProgress
      const opacity = 1 - exitProgress

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
            fontFamily: "'Fira Code', 'JetBrains Mono', 'Courier New', monospace",
            fontSize: 'clamp(32px, 9vw, 120px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
          }}
        >
          {chars.map((ch, ci) => {
            const charColor = tokenColor(ci, index)
            // Blend toward white/gray as desaturate increases
            const finalColor = desaturate > 0.5 ? 'rgba(255,255,255,0.4)' : charColor

            return (
              <span key={ci} style={{ color: finalColor }}>
                {ch}
              </span>
            )
          })}
        </div>
      )
    }
  },
}

function SyntaxHighlightComponent(props: MotionGraphicProps<SyntaxHighlightConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-syntax-highlight',
  title: 'Kinetic Syntax Highlight',
  description:
    'VS Code Dracula theme: letters appear one by one each colored as a different syntax token (keyword, string, type, function), tokenizer pulse sweeps on hold',
  tags: ['kinetic', 'typography', 'syntax', 'code', 'highlight', 'vscode', 'developer', 'tech'],
  category: 'captions',
  component: SyntaxHighlightComponent as any,
  defaultConfig: {
    words: ['FUNCTION', 'RETURN', 'EXPORT', 'IMPORT'],
    colors: ['#ff79c6', '#50fa7b', '#8be9fd', '#ffb86c'],
    bgColor: '#282a36',
    cycleDuration: 2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FUNCTION', 'RETURN', 'EXPORT', 'IMPORT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ff79c6', '#50fa7b', '#8be9fd', '#ffb86c'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#282a36', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2, min: 0.5, max: 5, group: 'Timing' },
  ],
})
