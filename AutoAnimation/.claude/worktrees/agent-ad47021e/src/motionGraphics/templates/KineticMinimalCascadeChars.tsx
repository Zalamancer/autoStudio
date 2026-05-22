import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalCascadeCharsConfig extends KineticBaseConfig {}

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

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    const chars = word.split('')
    const staggerDelay = 0.12 // fraction of enter phase per character
    const totalChars = chars.length

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 0,
        }}
      >
        {chars.map((char, i) => {
          const delay = i * staggerDelay
          // Each character has its own staggered enter progress
          const charEnterP = Math.max(0, Math.min(1, (enterProgress - delay) / (1 - delay + 0.01)))
          const charExitP = Math.max(0, Math.min(1, (exitProgress - (totalChars - 1 - i) * staggerDelay) / (1 - (totalChars - 1) * staggerDelay + 0.01)))

          let opacity = 1
          let translateY = 0

          if (phase === 'enter') {
            const eased = easeOutCubic(charEnterP)
            opacity = eased
            translateY = (1 - eased) * 28
          } else if (phase === 'exit') {
            // Exit cascades from last char to first (reverse)
            const eased = easeInCubic(Math.max(0, Math.min(1, charExitP)))
            opacity = 1 - eased
            translateY = -eased * 18
          }

          return (
            <div
              key={i}
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
                fontSize: 'clamp(36px, 8vw, 120px)',
                fontWeight: 300,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color,
                transform: `translateY(${translateY.toFixed(2)}px)`,
                opacity,
                display: 'inline-block',
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </div>
          )
        })}
      </div>
    )
  },
}

function MinimalCascadeCharsComponent(props: MotionGraphicProps<MinimalCascadeCharsConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-cascade-chars',
  title: 'Minimal Cascade Chars',
  description: 'Each character enters with a staggered delay cascade — letters drop in one by one, exit in reverse. Pure rhythmic stagger on a single axis.',
  tags: ['kinetic', 'typography', 'minimal', 'stagger', 'cascade', 'characters', 'rhythm', 'delay'],
  category: 'captions',
  component: MinimalCascadeCharsComponent as any,
  defaultConfig: {
    words: ['CASCADE', 'FLOW', 'SEQUENCE', 'DROP'],
    colors: ['#1A1A1A', '#222222', '#1A1A1A', '#333333'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CASCADE', 'FLOW', 'SEQUENCE', 'DROP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1A1A1A', '#222222', '#1A1A1A', '#333333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.6, max: 6, group: 'Timing' },
  ],
})
