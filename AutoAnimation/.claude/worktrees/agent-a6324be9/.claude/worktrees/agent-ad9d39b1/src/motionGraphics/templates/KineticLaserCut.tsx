import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LaserCutConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Laser cutter work surface -- metal/wood with alignment marks
    const gridColor = 'rgba(255, 100, 50, 0.04)'
    const alignColor = 'rgba(255, 100, 50, 0.1)'

    // Subtle material texture grid
    const gridSize = 40

    // Smoke/heat particles
    const particles: { x: number; y: number; opacity: number; size: number }[] = []
    for (let i = 0; i < 15; i++) {
      const seed = i * 41 + (Math.floor(frame * 0.1) % 100)
      const px = seededRand(seed) * width
      const py = seededRand(seed + 1) * height
      const life = (seededRand(seed + 2) + frame * 0.01) % 1
      particles.push({
        x: px,
        y: py - life * 30,
        opacity: (1 - life) * 0.06,
        size: 2 + life * 4,
      })
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Material grid */}
          {Array.from({ length: Math.ceil(width / gridSize) + 1 }, (_, i) => (
            <line key={`vg${i}`} x1={i * gridSize} y1={0} x2={i * gridSize} y2={height}
              stroke={gridColor} strokeWidth={0.3} />
          ))}
          {Array.from({ length: Math.ceil(height / gridSize) + 1 }, (_, i) => (
            <line key={`hg${i}`} x1={0} y1={i * gridSize} x2={width} y2={i * gridSize}
              stroke={gridColor} strokeWidth={0.3} />
          ))}
          {/* Corner alignment marks */}
          {[
            { x: 15, y: 15 },
            { x: width - 15, y: 15 },
            { x: 15, y: height - 15 },
            { x: width - 15, y: height - 15 },
          ].map((c, i) => (
            <g key={`al${i}`}>
              <line x1={c.x - 8} y1={c.y} x2={c.x + 8} y2={c.y} stroke={alignColor} strokeWidth={0.5} />
              <line x1={c.x} y1={c.y - 8} x2={c.x} y2={c.y + 8} stroke={alignColor} strokeWidth={0.5} />
              <circle cx={c.x} cy={c.y} r={4} fill="none" stroke={alignColor} strokeWidth={0.4} />
            </g>
          ))}
          {/* Smoke particles */}
          {particles.map((p, i) => (
            <circle key={`p${i}`} cx={p.x} cy={p.y} r={p.size}
              fill={`rgba(255, 150, 80, ${p.opacity})`} />
          ))}
          {/* Machine status */}
          <text x={10} y={height - 8} fill="rgba(255, 100, 50, 0.12)"
            fontSize={7} fontFamily="'Courier New', monospace">
            PWR: 80W | SPD: 120mm/s | PASS: 1/1
          </text>
          {/* Bed outline */}
          <rect x={8} y={8} width={width - 16} height={height - 16}
            fill="none" stroke="rgba(255, 100, 50, 0.06)" strokeWidth={0.5} strokeDasharray="6 3" />
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height, frame }: WordRenderProps) => {
    const fontSize = Math.min(width / (word.length * 0.6), 130)

    if (phase === 'enter') {
      // Laser traces text outline left to right with glow
      const traceProgress = enterProgress
      const clipPercent = traceProgress * 100

      // Laser head position
      const laserX = width * 0.15 + traceProgress * width * 0.7
      const laserY = height * 0.5

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Burn glow behind text */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 700,
            color: 'transparent',
            WebkitTextStroke: `3px rgba(255, 120, 40, ${0.15 * traceProgress})`,
            textTransform: 'uppercase',
            letterSpacing: 4,
            whiteSpace: 'nowrap',
            filter: `blur(4px)`,
            clipPath: `inset(0 ${100 - clipPercent}% 0 0)`,
          }}>
            {word}
          </div>
          {/* Clean cut text */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 700,
            color: 'transparent',
            WebkitTextStroke: `1.5px ${color}`,
            textTransform: 'uppercase',
            letterSpacing: 4,
            whiteSpace: 'nowrap',
            clipPath: `inset(0 ${100 - clipPercent}% 0 0)`,
          }}>
            {word}
          </div>
          {/* Laser head */}
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {/* Laser beam from top */}
            <line x1={laserX} y1={0} x2={laserX} y2={laserY - fontSize * 0.6}
              stroke="rgba(255, 50, 20, 0.15)" strokeWidth={1} />
            {/* Cutting point glow */}
            <circle cx={laserX} cy={laserY} r={6}
              fill="rgba(255, 200, 100, 0.3)" />
            <circle cx={laserX} cy={laserY} r={3}
              fill="rgba(255, 255, 200, 0.6)" />
            <circle cx={laserX} cy={laserY} r={1.5}
              fill="rgba(255, 255, 255, 0.9)" />
            {/* Sparks */}
            {Array.from({ length: 4 }, (_, i) => {
              const angle = (frame * 0.3 + i * 1.5) % (Math.PI * 2)
              const dist = 5 + seededRand(frame + i) * 10
              return (
                <circle key={`sp${i}`}
                  cx={laserX + Math.cos(angle) * dist}
                  cy={laserY + Math.sin(angle) * dist * 0.5 + dist * 0.3}
                  r={0.8}
                  fill="rgba(255, 220, 100, 0.5)" />
              )
            })}
          </svg>
        </div>
      )
    } else if (phase === 'hold') {
      // Complete cut with subtle heat glow pulsing
      const pulse = 0.7 + Math.sin(holdProgress * Math.PI * 3) * 0.3
      const heatPulse = Math.sin(holdProgress * Math.PI * 5) * 0.08

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Warm burn glow */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 700,
            color: 'transparent',
            WebkitTextStroke: `3px rgba(255, 120, 40, ${0.1 + heatPulse})`,
            textTransform: 'uppercase',
            letterSpacing: 4,
            whiteSpace: 'nowrap',
            filter: 'blur(4px)',
          }}>
            {word}
          </div>
          {/* Crisp vector cut outline */}
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
            letterSpacing: 4,
            whiteSpace: 'nowrap',
            textShadow: `0 0 ${4 + pulse * 6}px rgba(255, 120, 40, 0.3)`,
          }}>
            {word}
          </div>
          {/* Cut quality indicator */}
          <div style={{
            position: 'absolute',
            bottom: '18%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: `${color}30`,
            letterSpacing: 2,
          }}>
            CUT COMPLETE &mdash; KERF: 0.2mm
          </div>
        </div>
      )
    } else {
      // Exit: text pieces fall away as if cut from sheet
      const t = exitProgress
      const ease = t * t

      const letters = word.split('')
      const letterWidth = fontSize * 0.6

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {letters.map((letter, i) => {
            const baseX = (width - letters.length * letterWidth) / 2 + i * letterWidth
            // Each piece falls with slight rotation
            const fallY = ease * 60 * (1 + seededRand(i * 17) * 0.5)
            const rotate = ease * (seededRand(i * 31) - 0.5) * 20
            const opacity = 1 - ease

            return (
              <div key={i} style={{
                position: 'absolute',
                left: baseX,
                top: '50%',
                transform: `translateY(calc(-50% + ${fallY}px)) rotate(${rotate}deg)`,
                transformOrigin: 'center',
                fontFamily: "'Courier New', monospace",
                fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
                fontWeight: 700,
                color,
                textTransform: 'uppercase',
                opacity,
                textShadow: `0 0 4px rgba(255, 120, 40, ${0.2 * opacity})`,
              }}>
                {letter}
              </div>
            )
          })}
        </div>
      )
    }
  },
}

function LaserCutComponent(props: MotionGraphicProps<LaserCutConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-laser-cut',
  title: 'Laser Cut',
  description: 'Laser cutter path tracing text outline with burn marks, sparks, precision vector cutting, alignment marks, and kerf annotations',
  tags: ['kinetic', 'typography', 'laser', 'cut', 'fabrication', 'vector', 'precision', 'technical'],
  category: 'captions',
  component: LaserCutComponent as any,
  defaultConfig: {
    words: ['LASER', 'CUT', 'ETCH', 'BURN'],
    colors: ['#FF6428', '#FFA050', '#FF6428', '#FFA050'],
    bgColor: '#0c0808',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LASER', 'CUT', 'ETCH', 'BURN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6428', '#FFA050'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0808', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
  ],
})
