import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NeonFlickerConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Subtle ambient neon glow on the wall behind
    const ambientPulse = 0.03 + Math.sin(time * 2) * 0.01

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Brick wall texture suggestion */}
        {Array.from({ length: 8 }, (_, row) =>
          Array.from({ length: 12 }, (_, col) => {
            const offset = row % 2 === 0 ? 0 : 4.16
            return (
              <div
                key={`${row}-${col}`}
                style={{
                  position: 'absolute',
                  left: `${col * 8.33 + offset}%`,
                  top: `${row * 12.5}%`,
                  width: '8.33%',
                  height: '12.5%',
                  border: '1px solid rgba(60,40,30,0.15)',
                  borderRadius: 1,
                }}
              />
            )
          })
        )}
        {/* Neon ambient glow on wall */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '20%',
            right: '20%',
            bottom: '30%',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, rgba(255,50,100,${ambientPulse}) 0%, transparent 70%)`,
            filter: 'blur(40px)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30
    const letters = word.split('')

    // Each letter has its own neon tube that flickers on in sequence
    const letterElements = letters.map((letter, li) => {
      const letterDelay = li / (letters.length + 1)
      let letterOpacity = 0
      let glowIntensity = 0
      let isOn = false
      let isBuzzing = false

      if (phase === 'enter') {
        // Letters flicker on one by one
        const localProgress = Math.max(0, (enterProgress - letterDelay) / (1 - letterDelay))

        if (localProgress <= 0) {
          letterOpacity = 0
          isOn = false
        } else if (localProgress < 0.2) {
          // First attempt to turn on - flickers
          const flickerSeed = li * 47 + f
          letterOpacity = rand(flickerSeed) < 0.5 ? 0.6 : 0
          isBuzzing = true
        } else if (localProgress < 0.3) {
          letterOpacity = 0
        } else if (localProgress < 0.5) {
          const flickerSeed = li * 83 + f
          letterOpacity = rand(flickerSeed) < 0.7 ? 0.8 : 0.2
          isBuzzing = true
        } else if (localProgress < 0.55) {
          letterOpacity = 0.1
        } else {
          letterOpacity = 1
          isOn = true
          glowIntensity = Math.min(1, (localProgress - 0.55) / 0.45)
        }
      } else if (phase === 'hold') {
        isOn = true
        letterOpacity = 1
        glowIntensity = 1

        // Occasional random flicker on individual letters during hold
        const flickerSeed = li * 137 + f
        const flickerChance = rand(flickerSeed)
        if (flickerChance < 0.015) {
          letterOpacity = 0.3
          isBuzzing = true
        } else if (flickerChance < 0.03) {
          letterOpacity = 0.7
          isBuzzing = true
        }

        // Subtle steady pulse
        glowIntensity = 0.85 + Math.sin(time * 3 + li * 0.5) * 0.15
      } else {
        // Letters flicker off in reverse sequence
        const reverseDelay = (letters.length - 1 - li) / (letters.length + 1)
        const localProgress = Math.max(0, (exitProgress - reverseDelay) / (1 - reverseDelay))

        if (localProgress <= 0) {
          isOn = true
          letterOpacity = 1
          glowIntensity = 1
        } else if (localProgress < 0.3) {
          letterOpacity = rand(li * 71 + f) < 0.6 ? 0.7 : 0.2
          isBuzzing = true
          glowIntensity = 1 - localProgress
        } else if (localProgress < 0.5) {
          letterOpacity = rand(li * 59 + f) < 0.3 ? 0.4 : 0
          isBuzzing = true
          glowIntensity = 0.3
        } else {
          letterOpacity = 0
          glowIntensity = 0
        }
      }

      const neonGlow = isOn || glowIntensity > 0.5
        ? [
            `0 0 7px ${color}`,
            `0 0 15px ${color}`,
            `0 0 30px ${color}`,
            `0 0 50px rgba(255,255,255,${glowIntensity * 0.15})`,
          ].join(', ')
        : isBuzzing
          ? `0 0 5px ${color}`
          : 'none'

      return (
        <span
          key={li}
          style={{
            display: 'inline-block',
            opacity: letterOpacity,
            color: isOn ? '#ffffff' : color,
            textShadow: neonGlow,
            transition: isBuzzing ? 'none' : 'opacity 0.05s',
          }}
        >
          {letter}
        </span>
      )
    })

    return (
      <>
        {/* Neon tube mounting bar */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(50% - clamp(30px, 8vw, 100px))',
            left: '15%',
            right: '15%',
            height: 3,
            background: 'rgba(80,80,80,0.3)',
            borderRadius: 2,
          }}
        />
        {/* Letter container */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Arial Rounded MT Bold', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 8,
            whiteSpace: 'nowrap',
          }}
        >
          {letterElements}
        </div>
      </>
    )
  },
}

function NeonFlickerComponent(props: MotionGraphicProps<NeonFlickerConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-neon-flicker',
  title: 'Kinetic Neon Flicker',
  description: 'Individual neon letter tubes flicker on one by one with buzzing glow, mounted on a dark brick wall with warm ambient light',
  tags: ['kinetic', 'typography', 'neon', 'flicker', 'sign', 'glow', 'tube', 'bar', 'night', 'light'],
  category: 'captions',
  component: NeonFlickerComponent as any,
  defaultConfig: {
    words: ['OPEN', 'NEON', 'GLOW', 'BUZZ'],
    colors: ['#FF3366', '#FF6699', '#FF3366', '#FF99BB'],
    bgColor: '#0d0a08',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['OPEN', 'NEON', 'GLOW', 'BUZZ'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF3366', '#FF6699', '#FF3366', '#FF99BB'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0a08', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
