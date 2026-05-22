import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SmoothSlideConfig extends KineticBaseConfig {}

/** Cubic ease-in-out — perfectly smooth, no overshoot */
function cubicInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width }: WordRenderProps) => {
    let opacity = 0
    let translateX = 0

    if (phase === 'enter') {
      const eased = cubicInOut(enterProgress)
      opacity = eased
      translateX = (1 - eased) * width * 0.6
    } else if (phase === 'hold') {
      opacity = 1
      translateX = 0
    } else {
      const eased = cubicInOut(exitProgress)
      opacity = 1 - eased
      translateX = -eased * width * 0.6
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${translateX}px)`,
          opacity,
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(42px, 12vw, 160px)',
          fontWeight: 300,
          letterSpacing: 6,
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

function SmoothSlideComponent(props: MotionGraphicProps<SmoothSlideConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-smooth-slide',
  title: 'Kinetic Smooth Slide',
  description: 'Ultra-smooth horizontal slide with perfectly cubic easing — pure satisfying motion, no bounce or overshoot',
  tags: ['kinetic', 'typography', 'smooth', 'slide', 'asmr', 'satisfying', 'minimal'],
  category: 'captions',
  component: SmoothSlideComponent as any,
  defaultConfig: {
    words: ['SMOOTH', 'GLIDE', 'FLOW', 'EASE'],
    colors: ['#E8E8E8', '#C0C0C0', '#A8A8A8', '#D4D4D4'],
    bgColor: '#1A1A2E',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SMOOTH', 'GLIDE', 'FLOW', 'EASE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8E8E8', '#C0C0C0', '#A8A8A8', '#D4D4D4'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
