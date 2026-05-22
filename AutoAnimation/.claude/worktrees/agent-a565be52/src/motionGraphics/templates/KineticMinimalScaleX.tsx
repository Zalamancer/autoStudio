import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalScaleXConfig extends KineticBaseConfig {}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let scaleX = 1
    let opacity = 1

    if (phase === 'enter') {
      const e = easeOutQuart(enterProgress)
      scaleX = e
      opacity = Math.min(1, enterProgress * 3)
    } else if (phase === 'exit') {
      // Collapses back to zero width — satisfying mirror of enter
      scaleX = 1 - easeOutQuart(exitProgress)
      opacity = 1 - exitProgress * 0.6
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scaleX(${scaleX.toFixed(4)})`,
          opacity,
          transformOrigin: 'center center',
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

function MinimalScaleXComponent(props: MotionGraphicProps<MinimalScaleXConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-scalex',
  title: 'Minimal Scale X',
  description: 'Text expands horizontally from zero width — single scaleX transform as the sole animation mechanic.',
  tags: ['kinetic', 'typography', 'minimal', 'scaleX', 'transform', 'horizontal', 'expand'],
  category: 'captions',
  component: MinimalScaleXComponent as any,
  defaultConfig: {
    words: ['WIDE', 'OPEN', 'EXPAND', 'FLAT'],
    colors: ['#111111', '#222222', '#111111', '#333333'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WIDE', 'OPEN', 'EXPAND', 'FLAT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#111111', '#222222', '#111111', '#333333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.1, min: 0.4, max: 5, group: 'Timing' },
  ],
})
