import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PaperCutConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index }: WordRenderProps) => {
    let opacity = 0
    let translateX = 0
    let translateY = 0
    let rotate = 0

    const seed = index * 137 + 42
    const dirX = ((seed % 4) - 2) * 50
    const dirY = ((seed * 3 + 7) % 4 - 2) * 40

    if (phase === 'enter') {
      const ease = 1 - Math.pow(1 - enterProgress, 3)
      opacity = Math.min(1, enterProgress * 2.5)
      translateX = dirX * (1 - ease)
      translateY = dirY * (1 - ease)
      rotate = ((seed % 6) - 3) * (1 - ease)
    } else if (phase === 'hold') {
      opacity = 1
      const bob = Math.sin(holdProgress * Math.PI * 2) * 0.5
      translateY = bob
    } else {
      opacity = 1 - exitProgress
      const ease = exitProgress * exitProgress
      translateX = -dirX * ease * 0.5
      translateY = -dirY * ease * 0.5
      rotate = -((seed % 4) - 2) * ease * 3
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) rotate(${rotate}deg)`,
          opacity,
        }}
      >
        <div
          style={{
            fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: 4,
            color,
            background: '#FFFFFF',
            padding: '8px 20px',
            boxShadow: '2px 3px 0 rgba(0,0,0,0.1), 4px 6px 0 rgba(0,0,0,0.05), 6px 9px 15px rgba(0,0,0,0.1)',
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function PaperCutComponent(props: MotionGraphicProps<PaperCutConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-paper-cut',
  title: 'Kinetic Paper Cut',
  description: 'Paper cut-out layered style with white card backgrounds and depth shadows',
  tags: ['kinetic', 'typography', 'paper', 'cut-out', 'craft'],
  category: 'captions',
  component: PaperCutComponent as any,
  defaultConfig: {
    words: ['CUT', 'FOLD', 'LAYER', 'CRAFT'],
    colors: ['#2D2D2D', '#E74C3C', '#2980B9', '#27AE60'],
    bgColor: '#E8E8E8',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CUT', 'FOLD', 'LAYER', 'CRAFT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2D2D2D', '#E74C3C', '#2980B9', '#27AE60'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#E8E8E8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
