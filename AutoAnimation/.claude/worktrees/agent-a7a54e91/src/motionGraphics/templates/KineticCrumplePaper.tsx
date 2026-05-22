import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CrumplePaperConfig extends KineticBaseConfig {}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
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
  }: WordRenderProps) => {
    const letters = word.split('')

    // Global crumple state for the whole word
    let globalScale = 1
    let globalOpacity = 1
    let globalBlur = 0

    if (phase === 'enter') {
      // Uncrumple: expand from a tight crumpled ball outward
      const t = easeOutBack(enterProgress)
      globalScale = 0.05 + t * 0.95
      globalBlur = (1 - enterProgress) * 8
      globalOpacity = Math.min(1, enterProgress * 3)
    } else if (phase === 'exit') {
      // Crumple up: collapse inward with rotation chaos
      const t = easeInOutCubic(exitProgress)
      globalScale = 1 - t * 0.97
      globalBlur = t * 10
      globalOpacity = 1 - t * 0.9
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${globalScale})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: globalOpacity,
          filter: globalBlur > 0 ? `blur(${globalBlur}px)` : 'none',
        }}
      >
        {letters.map((letter, i) => {
          const seed = index * 100 + i
          let translateX = 0
          let translateY = 0
          let rotate = 0
          let scaleX = 1
          let scaleY = 1

          if (phase === 'enter') {
            // Each letter emerges from a crumpled position
            const stagger = (i / Math.max(letters.length - 1, 1)) * 0.4
            const t = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger)))
            const eased = easeOutBack(t)
            // Letters were crumpled: random offsets that resolve to 0
            const startX = (seededRandom(seed + 1) - 0.5) * 40
            const startY = (seededRandom(seed + 2) - 0.5) * 40
            const startRot = (seededRandom(seed + 3) - 0.5) * 180
            translateX = startX * (1 - eased)
            translateY = startY * (1 - eased)
            rotate = startRot * (1 - eased)
            // Paper crease deformation
            scaleX = 1 - (1 - eased) * (seededRandom(seed + 4) * 0.4)
            scaleY = 1 - (1 - eased) * (seededRandom(seed + 5) * 0.4)
          } else if (phase === 'hold') {
            // Paper has minor settling creases
            const time = holdProgress * 4 + i * 0.7
            translateX = Math.sin(time + seededRandom(seed + 6) * 6) * 1.5
            translateY = Math.cos(time * 0.8 + seededRandom(seed + 7) * 6) * 1
            rotate = Math.sin(time * 0.5 + seededRandom(seed + 8) * 3) * 1.5
          } else {
            // Each letter crumples independently at slightly different times
            const crumpleDelay = seededRandom(seed) * 0.3
            const t = Math.max(0, Math.min(1, (exitProgress - crumpleDelay) / (1 - crumpleDelay * 0.5)))
            const eased = easeInOutCubic(t)

            translateX = (seededRandom(seed + 10) - 0.5) * eased * 50
            translateY = (seededRandom(seed + 11) - 0.5) * eased * 50
            rotate = (seededRandom(seed + 12) - 0.5) * eased * 200
            scaleX = 1 - eased * (0.3 + seededRandom(seed + 13) * 0.5)
            scaleY = 1 - eased * (0.3 + seededRandom(seed + 14) * 0.5)
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
                whiteSpace: 'pre',
                textShadow: '2px 2px 0 rgba(0,0,0,0.2)',
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

function CrumplePaperComponent(props: MotionGraphicProps<CrumplePaperConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-crumple-paper',
  title: 'Crumple Paper',
  description:
    'Text crumples like paper being wadded up. Letters emerge from a crumpled ball on enter with random rotation and scale distortion, rest with subtle paper-settling, then crumple back into a tight ball on exit.',
  tags: ['kinetic', 'crumple', 'paper', 'scrunch', 'wad', 'physics', 'material', 'origami'],
  category: 'captions',
  component: CrumplePaperComponent as any,
  defaultConfig: {
    words: ['CRUNCH', 'TOSS', 'WADS', 'FOLD'],
    colors: ['#F5F5F0', '#E8E4D0', '#D4C9A8', '#C8B99A'],
    bgColor: '#2d2d2d',
    cycleDuration: 1.8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['CRUNCH', 'TOSS', 'WADS', 'FOLD'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#F5F5F0', '#E8E4D0', '#D4C9A8', '#C8B99A'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2d2d2d', group: 'Style' },
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
