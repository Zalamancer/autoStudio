import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalCenterCornerConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// Words alternate between centre and corner destinations
const POSITIONS = [
  { tx: 0, ty: 0, scale: 1.0, anchor: 'center' },          // center
  { tx: 32, ty: -28, scale: 0.55, anchor: 'top-right' },   // top-right corner small
  { tx: 0, ty: 0, scale: 1.0, anchor: 'center' },          // center
  { tx: -32, ty: 28, scale: 0.55, anchor: 'bottom-left' }, // bottom-left corner small
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    const pos = POSITIONS[index % POSITIONS.length]
    let opacity = 1

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 2.5)
    } else if (phase === 'exit') {
      opacity = 1 - easeOutCubic(exitProgress)
    }

    const pct = `${pos.tx}%`
    const pct2 = `${pos.ty}%`

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${pct}), calc(-50% + ${pct2})) scale(${pos.scale})`,
          opacity,
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(36px, 8vw, 120px)',
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

function MinimalCenterCornerComponent(props: MotionGraphicProps<MinimalCenterCornerConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-center-corner',
  title: 'Minimal Center Corner',
  description: 'Words alternate between centred full-size and small corner placements — layout position as the rhythm, composition as the animation.',
  tags: ['kinetic', 'typography', 'minimal', 'composition', 'layout', 'center', 'corner', 'hierarchy'],
  category: 'captions',
  component: MinimalCenterCornerComponent as any,
  defaultConfig: {
    words: ['BIG', 'small', 'BOLD', 'quiet'],
    colors: ['#111111', '#888888', '#111111', '#888888'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BIG', 'small', 'BOLD', 'quiet'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#111111', '#888888', '#111111', '#888888'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.5, max: 5, group: 'Timing' },
  ],
})
