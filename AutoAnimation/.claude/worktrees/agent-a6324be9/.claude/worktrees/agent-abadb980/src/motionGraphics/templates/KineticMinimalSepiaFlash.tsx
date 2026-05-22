import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalSepiaFlashConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let sepia = 0
    let opacity = 1

    if (phase === 'enter') {
      // Enters fully sepia-toned, rapidly burns off to full colour
      const e = easeOutExpo(enterProgress)
      sepia = 1 - e
      opacity = Math.min(1, enterProgress * 3)
    } else if (phase === 'hold') {
      // Stays clean — subtle sepia recall at end of hold
      sepia = Math.max(0, (holdProgress - 0.8) / 0.2) * 0.15
    } else {
      // Sepia returns as it fades
      sepia = exitProgress * 0.7
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
          filter: sepia > 0.001 ? `sepia(${sepia.toFixed(4)})` : 'none',
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

function MinimalSepiaFlashComponent(props: MotionGraphicProps<MinimalSepiaFlashConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-sepia-flash',
  title: 'Minimal Sepia Flash',
  description: 'Words arrive sepia-toned and rapidly burn to full colour — single CSS sepia filter, nostalgic-to-present energy.',
  tags: ['kinetic', 'typography', 'minimal', 'sepia', 'filter', 'vintage', 'flash', 'color'],
  category: 'captions',
  component: MinimalSepiaFlashComponent as any,
  defaultConfig: {
    words: ['THEN', 'NOW', 'PAST', 'PRESENT'],
    colors: ['#1a1a1a', '#333333', '#222222', '#111111'],
    bgColor: '#FAFAFA',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['THEN', 'NOW', 'PAST', 'PRESENT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#333333', '#222222', '#111111'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FAFAFA', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.5, max: 5, group: 'Timing' },
  ],
})
