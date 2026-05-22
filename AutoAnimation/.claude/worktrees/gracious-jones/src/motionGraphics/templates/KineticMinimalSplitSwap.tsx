import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalSplitSwapConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    // Alternates: even words come from left half, odd from right half
    const side = index % 2 === 0 ? -1 : 1
    let translateX = 0
    let opacity = 1

    if (phase === 'enter') {
      const e = easeOutCubic(enterProgress)
      // Slides in from its half of the screen
      translateX = side * (1 - e) * 45
      opacity = Math.min(1, enterProgress * 2.5)
    } else if (phase === 'exit') {
      // Departs to the opposite side — swap
      translateX = -side * easeOutCubic(exitProgress) * 45
      opacity = 1 - exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: side === -1 ? '25%' : '75%',
          transform: `translate(-50%, -50%) translateX(${translateX.toFixed(2)}px)`,
          opacity,
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(28px, 6vw, 90px)',
          fontWeight: 300,
          letterSpacing: '0.05em',
          color,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function MinimalSplitSwapComponent(props: MotionGraphicProps<MinimalSplitSwapConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-split-swap',
  title: 'Minimal Split Swap',
  description: 'Words alternate between left and right halves of the screen, each sliding in from its side — layout as the choreography.',
  tags: ['kinetic', 'typography', 'minimal', 'split', 'swap', 'composition', 'layout', 'halves'],
  category: 'captions',
  component: MinimalSplitSwapComponent as any,
  defaultConfig: {
    words: ['LEFT', 'RIGHT', 'HERE', 'THERE'],
    colors: ['#111111', '#555555', '#111111', '#555555'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LEFT', 'RIGHT', 'HERE', 'THERE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#111111', '#555555', '#111111', '#555555'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.4, max: 5, group: 'Timing' },
  ],
})
