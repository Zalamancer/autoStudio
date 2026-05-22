import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WordByWordConfig extends KineticBaseConfig {}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
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
    let scale = 1

    if (phase === 'enter') {
      const eased = easeOutBack(enterProgress)
      scale = eased
      opacity = Math.min(1, enterProgress * 3)
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
    } else {
      const eased = easeInCubic(exitProgress)
      opacity = 1 - eased
      scale = 1 - eased * 0.15
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(48px, 14vw, 180px)',
          fontWeight: 800,
          color,
          letterSpacing: '-0.02em',
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function WordByWordComponent(props: MotionGraphicProps<WordByWordConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-word-by-word',
  title: 'Kinetic Word By Word',
  description: 'Clean modern caption style — words pop in one at a time with scale overshoot, the #1 TikTok/Reels caption look',
  tags: ['kinetic', 'typography', 'captions', 'clean', 'modern', 'tiktok', 'reels'],
  category: 'captions',
  component: WordByWordComponent as any,
  defaultConfig: {
    words: ['THIS', 'IS', 'HOW', 'IT', 'WORKS'],
    colors: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
    bgColor: '#1A1A2E',
    cycleDuration: 0.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['THIS', 'IS', 'HOW', 'IT', 'WORKS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFFFFF', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 0.8, min: 0.3, max: 5, group: 'Timing' },
  ],
})
