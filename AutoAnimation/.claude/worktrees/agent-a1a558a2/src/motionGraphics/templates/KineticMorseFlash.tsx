import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MorseFlashConfig extends KineticBaseConfig {}

// Full morse code table
const MORSE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
  G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
  M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  ' ': '/',
}

/** Encode a string to morse sequence of symbols */
function encodeToMorse(text: string): string[] {
  return text.toUpperCase().split('').map(ch => MORSE[ch] ?? '..-.-.').join(' ').split('')
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Timing units: dot=1, dash=3, intra-char gap=1, inter-char gap=3, word gap=7
// At cycleDuration seconds per word, we must fit the entire morse sequence in the enter phase
// We normalize morse timing across the available enter time.

/** Build a flat timed sequence from morse string.
 *  Returns array of {symbol, startNorm, endNorm} where norm is 0..1 */
function buildMorseTimeline(morseStr: string): Array<{ symbol: string; startNorm: number; endNorm: number }> {
  // Convert to timing units
  const elements: Array<{ symbol: string; duration: number }> = []
  for (let i = 0; i < morseStr.length; i++) {
    const ch = morseStr[i]
    if (ch === '.') {
      elements.push({ symbol: 'dot', duration: 1 })
      if (i < morseStr.length - 1) elements.push({ symbol: 'gap', duration: 1 })
    } else if (ch === '-') {
      elements.push({ symbol: 'dash', duration: 3 })
      if (i < morseStr.length - 1) elements.push({ symbol: 'gap', duration: 1 })
    } else if (ch === ' ') {
      // Inter-character gap (already has trailing gap=1, so add 2 more)
      elements.push({ symbol: 'char-gap', duration: 2 })
    } else if (ch === '/') {
      elements.push({ symbol: 'word-gap', duration: 4 })
    }
  }

  const total = elements.reduce((acc, e) => acc + e.duration, 0) || 1
  const timeline: Array<{ symbol: string; startNorm: number; endNorm: number }> = []
  let cursor = 0
  for (const el of elements) {
    timeline.push({
      symbol: el.symbol,
      startNorm: cursor / total,
      endNorm: (cursor + el.duration) / total,
    })
    cursor += el.duration
  }
  return timeline
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Morse code legend dots at top */}
        <div style={{
          position: 'absolute', top: 10, left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Courier New', monospace",
          fontSize: 9,
          color: 'rgba(255,200,0,0.15)',
          letterSpacing: 3,
          whiteSpace: 'nowrap',
        }}>
          · — · · —
        </div>
        {/* Bottom label */}
        <div style={{
          position: 'absolute', bottom: 12, left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Courier New', monospace",
          fontSize: 8,
          color: 'rgba(255,200,0,0.12)',
          letterSpacing: 4,
          whiteSpace: 'nowrap',
        }}>
          MORSE CODE
        </div>
        {/* Faint grid — telegraph paper */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(255,200,0,0.015) 19px, rgba(255,200,0,0.015) 20px)',
          pointerEvents: 'none',
        }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 131 + 37

    // Build morse timeline for this word (cached by value — deterministic)
    const morseStr = word.toUpperCase().split('').map(ch => MORSE[ch] ?? '..-.').join(' ')
    const timeline = buildMorseTimeline(morseStr)

    if (phase === 'enter') {
      // Phase 1 (0..0.55): morse light flashes encode the word
      // Phase 2 (0.55..1.0): word materializes from the morse pattern

      const morsePhase = enterProgress < 0.55
      const morseProgress = morsePhase ? enterProgress / 0.55 : 1
      const decodeProgress = morsePhase ? 0 : (enterProgress - 0.55) / 0.45

      // Which symbol is currently active?
      const activeEl = timeline.find(el => morseProgress >= el.startNorm && morseProgress < el.endNorm)
      const isFlashing = activeEl && (activeEl.symbol === 'dot' || activeEl.symbol === 'dash')
      const isDash = activeEl?.symbol === 'dash'

      // Morse display below (dots and dashes revealed so far)
      const revealedMorse = morseStr.substring(0, Math.floor(morseProgress * morseStr.length))

      // Text decoding: chars appear from left as decodeProgress increases
      const decodedChars = Math.floor(decodeProgress * word.length)

      return (
        <>
          {/* Morse flash light — the central beacon */}
          {morsePhase && (
            <div style={{
              position: 'absolute', top: '35%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: isDash ? 'clamp(60px, 12vw, 160px)' : 'clamp(18px, 4vw, 50px)',
              height: 'clamp(18px, 4vw, 50px)',
              borderRadius: isDash ? 8 : '50%',
              background: isFlashing ? color : 'rgba(255,200,0,0.04)',
              boxShadow: isFlashing ? `0 0 20px ${color}, 0 0 50px ${color}60` : 'none',
              transition: 'none',
            }} />
          )}

          {/* Morse notation string below the light */}
          {morsePhase && (
            <div style={{
              position: 'absolute',
              top: 'calc(35% + clamp(18px, 5vw, 60px))',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(14px, 3vw, 28px)',
              color: 'rgba(255,200,0,0.5)',
              whiteSpace: 'nowrap',
              letterSpacing: 6,
            }}>
              {revealedMorse}
            </div>
          )}

          {/* Text decoding in from left */}
          {!morsePhase && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(44px, 11vw, 150px)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              textTransform: 'uppercase',
            }}>
              {word.split('').map((ch, ci) => {
                if (ci < decodedChars) {
                  const isJustDecoded = ci === decodedChars - 1
                  return (
                    <span key={ci} style={{
                      color,
                      textShadow: isJustDecoded ? `0 0 16px ${color}` : 'none',
                    }}>
                      {ch}
                    </span>
                  )
                }
                // Not yet decoded — show morse placeholder
                const charMorse = MORSE[ch.toUpperCase()] ?? '..'
                return (
                  <span key={ci} style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 'clamp(20px, 4vw, 55px)',
                    color: 'rgba(255,200,0,0.3)',
                    letterSpacing: 2,
                    verticalAlign: 'middle',
                  }}>
                    {charMorse}
                  </span>
                )
              })}
            </div>
          )}
        </>
      )
    } else if (phase === 'hold') {
      // Stable text — periodic individual char morse flash at 0.4
      const flashChar = holdProgress > 0.38 && holdProgress < 0.48
      const flashIdx = seed % word.length

      return (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(44px, 11vw, 150px)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          letterSpacing: 4,
          textTransform: 'uppercase',
        }}>
          {word.split('').map((ch, ci) => {
            const isFlashing = flashChar && ci === flashIdx
            return (
              <span key={ci} style={{
                color,
                textShadow: isFlashing
                  ? `0 0 20px ${color}, 0 0 40px ${color}80`
                  : `0 0 6px ${color}30`,
                opacity: isFlashing ? 1 : 1,
              }}>
                {ch}
              </span>
            )
          })}
        </div>
      )
    } else {
      // Exit: text breaks back into morse flashes — reverse decode
      const encodeProgress = exitProgress
      const encodedChars = Math.floor(encodeProgress * word.length)
      // Chars convert to morse from right to left
      const encodeFrom = word.length - encodedChars

      return (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(44px, 11vw, 150px)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          letterSpacing: 4,
          textTransform: 'uppercase',
        }}>
          {word.split('').map((ch, ci) => {
            if (ci >= encodeFrom) {
              const charMorse = MORSE[ch.toUpperCase()] ?? '..'
              return (
                <span key={ci} style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(20px, 4vw, 55px)',
                  color: 'rgba(255,200,0,0.3)',
                  letterSpacing: 2,
                  verticalAlign: 'middle',
                  opacity: 1 - (exitProgress - 0.5) * 2 > 0 ? 1 : Math.max(0, 1 - (exitProgress - 0.75) * 4),
                }}>
                  {charMorse}
                </span>
              )
            }
            return (
              <span key={ci} style={{ color, opacity: 1 - exitProgress * 0.4 }}>
                {ch}
              </span>
            )
          })}
        </div>
      )
    }
  },
}

function MorseFlashComponent(props: MotionGraphicProps<MorseFlashConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-morse-flash',
  title: 'Kinetic Morse Flash',
  description: 'Morse code light transmission — text encodes to morse dot/dash flashes, word materializes as signals decode, chars convert back on exit',
  tags: ['kinetic', 'typography', 'glitch', 'morse', 'code', 'signal', 'telegraph', 'flash', 'transmission', 'decode'],
  category: 'captions',
  component: MorseFlashComponent as any,
  defaultConfig: {
    words: ['SOS', 'SIGNAL', 'MORSE', 'CODE'],
    colors: ['#FFC800', '#FFFFFF', '#FFC800', '#FFAA00'],
    bgColor: '#060604',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SOS', 'SIGNAL', 'MORSE', 'CODE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFC800', '#FFFFFF', '#FFC800', '#FFAA00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060604', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 1.0, max: 6, group: 'Timing' },
  ],
})
