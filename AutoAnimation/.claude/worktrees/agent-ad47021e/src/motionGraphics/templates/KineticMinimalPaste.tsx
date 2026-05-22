import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0

    if (phase === 'enter') {
      // Clean slide from bottom with ease
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      opacity = eased
      translateY = (1 - eased) * 40
    } else if (phase === 'hold') {
      opacity = 1
      translateY = 0
    } else {
      // Slide up and away
      const eased = exitProgress * exitProgress
      opacity = 1 - eased
      translateY = -eased * 50
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px)`,
          opacity,
          fontFamily: "'Helvetica Neue', 'Segoe UI', Arial, sans-serif",
          fontSize: 'clamp(36px, 10vw, 140px)',
          fontWeight: 200,
          letterSpacing: 12,
          color,
          textTransform: 'lowercase',
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function MinimalPasteComponent(props: MotionGraphicProps<KineticBaseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-paste',
  title: 'Kinetic Minimal Paste',
  description: 'Minimal editorial paste-up with clean slide transitions, light sans-serif, and wide tracking',
  tags: ['kinetic', 'typography', 'minimal', 'editorial', 'clean', 'modern'],
  category: 'captions',
  component: MinimalPasteComponent as any,
  defaultConfig: {
    words: ['less', 'is', 'more', 'always'],
    colors: ['#1a1a1a', '#666666', '#333333', '#1a1a1a'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['less', 'is', 'more', 'always'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#666666', '#333333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
