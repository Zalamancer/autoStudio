import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalDiamondConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

/**
 * Diamond iris reveal — a 4-pointed diamond (rotated square polygon) expanding
 * from the center outward to reveal the text, then contracting back on exit.
 *
 * clip-path polygon points (in % of bounding box):
 *   top    (50%, 50%-r)
 *   right  (50%+r, 50%)
 *   bottom (50%, 50%+r)
 *   left   (50%-r, 50%)
 * where r grows from 0 → 80% (enough to reveal the full element).
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let r: number

    if (phase === 'enter') {
      r = easeOutCubic(enterProgress) * 80
    } else if (phase === 'hold') {
      r = 80
    } else {
      r = (1 - easeInCubic(exitProgress)) * 80
    }

    const cx = 50
    const cy = 50
    const top    = `${cx}% ${cy - r}%`
    const right  = `${cx + r}% ${cy}%`
    const bottom = `${cx}% ${cy + r}%`
    const left   = `${cx - r}% ${cy}%`
    const clipPath = `polygon(${top}, ${right}, ${bottom}, ${left})`

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

function MinimalDiamondComponent(props: MotionGraphicProps<MinimalDiamondConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-diamond',
  title: 'Kinetic Minimal Diamond',
  description: 'Diamond iris expanding from center — a 4-point polygon clip-path reveals text in an elegant geometric iris wipe',
  tags: ['kinetic', 'typography', 'minimal', 'clip-path', 'reveal', 'diamond', 'iris', 'geometric'],
  category: 'captions',
  component: MinimalDiamondComponent as any,
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
