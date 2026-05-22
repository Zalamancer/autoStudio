import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalMetronomeConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 1
    // A metronome tick: each word snaps in precisely, then a small tick-nod during hold
    let translateY = 0
    let rotate = 0

    if (phase === 'enter') {
      // Snaps in from above — sharp, precise
      const eased = easeOutCubic(enterProgress)
      opacity = Math.min(1, enterProgress * 4)
      translateY = (1 - eased) * -22
    } else if (phase === 'hold') {
      // Single metronome tick: subtle -2deg → +2deg → 0 rotation
      const tick = Math.sin(holdProgress * Math.PI) // single half-cycle
      rotate = tick * 1.5 // max 1.5 degrees — barely perceptible, feels mechanical
      opacity = 1
    } else {
      opacity = 1 - easeOutCubic(exitProgress)
      translateY = exitProgress * 14
    }

    void holdProgress

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY.toFixed(2)}px) rotate(${rotate.toFixed(3)}deg)`,
          opacity,
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(36px, 8vw, 120px)',
          fontWeight: 300,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function MinimalMetronomeComponent(props: MotionGraphicProps<MinimalMetronomeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-metronome',
  title: 'Minimal Metronome',
  description: 'Words snap in from above, then nod with a single mechanical tick rotation during hold — precise rhythmic timing like a metronome beat',
  tags: ['kinetic', 'typography', 'minimal', 'metronome', 'tick', 'rhythm', 'beat', 'mechanical', 'rotate'],
  category: 'captions',
  component: MinimalMetronomeComponent as any,
  defaultConfig: {
    words: ['TICK', 'BEAT', 'TIME', 'PULSE'],
    colors: ['#111111', '#222222', '#111111', '#333333'],
    bgColor: '#FAFAFA',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TICK', 'BEAT', 'TIME', 'PULSE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#111111', '#222222', '#111111', '#333333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FAFAFA', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
