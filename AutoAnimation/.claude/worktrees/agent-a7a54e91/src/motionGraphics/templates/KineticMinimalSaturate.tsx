import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalSaturateConfig extends KineticBaseConfig {}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let saturate = 1
    let opacity = 1

    if (phase === 'enter') {
      // Desaturated (grey) → full color
      const e = easeInOutCubic(enterProgress)
      saturate = e
      opacity = Math.min(1, enterProgress * 2.5)
    } else if (phase === 'hold') {
      // Breathes: slightly over-saturated at midpoint
      saturate = 1 + Math.sin(holdProgress * Math.PI) * 0.4
    } else {
      // Bleaches back to grey on exit
      saturate = 1 - exitProgress
      opacity = 1 - exitProgress * 0.8
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          filter: `saturate(${saturate.toFixed(4)})`,
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

function MinimalSaturateComponent(props: MotionGraphicProps<MinimalSaturateConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-saturate',
  title: 'Minimal Saturate',
  description: 'Words bloom from grey to full colour via CSS saturate — single filter, colour as the storytelling mechanic.',
  tags: ['kinetic', 'typography', 'minimal', 'saturate', 'desaturate', 'color', 'filter', 'bloom'],
  category: 'captions',
  component: MinimalSaturateComponent as any,
  defaultConfig: {
    words: ['VIVID', 'COLOR', 'BLOOM', 'RICH'],
    colors: ['#e63946', '#457b9d', '#2a9d8f', '#e76f51'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['VIVID', 'COLOR', 'BLOOM', 'RICH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#e63946', '#457b9d', '#2a9d8f', '#e76f51'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
