import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DiagonalSweepConfig extends KineticBaseConfig {
  angle: number
}

function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__diagonalSweepConfig ?? { angle: 30 }
    // Angle of the sweep line in degrees (from vertical)
    const angleDeg = config.angle ?? 30
    const angleRad = (angleDeg * Math.PI) / 180

    // The diagonal sweep moves from left-to-right.
    // We compute the x-intercept of the diagonal boundary at y=0.
    // Diagonal line equation: x = sweepX + y * tan(angle)
    // To fully cover/uncover, sweepX goes from -(width + height*tan) to width.
    const tanA = Math.tan(angleRad)
    const extraX = Math.abs(height * tanA)
    const totalTravel = width + extraX

    const revealP = phase === 'hold' ? 1 : phase === 'enter' ? easeInOutQuart(enterProgress) : 1 - easeInOutQuart(exitProgress)

    // sweepX is the x-position of the diagonal line at y=0
    const sweepX = revealP * totalTravel - extraX

    // Clip polygon: left of the diagonal line is revealed
    // The diagonal runs through (sweepX, 0) and (sweepX - height*tanA, height)
    const topX = sweepX
    const bottomX = sweepX - height * tanA

    // Add overhang to avoid clipping artifacts
    const clipPath = `polygon(
      ${topX}px 0px,
      -100px 0px,
      -100px ${height + 100}px,
      ${bottomX}px ${height}px
    )`

    // Sweep bar — a narrow parallelogram at the leading edge
    const barWidth = 6
    const barTopX1 = topX
    const barTopX2 = topX + barWidth
    const barBotX1 = bottomX
    const barBotX2 = bottomX + barWidth

    const barPath = `polygon(
      ${barTopX1}px 0px,
      ${barTopX2}px 0px,
      ${barBotX2}px ${height}px,
      ${barBotX1}px ${height}px
    )`

    const barVisible = phase !== 'hold'

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Revealed text region clipped by diagonal boundary */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath,
            WebkitClipPath: clipPath,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(40px, 10vw, 140px)',
              fontWeight: 800,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {word}
          </div>
        </div>

        {/* Diagonal sweep bar at the leading edge */}
        {barVisible && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              clipPath: barPath,
              WebkitClipPath: barPath,
              background: `linear-gradient(90deg, transparent, ${color}CC, transparent)`,
              opacity: 0.9,
              filter: `blur(2px) drop-shadow(0 0 8px ${color})`,
            }}
          />
        )}
      </div>
    )
  },
}

function DiagonalSweepComponent(props: MotionGraphicProps<DiagonalSweepConfig>) {
  ;(globalThis as any).__diagonalSweepConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-diagonal-sweep',
  title: 'Kinetic Diagonal Sweep',
  description: 'An angled diagonal line sweeps left-to-right across the frame, revealing text in a sharp parallelogram clip with a glowing leading edge',
  tags: ['kinetic', 'typography', 'diagonal', 'sweep', 'reveal', 'geometric', 'pattern', 'clip-path', 'angular'],
  category: 'captions',
  component: DiagonalSweepComponent as any,
  defaultConfig: {
    words: ['SLASH', 'SWEEP', 'CUT', 'ANGLE'],
    colors: ['#FFFFFF', '#FFD700', '#FF4444', '#00DDFF'],
    bgColor: '#0A0A0A',
    cycleDuration: 1.2,
    angle: 30,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SLASH', 'SWEEP', 'CUT', 'ANGLE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFD700', '#FF4444', '#00DDFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A0A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
    { key: 'angle', label: 'Sweep Angle (deg)', type: 'number', defaultValue: 30, min: 0, max: 60, group: 'Animation' },
  ],
})
