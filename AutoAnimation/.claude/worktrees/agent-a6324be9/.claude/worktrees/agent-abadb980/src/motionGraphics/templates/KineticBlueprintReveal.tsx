import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BlueprintRevealConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    const gridSpacing = 30
    const subGridSpacing = 10
    const gridColor = 'rgba(200, 220, 255, 0.12)'
    const subGridColor = 'rgba(200, 220, 255, 0.04)'
    const accentColor = 'rgba(200, 220, 255, 0.2)'

    // Slow pan effect
    const panX = (frame * 0.15) % gridSpacing
    const panY = (frame * 0.1) % gridSpacing

    // Corner markers
    const markerSize = 18

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Sub-grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: [
              `linear-gradient(90deg, ${subGridColor} 1px, transparent 1px)`,
              `linear-gradient(0deg, ${subGridColor} 1px, transparent 1px)`,
            ].join(', '),
            backgroundSize: `${subGridSpacing}px ${subGridSpacing}px`,
            backgroundPosition: `${panX}px ${panY}px`,
            pointerEvents: 'none',
          }}
        />
        {/* Main grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: [
              `linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`,
              `linear-gradient(0deg, ${gridColor} 1px, transparent 1px)`,
            ].join(', '),
            backgroundSize: `${gridSpacing}px ${gridSpacing}px`,
            backgroundPosition: `${panX}px ${panY}px`,
            pointerEvents: 'none',
          }}
        />
        {/* Blueprint border with corner marks */}
        <div
          style={{
            position: 'absolute',
            inset: 12,
            border: `1px solid ${accentColor}`,
            pointerEvents: 'none',
          }}
        />
        {/* Top-left corner mark */}
        <svg width={markerSize} height={markerSize} style={{ position: 'absolute', top: 6, left: 6, opacity: 0.3 }}>
          <line x1={0} y1={0} x2={markerSize} y2={0} stroke="#88AAFF" strokeWidth={1.5} />
          <line x1={0} y1={0} x2={0} y2={markerSize} stroke="#88AAFF" strokeWidth={1.5} />
        </svg>
        {/* Bottom-right corner mark */}
        <svg width={markerSize} height={markerSize} style={{ position: 'absolute', bottom: 6, right: 6, opacity: 0.3 }}>
          <line x1={markerSize} y1={markerSize} x2={0} y2={markerSize} stroke="#88AAFF" strokeWidth={1.5} />
          <line x1={markerSize} y1={markerSize} x2={markerSize} y2={0} stroke="#88AAFF" strokeWidth={1.5} />
        </svg>
        {/* Title block area */}
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            right: 14,
            width: 'clamp(80px, 18%, 160px)',
            height: 'clamp(30px, 6%, 50px)',
            border: `1px solid ${accentColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontFamily: "'Courier New', monospace", fontSize: 7, color: 'rgba(200,220,255,0.3)', letterSpacing: 2 }}>
            ARCH-PLAN
          </span>
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0

    if (phase === 'enter') {
      // Draw text like a blueprint pencil: stroke from left to right
      const drawProgress = Math.min(1, enterProgress * 1.4)
      const clipPercent = 100 - drawProgress * 100

      // Pencil cursor position
      const cursorX = drawProgress * 100

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* The text being drawn */}
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(44px, 12vw, 160px)',
              fontWeight: 700,
              color: 'transparent',
              WebkitTextStroke: `1.5px ${color}`,
              textShadow: `0 0 6px ${color}20`,
              whiteSpace: 'nowrap',
              letterSpacing: 8,
              textTransform: 'uppercase',
              clipPath: `inset(0 ${clipPercent}% 0 0)`,
            }}
          >
            {word}
          </div>
          {/* Drawing cursor */}
          {drawProgress < 0.95 && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: `${cursorX}%`,
                width: 3,
                height: 'clamp(30px, 8vw, 60px)',
                background: color,
                opacity: 0.7,
                transform: 'translateY(-50%)',
                boxShadow: `0 0 8px ${color}`,
              }}
            />
          )}
          {/* Dimension line below */}
          <div
            style={{
              position: 'absolute',
              bottom: -16,
              left: 0,
              right: `${clipPercent}%`,
              height: 1,
              background: `${color}40`,
            }}
          />
        </div>
      )
    } else if (phase === 'hold') {
      // Fully drawn, gentle glow pulse
      const pulse = 0.7 + Math.sin(holdProgress * Math.PI * 3) * 0.3

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(44px, 12vw, 160px)',
              fontWeight: 700,
              color: 'transparent',
              WebkitTextStroke: `1.5px ${color}`,
              textShadow: `0 0 ${4 + pulse * 8}px ${color}40, 0 0 ${10 + pulse * 12}px ${color}15`,
              whiteSpace: 'nowrap',
              letterSpacing: 8,
              textTransform: 'uppercase',
            }}
          >
            {word}
          </div>
          {/* Dimension line */}
          <div style={{ position: 'absolute', bottom: -16, left: 0, right: 0, height: 1, background: `${color}40` }} />
          {/* Dimension arrows */}
          <div style={{ position: 'absolute', bottom: -20, left: -2, width: 6, height: 6, borderLeft: `1px solid ${color}40`, borderBottom: `1px solid ${color}40`, transform: 'rotate(45deg)' }} />
          <div style={{ position: 'absolute', bottom: -20, right: -2, width: 6, height: 6, borderRight: `1px solid ${color}40`, borderBottom: `1px solid ${color}40`, transform: 'rotate(-45deg)' }} />
        </div>
      )
    } else {
      // Erase: fade from right to left
      const erasePercent = exitProgress * 100

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 1 - exitProgress * 0.4,
          }}
        >
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(44px, 12vw, 160px)',
              fontWeight: 700,
              color: 'transparent',
              WebkitTextStroke: `1.5px ${color}`,
              textShadow: `0 0 6px ${color}20`,
              whiteSpace: 'nowrap',
              letterSpacing: 8,
              textTransform: 'uppercase',
              clipPath: `inset(0 0 0 ${erasePercent}%)`,
            }}
          >
            {word}
          </div>
        </div>
      )
    }
  },
}

function BlueprintRevealComponent(props: MotionGraphicProps<BlueprintRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-blueprint-reveal',
  title: 'Kinetic Blueprint Reveal',
  description: 'Architectural blueprint text drawn stroke by stroke on a grid background with dimension lines, corner marks, and title block',
  tags: ['kinetic', 'typography', 'blueprint', 'architecture', 'technical', 'drawing', 'construction'],
  category: 'captions',
  component: BlueprintRevealComponent as any,
  defaultConfig: {
    words: ['DESIGN', 'BUILD', 'PLAN', 'DRAFT'],
    colors: ['#88BBFF', '#AACCFF', '#88BBFF', '#AACCFF'],
    bgColor: '#0A1628',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DESIGN', 'BUILD', 'PLAN', 'DRAFT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#88BBFF', '#AACCFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A1628', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
