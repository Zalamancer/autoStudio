import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LaserGridConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Tron-style perspective grid receding to a horizon at 60% from top
    const horizonY = height * 0.6
    const gridColor = 'rgba(0,255,255,0.12)'
    const glowColor = 'rgba(0,255,255,0.25)'

    // Vertical grid lines — spread from center vanishing point
    const vLineCount = 12
    const vLines = Array.from({ length: vLineCount + 1 }, (_, i) => {
      const t = i / vLineCount  // 0..1
      const xTop = width * t    // equal spacing at horizon
      const xBottom = (t - 0.5) * width * 3 + width * 0.5  // spread wide at bottom
      return { xTop, xBottom }
    })

    // Horizontal grid lines — evenly spaced in perspective, scrolling toward viewer
    const hLineCount = 10
    const hLines = Array.from({ length: hLineCount }, (_, i) => {
      // Perspective spacing: closer lines near bottom are farther apart
      const p = (i + (frame * 0.025) % 1) / hLineCount
      const perspY = horizonY + (height - horizonY) * (p * p)  // quadratic gives perspective
      return perspY
    })

    // Vertical neon accent lines racing outward from center (Tron light cycle trails)
    const trailCount = 4
    const trails = Array.from({ length: trailCount }, (_, i) => {
      const seed = i * 37 + 11
      const xBase = (0.2 + i * 0.2) * width
      const length = 40 + (seed % 60)
      const yPos = ((frame * (1.2 + i * 0.4) + seed * 20) % (height * 1.1)) - 20
      const isLeft = i < 2
      return { x: isLeft ? xBase : width - xBase, y: yPos, length }
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Perspective grid SVG */}
        <svg
          style={{ position: 'absolute', inset: 0 }}
          width={width}
          height={height}
        >
          {/* Vertical grid lines from horizon to bottom */}
          {vLines.map((vl, i) => (
            <line
              key={`v${i}`}
              x1={vl.xTop}
              y1={horizonY}
              x2={vl.xBottom}
              y2={height}
              stroke={gridColor}
              strokeWidth="1"
            />
          ))}

          {/* Horizontal grid lines */}
          {hLines.map((y, i) => {
            if (y < horizonY || y > height) return null
            const fadeT = (y - horizonY) / (height - horizonY)
            const opacity = 0.05 + fadeT * 0.2
            return (
              <line
                key={`h${i}`}
                x1={0}
                y1={y}
                x2={width}
                y2={y}
                stroke={`rgba(0,255,255,${opacity})`}
                strokeWidth="1"
              />
            )
          })}

          {/* Horizon glow line */}
          <line
            x1={0}
            y1={horizonY}
            x2={width}
            y2={horizonY}
            stroke="rgba(0,255,255,0.35)"
            strokeWidth="1.5"
          />
          <line
            x1={0}
            y1={horizonY}
            x2={width}
            y2={horizonY}
            stroke="rgba(0,255,255,0.08)"
            strokeWidth="8"
          />
        </svg>

        {/* Light cycle speed trails */}
        {trails.map((t, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: t.x - 1,
              top: t.y,
              width: 2,
              height: t.length,
              background: `linear-gradient(180deg, transparent, ${i % 2 === 0 ? 'rgba(0,255,255,0.6)' : 'rgba(255,0,255,0.5)'}, transparent)`,
              boxShadow: i % 2 === 0
                ? '0 0 4px rgba(0,255,255,0.4)'
                : '0 0 4px rgba(255,0,255,0.4)',
            }}
          />
        ))}

        {/* Horizon glow bloom */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: horizonY - 20,
            height: 40,
            background: 'linear-gradient(180deg, transparent, rgba(0,255,255,0.04), transparent)',
            pointerEvents: 'none',
          }}
        />

        {/* TRON label top-left */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 18,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(0,255,255,0.25)',
            letterSpacing: 3,
          }}
        >
          GRID.SYS | SECTOR 7
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    if (phase === 'enter') {
      // Text rises up from the grid floor with a laser trace effect
      const riseY = (1 - enterProgress) * 40
      const opacity = Math.min(1, enterProgress * 2)
      // Grid line reveal: text clips in from bottom as if rising off the floor
      const clipReveal = Math.max(0, 100 - enterProgress * 110)

      return (
        <div
          style={{
            position: 'absolute',
            top: '45%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${riseY}px))`,
            opacity,
          }}
        >
          {/* Laser trace underline that draws left-to-right */}
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              left: 0,
              width: `${enterProgress * 100}%`,
              height: 2,
              background: `linear-gradient(90deg, ${color}, ${color}80)`,
              boxShadow: `0 0 8px ${color}, 0 0 16px ${color}60`,
            }}
          />

          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 10vw, 150px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 10px ${color}, 0 0 25px ${color}50`,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textTransform: 'uppercase',
              clipPath: `inset(${clipReveal}% 0 0 0)`,
            }}
          >
            {word}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Text fully present — grid lines appear to converge behind it
      const glowPulse = 0.8 + Math.sin(holdProgress * Math.PI * 3) * 0.2

      return (
        <div
          style={{
            position: 'absolute',
            top: '45%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Reflection on grid floor */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 10vw, 150px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 8px ${color}`,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textTransform: 'uppercase',
              opacity: 0.12,
              transform: 'scaleY(-0.25) translateY(-2px)',
              transformOrigin: 'top',
              filter: 'blur(1px)',
            }}
          >
            {word}
          </div>

          {/* Laser underline */}
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              left: 0,
              right: 0,
              height: 2,
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
              boxShadow: `0 0 8px ${color}`,
              opacity: glowPulse,
            }}
          />

          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 10vw, 150px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 ${10 * glowPulse}px ${color}, 0 0 ${30 * glowPulse}px ${color}50`,
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
      // Exit: text sweeps away with laser trail going right
      const sweepX = exitProgress * 120
      const opacity = 1 - exitProgress

      return (
        <div
          style={{
            position: 'absolute',
            top: '45%',
            left: '50%',
            transform: `translate(calc(-50% + ${sweepX}px), -50%)`,
            opacity,
          }}
        >
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 10vw, 150px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 8px ${color}`,
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

function LaserGridComponent(props: MotionGraphicProps<LaserGridConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-laser-grid',
  title: 'Kinetic Laser Grid',
  description: 'Tron-style perspective laser grid receding to horizon with text rising off the grid floor, light cycle trails, and neon underline laser trace',
  tags: ['kinetic', 'typography', 'tron', 'laser', 'grid', 'perspective', 'neon', 'cyberpunk', 'sci-fi'],
  category: 'captions',
  component: LaserGridComponent as any,
  defaultConfig: {
    words: ['GRID', 'SECTOR', 'TRON', 'LEGACY'],
    colors: ['#00FFFF', '#0066FF', '#00FFFF', '#FF00FF'],
    bgColor: '#0d0d1a',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GRID', 'SECTOR', 'TRON', 'LEGACY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFFF', '#0066FF', '#00FFFF', '#FF00FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
