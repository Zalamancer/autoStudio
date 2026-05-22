import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SplitLineConfig extends KineticBaseConfig {}

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
    let topOffset = 0
    let bottomOffset = 0
    let glowIntensity = 0

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      // Halves come together
      topOffset = (1 - eased) * -40
      bottomOffset = (1 - eased) * 40
      opacity = Math.min(1, enterProgress * 2.5)
    } else if (phase === 'hold') {
      opacity = 1
      topOffset = 0
      bottomOffset = 0
      // Subtle glow pulse
      glowIntensity = 0.3 + Math.sin(holdProgress * Math.PI * 4) * 0.15
    } else {
      const eased = easeInCubic(exitProgress)
      // Split apart
      topOffset = eased * -60
      bottomOffset = eased * 60
      opacity = 1 - eased * 0.8
    }

    const textStyle: React.CSSProperties = {
      fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      fontSize: 'clamp(48px, 14vw, 180px)',
      fontWeight: 800,
      color,
      whiteSpace: 'nowrap',
      letterSpacing: '-0.01em',
    }

    return (
      <div style={{ opacity }}>
        {/* Top half */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translateY(${topOffset}px)`,
            clipPath: 'inset(0 0 50% 0)',
            ...textStyle,
            textShadow: glowIntensity > 0 ? `0 0 ${glowIntensity * 30}px ${color}66` : undefined,
          }}
        >
          {word}
        </div>
        {/* Bottom half */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translateY(${bottomOffset}px)`,
            clipPath: 'inset(50% 0 0 0)',
            ...textStyle,
            textShadow: glowIntensity > 0 ? `0 0 ${glowIntensity * 30}px ${color}66` : undefined,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function SplitLineComponent(props: MotionGraphicProps<SplitLineConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-split-line',
  title: 'Kinetic Split Line',
  description: 'Text splits horizontally — halves come together on enter, split apart on exit with glow pulse',
  tags: ['kinetic', 'typography', 'split', 'clip-path', 'creative'],
  category: 'captions',
  component: SplitLineComponent as any,
  defaultConfig: {
    words: ['SPLIT', 'APART', 'COME', 'BACK'],
    colors: ['#FFFFFF', '#E0E0FF', '#FFFFFF', '#E0E0FF'],
    bgColor: '#0B1528',
    cycleDuration: 1.1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SPLIT', 'APART', 'COME', 'BACK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#E0E0FF', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0B1528', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
