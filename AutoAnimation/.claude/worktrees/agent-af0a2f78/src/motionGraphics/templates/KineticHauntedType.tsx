import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HauntedTypeConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame }: BackgroundRenderProps) => {
    const f = frame ?? 0
    // Old paper texture with vignette
    const dustSpots = Array.from({ length: 12 }, (_, i) => ({
      x: rand(i * 37) * 100,
      y: rand(i * 53 + 7) * 100,
      size: 2 + rand(i * 11) * 6,
      opacity: 0.03 + rand(i * 19) * 0.04,
    }))

    // Candle flicker light
    const candleFlicker = 0.04 + Math.sin(f * 0.15) * 0.01 + Math.sin(f * 0.37) * 0.008

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
        {/* Aged paper tint */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 40%, rgba(40, 30, 20, 0.3), transparent 70%)',
          }}
        />
        {/* Candle glow */}
        <div
          style={{
            position: 'absolute',
            bottom: '5%',
            left: '50%',
            width: 200,
            height: 200,
            transform: 'translateX(-50%)',
            background: `radial-gradient(circle, rgba(180, 120, 40, ${candleFlicker}), transparent 70%)`,
          }}
        />
        {/* Dust spots */}
        {dustSpots.map((spot, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${spot.x}%`,
              top: `${spot.y}%`,
              width: spot.size,
              height: spot.size,
              borderRadius: '50%',
              background: '#3a2a1a',
              opacity: spot.opacity,
            }}
          />
        ))}
        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 79 + 17
    const totalChars = word.length

    if (phase === 'enter') {
      // Typewriter reveal: chars appear one by one with key-strike effect
      const charsRevealed = Math.floor(enterProgress * (totalChars + 2))

      const chars = word.split('').map((ch, ci) => {
        const isRevealed = ci < charsRevealed
        const isCurrentKey = ci === charsRevealed - 1 && enterProgress < 0.95

        // Key strike jitter on current char
        const jitterX = isCurrentKey ? (rand(seed + ci + f) - 0.5) * 3 : 0
        const jitterY = isCurrentKey ? (rand(seed + ci + f * 2) - 0.5) * 2 : 0

        // Ink splatter variation per char
        const inkOpacity = isRevealed ? 0.7 + rand(seed + ci * 3) * 0.3 : 0
        const inkRotation = (rand(seed + ci * 7) - 0.5) * 4

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              opacity: inkOpacity,
              transform: `translate(${jitterX}px, ${jitterY}px) rotate(${inkRotation}deg)`,
              color: isCurrentKey ? '#ddd' : color,
            }}
          >
            {ch}
          </span>
        )
      })

      // Cursor/carriage
      const cursorBlink = f % 20 < 12
      const cursorX = charsRevealed * 0.6 // approximate

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', 'Courier', monospace",
            fontSize: 'clamp(32px, 10vw, 120px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 6,
            whiteSpace: 'nowrap',
            zIndex: 1,
          }}
        >
          {chars}
          {cursorBlink && enterProgress < 0.9 && (
            <span style={{ color: '#aaa', opacity: 0.6 }}>|</span>
          )}
        </div>
      )
    } else if (phase === 'hold') {
      // Text complete, slight paper crinkle effect
      const crinkle = Math.sin(holdProgress * Math.PI * 2) * 0.5

      // Random ink bleed on some chars
      const chars = word.split('').map((ch, ci) => {
        const bleed = rand(seed + ci * 13 + Math.floor(holdProgress * 3))
        const isGlitchChar = bleed > 0.9

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              color: isGlitchChar ? '#555' : color,
              transform: `rotate(${(rand(seed + ci * 7) - 0.5) * 4}deg)`,
              textShadow: isGlitchChar ? '0 0 3px rgba(0,0,0,0.5)' : undefined,
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
            transform: `translate(-50%, -50%) rotate(${crinkle}deg)`,
            fontFamily: "'Courier New', 'Courier', monospace",
            fontSize: 'clamp(32px, 10vw, 120px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 6,
            whiteSpace: 'nowrap',
            zIndex: 1,
            opacity: 0.9,
          }}
        >
          {chars}
        </div>
      )
    } else {
      // Exit: ink fades, paper burns from edges
      const burnProgress = exitProgress

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', 'Courier', monospace",
            fontSize: 'clamp(32px, 10vw, 120px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color,
            whiteSpace: 'nowrap',
            zIndex: 1,
            opacity: (1 - burnProgress) * 0.9,
            filter: `brightness(${1 + burnProgress * 0.5}) saturate(${1 - burnProgress * 0.5})`,
            clipPath: burnProgress > 0.3
              ? `inset(${burnProgress * 10}% ${burnProgress * 15}% ${burnProgress * 10}% ${burnProgress * 15}%)`
              : undefined,
          }}
        >
          {word.split('').map((ch, ci) => (
            <span
              key={ci}
              style={{
                display: 'inline-block',
                transform: `rotate(${(rand(seed + ci * 7) - 0.5) * 4}deg)`,
              }}
            >
              {ch}
            </span>
          ))}
        </div>
      )
    }
  },
}

function HauntedTypeComponent(props: MotionGraphicProps<HauntedTypeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-haunted-type',
  title: 'Kinetic Haunted Type',
  description: 'Old haunted typewriter text reveal with ink variation, key-strike jitter, candle glow, and paper burn exit effect',
  tags: ['kinetic', 'typography', 'horror', 'typewriter', 'haunted', 'vintage', 'creepy', 'dark'],
  category: 'captions',
  component: HauntedTypeComponent as any,
  defaultConfig: {
    words: ['REDRUM', 'MURDER', 'HELP ME', 'RUN'],
    colors: ['#8B4513', '#654321', '#6B3A2A', '#7B3F00'],
    bgColor: '#0d0a07',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['REDRUM', 'MURDER', 'HELP ME', 'RUN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#8B4513', '#654321', '#6B3A2A', '#7B3F00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0a07', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
