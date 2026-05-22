import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MeltDownConfig extends KineticBaseConfig {}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeInQuad(t: number): number {
  return t * t
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    height,
  }: WordRenderProps) => {
    const letters = word.split('')

    return (
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
        }}
      >
        {letters.map((letter, i) => {
          const seed = index * 100 + i
          // Per-character drip timing — letters melt at slightly different rates
          const meltDelay = seededRandom(seed) * 0.2
          const meltSpeed = 0.6 + seededRandom(seed + 1) * 0.4

          let translateY = 0
          let scaleX = 1
          let scaleY = 1
          let opacity = 1
          let skewX = 0
          let blur = 0

          if (phase === 'enter') {
            // Drip in from above — solidify from molten state
            const t = easeOutQuad(enterProgress)
            // Letters drip down into position
            translateY = -(1 - t) * height * 0.4
            scaleX = 1 + (1 - t) * 0.4 // wide and soft when molten
            scaleY = 1 - (1 - t) * 0.2
            blur = (1 - t) * 6
            opacity = Math.min(1, enterProgress * 2.5)
          } else if (phase === 'hold') {
            // Subtle heat shimmer — wax is still warm
            const time = holdProgress * 8 + i * 0.9
            const wave = Math.sin(time + seededRandom(seed + 5) * Math.PI)
            translateY = wave * 3
            skewX = Math.sin(time * 0.7 + seededRandom(seed + 6) * Math.PI) * 2
            scaleX = 1 + wave * 0.02
            scaleY = 1 - wave * 0.01
            opacity = 1
          } else {
            // Melt downward — each letter has a different delay and rate
            const localT = Math.max(0, (exitProgress - meltDelay) / meltSpeed)
            const t = Math.min(1, easeInQuad(localT))

            // Drip: letterhead stays, body elongates downward
            scaleY = 1 + t * 4 // letter stretches down
            scaleX = 1 - t * 0.4 // gets thinner as it drips
            translateY = t * height * 0.5
            skewX = (seededRandom(seed + 10) - 0.5) * t * 15
            opacity = 1 - Math.max(0, (localT - 0.6) / 0.4)
            blur = t * 4
          }

          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                fontFamily: "'Arial Black', 'Impact', sans-serif",
                fontSize: 'clamp(48px, 12vw, 160px)',
                fontWeight: 900,
                color,
                transformOrigin: 'top center',
                transform: `translateY(${translateY}px) scaleX(${scaleX}) scaleY(${scaleY}) skewX(${skewX}deg)`,
                opacity,
                filter: blur > 0 ? `blur(${blur}px)` : 'none',
                whiteSpace: 'pre',
                textShadow: '2px 4px 8px rgba(0,0,0,0.4)',
              }}
            >
              {letter}
            </span>
          )
        })}
      </div>
    )
  },
}

function MeltDownComponent(props: MotionGraphicProps<MeltDownConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-melt-down',
  title: 'Melt Down',
  description:
    'Text melts downward like hot wax or a candle. Each character drips at a different rate with per-letter elongation and thinning, then solidifies in hold before melting away on exit.',
  tags: ['kinetic', 'melt', 'wax', 'drip', 'heat', 'physics', 'material', 'liquid'],
  category: 'captions',
  component: MeltDownComponent as any,
  defaultConfig: {
    words: ['HOT', 'MELT', 'DRIP', 'FLOW'],
    colors: ['#FF4500', '#FF8C00', '#FFD700', '#FF6347'],
    bgColor: '#1a0500',
    cycleDuration: 2.0,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['HOT', 'MELT', 'DRIP', 'FLOW'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF4500', '#FF8C00', '#FFD700', '#FF6347'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0500', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.0,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
