import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalCrossfadeConfig extends KineticBaseConfig {}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // Pure opacity crossfade — incoming word fades in while outgoing fades out
    // overlapping at their transition boundaries for a true dissolve feel
    let opacity = 1
    let scale = 1

    if (phase === 'enter') {
      const eased = easeInOutSine(enterProgress)
      opacity = eased
      // Very subtle scale: 0.98 → 1.00 so it feels like it crystallises
      scale = 0.98 + eased * 0.02
    } else if (phase === 'exit') {
      const eased = easeInOutSine(exitProgress)
      opacity = 1 - eased
      scale = 1 + eased * 0.02
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale.toFixed(4)})`,
          opacity,
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(36px, 8vw, 120px)',
          fontWeight: 300,
          letterSpacing: '0.08em',
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

function MinimalCrossfadeComponent(props: MotionGraphicProps<MinimalCrossfadeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-crossfade',
  title: 'Minimal Crossfade',
  description: 'Silky sine-curve opacity dissolve between words with a hairline scale — the cleanest possible word transition, nothing else',
  tags: ['kinetic', 'typography', 'minimal', 'crossfade', 'dissolve', 'fade', 'transition', 'clean'],
  category: 'captions',
  component: MinimalCrossfadeComponent as any,
  defaultConfig: {
    words: ['DISSOLVE', 'MELT', 'BLEND', 'MERGE'],
    colors: ['#1A1A1A', '#2A2A2A', '#1A1A1A', '#333333'],
    bgColor: '#FAFAFA',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DISSOLVE', 'MELT', 'BLEND', 'MERGE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1A1A1A', '#2A2A2A', '#1A1A1A', '#333333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FAFAFA', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 6, group: 'Timing' },
  ],
})
