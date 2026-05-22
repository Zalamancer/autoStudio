import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalUnfoldConfig extends KineticBaseConfig {}

/** Deceleration ease — fast start, slow finish */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/** Ease in-out for exits */
function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // Unfold mechanic: text starts collapsed to a single horizontal point (scaleY=0, scaleX=0)
    // at center, then unfolds outward — first width, then height, like unfolding a piece of paper.
    // Two-stage: 0..0.5 = horizontal unfold (scaleX 0→1), 0.5..1 = vertical unfold (scaleY 0→1)

    let scaleX = 1
    let scaleY = 1
    let opacity = 1

    if (phase === 'enter') {
      const e = easeOutCubic(enterProgress)
      if (enterProgress <= 0.5) {
        // Stage 1: horizontal unfold
        const stage1 = easeOutCubic(enterProgress / 0.5)
        scaleX = stage1
        scaleY = 0.02 // almost a line
        opacity = stage1
      } else {
        // Stage 2: vertical unfold
        scaleX = 1
        const stage2 = easeOutCubic((enterProgress - 0.5) / 0.5)
        scaleY = 0.02 + stage2 * 0.98
        opacity = 1
      }
    } else if (phase === 'hold') {
      scaleX = 1
      scaleY = 1
      opacity = 1
    } else {
      // Exit: fold back vertically then horizontally
      const e = easeInOutQuad(exitProgress)
      if (exitProgress <= 0.5) {
        scaleX = 1
        const stage1 = easeInOutQuad(exitProgress / 0.5)
        scaleY = 1 - stage1 * 0.98
        opacity = 1
      } else {
        const stage2 = easeInOutQuad((exitProgress - 0.5) / 0.5)
        scaleX = 1 - stage2
        scaleY = 0.02
        opacity = 1 - stage2
      }
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scaleX(${scaleX}) scaleY(${scaleY})`,
          transformOrigin: 'center center',
          opacity,
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(36px, 8vw, 120px)',
          fontWeight: 300,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function MinimalUnfoldComponent(props: MotionGraphicProps<MinimalUnfoldConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-unfold',
  title: 'Kinetic Minimal Unfold',
  description: 'Text unfolds from a single point like paper being opened — horizontal first, then vertical, clean white background',
  tags: ['kinetic', 'typography', 'minimal', 'unfold', 'entrance', 'paper', 'clean', 'white'],
  category: 'captions',
  component: MinimalUnfoldComponent as any,
  defaultConfig: {
    words: ['UNFOLD', 'OPEN', 'REVEAL', 'EXPAND'],
    colors: ['#1a1a1a', '#222222', '#111111', '#333333'],
    bgColor: '#ffffff',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['UNFOLD', 'OPEN', 'REVEAL', 'EXPAND'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#222222', '#111111', '#333333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
