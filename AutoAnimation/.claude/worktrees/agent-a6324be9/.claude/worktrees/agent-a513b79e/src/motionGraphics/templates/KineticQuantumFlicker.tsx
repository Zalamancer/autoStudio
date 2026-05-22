import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface QuantumFlickerConfig extends KineticBaseConfig {
  altWord: string
}

// A second word that the text "superposition" flickers between
const DEFAULT_ALT = 'UNKNOWN'

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Quantum probability cloud — faint gaussian blobs pulsing
    const blobs = Array.from({ length: 5 }, (_, i) => {
      const seed = i * 43 + 11
      const cx = (Math.abs(Math.sin(seed * 0.3)) * 0.7 + 0.15) * 100
      const cy = (Math.abs(Math.sin(seed * 0.19)) * 0.6 + 0.2) * 100
      const pulse = 0.5 + Math.abs(Math.sin(frame * 0.03 + i * 1.1)) * 0.5
      const size = (30 + i * 10) * pulse
      const opacity = 0.025 + i * 0.008

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${cx}%`,
            top: `${cy}%`,
            width: size,
            height: size,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: i % 2 === 0
              ? `rgba(0,102,255,${opacity})`
              : `rgba(255,0,255,${opacity})`,
            filter: `blur(${12 + i * 4}px)`,
            pointerEvents: 'none',
          }}
        />
      )
    })

    // Schrodinger box — dashed border around center
    const boxW = Math.min(width * 0.7, 500)
    const boxH = Math.min(height * 0.28, 120)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {blobs}

        {/* Schrödinger uncertainty box */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: boxW,
            height: boxH,
            border: '1px dashed rgba(0,255,255,0.08)',
            borderRadius: 4,
            pointerEvents: 'none',
          }}
        />

        {/* Wave function lines */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12 }}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          {Array.from({ length: 3 }, (_, i) => {
            const y = height * (0.3 + i * 0.2)
            const amplitude = 6 - i * 1.5
            const freq = 0.04 + i * 0.01
            const phase = frame * 0.06 + i * 2
            const points = Array.from({ length: Math.ceil(width / 4) }, (_, j) => {
              const x = j * 4
              const wy = y + Math.sin(x * freq + phase) * amplitude
              return `${x},${wy}`
            }).join(' ')
            return (
              <polyline
                key={i}
                points={points}
                fill="none"
                stroke={i % 2 === 0 ? '#00FFFF' : '#0066FF'}
                strokeWidth="0.8"
              />
            )
          })}
        </svg>

        {/* Labels */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 18,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(0,255,255,0.22)',
            letterSpacing: 2,
          }}
        >
          ψ STATE | SUPERPOSITION
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            right: 18,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(255,0,255,0.22)',
            letterSpacing: 2,
          }}
        >
          COLLAPSE: {Math.floor(frame * 0.5) % 2 === 0 ? 'PENDING' : 'OBSERVE'}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    // The "other" superposed state — deterministically derived from the word
    const altWord = word.split('').map((c, i) => {
      const code = c.charCodeAt(0)
      return String.fromCharCode(65 + (code + i * 3 + index) % 26)
    }).join('')

    if (phase === 'enter') {
      // Both states visible, rapidly switching, then primary locks in
      const switchRate = Math.floor(enterProgress * 10)
      const showPrimary = switchRate % 2 === 0 || enterProgress > 0.7
      const displayWord = showPrimary ? word : altWord
      const opacity = Math.min(1, enterProgress * 2)

      // Interference pattern — horizontal bands sweeping
      const bandY = (enterProgress * 200) % 100

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
          }}
        >
          {/* Interference band overlay */}
          <div
            style={{
              position: 'absolute',
              inset: -8,
              overflow: 'hidden',
              borderRadius: 2,
              pointerEvents: 'none',
              opacity: Math.max(0, 1 - enterProgress * 1.5),
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${bandY}%`,
                height: '30%',
                background: 'rgba(0,255,255,0.04)',
                filter: 'blur(4px)',
              }}
            />
          </div>

          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 10vw, 150px)',
              fontWeight: 700,
              color: showPrimary ? color : '#FF00FF',
              textShadow: showPrimary
                ? `0 0 12px ${color}`
                : '0 0 12px #FF00FF',
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textTransform: 'uppercase',
              filter: enterProgress < 0.7 ? 'blur(0.5px)' : 'none',
            }}
          >
            {displayWord}
          </span>
        </div>
      )
    } else if (phase === 'hold') {
      // Wavefunction has collapsed to the real word — but ghost of alt state persists faintly
      // Occasional "observation" glitch: briefly shows alt state
      const glitchWindow = Math.floor(holdProgress * 5)
      const isObserved = glitchWindow % 5 === 2 && holdProgress > 0.25 && holdProgress < 0.75
      const tinyFlicker = Math.sin(holdProgress * Math.PI * 12) > 0.95

      const displayWord = (isObserved && tinyFlicker) ? altWord : word
      const displayColor = (isObserved && tinyFlicker) ? '#FF00FF' : color

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Ghost alt state (very faint) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.06,
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(40px, 10vw, 150px)',
                fontWeight: 700,
                color: '#FF00FF',
                whiteSpace: 'nowrap',
                letterSpacing: 6,
                textTransform: 'uppercase',
                filter: 'blur(2px)',
              }}
            >
              {altWord}
            </span>
          </div>

          {/* Collapsed primary state */}
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 10vw, 150px)',
              fontWeight: 700,
              color: displayColor,
              textShadow: `0 0 10px ${displayColor}, 0 0 28px ${displayColor}50`,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textTransform: 'uppercase',
            }}
          >
            {displayWord}
          </span>
        </div>
      )
    } else {
      // Exit: wavefunction re-spreads as text decoheres — both states flicker before vanishing
      const decohere = exitProgress > 0.4
      const switchRate = decohere ? Math.floor(exitProgress * 15) : 0
      const showPrimary = switchRate % 2 === 0
      const displayWord = decohere ? (showPrimary ? word : altWord) : word
      const displayColor = (decohere && !showPrimary) ? '#FF00FF' : color
      const opacity = 1 - exitProgress

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
          }}
        >
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 10vw, 150px)',
              fontWeight: 700,
              color: displayColor,
              textShadow: `0 0 8px ${displayColor}`,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textTransform: 'uppercase',
              filter: decohere ? 'blur(0.5px)' : 'none',
            }}
          >
            {displayWord}
          </span>
        </div>
      )
    }
  },
}

function QuantumFlickerComponent(props: MotionGraphicProps<QuantumFlickerConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-quantum-flicker',
  title: 'Kinetic Quantum Flicker',
  description: 'Text exists in quantum superposition, rapidly switching between two states until wavefunction collapses — ghost alt state persists faintly during hold',
  tags: ['kinetic', 'typography', 'quantum', 'superposition', 'flicker', 'physics', 'sci-fi', 'futuristic'],
  category: 'captions',
  component: QuantumFlickerComponent as any,
  defaultConfig: {
    words: ['OBSERVE', 'COLLAPSE', 'CERTAIN', 'KNOWN'],
    colors: ['#00FFFF', '#0066FF', '#00FFFF', '#FF00FF'],
    bgColor: '#0a0a12',
    cycleDuration: 1.6,
    altWord: DEFAULT_ALT,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['OBSERVE', 'COLLAPSE', 'CERTAIN', 'KNOWN'], group: 'Content' },
    { key: 'altWord', label: 'Alt State Word', type: 'text', defaultValue: DEFAULT_ALT, group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFFF', '#0066FF', '#00FFFF', '#FF00FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a12', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
  ],
})
