import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FlipCardConfig extends KineticBaseConfig {}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return c3 * t * t * t - c1 * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let rotateY = 0
    let opacity = 1

    if (phase === 'enter') {
      const eased = easeOutBack(enterProgress)
      rotateY = 180 - 180 * eased
      opacity = enterProgress > 0.3 ? 1 : enterProgress / 0.3
    } else if (phase === 'hold') {
      // Subtle wobble
      rotateY = Math.sin(holdProgress * Math.PI * 4) * 3
    } else {
      const eased = easeInBack(exitProgress)
      rotateY = -180 * eased
      opacity = exitProgress < 0.7 ? 1 : (1 - exitProgress) / 0.3
    }

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: 1200,
        }}
      >
        <div
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateY(${rotateY}deg)`,
            backfaceVisibility: 'hidden',
            padding: '24px 48px',
            borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))',
            boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 40px ${color}33`,
            border: `2px solid ${color}44`,
            opacity,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(40px, 10vw, 140px)',
              fontWeight: 800,
              color,
              whiteSpace: 'nowrap',
              textShadow: `0 2px 20px ${color}66`,
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              letterSpacing: '0.02em',
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function FlipCardComponent(props: MotionGraphicProps<FlipCardConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-flip-card',
  title: 'Kinetic Flip Card',
  description: '3D card flip reveal with perspective, backface-visibility, and subtle wobble hold',
  tags: ['kinetic', 'typography', '3d', 'flip', 'card', 'perspective'],
  category: 'captions',
  component: FlipCardComponent as any,
  defaultConfig: {
    words: ['FLIP', 'THE', 'SCRIPT', 'NOW'],
    colors: ['#00D4FF', '#FF6B9D', '#C084FC', '#34D399'],
    bgColor: '#0f0f1a',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FLIP', 'THE', 'SCRIPT', 'NOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00D4FF', '#FF6B9D', '#C084FC', '#34D399'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0f1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
