import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalAltDirectionConfig extends KineticBaseConfig {}

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

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width }: WordRenderProps) => {
    // Alternates: even words enter from right, odd words enter from left
    const dir = index % 2 === 0 ? 1 : -1
    const slideAmount = width * 0.5
    let opacity = 1
    let translateX = 0

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      opacity = Math.min(1, enterProgress * 2.5)
      translateX = dir * slideAmount * (1 - eased)
    } else if (phase === 'exit') {
      const eased = easeInCubic(exitProgress)
      opacity = 1 - eased
      // Exits in opposite direction to entrance
      translateX = -dir * slideAmount * 0.6 * eased
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${translateX.toFixed(2)}px)`,
          opacity,
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(36px, 8vw, 120px)',
          fontWeight: 300,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function MinimalAltDirectionComponent(props: MotionGraphicProps<MinimalAltDirectionConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-alt-direction',
  title: 'Minimal Alt Direction',
  description: 'Alternating words enter from opposite sides — even from right, odd from left — creating a rhythmic back-and-forth horizontal swing',
  tags: ['kinetic', 'typography', 'minimal', 'alternating', 'direction', 'slide', 'rhythm', 'ping-pong'],
  category: 'captions',
  component: MinimalAltDirectionComponent as any,
  defaultConfig: {
    words: ['LEFT', 'RIGHT', 'BACK', 'FORTH'],
    colors: ['#111111', '#222222', '#111111', '#222222'],
    bgColor: '#F5F5F5',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LEFT', 'RIGHT', 'BACK', 'FORTH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#111111', '#222222', '#111111', '#222222'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5F5F5', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.4, max: 5, group: 'Timing' },
  ],
})
