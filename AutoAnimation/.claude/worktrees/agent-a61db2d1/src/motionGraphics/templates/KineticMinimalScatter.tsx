import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalScatterConfig extends KineticBaseConfig {}

// Deterministic pseudo-random offsets based on character index
function getScatterOffset(i: number, total: number): { x: number; y: number; rot: number } {
  // Use prime-based hash for deterministic spread
  const t = (i * 137.508 + 42) % 360
  const rad = (t * Math.PI) / 180
  const radius = 80 + (i % 3) * 40
  return {
    x: Math.cos(rad) * radius,
    y: Math.sin(rad) * radius,
    rot: ((i * 73) % 120) - 60,
  }
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    exitProgress,
    phase,
  }: WordRenderProps) => {
    const chars = word.split('')

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {chars.map((char, i) => {
          const delay = i / chars.length
          const scatter = getScatterOffset(i, chars.length)

          let charP = 0
          if (phase === 'enter') {
            charP = Math.max(0, Math.min(1, (enterProgress - delay * 0.5) / 0.5))
          } else if (phase === 'hold') {
            charP = 1
          } else {
            charP = 1 - Math.max(0, Math.min(1, (exitProgress - delay * 0.5) / 0.5))
          }

          // Ease in-out cubic
          const eased =
            charP < 0.5
              ? 4 * charP * charP * charP
              : 1 - Math.pow(-2 * charP + 2, 3) / 2

          // From scattered offset to zero (settled position)
          const tx = scatter.x * (1 - eased)
          const ty = scatter.y * (1 - eased)
          const rot = scatter.rot * (1 - eased)
          const opacity = eased

          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
                fontSize: 'clamp(36px, 8vw, 120px)',
                fontWeight: 700,
                letterSpacing: '0.04em',
                color,
                opacity,
                transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg)`,
                transformOrigin: 'center center',
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          )
        })}
      </div>
    )
  },
}

function MinimalScatterComponent(props: MotionGraphicProps<MinimalScatterConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-scatter',
  title: 'Minimal Scatter',
  description:
    'Letters start scattered at deterministic random positions and converge into the word. Each character settles with a staggered ease-in-out.',
  tags: ['kinetic', 'minimal', 'scatter', 'assemble', 'stagger', 'chaos', 'order', 'character'],
  category: 'captions',
  component: MinimalScatterComponent as any,
  defaultConfig: {
    words: ['GATHER', 'FOCUS', 'ORDER', 'FORM'],
    colors: ['#111111', '#222222', '#333333', '#111111'],
    bgColor: '#ffffff',
    cycleDuration: 1.8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['GATHER', 'FOCUS', 'ORDER', 'FORM'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#111111', '#222222', '#333333', '#111111'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ffffff', group: 'Style' },
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
