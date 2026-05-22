import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalCrossConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

/**
 * Cross / plus-sign shape growing from center to reveal text.
 * The cross is defined as a 12-vertex polygon centered at (50%, 50%).
 * arm:  half-thickness of the cross arms (narrows = 0, widens to 20%)
 * reach: how far the arms extend from center (0 → 80%)
 *
 * Vertices (clockwise from top-left of top arm):
 *   (-arm, -reach), (arm, -reach),   — top arm top edge
 *   (arm, -arm), (reach, -arm),       — top-right corner + right arm top
 *   (reach, arm), (arm, arm),         — right arm bottom + inner corner
 *   (arm, reach), (-arm, reach),      — bottom arm right + bottom
 *   (-arm, arm), (-reach, arm),       — bottom-left corner + left arm bottom
 *   (-reach, -arm), (-arm, -arm)      — left arm top + inner corner
 * All coords are % offsets from center (50%, 50%).
 */
function crossClipPath(arm: number, reach: number): string {
  const cx = 50
  const cy = 50
  const pts = [
    [-arm, -reach], [arm, -reach],
    [arm, -arm], [reach, -arm],
    [reach, arm], [arm, arm],
    [arm, reach], [-arm, reach],
    [-arm, arm], [-reach, arm],
    [-reach, -arm], [-arm, -arm],
  ]
  return `polygon(${pts.map(([dx, dy]) => `${(cx + dx).toFixed(2)}% ${(cy + dy).toFixed(2)}%`).join(', ')})`
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let p: number

    if (phase === 'enter') {
      p = easeOutCubic(enterProgress)
    } else if (phase === 'hold') {
      p = 1
    } else {
      p = 1 - easeInCubic(exitProgress)
    }

    // arm stays proportional; reach grows to cover the element
    const arm = p * 20
    const reach = p * 80
    const clipPath = crossClipPath(arm, reach)

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(36px, 8vw, 120px)',
          fontWeight: 300,
          color,
          whiteSpace: 'nowrap',
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
          clipPath,
        }}
      >
        {word}
      </div>
    )
  },
}

function MinimalCrossComponent(props: MotionGraphicProps<MinimalCrossConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-cross',
  title: 'Kinetic Minimal Cross',
  description: 'Plus/cross shape growing outward from center — a 12-vertex polygon clip-path expands arms to reveal text',
  tags: ['kinetic', 'typography', 'minimal', 'clip-path', 'reveal', 'cross', 'plus', 'geometric'],
  category: 'captions',
  component: MinimalCrossComponent as any,
  defaultConfig: {
    words: ['REVEAL', 'SHAPE', 'CLEAN'],
    colors: ['#1A1A1A', '#1A1A1A', '#1A1A1A'],
    bgColor: '#FFFFFF',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['REVEAL', 'SHAPE', 'CLEAN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1A1A1A', '#1A1A1A', '#1A1A1A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
