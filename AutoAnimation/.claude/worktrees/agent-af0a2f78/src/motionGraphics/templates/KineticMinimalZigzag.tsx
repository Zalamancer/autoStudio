import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalZigzagConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

/**
 * Zigzag edge wipe sweeping left to right across the text.
 * The reveal boundary is a vertical zigzag that travels from x=0% → x=100%.
 * The zigzag has N teeth across the height. The polygon covers the revealed
 * (left) portion of the element with a sawtooth right edge.
 *
 * Construction: left-side rectangle + zigzag right edge.
 * For N teeth, the right edge alternates between (frontX + toothDepth) and (frontX - toothDepth)
 * at evenly spaced y positions.
 *
 * On enter: frontX sweeps 0 → 100%
 * On exit: frontX continues past 100% (i.e. the clipped region starts from right,
 *          so we invert: reveal from right by using "inset" instead, or re-build
 *          the polygon from the right side going left).
 */
function zigzagClipPath(frontX: number, sweepingRight: boolean): string {
  const N = 6 // number of zigzag teeth
  const toothDepth = 8 // % amplitude of each tooth

  if (!sweepingRight) {
    // Exit: the front sweeps from 100% back to 0% (covered region shrinks from right)
    // Build: right rectangle + zigzag left edge going from right leftward
    const rightEdge = 100
    const points: string[] = []
    // Top-right
    points.push(`${rightEdge}% 0%`)
    // Bottom-right
    points.push(`${rightEdge}% 100%`)
    // Zigzag left edge, bottom → top
    for (let i = N; i >= 0; i--) {
      const y = (i / N) * 100
      const xOffset = i % 2 === 0 ? toothDepth : -toothDepth
      points.push(`${(frontX + xOffset).toFixed(2)}% ${y.toFixed(2)}%`)
    }
    return `polygon(${points.join(', ')})`
  }

  // Enter: revealed region is everything to the LEFT of the zigzag front
  const points: string[] = []
  // Top-left corner
  points.push(`0% 0%`)
  // Bottom-left corner
  points.push(`0% 100%`)
  // Zigzag right edge, bottom → top
  for (let i = N; i >= 0; i--) {
    const y = (i / N) * 100
    const xOffset = i % 2 === 0 ? toothDepth : -toothDepth
    points.push(`${(frontX + xOffset).toFixed(2)}% ${y.toFixed(2)}%`)
  }
  return `polygon(${points.join(', ')})`
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let clipPath: string

    if (phase === 'enter') {
      // frontX: -8% → 108% so zigzag teeth don't peek before/after element bounds
      const frontX = -8 + easeOutCubic(enterProgress) * 116
      clipPath = zigzagClipPath(frontX, true)
    } else if (phase === 'hold') {
      clipPath = 'inset(0 0 0 0)' // fully visible
    } else {
      // Exit: revealed region shrinks from the right back leftward
      const frontX = 108 - easeInCubic(exitProgress) * 116
      clipPath = zigzagClipPath(frontX, false)
    }

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

function MinimalZigzagComponent(props: MotionGraphicProps<MinimalZigzagConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-zigzag',
  title: 'Kinetic Minimal Zigzag',
  description: 'Zigzag edge wipe sweeping left to right — a sawtooth polygon clip-path travels across the text for a serrated reveal',
  tags: ['kinetic', 'typography', 'minimal', 'clip-path', 'reveal', 'zigzag', 'wipe', 'sawtooth'],
  category: 'captions',
  component: MinimalZigzagComponent as any,
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
