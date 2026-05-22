import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalDominoConfig extends KineticBaseConfig {}

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
          alignItems: 'flex-end',
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
            // Dominos tip over in reverse on exit (right to left)
            const reverseDelay = (chars.length - 1 - i) / chars.length
            charP = 1 - Math.max(0, Math.min(1, (exitProgress - reverseDelay * 0.6) / 0.4))
          }

          // Ease out cubic for the tip-over rotation
          const eased = 1 - Math.pow(1 - charP, 3)
          // Starts at -90deg (standing rotated backward), tips to 0deg
          const rotateZ = (1 - eased) * -90
          const opacity = Math.min(1, charP * 2)

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
                transform: `rotateZ(${rotateZ}deg)`,
                transformOrigin: 'center bottom',
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

function MinimalDominoComponent(props: MotionGraphicProps<MinimalDominoConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-domino',
  title: 'Minimal Domino',
  description:
    'Letters tip over like dominoes from left to right — each rotates from vertical to upright with a staggered delay.',
  tags: ['kinetic', 'minimal', 'domino', 'rotate', 'stagger', 'sequence', 'character', 'tilt'],
  category: 'captions',
  component: MinimalDominoComponent as any,
  defaultConfig: {
    words: ['DOMINO', 'TOPPLE', 'CHAIN', 'REACT'],
    colors: ['#111111', '#222222', '#333333', '#111111'],
    bgColor: '#ffffff',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['DOMINO', 'TOPPLE', 'CHAIN', 'REACT'],
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
