import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DimensionLineConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    const gridColor = 'rgba(120, 160, 200, 0.05)'
    const majorColor = 'rgba(120, 160, 200, 0.1)'

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Minor grid */}
          {Array.from({ length: Math.ceil(width / 20) + 1 }, (_, i) => (
            <line key={`vg${i}`} x1={i * 20} y1={0} x2={i * 20} y2={height}
              stroke={i % 5 === 0 ? majorColor : gridColor} strokeWidth={i % 5 === 0 ? 0.5 : 0.2} />
          ))}
          {Array.from({ length: Math.ceil(height / 20) + 1 }, (_, i) => (
            <line key={`hg${i}`} x1={0} y1={i * 20} x2={width} y2={i * 20}
              stroke={i % 5 === 0 ? majorColor : gridColor} strokeWidth={i % 5 === 0 ? 0.5 : 0.2} />
          ))}
          {/* Scattered dimension annotations on background */}
          {[
            { x1: width * 0.1, y: height * 0.2, x2: width * 0.35, label: '450' },
            { x1: width * 0.65, y: height * 0.8, x2: width * 0.9, label: '320' },
          ].map((dim, i) => {
            const opacity = 0.12 + Math.sin(frame * 0.03 + i * 2) * 0.04
            return (
              <g key={`bg-dim${i}`} opacity={opacity}>
                {/* Extension lines */}
                <line x1={dim.x1} y1={dim.y - 8} x2={dim.x1} y2={dim.y + 8} stroke="rgba(120, 160, 200, 1)" strokeWidth={0.4} />
                <line x1={dim.x2} y1={dim.y - 8} x2={dim.x2} y2={dim.y + 8} stroke="rgba(120, 160, 200, 1)" strokeWidth={0.4} />
                {/* Dimension line */}
                <line x1={dim.x1} y1={dim.y} x2={dim.x2} y2={dim.y} stroke="rgba(120, 160, 200, 1)" strokeWidth={0.4} />
                {/* Arrows */}
                <polygon points={`${dim.x1},${dim.y} ${dim.x1 + 6},${dim.y - 2.5} ${dim.x1 + 6},${dim.y + 2.5}`}
                  fill="rgba(120, 160, 200, 1)" />
                <polygon points={`${dim.x2},${dim.y} ${dim.x2 - 6},${dim.y - 2.5} ${dim.x2 - 6},${dim.y + 2.5}`}
                  fill="rgba(120, 160, 200, 1)" />
                <text x={(dim.x1 + dim.x2) / 2} y={dim.y - 4} textAnchor="middle"
                  fill="rgba(120, 160, 200, 1)" fontSize={8} fontFamily="'Courier New', monospace">{dim.label}</text>
              </g>
            )
          })}
          {/* Drawing border */}
          <rect x={3} y={3} width={width - 6} height={height - 6} fill="none" stroke="rgba(120, 160, 200, 0.08)" strokeWidth={0.5} />
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const fontSize = Math.min(width / (word.length * 0.6), 130)
    const textWidth = word.length * fontSize * 0.6
    const centerX = width / 2
    const centerY = height / 2
    const dimLineY = centerY - fontSize * 0.75
    const leftX = centerX - textWidth / 2 - 30
    const rightX = centerX + textWidth / 2 + 30
    const measurement = Math.round(textWidth)

    if (phase === 'enter') {
      // Dimension lines draw in first, then text appears between them
      const lineProgress = Math.min(1, enterProgress * 2.5)
      const textProgress = Math.max(0, (enterProgress - 0.4) / 0.6)
      const lineEase = 1 - Math.pow(1 - lineProgress, 2)
      const textEase = 1 - Math.pow(1 - textProgress, 3)

      const lineLength = (rightX - leftX) * lineEase
      const currentRight = leftX + lineLength

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
            {/* Left extension line */}
            <line x1={leftX} y1={dimLineY - 15 * lineEase} x2={leftX} y2={dimLineY + 15 * lineEase}
              stroke={color} strokeWidth={0.8} opacity={lineEase * 0.7} />
            {/* Right extension line */}
            {lineEase > 0.8 && (
              <line x1={currentRight} y1={dimLineY - 15 * lineEase} x2={currentRight} y2={dimLineY + 15 * lineEase}
                stroke={color} strokeWidth={0.8} opacity={(lineEase - 0.8) * 5 * 0.7} />
            )}
            {/* Dimension line */}
            <line x1={leftX} y1={dimLineY} x2={currentRight} y2={dimLineY}
              stroke={color} strokeWidth={0.8} opacity={lineEase * 0.7} />
            {/* Left arrow */}
            <polygon points={`${leftX},${dimLineY} ${leftX + 8},${dimLineY - 3} ${leftX + 8},${dimLineY + 3}`}
              fill={color} opacity={lineEase * 0.7} />
            {/* Right arrow */}
            {lineEase > 0.8 && (
              <polygon points={`${currentRight},${dimLineY} ${currentRight - 8},${dimLineY - 3} ${currentRight - 8},${dimLineY + 3}`}
                fill={color} opacity={(lineEase - 0.8) * 5 * 0.7} />
            )}
            {/* Measurement text */}
            {lineEase > 0.5 && (
              <text x={centerX} y={dimLineY - 6} textAnchor="middle"
                fill={color} fontSize={10} fontFamily="'Courier New', monospace"
                opacity={(lineEase - 0.5) * 2 * 0.6}>{measurement}px</text>
            )}
          </svg>
          {/* Main word */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scaleX(${textEase})`,
            transformOrigin: 'center',
            opacity: textEase,
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
    } else if (phase === 'hold') {
      const pulse = 0.85 + Math.sin(holdProgress * Math.PI * 3) * 0.15

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
            {/* Extension lines */}
            <line x1={leftX} y1={dimLineY - 15} x2={leftX} y2={dimLineY + 15}
              stroke={color} strokeWidth={0.8} opacity={0.7} />
            <line x1={rightX} y1={dimLineY - 15} x2={rightX} y2={dimLineY + 15}
              stroke={color} strokeWidth={0.8} opacity={0.7} />
            {/* Dimension line */}
            <line x1={leftX} y1={dimLineY} x2={rightX} y2={dimLineY}
              stroke={color} strokeWidth={0.8} opacity={0.7} />
            {/* Arrows */}
            <polygon points={`${leftX},${dimLineY} ${leftX + 8},${dimLineY - 3} ${leftX + 8},${dimLineY + 3}`}
              fill={color} opacity={0.7} />
            <polygon points={`${rightX},${dimLineY} ${rightX - 8},${dimLineY - 3} ${rightX - 8},${dimLineY + 3}`}
              fill={color} opacity={0.7} />
            {/* Measurement */}
            <text x={centerX} y={dimLineY - 6} textAnchor="middle"
              fill={color} fontSize={10} fontFamily="'Courier New', monospace" opacity={0.6 * pulse}>{measurement}px</text>
            {/* Vertical dimension on left side */}
            <line x1={leftX - 20} y1={centerY - fontSize * 0.4} x2={leftX - 20} y2={centerY + fontSize * 0.4}
              stroke={color} strokeWidth={0.5} opacity={0.35} />
            <text x={leftX - 24} y={centerY + 3} textAnchor="end"
              fill={color} fontSize={8} fontFamily="'Courier New', monospace" opacity={0.3}>{Math.round(fontSize * 0.8)}px</text>
          </svg>
          {/* Main word */}
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
    } else {
      const opacity = 1 - exitProgress
      const shrink = 1 - exitProgress * 0.3

      return (
        <div style={{ position: 'absolute', inset: 0, opacity }}>
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
            <line x1={leftX} y1={dimLineY - 15} x2={leftX} y2={dimLineY + 15}
              stroke={color} strokeWidth={0.8} opacity={0.7} />
            <line x1={rightX} y1={dimLineY - 15} x2={rightX} y2={dimLineY + 15}
              stroke={color} strokeWidth={0.8} opacity={0.7} />
            <line x1={leftX} y1={dimLineY} x2={rightX} y2={dimLineY}
              stroke={color} strokeWidth={0.8} opacity={0.7} />
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scaleX(${shrink})`,
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

function DimensionLineComponent(props: MotionGraphicProps<DimensionLineConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dimension-line',
  title: 'Dimension Line',
  description: 'Text between architectural dimension lines with arrows, measurement annotations, extension lines, and engineering drawing grid',
  tags: ['kinetic', 'typography', 'dimension', 'measurement', 'architecture', 'technical', 'engineering', 'annotation'],
  category: 'captions',
  component: DimensionLineComponent as any,
  defaultConfig: {
    words: ['WIDTH', 'SPAN', 'DEPTH', 'RISE'],
    colors: ['#78A0C8', '#90B8E0', '#78A0C8', '#90B8E0'],
    bgColor: '#0a0e14',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WIDTH', 'SPAN', 'DEPTH', 'RISE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#78A0C8', '#90B8E0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0e14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
