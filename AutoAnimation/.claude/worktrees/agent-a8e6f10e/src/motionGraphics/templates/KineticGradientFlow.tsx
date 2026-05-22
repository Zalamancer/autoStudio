import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GradientFlowConfig extends KineticBaseConfig {
  gradientColors: string[]
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 1
    let gradientPos = 0 // 0-300% for flowing gradient

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 3)
      // Gradient sweeps in from left
      gradientPos = easeOutCubic(enterProgress) * 100
    } else if (phase === 'hold') {
      opacity = 1
      // Gradient continuously flows
      gradientPos = 100 + holdProgress * 200
    } else {
      // Gradient drains away
      opacity = 1 - easeInCubic(exitProgress)
      gradientPos = 300 + exitProgress * 100
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
        }}
      >
        {/* Gradient text */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(48px, 14vw, 180px)',
            fontWeight: 800,
            background: `linear-gradient(90deg, #EC4899 0%, #8B5CF6 25%, #3B82F6 50%, #EC4899 75%, #8B5CF6 100%)`,
            backgroundSize: '200% 100%',
            backgroundPosition: `${gradientPos}% 0`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}
        >
          {word}
        </div>
        {/* Glow layer behind */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(48px, 14vw, 180px)',
            fontWeight: 800,
            background: `linear-gradient(90deg, #EC4899 0%, #8B5CF6 25%, #3B82F6 50%, #EC4899 75%, #8B5CF6 100%)`,
            backgroundSize: '200% 100%',
            backgroundPosition: `${gradientPos}% 0`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
            filter: 'blur(20px)',
            opacity: 0.4,
            zIndex: -1,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function GradientFlowComponent(props: MotionGraphicProps<GradientFlowConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-gradient-flow',
  title: 'Kinetic Gradient Flow',
  description: 'Flowing linear gradient fill on text using background-clip with continuous animation',
  tags: ['kinetic', 'typography', 'gradient', 'flow', 'colorful', 'modern'],
  category: 'captions',
  component: GradientFlowComponent as any,
  defaultConfig: {
    words: ['DREAM', 'CREATE', 'SHINE', 'GLOW'],
    colors: ['#EC4899', '#8B5CF6', '#3B82F6', '#EC4899'],
    bgColor: '#0F0F1A',
    cycleDuration: 1.2,
    gradientColors: ['#EC4899', '#8B5CF6', '#3B82F6'],
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DREAM', 'CREATE', 'SHINE', 'GLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#EC4899', '#8B5CF6', '#3B82F6'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F0F1A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
