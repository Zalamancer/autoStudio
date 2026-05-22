import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalInstantCutConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // Binary: fully on or fully off. No easing. Hard cut — the timing IS the effect.
    let opacity: number

    if (phase === 'enter') {
      opacity = enterProgress > 0 ? 1 : 0
    } else if (phase === 'exit') {
      opacity = exitProgress > 0 ? 0 : 1
    } else {
      opacity = 1
    }

    // Single-frame flicker at entry moment — adds texture to the hard cut
    if (phase === 'enter' && enterProgress < 0.04) {
      opacity = Math.random() > 0.5 ? 1 : 0
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

function MinimalInstantCutComponent(props: MotionGraphicProps<MinimalInstantCutConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-instant-cut',
  title: 'Minimal Instant Cut',
  description: 'Zero easing — words appear and disappear on a hard binary cut with a single-frame flicker. Timing is the entire aesthetic.',
  tags: ['kinetic', 'typography', 'minimal', 'cut', 'instant', 'timing', 'binary', 'flash'],
  category: 'captions',
  component: MinimalInstantCutComponent as any,
  defaultConfig: {
    words: ['NOW', 'THEN', 'HERE', 'GONE'],
    colors: ['#111111', '#222222', '#111111', '#333333'],
    bgColor: '#FFFFFF',
    cycleDuration: 0.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['NOW', 'THEN', 'HERE', 'GONE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#111111', '#222222', '#111111', '#333333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 0.8, min: 0.3, max: 5, group: 'Timing' },
  ],
})
