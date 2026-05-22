import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalAlignShiftConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// Each word takes a different anchor position — left / center / right / center
const ANCHORS = ['flex-start', 'center', 'flex-end', 'center']
const ANCHOR_OFFSETS = [-1, 0, 1, 0] // -1 = left, 0 = center, 1 = right

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    const anchorIdx = index % ANCHORS.length
    const offsetDir = ANCHOR_OFFSETS[anchorIdx]
    // Enter from opposite side of its anchor
    const enterOffsetX = -(offsetDir === 0 ? 0 : offsetDir) * 60

    let translateX = 0
    let opacity = 1

    if (phase === 'enter') {
      const e = easeOutCubic(enterProgress)
      translateX = enterOffsetX * (1 - e)
      opacity = Math.min(1, enterProgress * 2.5)
    } else if (phase === 'exit') {
      translateX = offsetDir * 50 * easeOutCubic(exitProgress)
      opacity = 1 - exitProgress
    }

    const justifyContent = ANCHORS[anchorIdx]

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          transform: `translateY(-50%) translateX(${translateX.toFixed(2)}px)`,
          display: 'flex',
          justifyContent,
          paddingLeft: '10%',
          paddingRight: '10%',
          opacity,
        }}
      >
        <span
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(36px, 8vw, 120px)',
            fontWeight: 300,
            letterSpacing: '0.05em',
            color,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </span>
      </div>
    )
  },
}

function MinimalAlignShiftComponent(props: MotionGraphicProps<MinimalAlignShiftConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-align-shift',
  title: 'Minimal Align Shift',
  description: 'Each word anchors to a different alignment — left, center, right — sliding from its origin, making text-align the visual rhythm.',
  tags: ['kinetic', 'typography', 'minimal', 'alignment', 'layout', 'spacing', 'left', 'right', 'center'],
  category: 'captions',
  component: MinimalAlignShiftComponent as any,
  defaultConfig: {
    words: ['LEFT', 'CENTER', 'RIGHT', 'BACK'],
    colors: ['#111111', '#333333', '#111111', '#333333'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LEFT', 'CENTER', 'RIGHT', 'BACK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#111111', '#333333', '#111111', '#333333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.4, max: 5, group: 'Timing' },
  ],
})
