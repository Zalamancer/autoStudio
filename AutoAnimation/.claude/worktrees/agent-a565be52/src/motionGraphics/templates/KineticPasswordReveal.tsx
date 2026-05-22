import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PasswordRevealConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Subtle cursor blink in the input field
    const cursorVisible = Math.sin(time * Math.PI * 1.5) > 0

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Password input field chrome */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'clamp(200px, 55vw, 500px)',
            background: '#1A1A1A',
            borderRadius: 8,
            padding: 'clamp(16px, 4vw, 36px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {/* App header */}
          <div
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: 'clamp(8px, 1.5vw, 13px)',
              color: 'rgba(255,255,255,0.35)',
              textAlign: 'center',
              marginBottom: 'clamp(8px, 2vw, 18px)',
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            Enter Password
          </div>

          {/* Input row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#2A2A2A',
              border: '1.5px solid rgba(255,255,255,0.12)',
              borderRadius: 6,
              padding: 'clamp(6px, 1.5vw, 12px) clamp(8px, 2vw, 16px)',
              gap: 8,
            }}
          >
            {/* Lock icon */}
            <span
              style={{
                fontSize: 'clamp(10px, 2vw, 16px)',
                opacity: 0.4,
              }}
            >
              {'\uD83D\uDD12'}
            </span>
            {/* The actual text area — word appears here as placeholder */}
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }} />
            {/* Eye icon */}
            <span
              style={{
                fontSize: 'clamp(10px, 2vw, 16px)',
                opacity: 0.4,
              }}
            >
              {'\uD83D\uDC41'}
            </span>
          </div>

          {/* Strength indicator dots */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              marginTop: 'clamp(6px, 1.5vw, 12px)',
              justifyContent: 'center',
            }}
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  width: 'clamp(20px, 5vw, 40px)',
                  height: 3,
                  borderRadius: 2,
                  background: i < 3 ? '#4ADE80' : 'rgba(255,255,255,0.1)',
                  opacity: 0.3,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const totalChars = word.length

    let opacity = 1
    let displayChars: Array<{ char: string; revealed: boolean }> = []

    if (phase === 'enter') {
      // First half: type in as dots, second half: reveal chars left to right
      if (enterProgress < 0.45) {
        const t = enterProgress / 0.45
        const dotsToShow = Math.floor(t * totalChars)
        opacity = Math.min(1, enterProgress * 4)
        displayChars = word.split('').map((char, i) => ({
          char,
          revealed: false,
        }))
        displayChars = displayChars.slice(0, dotsToShow).map((c) => ({ ...c, revealed: false }))
      } else {
        // Reveal phase
        const t = (enterProgress - 0.45) / 0.55
        const charsRevealed = Math.floor(t * totalChars)
        opacity = 1
        displayChars = word.split('').map((char, i) => ({
          char,
          revealed: i < charsRevealed,
        }))
      }
    } else if (phase === 'hold') {
      displayChars = word.split('').map((char) => ({ char, revealed: true }))
    } else {
      // Exit: re-obscure
      const hideCount = Math.floor(exitProgress * totalChars)
      displayChars = word.split('').map((char, i) => ({
        char,
        revealed: i >= hideCount,
      }))
      opacity = Math.max(0, 1 - exitProgress * 1.5)
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(1px, 0.4vw, 4px)',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        {displayChars.map((item, i) => (
          <span
            key={i}
            style={{
              fontSize: item.revealed
                ? 'clamp(30px, 7.5vw, 105px)'
                : 'clamp(22px, 5.5vw, 78px)',
              fontWeight: item.revealed ? 700 : 900,
              color: item.revealed ? color : 'rgba(255,255,255,0.5)',
              lineHeight: 1,
              transition: 'all 0.05s',
              // Dots are slightly smaller and centered
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {item.revealed ? item.char : '\u2022'}
          </span>
        ))}
        {/* Cursor blink at end during enter */}
        {phase === 'enter' && enterProgress < 0.45 && (
          <span
            style={{
              display: 'inline-block',
              width: 'clamp(2px, 0.4vw, 4px)',
              height: 'clamp(28px, 6.5vw, 90px)',
              background: color,
              borderRadius: 2,
              opacity: Math.sin(f * 0.25) > 0 ? 0.8 : 0,
            }}
          />
        )}
      </div>
    )
  },
}

function PasswordRevealComponent(props: MotionGraphicProps<PasswordRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-password-reveal',
  title: 'Kinetic Password Reveal',
  description:
    'Password input field — text types in as bullet dots then reveals character by character as if the eye icon was tapped, with input field chrome and strength indicator',
  tags: ['kinetic', 'typography', 'password', 'reveal', 'input', 'ui', 'digital', 'login'],
  category: 'captions',
  component: PasswordRevealComponent as any,
  defaultConfig: {
    words: ['SECRET', 'PRIVATE', 'LOCKED', 'HIDDEN'],
    colors: ['#4ADE80', '#60A5FA', '#F472B6', '#FACC15'],
    bgColor: '#0F0F0F',
    cycleDuration: 2.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SECRET', 'PRIVATE', 'LOCKED', 'HIDDEN'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#4ADE80', '#60A5FA', '#F472B6', '#FACC15'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F0F0F', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
