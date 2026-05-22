import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FoldConfig extends KineticBaseConfig {}

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
    let rotateX = 0
    let opacity = 1
    let origin = 'center top'
    let shadowY = 0
    let shadowBlur = 0

    if (phase === 'enter') {
      // Unfold from top — starts at 90deg (folded up), rotates to 0
      const t = easeOutCubic(enterProgress)
      rotateX = 90 * (1 - t)
      opacity = Math.min(1, enterProgress * 2.5)
      origin = 'center top'
      shadowY = (1 - t) * 20
      shadowBlur = (1 - t) * 15
    } else if (phase === 'hold') {
      rotateX = 0
      opacity = 1
      // Subtle shadow pulse
      shadowY = 4 + Math.sin(holdProgress * Math.PI * 4) * 2
      shadowBlur = 8 + Math.sin(holdProgress * Math.PI * 4) * 3
    } else {
      // Fold down — rotates to -90deg from bottom
      const t = easeInCubic(exitProgress)
      rotateX = -90 * t
      opacity = 1 - t * t
      origin = 'center bottom'
      shadowY = t * 20
      shadowBlur = t * 15
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          perspective: 800,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          style={{
            transform: `rotateX(${rotateX}deg)`,
            transformOrigin: origin,
            opacity,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            color,
            textShadow: `0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,0.4)`,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function FoldTransitionComponent(props: MotionGraphicProps<FoldConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-fold-transition',
  title: 'Kinetic Paper Fold',
  description: 'Words unfold from above like a page turning — 3D perspective rotation with shadow, then fold down to exit',
  tags: ['kinetic', 'typography', 'transition', 'fold', '3d', 'perspective'],
  category: 'captions',
  component: FoldTransitionComponent as any,
  defaultConfig: {
    words: ['FOLD', 'TURN', 'PAGE', 'FLIP'],
    colors: ['#F5F5F0', '#F5F5F0', '#F5F5F0', '#F5F5F0'],
    bgColor: '#2a2a2a',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FOLD', 'TURN', 'PAGE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F5F5F0', '#F5F5F0', '#F5F5F0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2a2a2a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
