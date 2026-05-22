import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CrayonWriteConfig extends KineticBaseConfig {}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const crayonColors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF8E53', '#C77DFF']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Paper texture lines */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${8 + i * 8}%`,
            height: '1px',
            background: 'rgba(173,216,230,0.3)',
          }}
        />
      ))}
      {/* Red margin line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '12%',
          width: '2px',
          background: 'rgba(255,100,100,0.25)',
        }}
      />
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
          alignItems: 'baseline',
          opacity: globalOpacity,
        }}
      >
        {letters.map((letter, i) => {
          const seed = index * 100 + i
          const crayonColor = crayonColors[Math.floor(seededRandom(seed + 50) * crayonColors.length)]

          // Each letter "drawn" with stagger
          const stagger = i * 0.12
          let letterOpacity = 0
          let letterScale = 0.3
          let strokeWidth = 0
          let wobbleY = 0
          let wobbleRotate = 0

          if (phase === 'enter') {
            const t = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger * 0.5)))
            const eased = easeOutCubic(t)
            letterOpacity = t > 0 ? 1 : 0
            letterScale = 0.3 + eased * 0.7
            strokeWidth = eased * 3
            // Crayon drawing wobble
            if (t > 0 && t < 1) {
              wobbleY = Math.sin(t * Math.PI * 6) * 4 * (1 - t)
              wobbleRotate = Math.sin(t * Math.PI * 4) * 8 * (1 - t)
            }
          } else if (phase === 'hold') {
            letterOpacity = 1
            letterScale = 1
            strokeWidth = 3
            // Gentle hand-drawn wobble
            const time = holdProgress * 15 + i * 1.3
            wobbleY = Math.sin(time) * 1.5
            wobbleRotate = Math.sin(time * 0.7 + seededRandom(seed) * 5) * 2
          } else {
            letterOpacity = 1 - exitProgress
            letterScale = 1
            strokeWidth = 3 * (1 - exitProgress)
          }

          // Random baseline offset for hand-drawn feel
          const baselineOffset = (seededRandom(seed + 20) - 0.5) * 8

          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                fontFamily: "'Comic Sans MS', 'Fredoka One', cursive, sans-serif",
                fontSize: 'clamp(40px, 12vw, 140px)',
                fontWeight: 700,
                color: crayonColor,
                opacity: letterOpacity,
                transform: `translateY(${baselineOffset + wobbleY}px) rotate(${wobbleRotate}deg) scale(${letterScale})`,
                textShadow: `
                  ${strokeWidth}px ${strokeWidth}px 0 ${crayonColor}40,
                  -${strokeWidth * 0.5}px ${strokeWidth * 0.5}px 0 ${crayonColor}20
                `,
                WebkitTextStroke: `${strokeWidth * 0.3}px ${crayonColor}90`,
                whiteSpace: 'pre',
                filter: letterOpacity > 0 ? `saturate(1.3)` : 'none',
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

function CrayonWriteComponent(props: MotionGraphicProps<CrayonWriteConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-crayon-write',
  title: 'Crayon Write',
  description:
    'Text drawn letter-by-letter with colorful crayon strokes on notebook paper. Hand-drawn wobble, multicolor crayons, playful kids theme.',
  tags: ['kinetic', 'crayon', 'kids', 'cartoon', 'handwritten', 'colorful', 'playful', 'drawing'],
  category: 'captions',
  component: CrayonWriteComponent as any,
  defaultConfig: {
    words: ['DRAW', 'COLOR', 'FUN', 'PLAY'],
    colors: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF'],
    bgColor: '#FFFEF2',
    cycleDuration: 1.8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['DRAW', 'COLOR', 'FUN', 'PLAY'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFEF2', group: 'Style' },
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
