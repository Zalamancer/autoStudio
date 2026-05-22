import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalContrastPunchConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let contrast = 1
    let brightness = 1
    let opacity = 1

    if (phase === 'enter') {
      const e = easeOutCubic(enterProgress)
      // Punches in from over-exposed (high brightness, low contrast) to normal
      brightness = 1 + (1 - e) * 3
      contrast = e
      opacity = Math.min(1, enterProgress * 2)
    } else if (phase === 'exit') {
      // Fades out with rising contrast — hyper-sharp then gone
      contrast = 1 + exitProgress * 4
      brightness = 1 - exitProgress * 0.5
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
          filter: `contrast(${contrast.toFixed(3)}) brightness(${brightness.toFixed(3)})`,
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

function MinimalContrastPunchComponent(props: MotionGraphicProps<MinimalContrastPunchConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-contrast-punch',
  title: 'Minimal Contrast Punch',
  description: 'Text materialises from an over-exposed flash via CSS contrast/brightness — single filter mechanic, camera-flash energy.',
  tags: ['kinetic', 'typography', 'minimal', 'contrast', 'brightness', 'filter', 'punch', 'flash'],
  category: 'captions',
  component: MinimalContrastPunchComponent as any,
  defaultConfig: {
    words: ['BOLD', 'PUNCH', 'SHARP', 'HIT'],
    colors: ['#111111', '#222222', '#111111', '#333333'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BOLD', 'PUNCH', 'SHARP', 'HIT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#111111', '#222222', '#111111', '#333333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.1, min: 0.4, max: 5, group: 'Timing' },
  ],
})
