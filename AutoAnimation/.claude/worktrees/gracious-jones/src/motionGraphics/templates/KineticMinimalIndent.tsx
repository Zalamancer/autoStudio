import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalIndentConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    // Each word indents by a different amount based on its index — creates visual hierarchy
    const baseIndent = (index % 4) * 18
    let translateX = 0
    let opacity = 1

    if (phase === 'enter') {
      const e = easeOutCubic(enterProgress)
      // Slides in from the left side of its indent position
      translateX = -(1 - e) * 80 + baseIndent
      opacity = Math.min(1, enterProgress * 2.5)
    } else if (phase === 'hold') {
      translateX = baseIndent
    } else {
      translateX = baseIndent + exitProgress * 60
      opacity = 1 - exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX.toFixed(2)}px), -50%)`,
          opacity,
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(36px, 8vw, 120px)',
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

function MinimalIndentComponent(props: MotionGraphicProps<MinimalIndentConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-indent',
  title: 'Minimal Indent',
  description: 'Each word slides to a progressively indented position — margin as the animation mechanic, creating visual rhythm through offset.',
  tags: ['kinetic', 'typography', 'minimal', 'indent', 'margin', 'offset', 'hierarchy', 'spacing'],
  category: 'captions',
  component: MinimalIndentComponent as any,
  defaultConfig: {
    words: ['FIRST', 'SECOND', 'THIRD', 'FOURTH'],
    colors: ['#111111', '#333333', '#555555', '#777777'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FIRST', 'SECOND', 'THIRD', 'FOURTH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#111111', '#333333', '#555555', '#777777'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.4, max: 5, group: 'Timing' },
  ],
})
