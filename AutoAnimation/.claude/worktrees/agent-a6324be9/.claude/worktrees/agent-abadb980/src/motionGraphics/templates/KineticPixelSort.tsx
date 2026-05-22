import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// ── Glitch Distort 3: Pixel Sort ──────────────────────────────────────────────
// Columns of pixels are vertically "sorted" — bright pixels race upward,
// dark pixels fall down, creating the characteristic pixel-sorting art effect.

interface PixelSortConfig extends KineticBaseConfig {
  sortSpeed: number
  sortThreshold: number
}

function seeded(s: number): number {
  const x = Math.sin(s * 78.3 + 23.9) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const COL_COUNT = 18

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const colW = width / COL_COUNT

    // Sort progress — columns sort at different speeds
    let sortProgress = 0
    if (phase === 'enter') sortProgress = 1 - easeOutCubic(enterProgress)
    else if (phase === 'hold') sortProgress = 0.05 * Math.abs(Math.sin(holdProgress * Math.PI * 2))
    else sortProgress = easeInCubic(exitProgress)

    const sortColumns = Array.from({ length: COL_COUNT }, (_, ci) => {
      // Each column has a sort start threshold and speed
      const sortStart = seeded(ci * 7) * 0.3
      const colSortSpeed = 0.7 + seeded(ci * 11) * 0.6
      const colSort = Math.max(0, Math.min(1, (sortProgress - sortStart * (1 - sortProgress)) / colSortSpeed))

      // Sorted region spans some fraction of height
      const sortFraction = 0.3 + seeded(ci * 5) * 0.5

      // Bright "sorted" pixels that have risen to top of column
      const sortedH = height * sortFraction * colSort
      const sortedY = seeded(ci * 13) * (height * 0.4)

      // Color of this column's sorted region
      const hue = (ci / COL_COUNT) * 40 + 200
      const sortColor = colSort > 0.05
        ? `hsla(${hue}, 60%, 80%, ${colSort * 0.7})`
        : 'transparent'

      return (
        <div key={ci}>
          {/* Sorted bright column streak */}
          <div style={{
            position: 'absolute',
            left: ci * colW,
            top: sortedY,
            width: colW - 1,
            height: Math.max(0, sortedH),
            background: `linear-gradient(to bottom, ${sortColor}, transparent)`,
            transform: `scaleY(${colSort > 0 ? 1 : 0})`,
          }} />
          {/* Dark fall-off */}
          <div style={{
            position: 'absolute',
            left: ci * colW,
            top: sortedY + sortedH,
            width: colW - 1,
            height: Math.max(0, height * sortFraction * colSort * 0.4),
            background: `linear-gradient(to bottom, rgba(0,0,0,${colSort * 0.5}), transparent)`,
          }} />
        </div>
      )
    })

    // Text: partially obscured by sort streaks
    let textOp = 0
    if (phase === 'enter') textOp = easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7))
    else if (phase === 'hold') textOp = 1
    else textOp = Math.max(0, 1 - easeInCubic(exitProgress / 0.6))

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Text first so streaks overlay */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(44px, 10vw, 138px)',
          fontWeight: 900,
          color,
          opacity: textOp,
          whiteSpace: 'nowrap',
          letterSpacing: '0.02em',
        }}>
          {word}
        </div>
        {/* Sort streaks on top */}
        {sortColumns}
        {/* Glitch text copy with mix-blend */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: `translate(-50%, -50%) translateX(${sortProgress * 4}px)`,
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(44px, 10vw, 138px)',
          fontWeight: 900,
          color: `rgba(255,0,100,0.4)`,
          opacity: textOp * sortProgress * 0.8,
          whiteSpace: 'nowrap',
          letterSpacing: '0.02em',
          mixBlendMode: 'screen',
        }}>
          {word}
        </div>
      </div>
    )
  },
}

function PixelSortComponent(props: MotionGraphicProps<PixelSortConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pixel-sort',
  title: 'Kinetic Pixel Sort',
  description: 'Column-by-column pixel sorting effect sweeps across text — bright streaks race upward, dark regions fall, creating the signature art glitch aesthetic.',
  tags: ['kinetic', 'typography', 'pixel sort', 'glitch', 'digital', 'art', 'distortion', 'sorting'],
  category: 'captions',
  component: PixelSortComponent as any,
  defaultConfig: {
    words: ['SORT', 'GLITCH', 'DATA', 'ART'],
    colors: ['#FFFFFF', '#CC44FF', '#FFFFFF', '#44DDFF'],
    bgColor: '#030308',
    cycleDuration: 1.6,
    sortSpeed: 1,
    sortThreshold: 0.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SORT', 'GLITCH', 'DATA', 'ART'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#CC44FF', '#FFFFFF', '#44DDFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#030308', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'sortSpeed', label: 'Sort Speed', type: 'number', defaultValue: 1, min: 0.3, max: 3, group: 'Animation' },
    { key: 'sortThreshold', label: 'Sort Threshold', type: 'number', defaultValue: 0.5, min: 0.1, max: 0.9, group: 'Animation' },
  ],
})
