import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TaffyStretchConfig extends KineticBaseConfig {}

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

function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
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
          // Position in word: 0 = leftmost, 1 = rightmost
          const positionFraction = letters.length > 1 ? i / (letters.length - 1) : 0.5
          // Left letters get pulled left, right letters get pulled right
          const pullDirection = positionFraction - 0.5 // -0.5 to +0.5

          let translateX = 0
          let scaleX = 1
          let scaleY = 1
          let opacity = 1
          let blur = 0

          if (phase === 'enter') {
            // Taffy being pulled from sides: start extremely stretched, snap to normal
            // Letters come from compressed then elastic bounce
            const t = easeOutElastic(enterProgress)
            const compression = 1 - enterProgress

            // Start squished thin (like taffy before being pulled out)
            scaleX = 0.05 + t * 0.95
            scaleY = 1 + compression * 1.5  // tall and thin initially
            // Letters slide in from their pull direction
            translateX = pullDirection * width * 0.4 * (1 - easeInOutQuart(enterProgress))
            opacity = Math.min(1, enterProgress * 4)
          } else if (phase === 'hold') {
            // Taffy being gently pulled back and forth — slight oscillation
            const time = holdProgress * Math.PI * 4
            const pull = Math.sin(time) * 0.12
            // Outer letters stretch more than center
            const stretchAmount = Math.abs(pullDirection) * 2
            scaleX = 1 + pull * stretchAmount * (seededRandom(seed) * 0.5 + 0.75)
            scaleY = 1 - pull * 0.15 * stretchAmount
            translateX = pullDirection * Math.sin(time) * 12 * (seededRandom(seed + 1) * 0.4 + 0.6)
          } else {
            // Taffy being pulled apart: letters stretch toward edges then snap
            const t = easeInOutQuart(exitProgress)
            const snapT = exitProgress > 0.7 ? (exitProgress - 0.7) / 0.3 : 0

            if (exitProgress < 0.7) {
              // Stretch outward
              scaleX = 1 + t * 3 * (Math.abs(pullDirection) * 1.5 + 0.3)
              scaleY = 1 - t * 0.5
              translateX = pullDirection * width * 0.35 * t
            } else {
              // Snap: quickly compress and fly off
              scaleX = (1 + 0.7 * 3 * (Math.abs(pullDirection) * 1.5 + 0.3)) * (1 - snapT)
              scaleY = (1 - 0.7 * 0.5) * (1 - snapT)
              translateX = pullDirection * width * (0.35 * 0.7 + snapT * 0.8)
              opacity = 1 - snapT
              blur = snapT * 6
            }
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
                transform: `translateX(${translateX}px) scaleX(${scaleX}) scaleY(${scaleY})`,
                transformOrigin: 'center center',
                opacity,
                filter: blur > 0 ? `blur(${blur}px)` : 'none',
                whiteSpace: 'pre',
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
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

function TaffyStretchComponent(props: MotionGraphicProps<TaffyStretchConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-taffy-stretch',
  title: 'Taffy Stretch',
  description:
    'Text stretches horizontally like taffy being pulled from both ends. Letters snap into place with elastic bounce on enter, gently oscillate while held, then stretch and snap apart on exit.',
  tags: ['kinetic', 'taffy', 'stretch', 'elastic', 'pull', 'physics', 'material', 'candy'],
  category: 'captions',
  component: TaffyStretchComponent as any,
  defaultConfig: {
    words: ['PULL', 'SNAP', 'STRETCH', 'FLEX'],
    colors: ['#FF69B4', '#FF1493', '#FF82AB', '#FFB6C1'],
    bgColor: '#1a0a12',
    cycleDuration: 1.6,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['PULL', 'SNAP', 'STRETCH', 'FLEX'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF69B4', '#FF1493', '#FF82AB', '#FFB6C1'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0a12', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
