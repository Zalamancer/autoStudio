import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalVerticalStackConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// Each word sits at a different vertical position — they form a stacked column
const VERTICAL_POSITIONS = ['-22%', '-7%', '7%', '22%']
const ENTER_DELAYS = [0, 0.05, 0.1, 0.15] // staggered slightly

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    const vPos = VERTICAL_POSITIONS[index % VERTICAL_POSITIONS.length]
    // Sizes decrease from top to bottom — visual weight hierarchy
    const fontSize = `clamp(${20 - index * 3}px, ${7 - index * 1}vw, ${100 - index * 15}px)`
    let translateX = 0
    let opacity = 1

    if (phase === 'enter') {
      const delayed = Math.max(0, enterProgress - ENTER_DELAYS[index % 4])
      const e = easeOutCubic(Math.min(1, delayed / (1 - ENTER_DELAYS[index % 4])))
      translateX = (1 - e) * -50
      opacity = Math.min(1, e * 3)
    } else if (phase === 'exit') {
      translateX = easeOutCubic(exitProgress) * 50
      opacity = 1 - exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: `calc(50% + ${vPos})`,
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${translateX.toFixed(2)}px)`,
          opacity,
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize,
          fontWeight: 300,
          letterSpacing: '0.06em',
          color,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function MinimalVerticalStackComponent(props: MotionGraphicProps<MinimalVerticalStackConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-vertical-stack',
  title: 'Minimal Vertical Stack',
  description: 'Four words stack vertically at decreasing sizes — a typographic column that slides in staggered from the left, composition as animation.',
  tags: ['kinetic', 'typography', 'minimal', 'vertical', 'stack', 'composition', 'hierarchy', 'column'],
  category: 'captions',
  component: MinimalVerticalStackComponent as any,
  defaultConfig: {
    words: ['HEADLINE', 'subtitle', 'detail', 'note'],
    colors: ['#111111', '#333333', '#666666', '#999999'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HEADLINE', 'subtitle', 'detail', 'note'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#111111', '#333333', '#666666', '#999999'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.8, max: 6, group: 'Timing' },
  ],
})
