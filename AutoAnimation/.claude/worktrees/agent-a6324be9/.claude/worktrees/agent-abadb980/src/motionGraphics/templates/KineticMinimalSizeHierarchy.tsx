import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalSizeHierarchyConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

// Size as the story — words cycle through radically different scales
const SCALES = [1.0, 0.3, 1.4, 0.2]
const COLORS_OVERRIDE = ['#111111', '#aaaaaa', '#111111', '#bbbbbb']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    const targetScale = SCALES[index % SCALES.length]
    const overrideColor = COLORS_OVERRIDE[index % COLORS_OVERRIDE.length]

    let scale = targetScale
    let opacity = 1

    if (phase === 'enter') {
      const e = easeOutExpo(enterProgress)
      // Each word scales up from 0 to its target size
      scale = e * targetScale
      opacity = Math.min(1, enterProgress * 3)
    } else if (phase === 'exit') {
      scale = targetScale * (1 - easeOutExpo(exitProgress) * 0.3)
      opacity = 1 - exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale.toFixed(4)})`,
          opacity,
          transformOrigin: 'center center',
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(36px, 9vw, 130px)',
          fontWeight: 300,
          letterSpacing: '0.06em',
          color: overrideColor || color,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function MinimalSizeHierarchyComponent(props: MotionGraphicProps<MinimalSizeHierarchyConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-size-hierarchy',
  title: 'Minimal Size Hierarchy',
  description: 'Words cycle through radically different scales — large, tiny, larger, tinier — size contrast as the composition language.',
  tags: ['kinetic', 'typography', 'minimal', 'size', 'hierarchy', 'scale', 'composition', 'contrast'],
  category: 'captions',
  component: MinimalSizeHierarchyComponent as any,
  defaultConfig: {
    words: ['LOUD', 'quiet', 'LOUDER', 'softer'],
    colors: ['#111111', '#aaaaaa', '#111111', '#bbbbbb'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LOUD', 'quiet', 'LOUDER', 'softer'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#111111', '#aaaaaa', '#111111', '#bbbbbb'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.4, max: 5, group: 'Timing' },
  ],
})
