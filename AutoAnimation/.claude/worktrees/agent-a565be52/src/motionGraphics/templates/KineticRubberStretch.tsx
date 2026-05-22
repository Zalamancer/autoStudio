import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RubberStretchConfig extends KineticBaseConfig {}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3
  if (t === 0) return 0
  if (t === 1) return 1
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

function easeInElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3
  if (t === 0) return 0
  if (t === 1) return 1
  return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
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
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {letters.map((letter, i) => {
          const seed = index * 100 + i
          // Each letter has a unique pull vector — rubber has memory, pulls back
          const pullDirX = seededRandom(seed + 1) - 0.5
          const pullDirY = seededRandom(seed + 2) - 0.5
          const pullMagnitude = (seededRandom(seed + 3) * 0.6 + 0.4) * 120

          let translateX = 0
          let translateY = 0
          let scaleX = 1
          let scaleY = 1
          let rotate = 0
          let opacity = 1

          if (phase === 'enter') {
            // Rubber being stretched from its rest point, then snapping back
            // Enter: snap back from overstretched position
            const stagger = (i / Math.max(letters.length - 1, 1)) * 0.3
            const localT = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger)))
            const eased = easeOutElastic(localT)

            // Start from stretched position (letter was pulled far)
            translateX = pullDirX * pullMagnitude * (1 - eased)
            translateY = pullDirY * pullMagnitude * (1 - eased)
            // Rubber stretches in the direction of motion
            const stretchFactor = Math.sqrt(pullDirX * pullDirX + pullDirY * pullDirY)
            scaleX = 1 + (1 - eased) * stretchFactor * 0.8
            scaleY = 1 - (1 - eased) * stretchFactor * 0.3
            rotate = (1 - eased) * (seededRandom(seed + 4) - 0.5) * 40
            opacity = Math.min(1, localT * 3)
          } else if (phase === 'hold') {
            // Rubber at rest with natural springy micro-oscillations
            const time = holdProgress * Math.PI * 6 + i * 1.1
            // Rubber oscillation decays over time
            const decay = Math.exp(-holdProgress * 3)
            const amplitude = 12 * decay + 3 * (1 - decay)

            translateX = Math.sin(time * 1.2 + seededRandom(seed + 5) * Math.PI * 2) * amplitude * (seededRandom(seed + 6) * 0.4 + 0.6)
            translateY = Math.cos(time * 0.9 + seededRandom(seed + 7) * Math.PI * 2) * amplitude * 0.6
            rotate = Math.sin(time * 0.7 + seededRandom(seed + 8) * Math.PI) * 5 * decay + Math.sin(time * 0.5) * 2 * (1 - decay)
            // Rubber conserves volume: stretch in X = squash in Y
            scaleX = 1 + Math.sin(time * 1.2 + seededRandom(seed + 5) * Math.PI * 2) * 0.08
            scaleY = 1 / scaleX // volume conservation
          } else {
            // Stretched and released: letter gets pulled out then snaps back violently
            // But this time it overstretches and flies off
            const t = easeInElastic(exitProgress)

            translateX = pullDirX * pullMagnitude * t * 2
            translateY = pullDirY * pullMagnitude * t * 2
            // Extreme stretch during pull
            const stretchFactor = Math.sqrt(pullDirX * pullDirX + pullDirY * pullDirY)
            scaleX = 1 + t * stretchFactor * 2
            scaleY = 1 - t * stretchFactor * 0.6
            rotate = t * (seededRandom(seed + 14) - 0.5) * 90
            opacity = 1 - exitProgress * exitProgress
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
                transform: `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg) scaleX(${scaleX}) scaleY(${scaleY})`,
                transformOrigin: 'center center',
                opacity,
                whiteSpace: 'pre',
                textShadow: '3px 3px 0 rgba(0,0,0,0.25)',
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

function RubberStretchComponent(props: MotionGraphicProps<RubberStretchConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-rubber-stretch',
  title: 'Rubber Stretch',
  description:
    'Text stretches and deforms like rubber being pulled, then snaps back to shape. Each letter has elastic memory — snaps from stretched on enter with volume conservation, oscillates springily while held, then overstretches and flies off on exit.',
  tags: ['kinetic', 'rubber', 'elastic', 'stretch', 'snap', 'spring', 'physics', 'material', 'deform'],
  category: 'captions',
  component: RubberStretchComponent as any,
  defaultConfig: {
    words: ['SNAP', 'FLEX', 'BEND', 'PING'],
    colors: ['#FCA5A5', '#F87171', '#EF4444', '#DC2626'],
    bgColor: '#1c0a0a',
    cycleDuration: 1.8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SNAP', 'FLEX', 'BEND', 'PING'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FCA5A5', '#F87171', '#EF4444', '#DC2626'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1c0a0a', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
