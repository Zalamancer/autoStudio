import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WiggleTextConfig extends KineticBaseConfig {}

// Seeded pseudo-random for deterministic per-letter values
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
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
          let letterX = 0
          let letterY = 0
          let letterRotate = 0
          let letterScale = 1
          let letterOpacity = 1

          if (phase === 'enter') {
            // Scatter in from random positions
            const startX = (seededRandom(seed + 1) - 0.5) * width * 0.8
            const startY = (seededRandom(seed + 2) - 0.5) * height * 0.8
            const startRotate = (seededRandom(seed + 3) - 0.5) * 720

            const stagger = i * 0.08
            const t = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger * letters.length * 0.3)))
            const eased = easeOutCubic(t)

            letterX = startX * (1 - eased)
            letterY = startY * (1 - eased)
            letterRotate = startRotate * (1 - eased)
            letterScale = 0.3 + eased * 0.7
            letterOpacity = t
          } else if (phase === 'hold') {
            // Independent wiggle for each letter
            const time = holdProgress * 20 + i * 1.7
            letterX = Math.sin(time * 1.3 + seededRandom(seed + 4) * 6) * 6
            letterY = Math.cos(time * 1.1 + seededRandom(seed + 5) * 6) * 6
            letterRotate = Math.sin(time * 0.9 + seededRandom(seed + 6) * 6) * 15
            letterScale = 1 + Math.sin(time * 1.5 + seededRandom(seed + 7) * 6) * 0.08
          } else {
            // Exit: letters wiggle away to random positions
            const endX = (seededRandom(seed + 10) - 0.5) * width * 0.6
            const endY = (seededRandom(seed + 11) - 0.5) * height * 0.6
            const endRotate = (seededRandom(seed + 12) - 0.5) * 540

            const stagger = i * 0.06
            const t = Math.max(0, Math.min(1, (exitProgress - stagger) / (1 - stagger * letters.length * 0.2)))

            letterX = endX * t
            letterY = endY * t
            letterRotate = endRotate * t
            letterScale = 1 - t * 0.5
            letterOpacity = 1 - t
          }

          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                fontFamily: "'Comic Sans MS', 'Fredoka One', cursive, sans-serif",
                fontSize: 'clamp(36px, 10vw, 120px)',
                fontWeight: 700,
                color,
                transform: `translate(${letterX}px, ${letterY}px) rotate(${letterRotate}deg) scale(${letterScale})`,
                opacity: letterOpacity,
                textShadow: '3px 3px 0 rgba(0,0,0,0.15)',
                whiteSpace: 'pre',
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

function WiggleTextComponent(props: MotionGraphicProps<WiggleTextConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-wiggle-text',
  title: 'Wiggle Text',
  description:
    'Each letter wiggles independently with random rotation and offset. Playful, chaotic-but-fun energy.',
  tags: ['kinetic', 'wiggle', 'playful', 'chaotic', 'fun', 'letters', 'comic'],
  category: 'captions',
  component: WiggleTextComponent as any,
  defaultConfig: {
    words: ['CRAZY', 'FUN', 'WILD', 'YOLO'],
    colors: ['#FF6B6B', '#FFE66D', '#4ECDC4', '#FF9FF3'],
    bgColor: '#2D1B69',
    cycleDuration: 1.2,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['CRAZY', 'FUN', 'WILD', 'YOLO'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF6B6B', '#FFE66D', '#4ECDC4', '#FF9FF3'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2D1B69', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.2,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
