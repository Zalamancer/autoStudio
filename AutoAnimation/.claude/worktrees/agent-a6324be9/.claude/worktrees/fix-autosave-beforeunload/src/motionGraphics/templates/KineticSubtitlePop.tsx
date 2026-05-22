import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SubtitlePopConfig extends KineticBaseConfig {
  pillColor: string
  pillOpacity: number
}

function bounceEaseOut(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75 }
  if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375 }
  t -= 2.625 / 2.75
  return 7.5625 * t * t + 0.984375
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, height }: WordRenderProps) => {
    let opacity = 1
    let translateY = 0

    if (phase === 'enter') {
      const eased = bounceEaseOut(enterProgress)
      translateY = (1 - eased) * 80
      opacity = Math.min(1, enterProgress * 3)
    } else if (phase === 'hold') {
      opacity = 1
      translateY = Math.sin(holdProgress * Math.PI * 4) * 2
    } else {
      const eased = easeInQuad(exitProgress)
      translateY = eased * 80
      opacity = 1 - eased
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px)`,
          opacity,
        }}
      >
        {/* Pill background */}
        <div
          style={{
            position: 'absolute',
            inset: '-12px -24px',
            background: 'rgba(0,0,0,0.75)',
            borderRadius: 12,
          }}
        />
        {/* Text */}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(36px, 10vw, 140px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            lineHeight: 1.1,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function SubtitlePopComponent(props: MotionGraphicProps<SubtitlePopConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-subtitle-pop',
  title: 'Kinetic Subtitle Pop',
  description: 'Subtitle-style pop up from bottom with bounce easing and semi-transparent pill background',
  tags: ['kinetic', 'typography', 'subtitle', 'pop', 'pill', 'readable'],
  category: 'captions',
  component: SubtitlePopComponent as any,
  defaultConfig: {
    words: ['JUST', 'LIKE', 'THIS', 'EASY'],
    colors: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
    bgColor: 'transparent',
    cycleDuration: 1,
    pillColor: '#000000',
    pillOpacity: 0.75,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['JUST', 'LIKE', 'THIS', 'EASY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFFFFF', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: 'transparent', group: 'Style' },
    { key: 'pillColor', label: 'Pill Color', type: 'color', defaultValue: '#000000', group: 'Style' },
    { key: 'pillOpacity', label: 'Pill Opacity', type: 'number', defaultValue: 0.75, min: 0, max: 1, group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
