import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalMarginCollapseConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let scaleY = 1
    let translateY = 0
    let opacity = 1

    if (phase === 'enter') {
      // Collapses in from tall vertical space — scaleY grows from 0
      const e = easeOutExpo(enterProgress)
      scaleY = e
      translateY = (1 - e) * 30
      opacity = Math.min(1, enterProgress * 3)
    } else if (phase === 'exit') {
      // Collapses back down — vertical margin shrinks
      const e = easeOutExpo(exitProgress)
      scaleY = 1 - e * 0.8
      translateY = e * 20
      opacity = 1 - exitProgress * 1.2
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY.toFixed(2)}px)) scaleY(${scaleY.toFixed(4)})`,
          transformOrigin: 'center top',
          opacity: Math.max(0, opacity),
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

function MinimalMarginCollapseComponent(props: MotionGraphicProps<MinimalMarginCollapseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-margin-collapse',
  title: 'Minimal Margin Collapse',
  description: 'Text collapses vertically into existence — scaleY as a spacing metaphor, expanding from a flat line into full height.',
  tags: ['kinetic', 'typography', 'minimal', 'margin', 'scaleY', 'collapse', 'vertical', 'spacing'],
  category: 'captions',
  component: MinimalMarginCollapseComponent as any,
  defaultConfig: {
    words: ['FLAT', 'RISE', 'TALL', 'STAND'],
    colors: ['#111111', '#222222', '#333333', '#111111'],
    bgColor: '#FAFAFA',
    cycleDuration: 1.1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FLAT', 'RISE', 'TALL', 'STAND'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#111111', '#222222', '#333333', '#111111'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FAFAFA', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.1, min: 0.4, max: 5, group: 'Timing' },
  ],
})
