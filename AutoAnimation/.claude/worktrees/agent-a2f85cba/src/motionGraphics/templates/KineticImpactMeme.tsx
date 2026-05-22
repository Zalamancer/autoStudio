import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ImpactMemeConfig extends KineticBaseConfig {}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    let opacity = 1
    let translateY = 0
    let scale = 1

    if (phase === 'enter') {
      const eased = easeOutBack(enterProgress)
      // Slam in from top and bottom simultaneously (alternating by index)
      const fromTop = index % 2 === 0
      translateY = fromTop
        ? (1 - eased) * -(height * 0.6)
        : (1 - eased) * (height * 0.6)
      opacity = Math.min(1, enterProgress * 3)
      scale = 0.5 + eased * 0.5
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
    } else {
      opacity = 1 - exitProgress * 1.5
      scale = 1 - exitProgress * 0.4
    }

    const outlineWidth = Math.max(2, Math.round(height * 0.005))

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity: Math.max(0, opacity),
          fontFamily: "'Impact', 'Arial Black', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(52px, 16vw, 200px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color,
          whiteSpace: 'nowrap',
          WebkitTextStroke: `${outlineWidth}px #000000`,
          textShadow: `
            ${outlineWidth}px ${outlineWidth}px 0 #000,
            -${outlineWidth}px -${outlineWidth}px 0 #000,
            ${outlineWidth}px -${outlineWidth}px 0 #000,
            -${outlineWidth}px ${outlineWidth}px 0 #000,
            0 ${outlineWidth * 2}px ${outlineWidth * 4}px rgba(0,0,0,0.5)
          `,
        }}
      >
        {word}
      </div>
    )
  },
}

function ImpactMemeComponent(props: MotionGraphicProps<ImpactMemeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-impact-meme',
  title: 'Impact Meme',
  description: 'Classic meme Impact font with thick black outline, ALL CAPS text slamming in from top and bottom',
  tags: ['kinetic', 'meme', 'impact', 'viral', 'classic', 'outline'],
  category: 'captions',
  component: ImpactMemeComponent as any,
  defaultConfig: {
    words: ['ONE DOES', 'NOT SIMPLY', 'WALK INTO', 'MORDOR'],
    colors: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
    bgColor: '#1a1a1a',
    cycleDuration: 0.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ONE DOES', 'NOT SIMPLY', 'WALK INTO', 'MORDOR'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 0.8, min: 0.3, max: 5, group: 'Timing' },
  ],
})
