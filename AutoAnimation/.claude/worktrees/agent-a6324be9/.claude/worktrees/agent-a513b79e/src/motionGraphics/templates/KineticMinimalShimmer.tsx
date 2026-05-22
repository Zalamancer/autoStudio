import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalShimmerConfig extends KineticBaseConfig {}

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

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width }: WordRenderProps) => {
    // Shimmer mechanic: text starts invisible. A light sweep travels left→right
    // across the text, the portion of text swept by the light becomes visible and stays visible.
    // The sweep position is encoded as a clip-path-like gradient reveal.
    // We simulate with: base text at low opacity + a bright highlight band that sweeps across.

    let baseOpacity = 0
    let sweepX = -1  // -1 = not started, 0..1 = sweep position fraction across width
    let highlightOpacity = 0
    let exitOpacity = 1

    if (phase === 'enter') {
      // Base text fades in as the sweep passes — revealed text stays
      baseOpacity = easeOutCubic(enterProgress)
      sweepX = enterProgress  // sweep travels left to right over the word
      highlightOpacity = Math.sin(enterProgress * Math.PI) * 0.6  // bell curve — bright at mid-sweep
    } else if (phase === 'hold') {
      baseOpacity = 1
      sweepX = -1
      highlightOpacity = 0
    } else {
      baseOpacity = 1 - easeInCubic(exitProgress)
      sweepX = -1
      highlightOpacity = 0
      exitOpacity = baseOpacity
    }

    // Sweep highlight: a narrow bright band at sweepX position
    // We use a CSS linear-gradient overlay with the highlight centered at sweepX
    const sweepPercent = sweepX * 100
    const bandWidth = 12  // percent of element width

    const shimmerStyle: React.CSSProperties =
      sweepX >= 0 && highlightOpacity > 0
        ? {
            background: `linear-gradient(
              90deg,
              transparent ${sweepPercent - bandWidth}%,
              rgba(255,255,255,${highlightOpacity}) ${sweepPercent - bandWidth / 2}%,
              rgba(255,255,255,${highlightOpacity * 1.4}) ${sweepPercent}%,
              rgba(255,255,255,${highlightOpacity}) ${sweepPercent + bandWidth / 2}%,
              transparent ${sweepPercent + bandWidth}%
            )`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }
        : {}

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Base text */}
        <div
          style={{
            opacity: baseOpacity,
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
        {/* Shimmer sweep overlay — only during enter */}
        {sweepX >= 0 && highlightOpacity > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
              fontSize: 'clamp(36px, 8vw, 120px)',
              fontWeight: 300,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              ...shimmerStyle,
            }}
          >
            {word}
          </div>
        )}
      </div>
    )
  },
}

function MinimalShimmerComponent(props: MotionGraphicProps<MinimalShimmerConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-shimmer',
  title: 'Kinetic Minimal Shimmer',
  description: 'Text shimmers into existence as a light sweep travels across it left to right, illuminating as it passes',
  tags: ['kinetic', 'typography', 'minimal', 'shimmer', 'light', 'sweep', 'entrance', 'clean'],
  category: 'captions',
  component: MinimalShimmerComponent as any,
  defaultConfig: {
    words: ['SHIMMER', 'GLEAM', 'LIGHT', 'GLOW'],
    colors: ['#1a1a1a', '#222222', '#111111', '#2a2a2a'],
    bgColor: '#ffffff',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SHIMMER', 'GLEAM', 'LIGHT', 'GLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#222222', '#111111', '#2a2a2a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
