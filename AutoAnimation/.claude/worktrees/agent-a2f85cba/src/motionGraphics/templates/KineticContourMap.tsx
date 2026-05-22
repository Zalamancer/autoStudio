import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ContourMapConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Topographic contour background
    const cx = width / 2
    const cy = height / 2
    const contourCount = 14
    const contourColor = 'rgba(120, 180, 80, 0.08)'
    const indexColor = 'rgba(120, 180, 80, 0.16)'

    // Generate organic contour rings with slight perturbation
    const contours: string[] = []
    for (let c = 1; c <= contourCount; c++) {
      const baseRadius = c * Math.min(width, height) * 0.04
      const points: string[] = []
      const segments = 36
      for (let s = 0; s <= segments; s++) {
        const angle = (s / segments) * Math.PI * 2
        // Perturbation for organic shape
        const perturb = seededRand(c * 100 + s) * 15 + Math.sin(angle * 3 + c) * 8
        const animOffset = Math.sin(frame * 0.01 + c * 0.5 + angle * 2) * 2
        const r = baseRadius + perturb + animOffset
        const px = cx + Math.cos(angle) * r * 1.3
        const py = cy + Math.sin(angle) * r
        points.push(`${px},${py}`)
      }
      contours.push(points.join(' '))
    }

    // Elevation labels
    const elevLabels = contours.map((_, i) => {
      const elev = 100 + i * 20
      const angle = Math.PI * 0.3
      const baseRadius = (i + 1) * Math.min(width, height) * 0.04
      const lx = cx + Math.cos(angle) * baseRadius * 1.3
      const ly = cy + Math.sin(angle) * baseRadius
      return { x: lx, y: ly, elev }
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {contours.map((pts, i) => (
            <polyline key={`c${i}`} points={pts}
              fill="none" stroke={i % 5 === 0 ? indexColor : contourColor}
              strokeWidth={i % 5 === 0 ? 0.8 : 0.4} />
          ))}
          {/* Elevation labels on index contours */}
          {elevLabels.filter((_, i) => i % 5 === 0).map((l, i) => (
            <text key={`el${i}`} x={l.x} y={l.y - 3}
              fill="rgba(120, 180, 80, 0.25)" fontSize={7}
              fontFamily="'Courier New', monospace">{l.elev}m</text>
          ))}
          {/* Peak marker */}
          <text x={cx} y={cy + 4} textAnchor="middle"
            fill="rgba(120, 180, 80, 0.2)" fontSize={10} fontFamily="'Courier New', monospace">+</text>
          <text x={cx + 8} y={cy + 3}
            fill="rgba(120, 180, 80, 0.15)" fontSize={7} fontFamily="'Courier New', monospace">
            {100 + contourCount * 20}m
          </text>
          {/* North arrow */}
          <line x1={width - 25} y1={30} x2={width - 25} y2={15}
            stroke="rgba(120, 180, 80, 0.2)" strokeWidth={1} />
          <polygon points={`${width - 25},12 ${width - 28},20 ${width - 22},20`}
            fill="rgba(120, 180, 80, 0.2)" />
          <text x={width - 25} y={10} textAnchor="middle"
            fill="rgba(120, 180, 80, 0.2)" fontSize={7} fontFamily="'Courier New', monospace">N</text>
          {/* Scale bar */}
          <line x1={15} y1={height - 15} x2={65} y2={height - 15}
            stroke="rgba(120, 180, 80, 0.15)" strokeWidth={1} />
          <line x1={15} y1={height - 18} x2={15} y2={height - 12}
            stroke="rgba(120, 180, 80, 0.15)" strokeWidth={0.5} />
          <line x1={65} y1={height - 18} x2={65} y2={height - 12}
            stroke="rgba(120, 180, 80, 0.15)" strokeWidth={0.5} />
          <text x={40} y={height - 20} textAnchor="middle"
            fill="rgba(120, 180, 80, 0.15)" fontSize={6} fontFamily="'Courier New', monospace">100m</text>
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height, frame }: WordRenderProps) => {
    // Text formed by contour lines converging
    const fontSize = Math.min(width / (word.length * 0.6), 130)

    if (phase === 'enter') {
      // Contour rings shrink and converge to form text outline
      const t = enterProgress
      const ease = 1 - Math.pow(1 - t, 3)
      // Start as transparent outline, fill in
      const strokeOpacity = 1 - ease * 0.5
      const fillOpacity = ease
      // Multiple contour "rings" around text that collapse inward
      const rings = 5
      const maxOffset = 20 * (1 - ease)

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {Array.from({ length: rings }, (_, r) => {
            const offset = maxOffset * ((r + 1) / rings)
            const ringOpacity = (1 - r / rings) * (1 - ease * 0.7) * 0.5
            return (
              <div key={`r${r}`} style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontFamily: "'Courier New', monospace",
                fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
                fontWeight: 700,
                color: 'transparent',
                WebkitTextStroke: `${1 + r * 0.3}px ${color}`,
                textTransform: 'uppercase',
                letterSpacing: 3,
                whiteSpace: 'nowrap',
                opacity: ringOpacity,
                filter: `blur(${offset * 0.3}px)`,
                textShadow: 'none',
              }}>
                {word}
              </div>
            )
          })}
          {/* Main text */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 700,
            color: fillOpacity > 0.5 ? color : 'transparent',
            WebkitTextStroke: `1.5px ${color}`,
            textTransform: 'uppercase',
            letterSpacing: 3,
            whiteSpace: 'nowrap',
            opacity: ease,
          }}>
            {word}
          </div>
          {/* Elevation label */}
          {ease > 0.5 && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(${fontSize * word.length * 0.3}px, ${-fontSize * 0.3}px)`,
              fontFamily: "'Courier New', monospace",
              fontSize: 9,
              color: `${color}50`,
              opacity: (ease - 0.5) * 2,
            }}>
              +{Math.round(380 + ease * 20)}m
            </div>
          )}
        </div>
      )
    } else if (phase === 'hold') {
      // Stable with subtle contour shimmer
      const shimmer = Math.sin(holdProgress * Math.PI * 4) * 0.15

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Faint outer contour ring */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 700,
            color: 'transparent',
            WebkitTextStroke: `2px ${color}`,
            textTransform: 'uppercase',
            letterSpacing: 3,
            whiteSpace: 'nowrap',
            opacity: 0.15 + shimmer,
            filter: 'blur(3px)',
          }}>
            {word}
          </div>
          {/* Main text */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 700,
            color,
            WebkitTextStroke: `1px ${color}`,
            textTransform: 'uppercase',
            letterSpacing: 3,
            whiteSpace: 'nowrap',
          }}>
            {word}
          </div>
          {/* Elevation label */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(${fontSize * word.length * 0.3}px, ${-fontSize * 0.3}px)`,
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: `${color}50`,
          }}>
            +400m
          </div>
        </div>
      )
    } else {
      // Exit: contour lines expand outward and dissolve
      const t = exitProgress
      const ease = t * t
      const rings = 4

      return (
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - ease }}>
          {Array.from({ length: rings }, (_, r) => {
            const offset = ease * 15 * ((r + 1) / rings)
            return (
              <div key={`er${r}`} style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontFamily: "'Courier New', monospace",
                fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
                fontWeight: 700,
                color: 'transparent',
                WebkitTextStroke: `${1 + r * 0.4}px ${color}`,
                textTransform: 'uppercase',
                letterSpacing: 3,
                whiteSpace: 'nowrap',
                opacity: (1 - r / rings) * 0.4 * (1 - ease),
                filter: `blur(${offset * 0.5}px)`,
              }}>
                {word}
              </div>
            )
          })}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: 3,
            whiteSpace: 'nowrap',
          }}>
            {word}
          </div>
        </div>
      )
    }
  },
}

function ContourMapComponent(props: MotionGraphicProps<ContourMapConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-contour-map',
  title: 'Contour Map',
  description: 'Topographic contour lines forming letter shapes with elevation labels, north arrow, scale bar, and organic contour ring background',
  tags: ['kinetic', 'typography', 'contour', 'topographic', 'map', 'elevation', 'terrain', 'technical'],
  category: 'captions',
  component: ContourMapComponent as any,
  defaultConfig: {
    words: ['PEAK', 'RIDGE', 'VALE', 'MESA'],
    colors: ['#78B450', '#90D468', '#78B450', '#90D468'],
    bgColor: '#0a100c',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PEAK', 'RIDGE', 'VALE', 'MESA'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#78B450', '#90D468'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a100c', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
