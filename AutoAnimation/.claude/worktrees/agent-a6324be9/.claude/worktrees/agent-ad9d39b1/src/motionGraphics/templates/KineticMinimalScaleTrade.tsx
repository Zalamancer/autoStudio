import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalScaleTradeConfig extends KineticBaseConfig {}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return c3 * t * t * t - c1 * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 1
    let scale = 1

    if (phase === 'enter') {
      // New word comes in large and settles to 1 with slight overshoot
      const eased = easeOutBack(enterProgress)
      opacity = Math.min(1, enterProgress * 3)
      scale = 1.8 - eased * 0.8
    } else if (phase === 'exit') {
      // Word shrinks to nothing on exit — scale trade with incoming
      const eased = easeInBack(Math.min(exitProgress, 0.95))
      opacity = 1 - eased
      scale = 1 - eased * 0.6
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

function MinimalScaleTradeComponent(props: MotionGraphicProps<MinimalScaleTradeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-scale-trade',
  title: 'Minimal Scale Trade',
  description: 'Words enter large and land to normal scale, then shrink away — a pure scale exchange transition with back easing',
  tags: ['kinetic', 'typography', 'minimal', 'scale', 'trade', 'zoom', 'transition', 'overshoot'],
  category: 'captions',
  component: MinimalScaleTradeComponent as any,
  defaultConfig: {
    words: ['BIG', 'SMALL', 'ZOOM', 'FOCUS'],
    colors: ['#111111', '#222222', '#111111', '#333333'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BIG', 'SMALL', 'ZOOM', 'FOCUS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#111111', '#222222', '#111111', '#333333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.4, max: 5, group: 'Timing' },
  ],
})
