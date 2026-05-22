import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CipherWheelConfig extends KineticBaseConfig {}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function seededRand(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

function scrambleChar(realChar: string, progress: number, seed: number): string {
  if (progress >= 1) return realChar
  // Spin through alphabet positions based on progress
  const realIdx = ALPHABET.indexOf(realChar.toUpperCase())
  if (realIdx === -1) return realChar
  const offset = Math.floor((1 - progress) * 26 * (1 + seededRand(seed) * 2))
  return ALPHABET[(realIdx + offset) % 26]
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Outer cipher ring rotation
    const ringRotation = time * 15
    // Inner ring counter-rotation
    const innerRotation = -time * 22

    const ringSize = Math.min(width, height) * 0.85
    const innerRingSize = ringSize * 0.7

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Outer cipher ring */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: ringSize,
            height: ringSize,
            transform: `translate(-50%, -50%) rotate(${ringRotation}deg)`,
            borderRadius: '50%',
            border: '2px solid rgba(180,160,100,0.12)',
            pointerEvents: 'none',
          }}
        >
          {/* Outer ring letters */}
          {ALPHABET.split('').map((ch, i) => {
            const angle = (i / 26) * 360
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${angle}deg) translateY(-${ringSize / 2 - 14}px)`,
                  fontFamily: "'Courier New', monospace",
                  fontSize: 10,
                  color: 'rgba(180,160,100,0.18)',
                  transformOrigin: 'center center',
                }}
              >
                {ch}
              </div>
            )
          })}
        </div>

        {/* Inner cipher ring */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: innerRingSize,
            height: innerRingSize,
            transform: `translate(-50%, -50%) rotate(${innerRotation}deg)`,
            borderRadius: '50%',
            border: '1px solid rgba(100,180,160,0.1)',
            pointerEvents: 'none',
          }}
        >
          {ALPHABET.split('').map((ch, i) => {
            const angle = (i / 26) * 360
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${angle}deg) translateY(-${innerRingSize / 2 - 12}px)`,
                  fontFamily: "'Courier New', monospace",
                  fontSize: 9,
                  color: 'rgba(100,180,160,0.15)',
                  transformOrigin: 'center center',
                }}
              >
                {ch}
              </div>
            )
          })}
        </div>

        {/* Center crosshair */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 20,
            height: 1,
            transform: 'translate(-50%, -50%)',
            background: 'rgba(180,160,100,0.1)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 1,
            height: 20,
            transform: 'translate(-50%, -50%)',
            background: 'rgba(180,160,100,0.1)',
            pointerEvents: 'none',
          }}
        />
        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 197 + 53
    const totalChars = word.length

    if (phase === 'enter') {
      // Characters spin through gibberish and settle into plaintext left-to-right
      const chars = word.split('').map((realChar, ci) => {
        const charDelay = ci / (totalChars + 1) * 0.6
        const charProgress = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.4))
        const displayChar = scrambleChar(realChar, charProgress, seed + ci * 67 + f)
        const isSettled = charProgress >= 1
        const charColor = isSettled ? color : '#6A9A80'
        const glow = isSettled ? `0 0 8px ${color}60` : 'none'

        return (
          <span key={ci} style={{ color: charColor, textShadow: glow, transition: 'none' }}>
            {displayChar}
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
      // Stable decoded text with subtle shimmer
      const shimmerX = Math.sin(holdProgress * Math.PI * 2) * 2

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 8,
            textTransform: 'uppercase',
            textShadow: `${shimmerX}px 0 12px ${color}30, 0 0 8px ${color}40`,
          }}
        >
          {word}
        </div>
      )
    } else {
      // Exit: re-encrypt back into cipher text
      const chars = word.split('').map((realChar, ci) => {
        const charDelay = ci / (totalChars + 1) * 0.3
        const charProgress = Math.max(0, Math.min(1, (exitProgress - charDelay) / 0.7))
        const displayChar = scrambleChar(realChar, 1 - charProgress, seed + ci * 31 + f)
        const charColor = charProgress > 0 ? '#6A9A80' : color
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
            top: '50%',
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

function CipherWheelComponent(props: MotionGraphicProps<CipherWheelConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cipher-wheel',
  title: 'Kinetic Cipher Wheel',
  description: 'Cipher decode effect: text starts as encrypted gibberish with spinning cipher wheel overlays, letters rotate through the alphabet into correct plaintext',
  tags: ['kinetic', 'typography', 'cipher', 'decode', 'spy', 'encryption', 'wheel', 'intelligence'],
  category: 'captions',
  component: CipherWheelComponent as any,
  defaultConfig: {
    words: ['RAVEN', 'NIGHT', 'OMEGA', 'COVER'],
    colors: ['#C4A86A', '#C4A86A', '#C4A86A', '#C4A86A'],
    bgColor: '#0C0C0A',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RAVEN', 'NIGHT', 'OMEGA', 'COVER'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C4A86A', '#C4A86A', '#C4A86A', '#C4A86A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0C0C0A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
