import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FacelessTypeConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let rotation = 0
    let translateY = 0

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 2.5)
      scale = 0.3 + enterProgress * 0.7
      rotation = (1 - enterProgress) * (index % 2 === 0 ? 15 : -15)
      translateY = (1 - enterProgress) * 30
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1 + Math.sin(holdProgress * Math.PI * 4) * 0.02
    } else {
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.3
      translateY = exitProgress * -20
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg) translateY(${translateY}px)`,
          opacity,
          fontFamily: "'Helvetica Neue', 'Segoe UI', Arial, sans-serif",
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: 4,
          color,
          textShadow: `2px 2px 0 rgba(0,0,0,0.3), 0 0 20px ${color}40`,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function FacelessTypeComponent(props: MotionGraphicProps<FacelessTypeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-faceless-kinetic-type',
  title: 'Faceless Kinetic Typography',
  description: 'Word-by-word kinetic typography synced to voiceover with scale, rotation, and color emphasis',
  tags: ['faceless', 'kinetic', 'typography', 'text', 'voiceover', 'motion'],
  category: 'captions',
  component: FacelessTypeComponent as any,
  defaultConfig: {
    words: ['THIS', 'IS', 'YOUR', 'STORY'],
    colors: ['#FF3366', '#00BFFF', '#FFD700', '#00FFAA'],
    bgColor: '#1a1a2e',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['THIS', 'IS', 'YOUR', 'STORY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF3366', '#00BFFF', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
