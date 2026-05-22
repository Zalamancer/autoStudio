import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalWeightShiftConfig extends KineticBaseConfig {}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 1
    // fontWeight transitions from ultra-thin 100 → bold 700 on enter, back to thin on exit
    let fontWeight = 300

    if (phase === 'enter') {
      const eased = easeInOutCubic(enterProgress)
      opacity = Math.min(1, enterProgress * 2)
      // 100 (thin) → 700 (bold), settle at 300
      fontWeight = 100 + eased * 200
    } else if (phase === 'hold') {
      opacity = 1
      fontWeight = 300
      void holdProgress
    } else {
      const eased = easeInOutCubic(exitProgress)
      opacity = 1 - eased
      // 300 → 700 as it exits (gets heavier before disappearing)
      fontWeight = 300 + eased * 400
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(36px, 8vw, 120px)',
          fontWeight: Math.round(fontWeight),
          letterSpacing: '0.06em',
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

function MinimalWeightShiftComponent(props: MotionGraphicProps<MinimalWeightShiftConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-weight-shift',
  title: 'Minimal Weight Shift',
  description: 'Font weight transitions from hairline thin to normal on enter, then surges bold before vanishing — a single variable-font axis in motion',
  tags: ['kinetic', 'typography', 'minimal', 'font-weight', 'variable', 'bold', 'thin', 'clean'],
  category: 'captions',
  component: MinimalWeightShiftComponent as any,
  defaultConfig: {
    words: ['LIGHT', 'BOLD', 'WEIGHT', 'HEAVY'],
    colors: ['#1A1A1A', '#111111', '#1A1A1A', '#222222'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LIGHT', 'BOLD', 'WEIGHT', 'HEAVY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1A1A1A', '#111111', '#1A1A1A', '#222222'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 6, group: 'Timing' },
  ],
})
