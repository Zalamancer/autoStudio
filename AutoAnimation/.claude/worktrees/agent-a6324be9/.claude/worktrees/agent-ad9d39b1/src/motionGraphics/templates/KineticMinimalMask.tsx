import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalMaskConfig extends KineticBaseConfig {}

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

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // Enter: clip-path inset reveals left-to-right
    // Hold: fully visible
    // Exit: clip-path inset hides right-to-left

    let clipRight = 0 // percentage clipped from right (100 = fully hidden)

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      clipRight = 100 - eased * 100
    } else if (phase === 'hold') {
      clipRight = 0
    } else {
      const eased = easeInCubic(exitProgress)
      clipRight = eased * 100
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(36px, 8vw, 120px)',
          fontWeight: 300,
          color,
          whiteSpace: 'nowrap',
          letterSpacing: '0.03em',
          clipPath: `inset(0 ${clipRight}% 0 0)`,
        }}
      >
        {word}
      </div>
    )
  },
}

function MinimalMaskComponent(props: MotionGraphicProps<MinimalMaskConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-mask',
  title: 'Kinetic Minimal Mask',
  description: 'Text clips in from behind a rectangle mask with smooth left-to-right reveal using clip-path inset',
  tags: ['kinetic', 'typography', 'minimal', 'clean', 'mask', 'clip', 'reveal'],
  category: 'captions',
  component: MinimalMaskComponent as any,
  defaultConfig: {
    words: ['Mask', 'Reveal', 'Clean'],
    colors: ['#1A1A1A', '#1A1A1A', '#1A1A1A'],
    bgColor: '#FFFFFF',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['Mask', 'Reveal', 'Clean'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1A1A1A', '#1A1A1A', '#1A1A1A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
