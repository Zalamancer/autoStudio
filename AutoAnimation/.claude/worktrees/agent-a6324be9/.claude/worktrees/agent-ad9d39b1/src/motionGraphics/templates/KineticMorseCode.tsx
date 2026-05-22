import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MorseCodeConfig extends KineticBaseConfig {}

const MORSE_MAP: Record<string, string> = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  ' ': '/',
}

function toMorse(text: string): string {
  return text
    .toUpperCase()
    .split('')
    .map((ch) => MORSE_MAP[ch] ?? '')
    .join('   ')
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Pulsing amber glow from signal
    const pulseIntensity = 0.03 + Math.abs(Math.sin(time * 4)) * 0.04

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Subtle radial amber glow center */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 60%, rgba(200,150,50,${pulseIntensity}) 0%, transparent 55%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Horizontal telegraph wire lines */}
        {[0.15, 0.85].map((y, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${y * 100}%`,
              height: 1,
              background: 'rgba(200,150,50,0.08)',
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Signal indicator dot top-right */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 20,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: Math.sin(time * 6) > 0 ? '#D4A030' : '#3A3020',
            boxShadow: Math.sin(time * 6) > 0 ? '0 0 8px #D4A030' : 'none',
          }}
        />
        {/* TX label */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            right: 36,
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: 'rgba(200,150,50,0.3)',
            letterSpacing: 2,
          }}
        >
          TX
        </div>
        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const morseStr = toMorse(word)

    if (phase === 'enter') {
      // Show morse code dots/dashes first, then decode into letters
      const morseOpacity = 1
      const letterOpacity = 0
      const morseCharsToShow = Math.floor(enterProgress * (morseStr.length + 1))
      const displayMorse = morseStr.substring(0, Math.min(morseCharsToShow, morseStr.length))

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          {/* Morse code display */}
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(20px, 5vw, 60px)',
              color,
              opacity: morseOpacity,
              letterSpacing: 3,
              whiteSpace: 'nowrap',
              textShadow: `0 0 6px ${color}`,
            }}
          >
            {displayMorse}
            {/* Blinking transmission cursor */}
            <span style={{ opacity: Math.sin(f * 0.4) > 0 ? 1 : 0, color }}>_</span>
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Transition: morse fades out, decoded word fades in
      const decodeProgress = Math.min(1, holdProgress * 2.5)
      const morseOpacity = Math.max(0, 1 - decodeProgress * 1.5)
      const letterOpacity = Math.pow(decodeProgress, 0.8)

      // Letters reveal one by one
      const totalChars = word.length
      const chars = word.split('').map((ch, ci) => {
        const charThreshold = ci / totalChars
        const charRevealed = decodeProgress > charThreshold
        return (
          <span
            key={ci}
            style={{
              color,
              opacity: charRevealed ? letterOpacity : 0,
              textShadow: charRevealed ? `0 0 10px ${color}, 0 0 20px ${color}40` : 'none',
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
            textAlign: 'center',
          }}
        >
          {/* Fading morse */}
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(16px, 3.5vw, 40px)',
              color,
              opacity: morseOpacity,
              letterSpacing: 3,
              whiteSpace: 'nowrap',
              marginBottom: 12,
            }}
          >
            {morseStr}
          </div>
          {/* Decoded word */}
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 10vw, 140px)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textTransform: 'uppercase',
            }}
          >
            {chars}
          </div>
        </div>
      )
    } else {
      // Exit: text dims and fades with flicker
      const flicker = exitProgress > 0.5 ? (Math.sin(f * 0.6) > 0 ? 0.6 : 1) : 1
      const opacity = (1 - Math.pow(exitProgress, 1.5)) * flicker

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color,
            opacity,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            textTransform: 'uppercase',
            textShadow: `0 0 10px ${color}, 0 0 20px ${color}40`,
          }}
        >
          {word}
        </div>
      )
    }
  },
}

function MorseCodeComponent(props: MotionGraphicProps<MorseCodeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-morse-code',
  title: 'Kinetic Morse Code',
  description:
    'Morse code transmission: dots and dashes appear with telegraph rhythm then decode into readable letters, amber on black with signal glow',
  tags: ['kinetic', 'typography', 'morse', 'telegraph', 'spy', 'code', 'transmission', 'cipher'],
  category: 'captions',
  component: MorseCodeComponent as any,
  defaultConfig: {
    words: ['AGENT', 'ABORT', 'DELTA', 'EVADE'],
    colors: ['#D4A030', '#D4A030', '#D4A030', '#D4A030'],
    bgColor: '#0A0800',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['AGENT', 'ABORT', 'DELTA', 'EVADE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#D4A030', '#D4A030', '#D4A030', '#D4A030'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0800', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
