import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FlipBoardConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let scaleY = 1
    let opacity = 1

    if (phase === 'enter') {
      scaleY = enterProgress
      opacity = enterProgress > 0.1 ? 1 : enterProgress / 0.1
    } else if (phase === 'hold') {
      scaleY = 1
      opacity = 1
    } else {
      scaleY = 1 - exitProgress
      opacity = exitProgress < 0.9 ? 1 : (1 - exitProgress) / 0.1
    }

    const letters = word.split('')

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scaleY(${scaleY})`,
          opacity,
          display: 'flex',
          gap: 4,
          perspective: 600,
          whiteSpace: 'nowrap',
        }}
      >
        {letters.map((letter, i) => (
          <div
            key={i}
            style={{
              fontFamily: "'Courier New', 'Consolas', monospace",
              fontSize: 'clamp(36px, 10vw, 140px)',
              fontWeight: 600,
              textTransform: 'uppercase',
              color,
              background: '#333333',
              padding: '4px 8px',
              borderRadius: 3,
              lineHeight: 1.1,
              boxShadow: '0 2px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              borderBottom: '1px solid rgba(0,0,0,0.3)',
            }}
          >
            {letter}
          </div>
        ))}
      </div>
    )
  },
}

function FlipBoardComponent(props: MotionGraphicProps<FlipBoardConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-flip-board',
  title: 'Kinetic Flip Board',
  description: 'Airport departure board flip effect with per-letter dark background cards',
  tags: ['kinetic', 'typography', 'flip', 'airport', 'retro'],
  category: 'captions',
  component: FlipBoardComponent as any,
  defaultConfig: {
    words: ['GATE', 'A12', 'NOW', 'BOARDING'],
    colors: ['#FFD700', '#FFFFFF', '#00FF88', '#FF6600'],
    bgColor: '#1a1a1a',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GATE', 'A12', 'NOW', 'BOARDING'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD700', '#FFFFFF', '#00FF88', '#FF6600'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
