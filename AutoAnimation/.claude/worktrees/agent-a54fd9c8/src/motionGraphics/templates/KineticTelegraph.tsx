import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TelegraphConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Paper tape hole pattern — decorative sprocket holes
const SPROCKET_COUNT = 18

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width }: BackgroundRenderProps) => {
    const time = frame / fps
    // Paper tape scrolls from right to left
    const tapeOffset = (time * 40) % 28

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Paper tape band across vertical center-bottom */}
        <div style={{
          position: 'absolute',
          left: 0, right: 0,
          bottom: 20,
          height: 28,
          background: 'rgba(220,200,160,0.06)',
          borderTop: '1px solid rgba(220,200,160,0.08)',
          borderBottom: '1px solid rgba(220,200,160,0.08)',
        }}>
          {/* Sprocket holes */}
          {Array.from({ length: SPROCKET_COUNT + 2 }, (_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: (i * 28) - tapeOffset,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 6,
              height: 6,
              borderRadius: '50%',
              border: '1px solid rgba(220,200,160,0.12)',
              background: 'rgba(0,0,0,0.3)',
            }} />
          ))}
        </div>
        {/* Second tape strip at top (narrower) */}
        <div style={{
          position: 'absolute',
          left: 0, right: 0,
          top: 16,
          height: 20,
          background: 'rgba(220,200,160,0.04)',
          borderTop: '1px solid rgba(220,200,160,0.06)',
          borderBottom: '1px solid rgba(220,200,160,0.06)',
        }}>
          {Array.from({ length: SPROCKET_COUNT + 2 }, (_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: (i * 28) - ((tapeOffset + 14) % 28),
              top: '50%',
              transform: 'translateY(-50%)',
              width: 4,
              height: 4,
              borderRadius: '50%',
              border: '1px solid rgba(220,200,160,0.08)',
              background: 'rgba(0,0,0,0.3)',
            }} />
          ))}
        </div>
        {/* Telegraph header */}
        <div style={{
          position: 'absolute', top: 44, left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Courier New', monospace",
          fontSize: 8,
          color: 'rgba(220,200,160,0.15)',
          letterSpacing: 5,
          whiteSpace: 'nowrap',
        }}>
          WESTERN UNION
        </div>
        {/* Ticker sound visualization — small oscilloscope at bottom-left */}
        <div style={{
          position: 'absolute', bottom: 56, left: 14,
          display: 'flex', alignItems: 'center', gap: 1,
          height: 14,
        }}>
          {Array.from({ length: 20 }, (_, i) => {
            const isClick = rand(i * 41 + Math.floor(frame / 3)) > 0.7
            const h = isClick ? 8 + rand(i * 67 + frame) * 6 : 2
            return (
              <div key={i} style={{
                width: 2,
                height: h,
                background: isClick
                  ? 'rgba(220,200,160,0.4)'
                  : 'rgba(220,200,160,0.06)',
              }} />
            )
          })}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 149 + 67

    if (phase === 'enter') {
      // Telegraph ticker: characters punch out one by one, each with a mechanical "stamp" effect
      // Characters appear left to right with precise timing
      // Each character has a brief bright flash as it stamps, then settles

      const charsRevealed = enterProgress * word.length
      const charFlashDuration = 1 / word.length * 0.4 // Each stamp flash lasts 40% of one char slot

      const chars = word.split('').map((ch, ci) => {
        const charStartsAt = ci / word.length
        const charProgress = Math.max(0, Math.min(1, (enterProgress - charStartsAt) * word.length))

        if (charProgress === 0) {
          // Not yet revealed
          return (
            <span key={ci} style={{
              display: 'inline-block',
              color: 'transparent',
              // Reserve space with invisible placeholder
            }}>
              {ch}
            </span>
          )
        }

        const isStamping = charProgress < 0.35
        const stampIntensity = isStamping ? 1 - charProgress / 0.35 : 0

        return (
          <span key={ci} style={{
            display: 'inline-block',
            color: isStamping ? `rgba(255,255,255,${0.7 + stampIntensity * 0.3})` : color,
            textShadow: isStamping
              ? `0 0 ${stampIntensity * 20}px rgba(255,255,255,0.8), 0 0 ${stampIntensity * 8}px ${color}`
              : 'none',
            transform: isStamping
              ? `scale(${1 + stampIntensity * 0.15}) translateY(${-stampIntensity * 4}px)`
              : 'scale(1)',
            filter: isStamping ? `brightness(${1 + stampIntensity})` : undefined,
          }}>
            {ch}
          </span>
        )
      })

      // Cursor at current position
      const cursorPos = Math.floor(charsRevealed)
      const showCursor = cursorPos < word.length

      return (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(44px, 11vw, 150px)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          letterSpacing: 6,
          textTransform: 'uppercase',
          display: 'flex',
        }}>
          {chars}
          {/* Typing cursor */}
          {showCursor && (
            <span style={{
              display: 'inline-block',
              width: 'clamp(6px, 1.5vw, 16px)',
              height: 'clamp(36px, 9vw, 120px)',
              background: color,
              opacity: Math.sin(f * 0.4) > 0 ? 0.9 : 0.1,
              marginLeft: 2,
              verticalAlign: 'middle',
            }} />
          )}
        </div>
      )
    } else if (phase === 'hold') {
      // Stable text — blinking cursor at end, one inked re-stamp at 0.5
      const restamp = holdProgress > 0.47 && holdProgress < 0.53
      const restampIdx = seed % word.length

      return (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(44px, 11vw, 150px)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          letterSpacing: 6,
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
        }}>
          {word.split('').map((ch, ci) => {
            const isRestamping = restamp && ci === restampIdx
            return (
              <span key={ci} style={{
                display: 'inline-block',
                color,
                textShadow: isRestamping
                  ? `0 0 16px rgba(255,255,255,0.7), 0 0 6px ${color}`
                  : `0 0 4px ${color}30`,
                transform: isRestamping ? 'scale(1.1)' : undefined,
              }}>
                {ch}
              </span>
            )
          })}
          {/* Blinking cursor at end */}
          <span style={{
            display: 'inline-block',
            width: 'clamp(6px, 1.5vw, 16px)',
            height: 'clamp(36px, 9vw, 120px)',
            background: color,
            opacity: Math.sin(f * 0.25) > 0 ? 0.7 : 0.05,
            marginLeft: 2,
          }} />
        </div>
      )
    } else {
      // Exit: characters struck out one by one right to left (erased by back-space ticker)
      const charsErased = Math.floor(exitProgress * word.length)
      const eraseFrom = word.length - charsErased

      return (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(44px, 11vw, 150px)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          letterSpacing: 6,
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
        }}>
          {word.split('').map((ch, ci) => {
            if (ci >= eraseFrom) {
              // Being erased — show X then disappear
              const eraseProgress = Math.min(1, (exitProgress * word.length) - (word.length - 1 - ci))
              return (
                <span key={ci} style={{
                  display: 'inline-block',
                  color: 'rgba(255,80,80,0.6)',
                  opacity: Math.max(0, 1 - eraseProgress * 2),
                  textDecoration: 'line-through',
                }}>
                  {ch}
                </span>
              )
            }
            return (
              <span key={ci} style={{ display: 'inline-block', color }}>{ch}</span>
            )
          })}
        </div>
      )
    }
  },
}

function TelegraphComponent(props: MotionGraphicProps<TelegraphConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-telegraph',
  title: 'Kinetic Telegraph',
  description: 'Telegraph ticker tape — characters punch out one by one with mechanical stamp flash, paper tape sprocket holes, Western Union styling, cursor blink',
  tags: ['kinetic', 'typography', 'glitch', 'telegraph', 'ticker', 'tape', 'retro', 'mechanical', 'transmission', 'victorian'],
  category: 'captions',
  component: TelegraphComponent as any,
  defaultConfig: {
    words: ['URGENT', 'STOP', 'MESSAGE', 'ENDS'],
    colors: ['#DCC8A0', '#FFFFFF', '#DCC8A0', '#AAAAAA'],
    bgColor: '#050403',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['URGENT', 'STOP', 'MESSAGE', 'ENDS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#DCC8A0', '#FFFFFF', '#DCC8A0', '#AAAAAA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050403', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.6, max: 6, group: 'Timing' },
  ],
})
