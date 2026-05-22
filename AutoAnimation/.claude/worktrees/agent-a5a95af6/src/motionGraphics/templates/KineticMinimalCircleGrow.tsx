import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalCircleGrowConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

/**
 * Circle grows from a single point to reveal the text.
 * Uses CSS clip-path: circle(radius at cx cy).
 * The origin point is the vertical center, left edge (like a spotlight switch-on).
 * radius grows from 0 → 150% (oversized to fully cover the element at any aspect ratio).
 *
 * On exit the circle shrinks back toward the same origin point.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let radius: number

    if (phase === 'enter') {
      radius = easeOutCubic(enterProgress) * 150
    } else if (phase === 'hold') {
      radius = 150
    } else {
      radius = (1 - easeInCubic(exitProgress)) * 150
    }

    // Origin: left-center of the element — appears to grow from the left edge
    const clipPath = `circle(${radius.toFixed(2)}% at 0% 50%)`

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

function MinimalCircleGrowComponent(props: MotionGraphicProps<MinimalCircleGrowConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-circle-grow',
  title: 'Kinetic Minimal Circle Grow',
  description: 'Circle expands from a point at the left edge — a radial clip-path grows to reveal text like a spotlight switched on',
  tags: ['kinetic', 'typography', 'minimal', 'clip-path', 'reveal', 'circle', 'radial', 'grow'],
  category: 'captions',
  component: MinimalCircleGrowComponent as any,
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
