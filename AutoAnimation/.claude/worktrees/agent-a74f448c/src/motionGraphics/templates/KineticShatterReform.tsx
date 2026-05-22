import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ShatterReformConfig extends KineticBaseConfig {}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
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
    width,
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
          // Each fragment has a unique trajectory
          const fragAngle = seededRandom(seed + 1) * Math.PI * 2
          const fragDist = (seededRandom(seed + 2) * 0.5 + 0.5) * Math.min(width, height) * 0.4
          const fragX = Math.cos(fragAngle) * fragDist
          const fragY = Math.sin(fragAngle) * fragDist
          const fragRotate = (seededRandom(seed + 3) - 0.5) * 540
          const fragScale = 0.3 + seededRandom(seed + 4) * 0.4

          let translateX = 0
          let translateY = 0
          let rotate = 0
          let scale = 1
          let opacity = 1
          let blur = 0

          if (phase === 'enter') {
            // Reform from shattered pieces: fragments fly inward and assemble
            // Stagger: later letters reassemble slightly later
            const stagger = (i / Math.max(letters.length - 1, 1)) * 0.25
            const localT = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger)))
            const eased = easeOutCubic(localT)

            translateX = fragX * (1 - eased)
            translateY = fragY * (1 - eased)
            rotate = fragRotate * (1 - eased)
            scale = fragScale + eased * (1 - fragScale)
            opacity = localT
            blur = (1 - eased) * 3
          } else if (phase === 'hold') {
            // Assembled — vibrate very slightly like a glass resonating
            const time = holdProgress * Math.PI * 6
            translateX = Math.sin(time * 1.1 + seededRandom(seed + 5) * Math.PI) * 1.5
            translateY = Math.cos(time * 0.9 + seededRandom(seed + 6) * Math.PI) * 1
            rotate = Math.sin(time * 0.7 + seededRandom(seed + 7) * Math.PI) * 1
            scale = 1
            opacity = 1
          } else {
            // Shatter outward: explosive burst
            const burstStagger = seededRandom(seed + 20) * 0.15
            const localT = Math.max(0, Math.min(1, (exitProgress - burstStagger) / (1 - burstStagger * 0.5)))
            const eased = easeInCubic(localT)

            translateX = fragX * eased
            translateY = fragY * eased
            rotate = fragRotate * eased
            scale = 1 - eased * (1 - fragScale)
            opacity = 1 - eased
            blur = eased * 4
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
                transform: `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg) scale(${scale})`,
                opacity,
                filter: blur > 0 ? `blur(${blur}px)` : 'none',
                whiteSpace: 'pre',
                textShadow: `0 0 20px ${color}80, 2px 2px 0 rgba(0,0,0,0.3)`,
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

function ShatterReformComponent(props: MotionGraphicProps<ShatterReformConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-shatter-reform',
  title: 'Shatter Reform',
  description:
    'Text shatters into fragments then reassembles. Each letter is a shard with a unique trajectory — they fly in from random directions and lock into place on enter, resonate while held, then explode outward on exit.',
  tags: ['kinetic', 'shatter', 'break', 'fragment', 'glass', 'explode', 'physics', 'material'],
  category: 'captions',
  component: ShatterReformComponent as any,
  defaultConfig: {
    words: ['BREAK', 'CRACK', 'SMASH', 'BURST'],
    colors: ['#E0F2FE', '#BAE6FD', '#7DD3FC', '#38BDF8'],
    bgColor: '#0c1a2e',
    cycleDuration: 2.0,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['BREAK', 'CRACK', 'SMASH', 'BURST'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#E0F2FE', '#BAE6FD', '#7DD3FC', '#38BDF8'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c1a2e', group: 'Style' },
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
