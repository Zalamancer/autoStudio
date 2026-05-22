import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BounceConfig extends KineticBaseConfig {
  bounceHeight: number
}

function bounceEase(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75 }
  if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375 }
  t -= 2.625 / 2.75
  return 7.5625 * t * t + 0.984375
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, height }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0
    let scale = 1

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 2)
      // Drop from top with bounce
      const bounced = bounceEase(enterProgress)
      translateY = (1 - bounced) * -(height * 0.4)
      // Squash on impact
      if (enterProgress > 0.9) {
        const squashT = (enterProgress - 0.9) / 0.1
        scale = 1 - squashT * 0.15
      }
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Subtle idle bob
      translateY = Math.sin(holdProgress * Math.PI * 6) * 3
    } else {
      opacity = 1 - exitProgress
      translateY = exitProgress * (height * 0.3)
      scale = 1 - exitProgress * 0.3
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scaleY(${scale}) scaleX(${2 - scale})`,
          opacity,
          fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 700,
          color,
          textShadow: `3px 3px 0 rgba(0,0,0,0.2)`,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function BounceComponent(props: MotionGraphicProps<BounceConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-bounce-pop',
  title: 'Kinetic Bounce Pop',
  description: 'Playful bouncy words popping in with elastic spring physics and colorful pop effects',
  tags: ['kinetic', 'typography', 'bounce', 'pop', 'playful'],
  category: 'captions',
  component: BounceComponent as any,
  defaultConfig: {
    words: ['FUN', 'PLAY', 'JUMP', 'WOW'],
    colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'],
    bgColor: '#2D1B69',
    cycleDuration: 1,
    bounceHeight: 200,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FUN', 'PLAY', 'JUMP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6B6B', '#4ECDC4', '#FFE66D'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2D1B69', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
    { key: 'bounceHeight', label: 'Bounce Height', type: 'number', defaultValue: 200, min: 50, max: 500, group: 'Animation' },
  ],
})
