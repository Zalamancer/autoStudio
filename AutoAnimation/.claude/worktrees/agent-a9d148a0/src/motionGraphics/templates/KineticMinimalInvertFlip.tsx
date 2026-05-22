import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalInvertFlipConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let invert = 0
    let opacity = 1

    if (phase === 'enter') {
      // Binary flick: starts fully inverted, snaps to normal at the halfway point
      invert = enterProgress < 0.5 ? 1 : 0
      opacity = Math.min(1, enterProgress * 2)
    } else if (phase === 'exit') {
      // Snaps inverted right before disappearing
      invert = exitProgress > 0.6 ? 1 : 0
      opacity = 1 - exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          filter: invert > 0 ? 'invert(1)' : 'none',
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

function MinimalInvertFlipComponent(props: MotionGraphicProps<MinimalInvertFlipConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-invert-flip',
  title: 'Minimal Invert Flip',
  description: 'A binary invert snap — text flicks from inverted to normal colours at the midpoint of entry, like a negative flipping to positive.',
  tags: ['kinetic', 'typography', 'minimal', 'invert', 'filter', 'binary', 'flip', 'negative'],
  category: 'captions',
  component: MinimalInvertFlipComponent as any,
  defaultConfig: {
    words: ['FLIP', 'INVERT', 'NEGATIVE', 'POSITIVE'],
    colors: ['#111111', '#222222', '#111111', '#333333'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FLIP', 'INVERT', 'NEGATIVE', 'POSITIVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#111111', '#222222', '#111111', '#333333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.0, min: 0.4, max: 5, group: 'Timing' },
  ],
})
