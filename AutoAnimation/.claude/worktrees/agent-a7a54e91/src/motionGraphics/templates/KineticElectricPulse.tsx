import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ElectricPulseConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let scale = 1

    if (phase === 'enter') {
      // Flash in: quick white flash then snap to full
      if (enterProgress < 0.2) {
        opacity = enterProgress * 5
        scale = 1.2
      } else {
        opacity = 1
        scale = 1 + (1 - enterProgress) * 0.05
      }
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
    } else {
      // Flicker out: rapid opacity fluctuations
      const flicker = Math.sin(exitProgress * 40) * 0.5 + 0.5
      opacity = (1 - exitProgress) * flicker
      scale = 1
    }

    const glowRadius = phase === 'hold'
      ? 15 + Math.sin(Date.now() * 0.008) * 10
      : phase === 'enter' && enterProgress < 0.2
        ? 40
        : 15

    return (
      <>
        {/* White flash overlay on enter */}
        {phase === 'enter' && enterProgress < 0.15 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255, 255, 255, ' + (0.6 - enterProgress * 4) + ')',
              pointerEvents: 'none',
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            opacity,
            fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color,
            textShadow: `0 0 ${glowRadius}px ${color}, 0 0 ${glowRadius * 2}px rgba(0, 191, 255, 0.4), 0 0 ${glowRadius * 3}px rgba(0, 191, 255, 0.2)`,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function ElectricPulseComponent(props: MotionGraphicProps<ElectricPulseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-electric-pulse',
  title: 'Kinetic Electric Pulse',
  description: 'Electric lightning pulse effect with flash-in, pulsing glow, and flickering exit',
  tags: ['kinetic', 'typography', 'electric', 'pulse', 'lightning', 'energy'],
  category: 'captions',
  component: ElectricPulseComponent as any,
  defaultConfig: {
    words: ['VOLT', 'SURGE', 'SPARK', 'POWER'],
    colors: ['#00BFFF', '#FFFFFF', '#4169E1', '#00FFFF'],
    bgColor: '#050510',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['VOLT', 'SURGE', 'SPARK', 'POWER'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00BFFF', '#FFFFFF', '#4169E1', '#00FFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050510', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
