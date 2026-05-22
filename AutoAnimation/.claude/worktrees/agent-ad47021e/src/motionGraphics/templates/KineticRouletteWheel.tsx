import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RouletteWheelConfig extends KineticBaseConfig {}

function easeOutElastic(t: number): number {
  if (t === 0) return 0
  if (t === 1) return 1
  const c4 = (2 * Math.PI) / 4
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

function easeInCubic(t: number): number {
  return t * t * t
}

/**
 * KineticRouletteWheel
 * Characters spin in stacked like roulette wheel slots, blurring at speed,
 * decelerating with a small elastic bounce (click-stop feel) to show the word.
 * Each character column spins independently with a slight offset, like tumblers.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    const cx = width / 2
    const cy = height / 2
    const r = Math.min(width, height) * 0.44

    // Roulette wheel ring — outer rim
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            left: cx - r,
            top: cy - r,
            width: r * 2,
            height: r * 2,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.06)',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)',
          }}
        />
        {/* Pointer triangle at top */}
        <div
          style={{
            position: 'absolute',
            left: cx - 8,
            top: cy - r - 14,
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '14px solid rgba(255,255,255,0.5)',
          }}
        />
        {/* Center hub */}
        <div
          style={{
            position: 'absolute',
            left: cx - 6,
            top: cy - 6,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: '0.02em',
        }}
      >
        {chars.map((ch, ci) => {
          // Each column has a slight stagger — earlier chars decelerate first
          const stagger = (ci / Math.max(totalChars - 1, 1)) * 0.18

          let translateY = 0
          let opacity = 1
          let blur = 0

          if (phase === 'enter') {
            const localP = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger)))
            const eased = easeOutElastic(localP)
            // Spin down: start from below (positive Y = below in screen coords)
            translateY = (1 - eased) * -200
            blur = (1 - localP) * 8
            opacity = localP < 0.2 ? localP / 0.2 : 1
          } else if (phase === 'exit') {
            const localP = Math.max(0, Math.min(1, (exitProgress - stagger) / (1 - stagger)))
            const eased = easeInCubic(localP)
            translateY = eased * 200
            blur = localP * 8
            opacity = localP > 0.7 ? 1 - (localP - 0.7) / 0.3 : 1
          }

          return (
            <span
              key={ci}
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: 'clamp(40px, 10vw, 140px)',
                fontWeight: 800,
                color,
                display: 'inline-block',
                transform: `translateY(${translateY}%)`,
                filter: blur > 0 ? `blur(${blur}px)` : undefined,
                opacity,
                textShadow: `0 0 20px ${color}66`,
                letterSpacing: '0.05em',
              }}
            >
              {ch}
            </span>
          )
        })}
      </div>
    )
  },
}

function RouletteWheelComponent(props: MotionGraphicProps<RouletteWheelConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-roulette-wheel',
  title: 'Kinetic Roulette Wheel',
  description:
    'Characters spin in like roulette wheel slots, decelerating with an elastic bounce-stop — the pointer clicks each column into place.',
  tags: ['kinetic', 'typography', 'roulette', 'wheel', 'casino', 'spin', 'slot', 'mechanical'],
  category: 'captions',
  component: RouletteWheelComponent as any,
  defaultConfig: {
    words: ['LUCKY', 'SEVEN', 'SPIN', 'WIN'],
    colors: ['#FFD700', '#FF4444', '#FFFFFF', '#00CC66'],
    bgColor: '#0a0808',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LUCKY', 'SEVEN', 'SPIN', 'WIN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD700', '#FF4444', '#FFFFFF', '#00CC66'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0808', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
