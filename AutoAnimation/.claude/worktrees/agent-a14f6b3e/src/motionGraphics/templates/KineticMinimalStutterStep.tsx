import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalStutterStepConfig extends KineticBaseConfig {}

function stutter(t: number, steps: number): number {
  // Steps function — quantises smooth progress into discrete jumps
  return Math.floor(t * steps) / steps
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let translateY = 0
    let opacity = 1

    if (phase === 'enter') {
      // Drops in via 6 discrete steps — staircase of arrival
      const stepped = stutter(enterProgress, 6)
      translateY = (1 - stepped) * -40
      opacity = stepped > 0 ? 1 : 0
    } else if (phase === 'exit') {
      // Steps out in 4 larger jumps downward
      const stepped = stutter(exitProgress, 4)
      translateY = stepped * 35
      opacity = 1 - stepped
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY.toFixed(2)}px))`,
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

function MinimalStutterStepComponent(props: MotionGraphicProps<MinimalStutterStepConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-stutter-step',
  title: 'Minimal Stutter Step',
  description: 'Words arrive in quantised staircase steps — no easing, just discrete jumps. The stutter rhythm is the entire effect.',
  tags: ['kinetic', 'typography', 'minimal', 'stutter', 'step', 'quantise', 'timing', 'rhythm', 'discrete'],
  category: 'captions',
  component: MinimalStutterStepComponent as any,
  defaultConfig: {
    words: ['STEP', 'JUMP', 'SKIP', 'SNAP'],
    colors: ['#111111', '#222222', '#333333', '#111111'],
    bgColor: '#FAFAFA',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['STEP', 'JUMP', 'SKIP', 'SNAP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#111111', '#222222', '#333333', '#111111'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FAFAFA', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.4, max: 5, group: 'Timing' },
  ],
})
