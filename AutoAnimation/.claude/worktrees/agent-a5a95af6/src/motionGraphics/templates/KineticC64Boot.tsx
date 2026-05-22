import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface C64BootConfig extends KineticBaseConfig {}

// C64 color palette
const C64_LIGHT_BLUE = '#6C5EB5'
const C64_BLUE = '#40318D'
const C64_DARK_BLUE = '#352879'
const C64_WHITE = '#7B71A5'

// PETSCII-style decorative border characters
const PETSCII_BORDER_H = '\u2500'
const PETSCII_BORDER_V = '\u2502'
const PETSCII_CORNER_TL = '\u250C'
const PETSCII_CORNER_TR = '\u2510'
const PETSCII_CORNER_BL = '\u2514'
const PETSCII_CORNER_BR = '\u2518'

const BOOT_LINES = [
  '',
  '    **** COMMODORE 64 BASIC V2 ****',
  '',
  ' 64K RAM SYSTEM  38911 BASIC BYTES FREE',
  '',
  'READY.',
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // PETSCII border pattern
    const borderCols = Math.floor(width / 10)
    const borderChars: string[] = []
    for (let i = 0; i < borderCols; i++) {
      const seed = Math.floor(time * 3 + i * 0.7)
      const chars = ['\u2580', '\u2584', '\u2588', '\u2591', '\u2592', '\u2593', '\u25A0', '\u25CF']
      borderChars.push(chars[Math.abs(seed * 137 + i * 31) % chars.length])
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* C64 boot text */}
        {BOOT_LINES.map((line, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 14,
              top: 10 + i * 16,
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: 11,
              color: '#6C5EB5',
              opacity: 0.15,
              whiteSpace: 'pre',
              letterSpacing: 0,
            }}
          >
            {line}
          </div>
        ))}

        {/* Top PETSCII decorative border */}
        <div
          style={{
            position: 'absolute',
            top: 108,
            left: 8,
            right: 8,
            fontFamily: "'Courier New', monospace",
            fontSize: 10,
            color: '#6C5EB5',
            opacity: 0.12,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            letterSpacing: 0,
          }}
        >
          {borderChars.join('')}
        </div>

        {/* Bottom PETSCII decorative border */}
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            left: 8,
            right: 8,
            fontFamily: "'Courier New', monospace",
            fontSize: 10,
            color: '#6C5EB5',
            opacity: 0.12,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            letterSpacing: 0,
          }}
        >
          {borderChars.reverse().join('')}
        </div>

        {/* READY. prompt at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 14,
            fontFamily: "'Courier New', monospace",
            fontSize: 12,
            color: '#6C5EB5',
            opacity: 0.2,
            letterSpacing: 0,
          }}
        >
          READY.
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 12,
              background: '#6C5EB5',
              marginLeft: 2,
              verticalAlign: 'middle',
              opacity: Math.sin(time * 4) > 0 ? 1 : 0,
            }}
          />
        </div>

        {/* CRT phosphor vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Scan lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame, index }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30

    if (phase === 'enter') {
      // C64 character-by-character type with block cursor
      const totalChars = word.length
      const charsToShow = Math.floor(enterProgress * (totalChars + 1))
      const displayText = word.substring(0, Math.min(charsToShow, totalChars))

      // Each newly appearing character briefly shows as a PETSCII block
      const chars = displayText.split('').map((ch, ci) => {
        const isLatest = ci === charsToShow - 1 && enterProgress < 0.95
        if (isLatest) {
          const blockPhase = (enterProgress * totalChars) % 1
          if (blockPhase < 0.3) {
            return (
              <span key={ci} style={{ color }}>
                {'\u2588'}
              </span>
            )
          }
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
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(38px, 10vw, 140px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
          }}
        >
          {chars}
          {/* Block cursor */}
          <span
            style={{
              display: 'inline-block',
              width: 'clamp(14px, 3.5vw, 32px)',
              height: 'clamp(32px, 8vw, 110px)',
              background: color,
              marginLeft: 2,
              verticalAlign: 'middle',
              opacity: Math.sin(f * 0.18) > 0 ? 1 : 0,
            }}
          />
        </div>
      )
    } else if (phase === 'hold') {
      // Steady display with blinking cursor, subtle color pulse like real C64
      const pulse = Math.sin(f * 0.04) * 0.06

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(38px, 10vw, 140px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textShadow: `0 0 ${4 + pulse * 10}px ${color}50`,
          }}
        >
          {word}
          <span
            style={{
              display: 'inline-block',
              width: 'clamp(14px, 3.5vw, 32px)',
              height: 'clamp(32px, 8vw, 110px)',
              background: color,
              marginLeft: 2,
              verticalAlign: 'middle',
              opacity: Math.sin(f * 0.18) > 0 ? 1 : 0,
            }}
          />
        </div>
      )
    } else {
      // Exit: characters replaced by PETSCII blocks then fade
      const totalChars = word.length
      const charsCleared = Math.floor(exitProgress * (totalChars + 1))

      const chars = word.split('').map((ch, ci) => {
        if (ci < charsCleared) {
          const blockProgress = Math.min(1, (exitProgress * totalChars - ci) / 1.5)
          if (blockProgress > 0.7) {
            return (
              <span key={ci} style={{ color, opacity: 1 - blockProgress }}>
                {'\u2591'}
              </span>
            )
          }
          return (
            <span key={ci} style={{ color }}>
              {'\u2588'}
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
            transform: 'translate(-50%, -50%)',
            opacity: 1 - exitProgress * 0.4,
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(38px, 10vw, 140px)',
            fontWeight: 700,
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

function C64BootComponent(props: MotionGraphicProps<C64BootConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-c64-boot',
  title: 'Kinetic C64 Boot',
  description:
    'Commodore 64 boot screen with PETSCII charset, light blue on dark blue, READY prompt, block cursor blink, and character-by-character typing',
  tags: ['kinetic', 'typography', 'c64', 'commodore', 'petscii', 'retro', '8bit', 'computing'],
  category: 'captions',
  component: C64BootComponent as any,
  defaultConfig: {
    words: ['LOAD', 'RUN', 'LIST', 'POKE'],
    colors: ['#6C5EB5', '#6C5EB5', '#6C5EB5', '#6C5EB5'],
    bgColor: '#40318D',
    cycleDuration: 1.4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['LOAD', 'RUN', 'LIST', 'POKE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#6C5EB5', '#6C5EB5', '#6C5EB5', '#6C5EB5'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#40318D', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
