import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AIGenTextConfig extends KineticBaseConfig {}

// Deterministic character substitution pool for the "scramble" effect
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&'

function seededChar(seed: number): string {
  const idx = Math.floor(Math.abs(Math.sin(seed * 7919) * 9999)) % CHARS.length
  return CHARS[idx]
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame }: BackgroundRenderProps) => {
    // Subtle ambient text particles drifting upward (AI token stream suggestion)
    const particles = Array.from({ length: 12 }, (_, i) => {
      const seed = i * 73 + 3
      const x = (Math.abs(Math.sin(seed * 0.37)) * 0.85 + 0.05) * 100
      const baseY = (Math.abs(Math.sin(seed * 0.19)) * 0.8 + 0.05) * 100
      const drift = ((frame * (0.08 + (i % 4) * 0.03) + i * 37) % 120) - 10
      const ch = seededChar(seed + Math.floor(frame * 0.1 + i))
      const op = 0.04 + (i % 3) * 0.02

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${(baseY - drift + 100) % 110}%`,
            fontFamily: "'Courier New', monospace",
            fontSize: 10,
            color: i % 3 === 0 ? `rgba(0,255,255,${op})` : i % 3 === 1 ? `rgba(255,0,255,${op})` : `rgba(0,102,255,${op})`,
            pointerEvents: 'none',
          }}
        >
          {ch}
        </div>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {particles}
        {/* Faint horizontal rule — AI prompt separator */}
        <div
          style={{
            position: 'absolute',
            left: '8%',
            right: '8%',
            top: '68%',
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(0,255,255,0.06), transparent)',
          }}
        />
        {/* Top prompt label */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 20,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(0,255,255,0.22)',
            letterSpacing: 3,
          }}
        >
          AI_MODEL v4.1 | GENERATING...
        </div>
        {/* Blinking cursor line at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            left: 20,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: `rgba(0,255,255,${Math.floor(frame / 8) % 2 === 0 ? 0.4 : 0.0})`,
            letterSpacing: 2,
          }}
        >
          ▌
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    const letters = word.split('')

    if (phase === 'enter') {
      // Characters appear one by one left-to-right, each briefly scrambling before resolving
      const revealCount = enterProgress * letters.length
      const opacity = Math.min(1, enterProgress * 1.5)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 0,
            opacity,
          }}
        >
          {/* Prompt > symbol */}
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(28px, 7vw, 100px)',
              fontWeight: 400,
              color: `${color}50`,
              marginRight: '0.15em',
              alignSelf: 'center',
              lineHeight: 1,
            }}
          >
            &gt;
          </span>
          {letters.map((ch, i) => {
            const revealed = i < revealCount - 1
            const resolving = i === Math.floor(revealCount) && revealCount > i
            const charFrac = revealCount - Math.floor(revealCount)
            const scrambleChar = seededChar(i * 31 + Math.floor(enterProgress * 60))

            const displayChar = revealed ? ch : resolving ? (charFrac > 0.5 ? ch : scrambleChar) : scrambleChar
            const charOpacity = revealed || resolving ? 1 : (i < revealCount + 1 ? 0.15 : 0)
            const isActive = Math.floor(revealCount) === i

            return (
              <span
                key={i}
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(40px, 10vw, 150px)',
                  fontWeight: 700,
                  color: isActive ? '#FFFFFF' : color,
                  textShadow: isActive
                    ? `0 0 12px #FFFFFF, 0 0 25px ${color}`
                    : revealed
                    ? `0 0 8px ${color}, 0 0 20px ${color}40`
                    : 'none',
                  opacity: charOpacity,
                  letterSpacing: '0.06em',
                  lineHeight: 1,
                  transition: 'none',
                }}
              >
                {displayChar}
              </span>
            )
          })}
          {/* Blinking cursor at end */}
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 10vw, 150px)',
              fontWeight: 700,
              color,
              opacity: 0.8,
              lineHeight: 1,
            }}
          >
            |
          </span>
        </div>
      )
    } else if (phase === 'hold') {
      // Fully resolved — cursor blinks at end, subtle glow pulse
      const cursorVisible = Math.floor(holdProgress * 6) % 2 === 0
      const glowPulse = 0.8 + Math.sin(holdProgress * Math.PI * 3) * 0.2

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(28px, 7vw, 100px)',
              fontWeight: 400,
              color: `${color}50`,
              marginRight: '0.15em',
              lineHeight: 1,
            }}
          >
            &gt;
          </span>
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 10vw, 150px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 ${8 * glowPulse}px ${color}, 0 0 ${25 * glowPulse}px ${color}50`,
              whiteSpace: 'nowrap',
              letterSpacing: '0.06em',
              lineHeight: 1,
            }}
          >
            {word}
          </span>
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 10vw, 150px)',
              fontWeight: 700,
              color,
              opacity: cursorVisible ? 0.9 : 0,
              marginLeft: '0.02em',
              lineHeight: 1,
            }}
          >
            |
          </span>
        </div>
      )
    } else {
      // Exit: characters dissolve right-to-left back into scramble then vanish
      const dissolveCount = exitProgress * letters.length
      const opacity = Math.max(0, 1 - exitProgress * 1.5)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            opacity,
          }}
        >
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(28px, 7vw, 100px)',
              fontWeight: 400,
              color: `${color}50`,
              marginRight: '0.15em',
              lineHeight: 1,
            }}
          >
            &gt;
          </span>
          {letters.map((ch, i) => {
            const reverseIdx = letters.length - 1 - i
            const dissolved = reverseIdx < dissolveCount
            const displayChar = dissolved ? seededChar(i * 53 + Math.floor(exitProgress * 30)) : ch

            return (
              <span
                key={i}
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(40px, 10vw, 150px)',
                  fontWeight: 700,
                  color: dissolved ? `${color}60` : color,
                  textShadow: dissolved ? 'none' : `0 0 6px ${color}`,
                  letterSpacing: '0.06em',
                  lineHeight: 1,
                }}
              >
                {displayChar}
              </span>
            )
          })}
        </div>
      )
    }
  },
}

function AIGenTextComponent(props: MotionGraphicProps<AIGenTextConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ai-gen-text',
  title: 'Kinetic AI Gen Text',
  description: 'AI text generation effect: characters appear one by one with a scramble-to-resolve reveal, blinking cursor, and floating token particles',
  tags: ['kinetic', 'typography', 'ai', 'generation', 'typing', 'cursor', 'tech', 'futuristic'],
  category: 'captions',
  component: AIGenTextComponent as any,
  defaultConfig: {
    words: ['THINKING', 'WRITING', 'CREATING', 'DONE'],
    colors: ['#00FFFF', '#FF00FF', '#00FFFF', '#00FF88'],
    bgColor: '#0a0a12',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['THINKING', 'WRITING', 'CREATING', 'DONE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFFF', '#FF00FF', '#00FFFF', '#00FF88'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a12', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
  ],
})
