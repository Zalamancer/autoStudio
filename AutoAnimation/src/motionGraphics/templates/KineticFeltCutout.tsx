import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FeltCutoutConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutBounce(t: number): number {
  const n1 = 7.5625
  const d1 = 2.75
  if (t < 1 / d1) return n1 * t * t
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
  return n1 * (t -= 2.625 / d1) * t + 0.984375
}

// Felt cutout: letters cut from colored felt sheets and placed/arranged
// The animation shows letters being placed one by one, slightly imprecise,
// with the characteristic felt texture and shadow from thickness
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Felt/flannel board texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(45deg, rgba(0,0,0,0.015) 0px, rgba(0,0,0,0.015) 1px, transparent 1px, transparent 3px),
              repeating-linear-gradient(135deg, rgba(0,0,0,0.015) 0px, rgba(0,0,0,0.015) 1px, transparent 1px, transparent 3px)`,
            pointerEvents: 'none',
          }}
        />
        {/* Flannel board gradient (slight unevenness) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 120% 120% at 30% 20%, rgba(255,255,255,0.06) 0%, transparent 60%)',
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
    width,
    height,
    frame,
  }: WordRenderProps) => {
    const f = frame ?? 0
    const chars = word.split('')

    // Felt colors — bright kindergarten palette
    const feltColors = [
      '#E53935', '#1565C0', '#2E7D32', '#F57F17',
      '#6A1B9A', '#00838F', '#AD1457', '#4E342E',
    ]

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 6,
          alignItems: 'center',
        }}
      >
        {chars.map((ch, ci) => {
          const charDelay = ci * 0.1
          let scale = 0
          let opacity = 0
          let rotZ = 0
          let dropY = 0

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (0.75 - charDelay * 0.4)))
            scale = easeOutBounce(p)
            opacity = Math.min(1, p * 3)
            // Letters drop from top with slight rotation (placed by hand)
            rotZ = (rand(ci * 13 + 7) * 10 - 5) * (1 - p)
            dropY = (1 - scale) * -40
          } else if (phase === 'hold') {
            scale = 1
            opacity = 1
            // Imprecise placement — slight jitter on hold
            rotZ = (rand(ci * 13 + 7) * 6 - 3)
            // Tiny breathing motion
            dropY = Math.sin(f * 0.3 + ci * 0.6) * 1.5
          } else {
            const p = Math.max(0, Math.min(1, exitProgress + ci * 0.08))
            scale = Math.max(0, 1 - p)
            opacity = Math.max(0, 1 - p * 1.5)
            rotZ = -20 * p
            dropY = p * 60
          }

          const feltColor = feltColors[(ci + index * 2) % feltColors.length]
          const finalRotZ = phase === 'hold' ? rotZ : rotZ

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                transform: `translateY(${dropY}px) scale(${scale}) rotate(${finalRotZ}deg)`,
                transformOrigin: 'center center',
                opacity,
              }}
            >
              {/* Felt backing — the colored felt shape */}
              <div
                style={{
                  position: 'absolute',
                  inset: '-14% -10%',
                  background: feltColor,
                  borderRadius: 6,
                  // Felt thickness shadow
                  boxShadow: `2px 4px 8px rgba(0,0,0,0.25), 1px 2px 3px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.15)`,
                  // Felt texture — subtle noise
                  backgroundImage: `radial-gradient(circle at ${rand(ci * 7) * 100}% ${rand(ci * 11) * 100}%, rgba(255,255,255,0.06) 0%, transparent 50%)`,
                }}
              />
              {/* Cut edge effect — uneven felt trim */}
              <div
                style={{
                  position: 'absolute',
                  inset: '-14% -10%',
                  border: `1px solid ${feltColor}CC`,
                  borderRadius: 6,
                  opacity: 0.4,
                }}
              />
              {/* Letter in contrasting color or white */}
              <span
                style={{
                  fontFamily: "'Fredoka One', 'Arial Rounded MT Bold', 'Arial', sans-serif",
                  fontSize: 'clamp(38px, 9vw, 130px)',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  display: 'inline-block',
                  lineHeight: 1.1,
                  position: 'relative',
                  zIndex: 1,
                  textShadow: '0 1px 2px rgba(0,0,0,0.25)',
                  letterSpacing: 1,
                }}
              >
                {ch}
              </span>
            </div>
          )
        })}
      </div>
    )
  },
}

function FeltCutoutComponent(props: MotionGraphicProps<FeltCutoutConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-felt-cutout',
  title: 'Kinetic Felt Cutout',
  description: 'Colored felt letters dropped onto a flannel board one by one with bounce — each letter on its own felt backing with characteristic thickness shadow, imprecise hand-placed rotation, bright craft aesthetic',
  tags: ['kinetic', 'typography', 'felt', 'craft', 'cutout', 'textile', 'flannel', 'board', 'playful', 'handmade'],
  category: 'captions',
  component: FeltCutoutComponent as any,
  defaultConfig: {
    words: ['FELT', 'SOFT', 'CRAFT', 'PLAY'],
    colors: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
    bgColor: '#2E4D3A',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FELT', 'SOFT', 'CRAFT', 'PLAY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Board Color', type: 'color', defaultValue: '#2E4D3A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.4, max: 5, group: 'Timing' },
  ],
})
