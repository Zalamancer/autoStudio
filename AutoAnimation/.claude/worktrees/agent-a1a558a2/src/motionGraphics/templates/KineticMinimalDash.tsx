import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalDashConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // Dash mechanic: text renders with a dashed stroke pattern that
    // progressively fills in (dash gaps close) to become solid text.
    // We simulate with: two layers — a dashed underline that consolidates,
    // and the text itself going from very light (dashed feel) to full opacity,
    // paired with a stroke outline that transitions to filled.
    //
    // Since CSS text-stroke is decorative-only, we simulate "dashing" by:
    // - Enter phase: text has a high stroke-width with low fill opacity (outline feel)
    //   and a fast-moving dash pattern underline that solidifies.
    // - As enterProgress→1: stroke-width decreases to 0, fill opacity rises to 1.

    let fillOpacity = 0
    let strokeOpacity = 0
    let strokeWidth = 0
    let underlineScaleX = 0
    let dashOffset = 0  // 0..100, drives the "solidifying" feel via opacity stepped bands
    let exitOpacity = 1

    if (phase === 'enter') {
      const e = easeOutCubic(enterProgress)
      // Stroke appears first (dashed outline), fill arrives second half
      strokeOpacity = Math.min(1, enterProgress * 2)
      strokeWidth = 1.5 * (1 - e)  // stroke thins as fill rises
      fillOpacity = e
      underlineScaleX = e
      dashOffset = (1 - enterProgress) * 60  // offset animates to 0 (solidifies)
    } else if (phase === 'hold') {
      fillOpacity = 1
      strokeOpacity = 0
      strokeWidth = 0
      underlineScaleX = 1
      dashOffset = 0
    } else {
      const e = easeInOutCubic(exitProgress)
      fillOpacity = 1 - e
      strokeOpacity = 0
      underlineScaleX = 1 - e
      exitOpacity = 1 - e
    }

    // Hex color → rgb for text-shadow dashes simulation
    // Use a repeating-linear-gradient mask on a child div for the dash effect
    const dashMaskProgress = easeOutCubic(Math.min(1, enterProgress * 2))
    const solidPercent = dashMaskProgress * 100

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Main text — transitions from outlined+dashed to solid */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(36px, 8vw, 120px)',
            fontWeight: 300,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color,
            opacity: fillOpacity,
            whiteSpace: 'nowrap',
            WebkitTextStroke: strokeWidth > 0 ? `${strokeWidth}px ${color}` : undefined,
            position: 'relative',
          }}
        >
          {word}
        </div>

        {/* Dashed underline that solidifies — grows scaleX and transitions from dashed to solid */}
        <div
          style={{
            position: 'absolute',
            bottom: -4,
            left: 0,
            right: 0,
            height: 2,
            transformOrigin: 'left center',
            transform: `scaleX(${underlineScaleX})`,
            // Dashed while entering, solid when held
            background: phase === 'enter'
              ? `repeating-linear-gradient(90deg, ${color} 0px, ${color} ${8 + dashMaskProgress * 8}px, transparent ${8 + dashMaskProgress * 8}px, transparent ${20}px)`
              : color,
            opacity: exitOpacity,
          }}
        />
      </div>
    )
  },
}

function MinimalDashComponent(props: MotionGraphicProps<MinimalDashConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-dash',
  title: 'Kinetic Minimal Dash',
  description: 'Text draws in as dashed strokes that solidify into clean filled text — a technical drafting entrance',
  tags: ['kinetic', 'typography', 'minimal', 'dash', 'draw', 'stroke', 'entrance', 'technical', 'clean'],
  category: 'captions',
  component: MinimalDashComponent as any,
  defaultConfig: {
    words: ['DRAW', 'DRAFT', 'TRACE', 'MARK'],
    colors: ['#1a1a1a', '#222222', '#111111', '#333333'],
    bgColor: '#ffffff',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DRAW', 'DRAFT', 'TRACE', 'MARK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#222222', '#111111', '#333333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
