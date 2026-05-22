import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Content Format: Unpopular Opinion
// Muted purple/grey palette. Words enter split in two halves —
// top half drops from above, bottom half rises from below, meeting
// in the middle like a book closing on a controversial take.
// "UNPOPULAR OPINION:" caption appears above in small text.
// Exit: the two halves split apart again.

interface UnpopularOpinionConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor === '#1e1a2e'
          ? 'linear-gradient(180deg, #1e1a2e 0%, #2a1f3d 100%)'
          : bgColor,
      }}
    >
      {/* Horizontal center divider line — faint */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '5%',
          right: '5%',
          height: 1,
          background: 'rgba(180,140,255,0.1)',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // Top half and bottom half meet in middle
    const eased = phase === 'enter'
      ? 1 - Math.pow(1 - enterProgress, 3)
      : phase === 'hold'
        ? 1
        : 1 - Math.pow(exitProgress, 2)

    const topOffset = phase === 'hold' ? 0 : (1 - eased) * (phase === 'enter' ? -50 : -50)
    const bottomOffset = phase === 'hold' ? 0 : (1 - eased) * (phase === 'enter' ? 50 : 50)
    const opacity = phase === 'enter'
      ? Math.min(enterProgress / 0.2, 1)
      : phase === 'hold'
        ? 1
        : 1 - exitProgress

    const halfH = 'clamp(20px, 4.5vw, 65px)'

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {/* Caption */}
        <div
          style={{
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: 'clamp(9px, 2vw, 28px)',
            fontWeight: 400,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: 'rgba(200,160,255,0.5)',
            whiteSpace: 'nowrap',
            marginBottom: 4,
          }}
        >
          unpopular opinion:
        </div>

        {/* Word split — top half */}
        <div
          style={{
            overflow: 'hidden',
            height: halfH,
            transform: `translateY(${topOffset}px)`,
          }}
        >
          <div
            style={{
              fontFamily: "'Helvetica Neue', 'Arial Black', sans-serif",
              fontSize: 'clamp(36px, 9vw, 130px)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: 2,
              whiteSpace: 'nowrap',
              color,
              lineHeight: 0.9,
            }}
          >
            {word}
          </div>
        </div>

        {/* Word split — bottom half */}
        <div
          style={{
            overflow: 'hidden',
            height: halfH,
            transform: `translateY(${bottomOffset}px)`,
          }}
        >
          <div
            style={{
              fontFamily: "'Helvetica Neue', 'Arial Black', sans-serif",
              fontSize: 'clamp(36px, 9vw, 130px)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: 2,
              whiteSpace: 'nowrap',
              color,
              lineHeight: 0.9,
              marginTop: `calc(-1 * clamp(36px, 9vw, 130px) * 0.9)`,
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function UnpopularOpinionComponent(props: MotionGraphicProps<UnpopularOpinionConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-unpopular-opinion',
  title: 'Kinetic Unpopular Opinion',
  description: 'TikTok unpopular opinion format — word halves meet from top/bottom like a controversial book closing, muted purple aesthetic',
  tags: ['kinetic', 'typography', 'unpopular', 'opinion', 'tiktok', 'split', 'content-format'],
  category: 'captions',
  component: UnpopularOpinionComponent as any,
  defaultConfig: {
    words: ['PINEAPPLE', 'BELONGS', 'ON PIZZA', 'PERIOD'],
    colors: ['#c8a0ff', '#a080e0', '#c8a0ff', '#e0c0ff'],
    bgColor: '#1e1a2e',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PINEAPPLE', 'BELONGS', 'ON PIZZA', 'PERIOD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#c8a0ff', '#a080e0', '#c8a0ff', '#e0c0ff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1e1a2e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.5, max: 5, group: 'Timing' },
  ],
})
