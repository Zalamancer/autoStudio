import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NeonOutlineConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress }: WordRenderProps) => {
    let opacity = 0
    let glowIntensity = 1

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 2)
      glowIntensity = enterProgress
    } else if (phase === 'hold') {
      opacity = 1
      glowIntensity = 0.7 + Math.sin(holdProgress * Math.PI * 4) * 0.3
    } else {
      opacity = 1 - exitProgress
      glowIntensity = 1 - exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(48px, 14vw, 180px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: 6,
          WebkitTextFillColor: 'transparent',
          WebkitTextStroke: `2px ${color}`,
          textShadow: `0 0 ${7 * glowIntensity}px ${color}, 0 0 ${15 * glowIntensity}px ${color}, 0 0 ${30 * glowIntensity}px ${color}`,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function NeonOutlineComponent(props: MotionGraphicProps<NeonOutlineConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-neon-outline',
  title: 'Kinetic Neon Outline',
  description: 'Neon outline-only text with no fill and pulsing glow effect',
  tags: ['kinetic', 'typography', 'neon', 'outline', 'glow'],
  category: 'captions',
  component: NeonOutlineComponent as any,
  defaultConfig: {
    words: ['GLOW', 'EDGE', 'LINE', 'PURE'],
    colors: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF3366'],
    bgColor: '#000000',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GLOW', 'EDGE', 'LINE', 'PURE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF3366'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000000', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
