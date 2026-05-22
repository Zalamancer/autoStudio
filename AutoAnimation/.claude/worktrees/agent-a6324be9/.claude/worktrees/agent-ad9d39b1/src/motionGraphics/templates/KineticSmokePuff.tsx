import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SmokePuffConfig extends KineticBaseConfig {}

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
          // Smoke drift: each letter has a unique drift direction
          const driftX = (seededRandom(seed + 1) - 0.5) * 80
          const driftY = -(seededRandom(seed + 2) * 0.7 + 0.3) * 70 // mostly upward
          const driftRotate = (seededRandom(seed + 3) - 0.5) * 90

          let translateX = 0
          let translateY = 0
          let rotate = 0
          let scale = 1
          let opacity = 1
          let blur = 0

          // Enter stagger — letters condense from smoke one at a time
          const enterStagger = (i / Math.max(letters.length - 1, 1)) * 0.4

          if (phase === 'enter') {
            // Condense from smoke: letters materialize out of blur
            const localT = Math.max(0, Math.min(1, (enterProgress - enterStagger) / (1 - enterStagger)))
            const eased = easeOutCubic(localT)

            // Start dispersed (smoky), contract to solid
            translateX = driftX * (1 - eased)
            translateY = driftY * (1 - eased) * 0.3 // less vertical during condensation
            rotate = driftRotate * (1 - eased)
            scale = 0.5 + eased * 0.5 // start slightly larger (gaseous)
            opacity = localT * localT // opacity squared for fade-in punch
            blur = (1 - eased) * 12
          } else if (phase === 'hold') {
            // Idle: slight drift like smoke in still air
            const time = holdProgress * Math.PI * 4 + i * 0.8
            translateX = Math.sin(time * 0.4 + seededRandom(seed + 5) * Math.PI) * 4
            translateY = Math.cos(time * 0.3 + seededRandom(seed + 6) * Math.PI) * 3 - holdProgress * 5 // slow upward creep
            rotate = Math.sin(time * 0.2 + seededRandom(seed + 7) * Math.PI) * 3
            blur = 0.3 // slight smokiness even when solid
            opacity = 1
          } else {
            // Dissolve into smoke: letters expand, blur, and drift away
            const t = easeInCubic(exitProgress)
            const smokeStagger = seededRandom(seed + 20) * 0.25
            const localT = Math.max(0, Math.min(1, (exitProgress - smokeStagger) / (1 - smokeStagger * 0.5)))
            const eased = easeInCubic(localT)

            translateX = driftX * eased
            translateY = driftY * eased
            rotate = driftRotate * eased
            scale = 1 + eased * 1.2 // expand as smoke dissipates
            opacity = 1 - eased
            blur = eased * 16
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
                textShadow: `0 0 20px ${color}80`,
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

function SmokePuffComponent(props: MotionGraphicProps<SmokePuffConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-smoke-puff',
  title: 'Smoke Puff',
  description:
    'Text dissolves into smoke and vapor. Letters condense out of dispersed blur on enter, drift gently while held like smoke in still air, then expand and dissipate into haze on exit.',
  tags: ['kinetic', 'smoke', 'vapor', 'dissolve', 'blur', 'drift', 'physics', 'material', 'gas'],
  category: 'captions',
  component: SmokePuffComponent as any,
  defaultConfig: {
    words: ['POOF', 'GONE', 'FADE', 'VAPE'],
    colors: ['#D1D5DB', '#9CA3AF', '#6B7280', '#E5E7EB'],
    bgColor: '#111827',
    cycleDuration: 2.0,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['POOF', 'GONE', 'FADE', 'VAPE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#D1D5DB', '#9CA3AF', '#6B7280', '#E5E7EB'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111827', group: 'Style' },
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
