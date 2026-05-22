import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GravityDropConfig extends KineticBaseConfig {}

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

  renderWord: ({ word, color, enterProgress, exitProgress, phase, height, index }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0
    let rotation = 0

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 2.5)
      // Drop from above with bounce
      const bounced = bounceEase(enterProgress)
      translateY = (1 - bounced) * -(height * 0.5)
    } else if (phase === 'hold') {
      opacity = 1
      // Slight sway
      translateY = Math.sin(Date.now() * 0.003 + index) * 2
    } else {
      opacity = 1 - exitProgress
      // Fall down with increasing speed (quadratic)
      translateY = exitProgress * exitProgress * (height * 0.6)
      rotation = exitProgress * ((index % 2 === 0) ? 8 : -8)
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) rotate(${rotation}deg)`,
          opacity,
          fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(48px, 14vw, 180px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          color,
          textShadow: '3px 3px 0 rgba(0,0,0,0.25)',
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function GravityDropComponent(props: MotionGraphicProps<GravityDropConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-gravity-drop',
  title: 'Kinetic Gravity Drop',
  description: 'Words drop with gravity physics and bounce easing, then fall away on exit',
  tags: ['kinetic', 'typography', 'gravity', 'bounce', 'drop'],
  category: 'captions',
  component: GravityDropComponent as any,
  defaultConfig: {
    words: ['DROP', 'FALL', 'CRASH', 'BOOM'],
    colors: ['#FF6B35', '#00BFFF', '#FF1493', '#FFD700'],
    bgColor: '#1a1a2e',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DROP', 'FALL', 'CRASH', 'BOOM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6B35', '#00BFFF', '#FF1493', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
