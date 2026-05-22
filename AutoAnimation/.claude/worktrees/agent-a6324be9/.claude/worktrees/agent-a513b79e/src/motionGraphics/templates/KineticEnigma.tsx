import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EnigmaConfig extends KineticBaseConfig {}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

// Simulated rotor wirings (simplified Enigma-style substitution)
const ROTOR_I = 'EKMFLGDQVZNTOWYHXUSPAIBRCJ'
const ROTOR_II = 'AJDKSIRUXBLHWTMCQGZNPYFVOE'
const ROTOR_III = 'BDFHJLCPRTXVZNYEIWGAKMUSQO'

function rotorSubstitute(ch: string, rotor: string, offset: number): string {
  const idx = ALPHABET.indexOf(ch.toUpperCase())
  if (idx === -1) return ch
  const shifted = (idx + offset) % 26
  return rotor[shifted]
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // Three rotor positions (spinning at different speeds)
    const rotor1Angle = (time * 30) % 360
    const rotor2Angle = (time * 18 + 120) % 360
    const rotor3Angle = (time * 12 + 240) % 360

    const rotorY = height * 0.15
    const rotorSize = Math.min(width * 0.18, 70)
    const rotorSpacing = width * 0.22

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Wehrmacht gray metallic gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(80,85,90,0.06) 0%, transparent 30%, rgba(60,65,70,0.08) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Three rotor indicators at top */}
        {[
          { angle: rotor1Angle, label: 'I', x: width / 2 - rotorSpacing },
          { angle: rotor2Angle, label: 'II', x: width / 2 },
          { angle: rotor3Angle, label: 'III', x: width / 2 + rotorSpacing },
        ].map((rotor, ri) => (
          <div key={ri} style={{ position: 'absolute', left: rotor.x - rotorSize / 2, top: rotorY - rotorSize / 2 }}>
            {/* Rotor housing */}
            <div
              style={{
                width: rotorSize,
                height: rotorSize,
                borderRadius: '50%',
                border: '2px solid rgba(150,155,160,0.15)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Rotor face with letter notches */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  transform: `rotate(${rotor.angle}deg)`,
                }}
              >
                {[0, 90, 180, 270].map((a, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: 1,
                      height: rotorSize * 0.35,
                      background: 'rgba(150,155,160,0.12)',
                      transform: `translate(-50%, -100%) rotate(${a}deg)`,
                      transformOrigin: 'bottom center',
                    }}
                  />
                ))}
              </div>
              {/* Rotor label */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Courier New', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'rgba(180,185,190,0.2)',
                }}
              >
                {rotor.label}
              </div>
            </div>
          </div>
        ))}

        {/* Electrical path traces (vertical lines between rotors and text area) */}
        {[width / 2 - rotorSpacing, width / 2, width / 2 + rotorSpacing].map((x, i) => {
          const glow = Math.sin(time * 4 + i * 2) > 0.3
          return (
            <div
              key={`path${i}`}
              style={{
                position: 'absolute',
                left: x,
                top: rotorY + rotorSize / 2 + 4,
                width: 1,
                height: height * 0.25,
                background: glow
                  ? 'rgba(220,180,60,0.15)'
                  : 'rgba(120,125,130,0.06)',
                boxShadow: glow ? '0 0 4px rgba(220,180,60,0.1)' : 'none',
                pointerEvents: 'none',
              }}
            />
          )
        })}

        {/* Plugboard dots at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 8,
          }}
        >
          {ALPHABET.substring(0, 13).split('').map((_ch, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: `rgba(150,155,160,${0.08 + (Math.sin(time * 3 + i) > 0.7 ? 0.12 : 0)})`,
              }}
            />
          ))}
        </div>

        {/* Metal panel vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 60px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 163 + 89
    const totalChars = word.length

    if (phase === 'enter') {
      // Each character passes through 3 rotors: shows intermediate substitutions
      const chars = word.split('').map((realChar, ci) => {
        const charDelay = ci / (totalChars + 1) * 0.5
        const charProgress = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.5))

        // Three rotor stages
        const rotorOffset = Math.floor((1 - charProgress) * 10) + ci
        let displayChar: string
        let charColor: string

        if (charProgress < 0.33) {
          // Through rotor III
          displayChar = rotorSubstitute(realChar, ROTOR_III, rotorOffset + f)
          charColor = '#8A7040'
        } else if (charProgress < 0.66) {
          // Through rotor II
          displayChar = rotorSubstitute(realChar, ROTOR_II, rotorOffset + Math.floor(f / 2))
          charColor = '#A08848'
        } else if (charProgress < 1) {
          // Through rotor I — almost there
          displayChar = rotorSubstitute(realChar, ROTOR_I, Math.floor((1 - charProgress) * 6))
          charColor = '#C0A060'
        } else {
          displayChar = realChar
          charColor = color
        }

        const isSettled = charProgress >= 1
        const glow = isSettled ? `0 0 6px rgba(220,180,60,0.4)` : 'none'

        return (
          <span key={ci} style={{ color: charColor, textShadow: glow }}>
            {displayChar}
          </span>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '55%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 8,
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>
      )
    } else if (phase === 'hold') {
      // Decoded, electrical path illuminated
      const pulseGlow = 4 + Math.sin(holdProgress * Math.PI * 4) * 3

      return (
        <div
          style={{
            position: 'absolute',
            top: '55%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 8,
            textTransform: 'uppercase',
            textShadow: `0 0 ${pulseGlow}px rgba(220,180,60,0.5), 0 0 ${pulseGlow * 2}px rgba(220,180,60,0.15)`,
          }}
        >
          {word}
        </div>
      )
    } else {
      // Exit: re-encrypt back through rotors
      const chars = word.split('').map((realChar, ci) => {
        const charDelay = ci / (totalChars + 1) * 0.3
        const charProgress = Math.max(0, Math.min(1, (exitProgress - charDelay) / 0.7))

        const rotorOffset = Math.floor(charProgress * 8) + ci
        let displayChar: string
        let charColor: string

        if (charProgress < 0.3) {
          displayChar = realChar
          charColor = color
        } else if (charProgress < 0.6) {
          displayChar = rotorSubstitute(realChar, ROTOR_I, rotorOffset)
          charColor = '#C0A060'
        } else {
          displayChar = rotorSubstitute(realChar, ROTOR_III, rotorOffset + f)
          charColor = '#8A7040'
        }

        const opacity = 1 - charProgress * 0.5

        return (
          <span key={ci} style={{ color: charColor, opacity }}>
            {displayChar}
          </span>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '55%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 8,
            textTransform: 'uppercase',
            opacity: 1 - exitProgress * 0.4,
          }}
        >
          {chars}
        </div>
      )
    }
  },
}

function EnigmaComponent(props: MotionGraphicProps<EnigmaConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-enigma',
  title: 'Kinetic Enigma',
  description: 'Enigma machine: letter substitution through 3 spinning rotors, electrical path illuminates as characters decode, Wehrmacht gray metallic aesthetic',
  tags: ['kinetic', 'typography', 'enigma', 'spy', 'cipher', 'rotor', 'wwii', 'intelligence', 'decode'],
  category: 'captions',
  component: EnigmaComponent as any,
  defaultConfig: {
    words: ['ULTRA', 'BLITZ', 'FRONT', 'STORM'],
    colors: ['#DCC060', '#DCC060', '#DCC060', '#DCC060'],
    bgColor: '#1A1C1E',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ULTRA', 'BLITZ', 'FRONT', 'STORM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#DCC060', '#DCC060', '#DCC060', '#DCC060'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1C1E', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
