import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MagnetLetterConfig extends KineticBaseConfig {
  magnetSize: number
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Spring settle with overshoot */
function springSettle(t: number): number {
  if (t >= 1) return 1
  const decay = Math.exp(-5 * t)
  return 1 - decay * Math.cos(t * Math.PI * 3)
}

// Magnet letter colors — classic fridge magnet palette
const MAGNET_COLORS = [
  '#E53935', '#1E88E5', '#FDD835', '#43A047',
  '#FB8C00', '#8E24AA', '#00ACC1', '#D81B60',
  '#7CB342', '#F4511E', '#3949AB', '#FFB300',
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Brushed metal refrigerator texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(
                90deg,
                transparent 0px,
                transparent 1px,
                rgba(255,255,255,0.015) 1px,
                rgba(255,255,255,0.015) 2px
              )
            `,
            pointerEvents: 'none',
          }}
        />
        {/* Fridge surface highlights */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.04) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(0,0,0,0.06) 0%, transparent 50%)
            `,
            pointerEvents: 'none',
          }}
        />
        {/* Scattered extra magnets in background */}
        {Array.from({ length: 5 }, (_, i) => {
          const x = 5 + rand(i * 71) * 90
          const y = 5 + rand(i * 47) * 90
          const magColor = MAGNET_COLORS[(i * 3) % MAGNET_COLORS.length]
          const rot = (rand(i * 23) - 0.5) * 30
          const chars = ['!', '?', '*', '#', '&']
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                fontFamily: "'Comic Sans MS', 'Fredoka One', cursive",
                fontSize: 'clamp(12px, 3vw, 28px)',
                fontWeight: 700,
                color: '#FFFFFF',
                background: magColor,
                padding: '2px 6px',
                borderRadius: 3,
                transform: `rotate(${rot}deg)`,
                opacity: 0.25,
                boxShadow: '1px 1px 3px rgba(0,0,0,0.3)',
              }}
            >
              {chars[i]}
            </div>
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const f = frame ?? 0
    const seed = index * 137

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 'clamp(2px, 0.8vw, 8px)',
          whiteSpace: 'nowrap',
        }}
      >
        {chars.map((ch, ci) => {
          // Each letter is a plastic magnet tile
          const magnetColor = MAGNET_COLORS[(ci + index * 3) % MAGNET_COLORS.length]
          const charSeed = seed + ci * 67

          // Unique per-letter tilt for that handmade fridge look
          const baseTilt = (rand(charSeed) - 0.5) * 12
          const baseOffsetY = (rand(charSeed + 1) - 0.5) * 6

          let opacity = 0
          let x = 0
          let y = 0
          let rotation = baseTilt
          let scale = 1
          let shadowBlur = 3
          let shadowY = 2

          if (phase === 'enter') {
            const charDelay = ci / totalChars * 0.5
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.5)))
            const settled = springSettle(p)

            // Slide from scattered positions toward center arrangement
            const startX = (rand(charSeed + 10) - 0.5) * width * 0.8
            const startY = (rand(charSeed + 20) - 0.5) * height * 0.6
            const startRotation = (rand(charSeed + 30) - 0.5) * 180

            x = startX * (1 - settled)
            y = startY * (1 - settled) + baseOffsetY * settled
            rotation = startRotation * (1 - settled) + baseTilt * settled
            scale = 0.6 + settled * 0.4

            // Magnetic snap — faster acceleration toward end
            opacity = Math.min(1, p * 2.5)

            // Shadow lifts during travel, settles on arrival
            shadowBlur = 3 + (1 - settled) * 12
            shadowY = 2 + (1 - settled) * 10
          } else if (phase === 'hold') {
            opacity = 1
            y = baseOffsetY
            // Subtle magnetic micro-adjustment
            const drift = Math.sin(holdProgress * Math.PI * 2 + ci * 1.3) * 1
            x = drift
            y = baseOffsetY + Math.cos(holdProgress * Math.PI * 3 + ci * 0.7) * 0.8
            rotation = baseTilt + Math.sin(holdProgress * Math.PI * 1.5 + ci) * 0.8
          } else {
            const charDelay = (1 - ci / totalChars) * 0.3
            const p = Math.max(0, Math.min(1, (exitProgress - charDelay) / (1 - charDelay * 0.4)))

            // Magnets slide off in different directions
            const exitAngle = (rand(charSeed + 50) - 0.5) * Math.PI
            x = Math.cos(exitAngle) * p * width * 0.4
            y = baseOffsetY + Math.sin(exitAngle) * p * height * 0.3 + p * 30
            rotation = baseTilt + p * (rand(charSeed + 60) - 0.5) * 120
            opacity = 1 - p
            scale = 1 - p * 0.3
            shadowBlur = 3 + p * 8
            shadowY = 2 + p * 6
          }

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
                transform: `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`,
                opacity,
              }}
            >
              {/* Magnet tile body */}
              <div
                style={{
                  background: magnetColor,
                  padding: 'clamp(4px, 1.2vw, 12px) clamp(6px, 1.5vw, 14px)',
                  borderRadius: 4,
                  boxShadow: `0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.25), inset 0 -1px 1px rgba(0,0,0,0.15)`,
                  position: 'relative',
                }}
              >
                {/* Letter text */}
                <span
                  style={{
                    fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
                    fontSize: 'clamp(32px, 10vw, 130px)',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    lineHeight: 1,
                    display: 'block',
                    textAlign: 'center',
                  }}
                >
                  {ch}
                </span>
                {/* Plastic glossy sheen */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 4,
                    background: 'linear-gradient(160deg, rgba(255,255,255,0.25) 0%, transparent 40%, rgba(0,0,0,0.05) 100%)',
                    pointerEvents: 'none',
                  }}
                />
                {/* Slight beveled edge */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderBottomColor: 'rgba(0,0,0,0.1)',
                    borderRightColor: 'rgba(0,0,0,0.05)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    )
  },
}

function MagnetLetterComponent(props: MotionGraphicProps<MagnetLetterConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-magnet-letter',
  title: 'Kinetic Magnet Letter',
  description: 'Fridge magnet letters sliding into position with slight tilt and overlap, magnetic snap settle against a brushed steel surface',
  tags: ['kinetic', 'typography', 'magnet', 'fridge', 'letter', 'craft', 'playful', 'colorful', 'toy'],
  category: 'captions',
  component: MagnetLetterComponent as any,
  defaultConfig: {
    words: ['HELLO', 'COOL', 'PLAY', 'FUN'],
    colors: ['#E53935', '#1E88E5', '#FDD835', '#43A047'],
    bgColor: '#D8D8D8',
    cycleDuration: 1.3,
    magnetSize: 100,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HELLO', 'COOL', 'PLAY', 'FUN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E53935', '#1E88E5', '#FDD835', '#43A047'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#D8D8D8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
    { key: 'magnetSize', label: 'Magnet Size', type: 'number', defaultValue: 100, min: 50, max: 200, group: 'Animation' },
  ],
})
