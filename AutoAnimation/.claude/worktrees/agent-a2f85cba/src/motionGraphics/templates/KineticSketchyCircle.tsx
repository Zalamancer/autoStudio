import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SketchyCircleConfig extends KineticBaseConfig {}

/**
 * Generate a rough/sketchy ellipse path with imperfections.
 * Returns an SVG path d-string for an imperfect circle.
 */
function sketchyEllipsePath(cx: number, cy: number, rx: number, ry: number, seed: number): string {
  const segments = 36
  const points: [number, number][] = []
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const noise = Math.sin(seed * 7 + i * 3.7) * 4 + Math.cos(seed * 11 + i * 5.3) * 3
    const x = cx + (rx + noise) * Math.cos(angle)
    const y = cy + (ry + noise * 0.8) * Math.sin(angle)
    points.push([x, y])
  }
  let d = `M ${points[0][0]} ${points[0][1]}`
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i][0]} ${points[i][1]}`
  }
  return d
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Subtle notebook grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'linear-gradient(rgba(100,130,180,0.08) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(100,130,180,0.08) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    const seed = index * 53 + 11
    const svgW = Math.min(width * 0.8, 600)
    const svgH = Math.min(height * 0.5, 200)
    const cx = svgW / 2
    const cy = svgH / 2
    const rx = svgW * 0.42
    const ry = svgH * 0.4
    const circlePath = sketchyEllipsePath(cx, cy, rx, ry, seed)
    // Approximate path length
    const pathLength = Math.PI * 2 * Math.sqrt((rx * rx + ry * ry) / 2) + 60

    if (phase === 'enter') {
      // Circle draws in, word fades in
      const circleDrawn = enterProgress
      const wordOpacity = Math.max(0, (enterProgress - 0.3) / 0.7)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width={svgW}
            height={svgH}
            viewBox={`0 0 ${svgW} ${svgH}`}
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          >
            <path
              d={circlePath}
              fill="none"
              stroke={color}
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={pathLength}
              strokeDashoffset={pathLength * (1 - circleDrawn)}
              opacity={0.7}
            />
          </svg>
          <div
            style={{
              position: 'relative',
              fontFamily: "'Segoe Print', 'Comic Sans MS', cursive",
              fontSize: 'clamp(36px, 9vw, 110px)',
              fontWeight: 700,
              color,
              opacity: wordOpacity,
              whiteSpace: 'nowrap',
            }}
          >
            {word}
          </div>
        </div>
      )
    }

    if (phase === 'hold') {
      // Circle wobbles slightly
      const wobbleScale = 1 + Math.sin(holdProgress * Math.PI * 4 + seed) * 0.015
      const wobbleRotation = Math.sin(holdProgress * Math.PI * 3 + seed * 2) * 1.5

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) rotate(${wobbleRotation}deg)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width={svgW}
            height={svgH}
            viewBox={`0 0 ${svgW} ${svgH}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scale(${wobbleScale})`,
            }}
          >
            <path
              d={circlePath}
              fill="none"
              stroke={color}
              strokeWidth={3}
              strokeLinecap="round"
              opacity={0.7}
            />
          </svg>
          <div
            style={{
              position: 'relative',
              fontFamily: "'Segoe Print', 'Comic Sans MS', cursive",
              fontSize: 'clamp(36px, 9vw, 110px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
            }}
          >
            {word}
          </div>
        </div>
      )
    }

    // Exit: circle erases (dashoffset reverses), word fades
    const circleErase = exitProgress
    const wordOpacity = 1 - exitProgress

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <path
            d={circlePath}
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={pathLength}
            strokeDashoffset={-pathLength * circleErase}
            opacity={0.7 * (1 - circleErase)}
          />
        </svg>
        <div
          style={{
            position: 'relative',
            fontFamily: "'Segoe Print', 'Comic Sans MS', cursive",
            fontSize: 'clamp(36px, 9vw, 110px)',
            fontWeight: 700,
            color,
            opacity: wordOpacity,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function SketchyCircleComponent(props: MotionGraphicProps<SketchyCircleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sketchy-circle',
  title: 'Kinetic Sketchy Circle',
  description: 'Hand-drawn sketchy circle draws around word with imperfect strokes and notebook background',
  tags: ['kinetic', 'typography', 'sketchy', 'circle', 'handdrawn', 'notebook', 'organic', 'doodle'],
  category: 'captions',
  component: SketchyCircleComponent as any,
  defaultConfig: {
    words: ['FOCUS', 'BREATHE', 'RELAX', 'FLOW'],
    colors: ['#2C3E50', '#E74C3C', '#3498DB', '#27AE60'],
    bgColor: '#FFFEF5',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FOCUS', 'BREATHE', 'RELAX', 'FLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2C3E50', '#E74C3C', '#3498DB', '#27AE60'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFEF5', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
