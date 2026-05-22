import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WireframeConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Perspective grid lines
    const gridColor = 'rgba(0, 140, 255, 0.08)'
    const gridHighlight = 'rgba(0, 140, 255, 0.15)'

    // Horizontal grid lines with perspective converging toward center-top
    const horizontalLines: number[] = []
    for (let i = 0; i < 12; i++) {
      // Exponential spacing for perspective effect
      const t = i / 11
      const y = height * 0.3 + (height * 0.7) * (t * t)
      horizontalLines.push(y)
    }

    // Vertical grid lines converging to vanishing point
    const vanishX = width / 2
    const vanishY = height * 0.25
    const verticalCount = 14

    // Animation: grid slowly shifts
    const gridShift = (frame * 0.3) % 40

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Horizontal lines */}
          {horizontalLines.map((y, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={y}
              x2={width}
              y2={y}
              stroke={i % 3 === 0 ? gridHighlight : gridColor}
              strokeWidth={i % 3 === 0 ? 0.8 : 0.4}
            />
          ))}
          {/* Vertical converging lines */}
          {Array.from({ length: verticalCount }, (_, i) => {
            const t = (i / (verticalCount - 1)) * 2 - 1 // -1 to 1
            const bottomX = vanishX + t * width * 0.6
            const alpha = i % 3 === 0 ? 0.15 : 0.07
            return (
              <line
                key={`v${i}`}
                x1={vanishX}
                y1={vanishY}
                x2={bottomX}
                y2={height}
                stroke={`rgba(0, 140, 255, ${alpha})`}
                strokeWidth={0.5}
              />
            )
          })}
          {/* Vanishing point dot */}
          <circle cx={vanishX} cy={vanishY} r={2} fill="rgba(0, 140, 255, 0.2)" />
        </svg>
        {/* Blueprint border */}
        <div
          style={{
            position: 'absolute',
            inset: 8,
            border: '1px solid rgba(0, 140, 255, 0.08)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    if (phase === 'enter') {
      // Wireframe outline draws in: simulate with text-stroke reveal
      const opacity = Math.min(1, enterProgress * 2)
      // Clip from left
      const revealPercent = 100 - enterProgress * 100

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
          }}
        >
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 700,
              color: 'transparent',
              WebkitTextStroke: `2px ${color}`,
              textShadow: `0 0 8px ${color}30`,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textTransform: 'uppercase',
              clipPath: `inset(0 ${revealPercent}% 0 0)`,
            }}
          >
            {word}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Stable wireframe outline with subtle glow pulse
      const pulse = 0.6 + Math.sin(holdProgress * Math.PI * 4) * 0.4

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
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 700,
              color: 'transparent',
              WebkitTextStroke: `2px ${color}`,
              textShadow: `0 0 ${6 + pulse * 10}px ${color}, 0 0 ${15 + pulse * 15}px ${color}30`,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textTransform: 'uppercase',
            }}
          >
            {word}
          </div>
        </div>
      )
    } else {
      // Exit: outline fades
      const opacity = 1 - exitProgress

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${1 + exitProgress * 0.05})`,
            opacity,
          }}
        >
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 700,
              color: 'transparent',
              WebkitTextStroke: `2px ${color}`,
              textShadow: `0 0 8px ${color}30`,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textTransform: 'uppercase',
            }}
          >
            {word}
          </div>
        </div>
      )
    }
  },
}

function WireframeComponent(props: MotionGraphicProps<WireframeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-wireframe',
  title: 'Kinetic Wireframe',
  description: 'Blueprint wireframe aesthetic with perspective grid, text-stroke outlines, and blue-on-dark technical drawing feel',
  tags: ['kinetic', 'typography', 'wireframe', 'blueprint', 'tech', 'outline'],
  category: 'captions',
  component: WireframeComponent as any,
  defaultConfig: {
    words: ['FRAME', 'MESH', 'GRID', 'DRAW'],
    colors: ['#0088FF', '#00AAFF', '#0088FF', '#00AAFF'],
    bgColor: '#040810',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FRAME', 'MESH', 'GRID', 'DRAW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#0088FF', '#00AAFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#040810', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
