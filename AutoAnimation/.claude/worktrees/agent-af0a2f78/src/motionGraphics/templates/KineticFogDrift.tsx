import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FogDriftConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, ${bgColor} 0%, #1a1a2a 100%)`,
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let translateX = 0
    let blur = 0

    if (phase === 'enter') {
      opacity = enterProgress
      translateX = (1 - enterProgress) * -40
      blur = (1 - enterProgress) * 15
    } else if (phase === 'hold') {
      opacity = 1
      translateX = Math.sin(Date.now() * 0.002) * 5
      blur = 0
    } else {
      opacity = 1 - exitProgress
      translateX = exitProgress * 30
      blur = exitProgress * 15
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${translateX}px)`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(36px, 11vw, 150px)',
          fontWeight: 200,
          letterSpacing: 12,
          color,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function FogDriftComponent(props: MotionGraphicProps<FogDriftConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-fog-drift',
  title: 'Kinetic Fog Drift',
  description: 'Misty fog drift effect with words emerging from blur and floating gently',
  tags: ['kinetic', 'typography', 'fog', 'mist', 'drift', 'ethereal'],
  category: 'captions',
  component: FogDriftComponent as any,
  defaultConfig: {
    words: ['SILENT', 'MIST', 'FADING', 'ECHO'],
    colors: ['#C0C0C0', '#E0E0E0', '#A0A0C0', '#D0D0E0'],
    bgColor: '#2a2a3a',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SILENT', 'MIST', 'FADING', 'ECHO'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C0C0C0', '#E0E0E0', '#A0A0C0', '#D0D0E0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2a2a3a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
