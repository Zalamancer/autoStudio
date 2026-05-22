import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalRollConfig extends KineticBaseConfig {}

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
          perspective: '600px',
        }}
      >
        {chars.map((char, i) => {
          const delay = i / chars.length

          let charP = 0
          if (phase === 'enter') {
            charP = Math.max(0, Math.min(1, (enterProgress - delay * 0.6) / 0.4))
          } else if (phase === 'hold') {
            charP = 1
          } else {
            charP = 1 - Math.max(0, Math.min(1, (exitProgress - delay * 0.6) / 0.4))
          }

          // Ease out cubic
          const eased = 1 - Math.pow(1 - charP, 3)

          // Rolls in from top: Y-axis rotation from 90deg (side-on) to 0deg (face-forward)
          const rotateY = (1 - eased) * 90
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
                transform: `rotateY(${rotateY}deg)`,
                transformStyle: 'preserve-3d',
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

function MinimalRollComponent(props: MotionGraphicProps<MinimalRollConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-roll',
  title: 'Minimal Roll',
  description:
    'Letters roll in one at a time with a Y-axis rotation — each flipping from edge-on to face-forward with a staggered delay.',
  tags: ['kinetic', 'minimal', 'roll', 'rotate', '3d', 'flip', 'stagger', 'sequence', 'character'],
  category: 'captions',
  component: MinimalRollComponent as any,
  defaultConfig: {
    words: ['ROLL', 'SPIN', 'FLIP', 'TURN'],
    colors: ['#111111', '#222222', '#333333', '#111111'],
    bgColor: '#ffffff',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['ROLL', 'SPIN', 'FLIP', 'TURN'],
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
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
