import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalDiagonalConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let tx = 0
    let ty = 0
    let opacity = 1

    if (phase === 'enter') {
      const e = easeOutCubic(enterProgress)
      // Arrives from bottom-left corner diagonally
      tx = (1 - e) * -60
      ty = (1 - e) * 60
      opacity = Math.min(1, enterProgress * 2)
    } else if (phase === 'exit') {
      // Departs to top-right corner diagonally
      const e = easeOutCubic(exitProgress)
      tx = e * 60
      ty = e * -60
      opacity = 1 - exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${tx.toFixed(2)}px), calc(-50% + ${ty.toFixed(2)}px))`,
          opacity,
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

function MinimalDiagonalComponent(props: MotionGraphicProps<MinimalDiagonalConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-diagonal',
  title: 'Minimal Diagonal',
  description: 'Words travel diagonally — enter from bottom-left, exit to top-right — a single translate on both axes creating effortless directional flow.',
  tags: ['kinetic', 'typography', 'minimal', 'diagonal', 'translate', 'transform', 'direction'],
  category: 'captions',
  component: MinimalDiagonalComponent as any,
  defaultConfig: {
    words: ['DRIFT', 'FLOW', 'GLIDE', 'MOVE'],
    colors: ['#111111', '#333333', '#222222', '#111111'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DRIFT', 'FLOW', 'GLIDE', 'MOVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#111111', '#333333', '#222222', '#111111'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.4, max: 5, group: 'Timing' },
  ],
})
