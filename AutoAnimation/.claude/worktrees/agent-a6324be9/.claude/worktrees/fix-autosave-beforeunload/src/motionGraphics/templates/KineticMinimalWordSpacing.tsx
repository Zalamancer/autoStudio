import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalWordSpacingConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let letterSpacing = '0.05em'
    let opacity = 1

    if (phase === 'enter') {
      // Explodes in from compressed — letter-spacing races from -0.3em to 0.05em
      const e = easeOutCubic(enterProgress)
      const spacing = -0.3 + e * 0.35
      letterSpacing = `${spacing.toFixed(4)}em`
      opacity = Math.min(1, enterProgress * 2)
    } else if (phase === 'exit') {
      // Continues expanding outward until the letters are too far apart to read
      const e = easeOutCubic(exitProgress)
      const spacing = 0.05 + e * 0.8
      letterSpacing = `${spacing.toFixed(4)}em`
      opacity = 1 - exitProgress
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
          letterSpacing,
          color,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function MinimalWordSpacingComponent(props: MotionGraphicProps<MinimalWordSpacingConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-word-spacing',
  title: 'Minimal Word Spacing',
  description: 'Letter-spacing as the animation — text compresses to tight then explodes wide, spacing is the entire mechanic.',
  tags: ['kinetic', 'typography', 'minimal', 'spacing', 'letter-spacing', 'explode', 'tracking'],
  category: 'captions',
  component: MinimalWordSpacingComponent as any,
  defaultConfig: {
    words: ['S P A C E', 'W I D E', 'O P E N', 'A I R'],
    colors: ['#111111', '#222222', '#333333', '#111111'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['S P A C E', 'W I D E', 'O P E N', 'A I R'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#111111', '#222222', '#333333', '#111111'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.5, max: 5, group: 'Timing' },
  ],
})
