import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SectionCutConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Architectural drawing background with section markers
    const gridColor = 'rgba(140, 120, 100, 0.06)'
    const accentColor = 'rgba(200, 60, 60, 0.25)'

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Fine grid */}
          {Array.from({ length: Math.ceil(width / 25) }, (_, i) => (
            <line key={`vg${i}`} x1={i * 25} y1={0} x2={i * 25} y2={height}
              stroke={gridColor} strokeWidth={0.3} />
          ))}
          {Array.from({ length: Math.ceil(height / 25) }, (_, i) => (
            <line key={`hg${i}`} x1={0} y1={i * 25} x2={width} y2={i * 25}
              stroke={gridColor} strokeWidth={0.3} />
          ))}
          {/* Section cut line (dashed-dot-dashed pattern) */}
          <line x1={width * 0.08} y1={height * 0.5} x2={width * 0.92} y2={height * 0.5}
            stroke={accentColor} strokeWidth={1.2} strokeDasharray="12 4 2 4" />
          {/* Section arrows at ends */}
          <polygon points={`${width * 0.08},${height * 0.5 - 8} ${width * 0.08},${height * 0.5 + 8} ${width * 0.08 - 10},${height * 0.5}`}
            fill={accentColor} />
          <polygon points={`${width * 0.92},${height * 0.5 - 8} ${width * 0.92},${height * 0.5 + 8} ${width * 0.92 + 10},${height * 0.5}`}
            fill={accentColor} />
          {/* Section labels */}
          <circle cx={width * 0.08} cy={height * 0.5 - 20} r={10} fill="none" stroke={accentColor} strokeWidth={0.8} />
          <text x={width * 0.08} y={height * 0.5 - 16} textAnchor="middle" fill="rgba(200, 60, 60, 0.5)" fontSize={11} fontFamily="'Courier New', monospace">A</text>
          <circle cx={width * 0.92} cy={height * 0.5 - 20} r={10} fill="none" stroke={accentColor} strokeWidth={0.8} />
          <text x={width * 0.92} y={height * 0.5 - 16} textAnchor="middle" fill="rgba(200, 60, 60, 0.5)" fontSize={11} fontFamily="'Courier New', monospace">A</text>
          {/* Material hatch patterns (diagonal lines in section areas) */}
          {Array.from({ length: 30 }, (_, i) => {
            const x = (i * 24) + ((frame * 0.2) % 24)
            return (
              <line key={`h${i}`} x1={x} y1={height * 0.5 + 2} x2={x + 15} y2={height * 0.5 + 17}
                stroke="rgba(140, 120, 100, 0.06)" strokeWidth={0.5} />
            )
          })}
          {/* Drawing border */}
          <rect x={4} y={4} width={width - 8} height={height - 8} fill="none" stroke="rgba(140, 120, 100, 0.1)" strokeWidth={0.5} />
          {/* Title block hint */}
          <line x1={width - 120} y1={height - 30} x2={width - 6} y2={height - 30}
            stroke="rgba(140, 120, 100, 0.1)" strokeWidth={0.5} />
          <text x={width - 115} y={height - 18} fill="rgba(140, 120, 100, 0.15)" fontSize={7} fontFamily="'Courier New', monospace">SECTION A-A</text>
          <text x={width - 115} y={height - 9} fill="rgba(140, 120, 100, 0.1)" fontSize={6} fontFamily="'Courier New', monospace">SCALE 1:1</text>
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    // Section cut reveals text in layers -- top half slides up, bottom half slides down
    const fontSize = Math.min(width / (word.length * 0.6), 140)
    const cutY = height * 0.5

    if (phase === 'enter') {
      // Cut line sweeps across, then text layers separate
      const sweepProgress = Math.min(1, enterProgress * 2.5)
      const separateProgress = Math.max(0, (enterProgress - 0.4) / 0.6)
      const ease = 1 - Math.pow(1 - separateProgress, 3)
      const separation = ease * 12
      const clipWidth = sweepProgress * 100

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Top half of text */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% - ${separation}px))`,
            clipPath: `inset(0 ${100 - clipWidth}% 50% 0)`,
            fontFamily: "'Courier New', monospace",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: 4,
            whiteSpace: 'nowrap',
          }}>
            {word}
          </div>
          {/* Bottom half with hatch fill */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${separation}px))`,
            clipPath: `inset(50% ${100 - clipWidth}% 0 0)`,
            fontFamily: "'Courier New', monospace",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: 4,
            whiteSpace: 'nowrap',
          }}>
            {word}
          </div>
          {/* Hatch fill in the gap */}
          {separation > 2 && (
            <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              {Array.from({ length: Math.ceil(width / 8) }, (_, i) => (
                <line key={`ht${i}`}
                  x1={width * 0.2 + i * 8} y1={cutY - separation + 1}
                  x2={width * 0.2 + i * 8 + separation * 2} y2={cutY + separation - 1}
                  stroke={`${color}20`} strokeWidth={0.6} />
              ))}
            </svg>
          )}
          {/* Cut sweep indicator */}
          {sweepProgress < 1 && (
            <div style={{
              position: 'absolute',
              left: `${sweepProgress * 100}%`,
              top: cutY - 20,
              width: 2,
              height: 40,
              background: 'rgba(200, 60, 60, 0.6)',
            }} />
          )}
        </div>
      )
    } else if (phase === 'hold') {
      const breathe = Math.sin(holdProgress * Math.PI * 2) * 2
      const separation = 12 + breathe

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% - ${separation}px))`,
            clipPath: 'inset(0 0 50% 0)',
            fontFamily: "'Courier New', monospace",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: 4,
            whiteSpace: 'nowrap',
          }}>
            {word}
          </div>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${separation}px))`,
            clipPath: 'inset(50% 0 0 0)',
            fontFamily: "'Courier New', monospace",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: 4,
            whiteSpace: 'nowrap',
          }}>
            {word}
          </div>
          {/* Hatch pattern in gap */}
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {Array.from({ length: Math.ceil(width / 8) }, (_, i) => (
              <line key={`hh${i}`}
                x1={width * 0.2 + i * 8} y1={cutY - separation + 2}
                x2={width * 0.2 + i * 8 + separation * 2} y2={cutY + separation - 2}
                stroke={`${color}15`} strokeWidth={0.6} />
            ))}
          </svg>
          {/* Material labels */}
          <div style={{
            position: 'absolute',
            right: '12%',
            top: cutY - separation - 16,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: `${color}40`,
            letterSpacing: 1,
          }}>
            CONCRETE
          </div>
          <div style={{
            position: 'absolute',
            right: '12%',
            top: cutY + separation + 4,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: `${color}40`,
            letterSpacing: 1,
          }}>
            STEEL
          </div>
        </div>
      )
    } else {
      // Exit: layers collapse back together and fade
      const collapse = exitProgress
      const separation = 12 * (1 - collapse)
      const opacity = 1 - exitProgress

      return (
        <div style={{ position: 'absolute', inset: 0, opacity }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% - ${separation}px))`,
            clipPath: 'inset(0 0 50% 0)',
            fontFamily: "'Courier New', monospace",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: 4,
            whiteSpace: 'nowrap',
          }}>
            {word}
          </div>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${separation}px))`,
            clipPath: 'inset(50% 0 0 0)',
            fontFamily: "'Courier New', monospace",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: 4,
            whiteSpace: 'nowrap',
          }}>
            {word}
          </div>
        </div>
      )
    }
  },
}

function SectionCutComponent(props: MotionGraphicProps<SectionCutConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-section-cut',
  title: 'Section Cut',
  description: 'Architectural section cut through text revealing internal structure layers with hatch patterns, material labels, and A-A section markers',
  tags: ['kinetic', 'typography', 'section', 'architecture', 'technical', 'cut', 'hatch', 'drawing'],
  category: 'captions',
  component: SectionCutComponent as any,
  defaultConfig: {
    words: ['SECTION', 'CUT', 'PLAN', 'ELEV'],
    colors: ['#C8A882', '#E0C8A0', '#C8A882', '#E0C8A0'],
    bgColor: '#0f0e0c',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SECTION', 'CUT', 'PLAN', 'ELEV'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C8A882', '#E0C8A0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0e0c', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
  ],
})
