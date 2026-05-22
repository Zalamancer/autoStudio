import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PerfectScaleConfig extends KineticBaseConfig {}

/** Smooth ease-in-out-cubic — no overshoot, precisely hits 1.0 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let scale = 0

    if (phase === 'enter') {
      const eased = easeInOutCubic(enterProgress)
      opacity = eased
      scale = eased
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
    } else {
      const eased = easeInOutCubic(exitProgress)
      opacity = 1 - eased
      scale = 1 - eased
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          fontFamily: "'SF Pro Display', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(44px, 12vw, 160px)',
          fontWeight: 500,
          letterSpacing: 4,
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

function PerfectScaleComponent(props: MotionGraphicProps<PerfectScaleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-perfect-scale',
  title: 'Kinetic Perfect Scale',
  description: 'Text scales from 0 to exactly 1.0 with smooth ease-in-out-cubic — satisfyingly precise, no overshoot',
  tags: ['kinetic', 'typography', 'scale', 'precise', 'asmr', 'satisfying', 'clean'],
  category: 'captions',
  component: PerfectScaleComponent as any,
  defaultConfig: {
    words: ['PRECISE', 'EXACT', 'CLEAN', 'PURE'],
    colors: ['#F0F0F0', '#D0D0D0', '#E0E0E0', '#C8C8C8'],
    bgColor: '#0D0D1A',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PRECISE', 'EXACT', 'CLEAN', 'PURE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F0F0F0', '#D0D0D0', '#E0E0E0', '#C8C8C8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D0D1A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
