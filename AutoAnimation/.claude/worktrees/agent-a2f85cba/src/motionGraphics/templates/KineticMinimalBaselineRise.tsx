import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalBaselineRiseConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 1
    // verticalAlign offset: text slides up into baseline from below
    let translateY = 0
    let clipBottom = '0%'

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      opacity = eased
      translateY = (1 - eased) * 32
      clipBottom = `${((1 - eased) * 100).toFixed(1)}%`
    } else if (phase === 'exit') {
      const eased = easeInCubic(exitProgress)
      opacity = 1 - eased
      translateY = -eased * 20
    }

    void holdProgress

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY.toFixed(2)}px)`,
          opacity,
          overflow: 'hidden',
          paddingBottom: clipBottom,
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(36px, 8vw, 120px)',
            fontWeight: 300,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function MinimalBaselineRiseComponent(props: MotionGraphicProps<MinimalBaselineRiseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-baseline-rise',
  title: 'Minimal Baseline Rise',
  description: 'Text rises up from its baseline with a clipping reveal — the word slides up into view like type being set on a compositor',
  tags: ['kinetic', 'typography', 'minimal', 'baseline', 'rise', 'clip', 'reveal', 'editorial'],
  category: 'captions',
  component: MinimalBaselineRiseComponent as any,
  defaultConfig: {
    words: ['RISE', 'LIFT', 'ASCEND', 'FLOAT'],
    colors: ['#111111', '#222222', '#111111', '#222222'],
    bgColor: '#F8F8F8',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RISE', 'LIFT', 'ASCEND', 'FLOAT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#111111', '#222222', '#111111', '#222222'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F8F8F8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.4, max: 5, group: 'Timing' },
  ],
})
