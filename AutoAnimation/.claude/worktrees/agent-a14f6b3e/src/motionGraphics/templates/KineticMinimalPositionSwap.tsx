import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalPositionSwapConfig extends KineticBaseConfig {}

function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, height }: WordRenderProps) => {
    // Words swap positions vertically: new word comes from below center, old exits above
    let opacity = 1
    let translateY = 0

    if (phase === 'enter') {
      const eased = easeInOutQuart(enterProgress)
      opacity = Math.min(1, enterProgress * 2)
      // Enters from below: 60% of height → 0
      translateY = (1 - eased) * height * 0.4
    } else if (phase === 'exit') {
      const eased = easeInOutQuart(exitProgress)
      opacity = 1 - Math.min(1, exitProgress * 2)
      // Exits upward: 0 → -40% of height
      translateY = -eased * height * 0.4
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY.toFixed(2)}px)`,
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

function MinimalPositionSwapComponent(props: MotionGraphicProps<MinimalPositionSwapConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-position-swap',
  title: 'Minimal Position Swap',
  description: 'Words flow in from below and exit upward — a vertical conveyor transition where each word smoothly replaces the last on the same axis',
  tags: ['kinetic', 'typography', 'minimal', 'vertical', 'swap', 'transition', 'conveyor', 'flow'],
  category: 'captions',
  component: MinimalPositionSwapComponent as any,
  defaultConfig: {
    words: ['ABOVE', 'BELOW', 'UP', 'DOWN'],
    colors: ['#1A1A1A', '#222222', '#1A1A1A', '#333333'],
    bgColor: '#F5F5F5',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ABOVE', 'BELOW', 'UP', 'DOWN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1A1A1A', '#222222', '#1A1A1A', '#333333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5F5F5', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.4, max: 5, group: 'Timing' },
  ],
})
