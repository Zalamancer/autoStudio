import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface JellyWobbleConfig extends KineticBaseConfig {}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle at 50% 50%, ${bgColor}, ${bgColor}E0)`,
      }}
    >
      {/* Playful dots background */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${seededRandom(i * 7 + 1) * 100}%`,
            top: `${seededRandom(i * 7 + 2) * 100}%`,
            width: `${6 + seededRandom(i * 7 + 3) * 12}px`,
            height: `${6 + seededRandom(i * 7 + 3) * 12}px`,
            borderRadius: '50%',
            background: `hsla(${seededRandom(i * 7 + 4) * 360}, 70%, 80%, 0.15)`,
          }}
        />
      ))}
    </div>
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    frame = 0,
  }: WordRenderProps) => {
    const letters = word.split('')
    let globalOpacity = 1

    if (phase === 'exit') {
      globalOpacity = 1 - easeOutCubic(exitProgress)
    }

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
          opacity: globalOpacity,
        }}
      >
        {letters.map((letter, i) => {
          const seed = index * 100 + i
          let letterScale = 1
          let skewX = 0
          let skewY = 0
          let translateY = 0
          let letterOpacity = 1

          if (phase === 'enter') {
            // Elastic pop-in with stagger
            const stagger = i * 0.1
            const t = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger * 0.5)))
            const elastic = easeOutElastic(t)
            letterScale = elastic
            letterOpacity = t > 0.05 ? 1 : 0
            // Squish on arrival
            if (t > 0 && t < 0.5) {
              skewX = Math.sin(t * Math.PI * 4) * 15 * (1 - t * 2)
            }
          } else if (phase === 'hold') {
            // Continuous jelly wobble - each letter has its own phase
            const time = holdProgress * 20 + i * 1.2
            const wobbleSpeed = 2.5 + seededRandom(seed) * 1.5

            // Jelly deformation
            skewX = Math.sin(time * wobbleSpeed) * 8
            skewY = Math.cos(time * wobbleSpeed * 0.8) * 5
            translateY = Math.sin(time * wobbleSpeed * 1.2 + Math.PI * 0.3) * 6
            letterScale = 1 + Math.sin(time * wobbleSpeed * 0.6) * 0.08

            // Occasional big wobble
            const bigWobble = Math.sin(time * 0.3) > 0.85
            if (bigWobble) {
              skewX *= 1.8
              skewY *= 1.8
              letterScale += 0.05
            }
          } else {
            // Melt away
            const stagger = i * 0.08
            const t = Math.max(0, Math.min(1, (exitProgress - stagger) / (1 - stagger * 0.4)))
            letterScale = 1 + t * 0.3
            skewX = t * 20
            translateY = t * 40
            letterOpacity = 1 - t
          }

          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
                fontSize: 'clamp(40px, 12vw, 140px)',
                fontWeight: 700,
                color,
                opacity: letterOpacity,
                transform: `translateY(${translateY}px) scale(${letterScale}) skewX(${skewX}deg) skewY(${skewY}deg)`,
                textShadow: `3px 3px 0 ${color}30, 0 6px 12px rgba(0,0,0,0.1)`,
                whiteSpace: 'pre',
                transition: 'none',
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

function JellyWobbleComponent(props: MotionGraphicProps<JellyWobbleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-jelly-wobble',
  title: 'Jelly Wobble',
  description:
    'Jiggly jelly-like text that wobbles and deforms per letter. Elastic pop-in, continuous skew wobble, and melty exit.',
  tags: ['kinetic', 'jelly', 'wobble', 'kids', 'cartoon', 'squishy', 'playful', 'fun'],
  category: 'captions',
  component: JellyWobbleComponent as any,
  defaultConfig: {
    words: ['JELLY', 'WIGGLY', 'SQUISHY', 'BOING'],
    colors: ['#FF69B4', '#7B68EE', '#00CED1', '#FFD700'],
    bgColor: '#FFF0F5',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['JELLY', 'WIGGLY', 'SQUISHY', 'BOING'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF69B4', '#7B68EE', '#00CED1', '#FFD700'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF0F5', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
