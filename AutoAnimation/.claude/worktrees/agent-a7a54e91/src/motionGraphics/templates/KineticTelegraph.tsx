import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TelegraphConfig extends KineticBaseConfig {
  paperColor: string
  inkColor: string
}

function pseudo(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInCirc(t: number): number {
  return 1 - Math.sqrt(1 - Math.pow(t, 2))
}

// Morse code lookup for visual dot/dash patterns
const MORSE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
  G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
  M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..', '0': '-----', '1': '.----', '2': '..---',
  '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
  '8': '---..', '9': '----.', ' ': '/',
}

function charToMorse(ch: string): string {
  return MORSE[ch.toUpperCase()] || '?'
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const size = Math.min(width, height)

    // Paper tape feed — continuous scroll
    const tapeScroll = (time * 30) % 200

    // Sounder armature click animation
    const clickCycle = (time * 8) % 1
    const armatureAngle = clickCycle < 0.1 ? clickCycle / 0.1 * -8 : clickCycle < 0.2 ? (1 - (clickCycle - 0.1) / 0.1) * -8 : 0

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Aged wood desk texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(
              85deg,
              transparent,
              transparent 30px,
              rgba(120,80,40,0.03) 30px,
              rgba(120,80,40,0.03) 32px
            ), repeating-linear-gradient(
              95deg,
              transparent,
              transparent 50px,
              rgba(100,70,35,0.02) 50px,
              rgba(100,70,35,0.02) 51px
            )`,
          }}
        />

        {/* Paper tape strip — scrolling through the machine */}
        <div
          style={{
            position: 'absolute',
            top: '28%',
            left: '5%',
            right: '5%',
            height: size * 0.08,
            background: '#F5F0E0',
            borderRadius: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2), inset 0 0 4px rgba(0,0,0,0.05)',
            overflow: 'hidden',
          }}
        >
          {/* Sprocket holes along tape edge */}
          {Array.from({ length: 24 }, (_, i) => {
            const holeX = ((i * 18 - tapeScroll) % (24 * 18) + 24 * 18) % (24 * 18)
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: '12%',
                  left: holeX,
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.08)',
                  boxShadow: 'inset 0 0.5px 1px rgba(0,0,0,0.15)',
                }}
              />
            )
          })}
          {/* Printed Morse marks on tape — dots and dashes */}
          {Array.from({ length: 30 }, (_, i) => {
            const markX = ((i * 14 - tapeScroll * 0.8) % (30 * 14) + 30 * 14) % (30 * 14)
            const isDash = pseudo(i * 31) > 0.5
            const markW = isDash ? 10 : 3
            return (
              <div
                key={`m-${i}`}
                style={{
                  position: 'absolute',
                  top: '55%',
                  left: markX,
                  width: markW,
                  height: 3,
                  background: 'rgba(30,20,10,0.15)',
                  borderRadius: 1,
                }}
              />
            )
          })}
        </div>

        {/* Telegraph sounder — the brass mechanism */}
        <div
          style={{
            position: 'absolute',
            bottom: '18%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: size * 0.25,
            height: size * 0.18,
          }}
        >
          {/* Wooden base */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: '-10%',
              right: '-10%',
              height: '25%',
              background: 'linear-gradient(180deg, #6B4226, #5A3620, #4A2A16)',
              borderRadius: '3px 3px 5px 5px',
              boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
            }}
          />
          {/* Brass upright posts */}
          {[0.2, 0.8].map((pos, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                bottom: '25%',
                left: `${pos * 100}%`,
                width: 6,
                height: '55%',
                background: 'linear-gradient(90deg, #C8A848, #D4B860, #C8A848)',
                borderRadius: 2,
                transform: 'translateX(-50%)',
              }}
            />
          ))}
          {/* Armature bar — the clicking lever */}
          <div
            style={{
              position: 'absolute',
              bottom: '60%',
              left: '15%',
              right: '15%',
              height: 4,
              background: 'linear-gradient(180deg, #B89838, #A08030)',
              borderRadius: 2,
              transformOrigin: '15% 50%',
              transform: `rotate(${armatureAngle}deg)`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          >
            {/* Striker knob */}
            <div
              style={{
                position: 'absolute',
                right: -3,
                top: -3,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'radial-gradient(circle, #D4B860, #B89838)',
              }}
            />
          </div>
          {/* Electromagnet coils */}
          <div
            style={{
              position: 'absolute',
              bottom: '30%',
              left: '35%',
              right: '35%',
              height: '25%',
              background: 'linear-gradient(180deg, #2a2a2a, #1a1a1a)',
              borderRadius: 2,
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)',
            }}
          />
        </div>

        {/* Wire running to key — diagonal line */}
        <div
          style={{
            position: 'absolute',
            bottom: '30%',
            right: '15%',
            width: size * 0.12,
            height: 1.5,
            background: 'linear-gradient(90deg, #555, #333)',
            transform: 'rotate(-15deg)',
            transformOrigin: 'right center',
          }}
        />

        {/* Warm gas-lamp vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 60%, transparent 35%, rgba(20,10,0,0.4) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Aged paper grain overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              45deg, transparent, transparent 4px, rgba(180,150,100,0.01) 4px, rgba(180,150,100,0.01) 5px
            )`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    frame,
  }: WordRenderProps) => {
    const f = frame ?? 0
    const chars = word.split('')

    // Morse code line for decoration beneath the word
    const morseStr = chars.map(ch => charToMorse(ch)).join(' ')

    if (phase === 'enter') {
      // Telegraph sounder: each character prints with a mechanical strike
      // Left-to-right like a ticker tape printing one character at a time
      const elements = chars.map((ch, ci) => {
        const charDelay = ci / (chars.length + 1)
        const charP = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.25))
        const eased = easeOutExpo(Math.min(1, charP))

        // Character stamps down with mechanical impact
        const strikeY = charP < 0.15 ? (1 - charP / 0.15) * -20 : 0
        const charOpacity = Math.min(1, charP * 3)
        // Ink splatter on impact — slight scale overshoot
        const impactScale = charP < 0.2 ? 1 + (1 - charP / 0.2) * 0.15 : 1
        // Mechanical vibration from sounder strike
        const vibrate = charP > 0 && charP < 0.3
          ? Math.sin(charP * Math.PI * 12) * (1 - charP / 0.3) * 2
          : 0

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              transform: `translate(0px, ${strikeY + vibrate}px) scale(${impactScale})`,
              opacity: charOpacity,
            }}
          >
            {ch}
          </span>
        )
      })

      // Morse code appearing in sync
      const morseChars = morseStr.split('')
      const morseVisible = Math.floor(enterProgress * morseChars.length)

      return (
        <>
          <div
            style={{
              position: 'absolute',
              top: '48%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Courier New', 'American Typewriter', monospace",
              fontSize: 'clamp(34px, 9vw, 120px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            {elements}
          </div>
          {/* Morse code transcript beneath */}
          <div
            style={{
              position: 'absolute',
              top: '62%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(10px, 2.5vw, 20px)',
              color: 'rgba(200,170,100,0.35)',
              whiteSpace: 'nowrap',
              letterSpacing: '0.2em',
            }}
          >
            {morseChars.slice(0, morseVisible).join('')}
            <span style={{ opacity: Math.sin(f * 0.3) > 0 ? 0.5 : 0 }}>_</span>
          </div>
        </>
      )
    }

    if (phase === 'hold') {
      // Active hold: characters have subtle sounder vibration + ink settling
      const elements = chars.map((ch, ci) => {
        // Gentle sounder resonance — each char trembles slightly
        const tremor = Math.sin(holdProgress * Math.PI * 6 + ci * 1.7) * 0.6
        // Ink absorption — characters slightly darken/spread
        const spread = holdProgress * 0.3
        const inkDeepen = 1 + holdProgress * 0.05

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              transform: `translateY(${tremor}px) scaleX(${1 + spread * 0.01})`,
              filter: `contrast(${inkDeepen})`,
            }}
          >
            {ch}
          </span>
        )
      })

      // Morse blinking cursor
      const cursorBlink = Math.sin(holdProgress * Math.PI * 8) > 0

      return (
        <>
          <div
            style={{
              position: 'absolute',
              top: '48%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Courier New', 'American Typewriter', monospace",
              fontSize: 'clamp(34px, 9vw, 120px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            {elements}
          </div>
          <div
            style={{
              position: 'absolute',
              top: '62%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(10px, 2.5vw, 20px)',
              color: 'rgba(200,170,100,0.35)',
              whiteSpace: 'nowrap',
              letterSpacing: '0.2em',
            }}
          >
            {morseStr}
            <span style={{ opacity: cursorBlink ? 0.5 : 0 }}>_</span>
          </div>
        </>
      )
    }

    // Exit: paper tape feeds out — characters scroll left and fade (mirrors the printing entry)
    const elements = chars.map((ch, ci) => {
      const charDelay = ci / (chars.length + 1)
      const charP = Math.max(0, Math.min(1, (exitProgress - charDelay) / 0.3))
      const eased = easeInCirc(Math.min(1, charP))

      // Characters pull left as tape feeds through
      const offsetX = eased * -(30 + ci * 6)
      const charOpacity = Math.max(0, 1 - charP * 2)
      // Tape curl — slight rotation as paper curls
      const curl = eased * (pseudo(ci * 19 + index) * 8 - 4)

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            transform: `translate(${offsetX}px, 0px) rotate(${curl}deg)`,
            opacity: charOpacity,
            filter: charP > 0.5 ? `blur(${(charP - 0.5) * 4}px)` : undefined,
          }}
        >
          {ch}
        </span>
      )
    })

    // Morse fades
    const morseOpacity = Math.max(0, 1 - exitProgress * 2)

    return (
      <>
        <div
          style={{
            position: 'absolute',
            top: '48%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', 'American Typewriter', monospace",
            fontSize: 'clamp(34px, 9vw, 120px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          {elements}
        </div>
        <div
          style={{
            position: 'absolute',
            top: '62%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(10px, 2.5vw, 20px)',
            color: 'rgba(200,170,100,0.35)',
            whiteSpace: 'nowrap',
            letterSpacing: '0.2em',
            opacity: morseOpacity,
          }}
        >
          {morseStr}
        </div>
      </>
    )
  },
}

function TelegraphComponent(props: MotionGraphicProps<TelegraphConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-telegraph',
  title: 'Kinetic Telegraph',
  description:
    'Telegraph sounder and ticker tape printer on an aged wood desk. Characters stamp down one-by-one with mechanical sounder impact, Morse code transcript appears beneath. Tape feeds out left on exit with paper curl.',
  tags: ['kinetic', 'typography', 'telegraph', 'morse', 'ticker', 'tape', 'vintage', 'victorian', 'brass', 'mechanical'],
  category: 'captions',
  component: TelegraphComponent as any,
  defaultConfig: {
    words: ['STOP', 'MESSAGE', 'URGENT', 'SEND'],
    colors: ['#2A1C0E', '#342010', '#2A1C0E', '#342010'],
    bgColor: '#1E1408',
    cycleDuration: 1.5,
    paperColor: '#F5F0E0',
    inkColor: '#2A1C0E',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['STOP', 'MESSAGE', 'URGENT', 'SEND'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2A1C0E', '#342010', '#2A1C0E', '#342010'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1E1408', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
