import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ClockWipeConfig extends KineticBaseConfig {}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * Generate a conic clip-path polygon that reveals a radial sweep from 12-o'clock.
 * sweepAngle: 0 = nothing visible, 360 = fully visible.
 */
function conicClipPath(sweepAngle: number): string {
  if (sweepAngle <= 0) return 'polygon(50% 50%, 50% 50%, 50% 50%)'
  if (sweepAngle >= 360) return 'none'

  const cx = 50
  const cy = 50
  const r = 80 // radius large enough to cover corners

  const points: string[] = [`${cx}% ${cy}%`, `${cx}% ${cy - r}%`] // center + 12 o'clock

  // Add corner points that the sweep has passed
  const cornerAngles = [
    { angle: 45, x: cx + r, y: cy - r },   // top-right
    { angle: 135, x: cx + r, y: cy + r },   // bottom-right
    { angle: 225, x: cx - r, y: cy + r },   // bottom-left
    { angle: 315, x: cx - r, y: cy - r },   // top-left
  ]

  for (const corner of cornerAngles) {
    if (sweepAngle > corner.angle) {
      points.push(`${corner.x}% ${corner.y}%`)
    }
  }

  // Add the sweep edge point
  const edgeRad = ((sweepAngle - 90) * Math.PI) / 180
  const edgeX = cx + Math.cos(edgeRad) * r
  const edgeY = cy + Math.sin(edgeRad) * r
  points.push(`${edgeX}% ${edgeY}%`)

  return `polygon(${points.join(', ')})`
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    // Subtle clock tick marks around the center
    const ticks = []
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 - 90) * (Math.PI / 180)
      const innerR = Math.min(width, height) * 0.38
      const outerR = Math.min(width, height) * 0.42
      const x1 = width / 2 + Math.cos(angle) * innerR
      const y1 = height / 2 + Math.sin(angle) * innerR
      const x2 = width / 2 + Math.cos(angle) * outerR
      const y2 = height / 2 + Math.sin(angle) * outerR

      ticks.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: Math.min(x1, x2),
            top: Math.min(y1, y2),
            width: Math.abs(x2 - x1) || 2,
            height: Math.abs(y2 - y1) || 2,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 1,
          }}
        />,
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {ticks}
        {/* Faint circular guide */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: Math.min(width, height) * 0.84,
            height: Math.min(width, height) * 0.84,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    let sweepAngle = 0
    let handAngle = -90 // start at 12 o'clock
    let handOpacity = 0

    if (phase === 'enter') {
      const eased = easeInOutCubic(enterProgress)
      sweepAngle = eased * 360
      handAngle = -90 + eased * 360
      handOpacity = enterProgress < 0.9 ? 0.7 : (1 - enterProgress) * 7
    } else if (phase === 'hold') {
      sweepAngle = 360 // fully visible
      handOpacity = 0
    } else {
      const eased = easeInOutCubic(exitProgress)
      // Reverse wipe
      sweepAngle = (1 - eased) * 360
      handAngle = -90 + (1 - eased) * 360
      handOpacity = exitProgress > 0.1 && exitProgress < 0.9 ? 0.5 : 0
    }

    const clipPath = sweepAngle >= 360 ? 'none' : conicClipPath(sweepAngle)
    const handRad = (handAngle * Math.PI) / 180
    const handLength = Math.min(width, height) * 0.35
    const handEndX = width / 2 + Math.cos(handRad) * handLength
    const handEndY = height / 2 + Math.sin(handRad) * handLength

    return (
      <>
        {/* Text clipped by the clock wipe */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            clipPath,
          }}
        >
          {word}
        </div>
        {/* Clock hand / radar sweep line */}
        {handOpacity > 0 && (
          <svg
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            width={width}
            height={height}
          >
            <line
              x1={width / 2}
              y1={height / 2}
              x2={handEndX}
              y2={handEndY}
              stroke={color}
              strokeWidth={2}
              opacity={handOpacity}
            />
            <circle
              cx={width / 2}
              cy={height / 2}
              r={4}
              fill={color}
              opacity={handOpacity}
            />
          </svg>
        )}
      </>
    )
  },
}

function ClockWipeComponent(props: MotionGraphicProps<ClockWipeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-clock-wipe',
  title: 'Kinetic Clock Wipe',
  description: 'Radial clock-hand sweep reveals text like a radar scan with a rotating wipe edge',
  tags: ['kinetic', 'typography', 'clock', 'wipe', 'radar', 'radial', 'geometric', 'mechanical'],
  category: 'captions',
  component: ClockWipeComponent as any,
  defaultConfig: {
    words: ['TIME', 'TICK', 'SWEEP', 'CLOCK'],
    colors: ['#00FFB3', '#00DDFF', '#FFD700', '#FF6BFF'],
    bgColor: '#0a0a18',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TIME', 'TICK', 'SWEEP', 'CLOCK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFB3', '#00DDFF', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a18', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
