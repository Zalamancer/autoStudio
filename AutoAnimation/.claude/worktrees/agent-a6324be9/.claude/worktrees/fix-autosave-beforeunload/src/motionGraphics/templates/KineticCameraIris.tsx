import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CameraIrisConfig extends KineticBaseConfig {
  bladeCount: number
}

function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
}

/**
 * Compute a multi-blade iris polygon clip-path.
 * openAmount: 0 = fully closed (tiny polygon near center), 1 = fully open (blades retracted)
 * Each blade is a thin wedge. The "closed" state is a polygon with blades interleaved
 * blocking the center.
 */
function irisClipPath(bladeCount: number, openAmount: number): string {
  if (openAmount >= 0.999) return 'none'
  if (openAmount <= 0.001) return 'polygon(50% 50%, 50% 50%, 50% 50%)'

  // The iris opening is approximated as a polygon with 2*bladeCount sides
  // At open=0 the "opening" collapses to a point at center
  // At open=1 the "opening" is larger than the frame
  const cx = 50
  const cy = 50
  const maxR = 85 // % — large enough to clear frame corners
  const openR = openAmount * maxR

  const points: string[] = []
  const n = bladeCount * 2 // vertices of the iris polygon

  // Each blade edge alternates between being pushed slightly inward (blade tip)
  // and the outer radius — giving the characteristic multi-petal aperture shape
  for (let i = 0; i < n; i++) {
    const angle = ((i / n) * 360 - 90) * (Math.PI / 180)
    // Alternate between inner and outer ring to create blade edges
    const isOuter = i % 2 === 0
    const bladeInset = isOuter ? 1.0 : Math.max(0.05, openAmount * 0.85)
    const r = openR * bladeInset
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    points.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`)
  }

  return `polygon(${points.join(', ')})`
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__cameraIrisConfig ?? { bladeCount: 6 }
    const bladeCount = Math.max(3, Math.min(12, config.bladeCount ?? 6))

    let openAmount = 0
    if (phase === 'enter') {
      openAmount = easeInOutQuart(enterProgress)
    } else if (phase === 'hold') {
      openAmount = 1
    } else {
      openAmount = 1 - easeInOutQuart(exitProgress)
    }

    const clipPath = irisClipPath(bladeCount, openAmount)

    // Blade overlay ring — the mechanical border of the iris
    const ringSize = Math.min(width, height) * 0.96
    const ringR = ringSize / 2
    const openingR = openAmount * ringR * 0.9

    // Draw blade outlines as SVG lines from center ring to outer rim
    const blades = []
    for (let i = 0; i < bladeCount; i++) {
      const angle = ((i / bladeCount) * 360 - 90 + (1 - openAmount) * 15) * (Math.PI / 180)
      const innerR = openingR
      const outerR = ringR * 0.98
      const x1 = width / 2 + Math.cos(angle) * innerR
      const y1 = height / 2 + Math.sin(angle) * innerR
      const x2 = width / 2 + Math.cos(angle) * outerR
      const y2 = height / 2 + Math.sin(angle) * outerR
      blades.push(
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth={1.5}
          opacity={0.3}
        />,
      )
    }

    return (
      <>
        {/* Text revealed through iris opening */}
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
        {/* Iris blade mechanism overlay */}
        <svg
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          width={width}
          height={height}
        >
          {/* Outer iris ring */}
          <circle
            cx={width / 2}
            cy={height / 2}
            r={ringR * 0.97}
            fill="none"
            stroke={color}
            strokeWidth={1}
            opacity={0.2}
          />
          {/* Inner iris edge — opening perimeter */}
          {openAmount > 0.01 && (
            <circle
              cx={width / 2}
              cy={height / 2}
              r={openingR}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              opacity={Math.min(0.5, openAmount)}
            />
          )}
          {blades}
        </svg>
      </>
    )
  },
}

function CameraIrisComponent(props: MotionGraphicProps<CameraIrisConfig>) {
  ;(globalThis as any).__cameraIrisConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-camera-iris',
  title: 'Kinetic Camera Iris',
  description: 'Multi-blade camera aperture iris opens from closed to reveal text through the aperture polygon',
  tags: ['kinetic', 'typography', 'camera', 'iris', 'aperture', 'blades', 'reveal', 'mechanical'],
  category: 'captions',
  component: CameraIrisComponent as any,
  defaultConfig: {
    words: ['FOCUS', 'SHOOT', 'EXPOSE', 'OPEN'],
    colors: ['#E8E0D0', '#C8B89A', '#F0EAE0', '#B0A090'],
    bgColor: '#0d0d0d',
    cycleDuration: 1.4,
    bladeCount: 6,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['FOCUS', 'SHOOT', 'EXPOSE', 'OPEN'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8E0D0', '#C8B89A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d0d', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'bladeCount',
      label: 'Blade Count',
      type: 'number',
      defaultValue: 6,
      min: 3,
      max: 12,
      group: 'Animation',
    },
  ],
})
