import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NewspaperHeadlineConfig extends KineticBaseConfig {}

function bounceEase(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75 }
  if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375 }
  t -= 2.625 / 2.75
  return 7.5625 * t * t + 0.984375
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Newsprint dot texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)',
          backgroundSize: '4px 4px',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0
    let scale = 1
    let rotation = 0

    if (phase === 'enter') {
      // Slam in from top with bounce
      opacity = Math.min(1, enterProgress * 3)
      const bounced = bounceEase(enterProgress)
      translateY = (1 - bounced) * -120
    } else if (phase === 'hold') {
      opacity = 1
    } else {
      // Crumple: slight scale and rotation
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.15
      rotation = exitProgress * 3
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale}) rotate(${rotation}deg)`,
          opacity,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 2,
          color,
          borderBottom: `4px solid ${color}`,
          paddingBottom: 4,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function NewspaperHeadlineComponent(props: MotionGraphicProps<NewspaperHeadlineConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-newspaper-headline',
  title: 'Kinetic Newspaper Headline',
  description: 'Breaking news newspaper headline style with bounce slam-in and dotted newsprint texture',
  tags: ['kinetic', 'typography', 'newspaper', 'headline', 'news', 'breaking'],
  category: 'captions',
  component: NewspaperHeadlineComponent as any,
  defaultConfig: {
    words: ['BREAKING', 'NEWS', 'ALERT', 'TODAY'],
    colors: ['#1a1a1a', '#CC0000', '#1a1a1a', '#CC0000'],
    bgColor: '#F2EDE0',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BREAKING', 'NEWS', 'ALERT', 'TODAY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#CC0000', '#1a1a1a', '#CC0000'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F2EDE0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
