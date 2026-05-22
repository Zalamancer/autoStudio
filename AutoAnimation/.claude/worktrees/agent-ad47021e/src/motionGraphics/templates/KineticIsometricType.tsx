import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface IsometricTypeConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    const gridSpacing = 50
    const isoAngle = Math.PI / 6 // 30 degrees
    const cosA = Math.cos(isoAngle)
    const sinA = Math.sin(isoAngle)

    const lines: { x1: number; y1: number; x2: number; y2: number; dim: boolean }[] = []

    // Isometric grid: lines going right-down and left-down from top
    const cx = width / 2
    const cy = height / 2
    const count = 20

    for (let i = -count; i <= count; i++) {
      const offsetX = i * gridSpacing
      // Right-leaning lines
      lines.push({
        x1: cx + offsetX - height * cosA,
        y1: cy - height * sinA,
        x2: cx + offsetX + height * cosA,
        y2: cy + height * sinA,
        dim: i % 4 !== 0,
      })
      // Left-leaning lines
      lines.push({
        x1: cx + offsetX + height * cosA,
        y1: cy - height * sinA,
        x2: cx + offsetX - height * cosA,
        y2: cy + height * sinA,
        dim: i % 4 !== 0,
      })
    }

    // Horizontal iso lines
    for (let i = -count; i <= count; i++) {
      const offsetY = i * gridSpacing * sinA * 2
      lines.push({
        x1: 0,
        y1: cy + offsetY,
        x2: width,
        y2: cy + offsetY,
        dim: i % 4 !== 0,
      })
    }

    // Animated coordinate markers
    const markers: { x: number; y: number; active: boolean }[] = []
    for (let i = 0; i < 12; i++) {
      const seed = i * 37
      const mx = seededRand(seed) * width
      const my = seededRand(seed + 7) * height
      const pulse = Math.sin((frame * 0.04 + i * 1.2) % (Math.PI * 2))
      markers.push({ x: mx, y: my, active: pulse > 0.2 })
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {lines.map((l, i) => (
            <line
              key={`g${i}`}
              x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke={l.dim ? 'rgba(100, 180, 255, 0.05)' : 'rgba(100, 180, 255, 0.12)'}
              strokeWidth={l.dim ? 0.3 : 0.6}
            />
          ))}
          {markers.map((m, i) => (
            <g key={`m${i}`}>
              <circle cx={m.x} cy={m.y} r={m.active ? 3 : 1.5}
                fill={m.active ? 'rgba(100, 200, 255, 0.5)' : 'rgba(100, 200, 255, 0.1)'} />
              {m.active && (
                <>
                  <line x1={m.x - 6} y1={m.y} x2={m.x + 6} y2={m.y} stroke="rgba(100, 200, 255, 0.3)" strokeWidth={0.5} />
                  <line x1={m.x} y1={m.y - 6} x2={m.x} y2={m.y + 6} stroke="rgba(100, 200, 255, 0.3)" strokeWidth={0.5} />
                </>
              )}
            </g>
          ))}
          {/* Origin axes */}
          <text x={width - 30} y={height - 10} fill="rgba(100, 200, 255, 0.2)" fontSize={9} fontFamily="'Courier New', monospace">X,Y,Z</text>
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height, frame }: WordRenderProps) => {
    // Letters assemble from scattered isometric grid positions
    const letters = word.split('')
    const letterWidth = Math.min(width / (letters.length + 1), 90)

    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {letters.map((letter, i) => {
          const seed = i * 73 + 11
          // Scattered start positions on isometric grid
          const startX = (seededRand(seed) - 0.5) * width * 0.8
          const startY = (seededRand(seed + 3) - 0.5) * height * 0.6
          const startRotateX = 60
          const startRotateZ = (seededRand(seed + 7) - 0.5) * 40

          let x = 0, y = 0, rotateX = 0, rotateZ = 0, opacity = 0, skewY = 0

          if (phase === 'enter') {
            // Stagger each letter
            const letterDelay = i / letters.length
            const t = Math.max(0, Math.min(1, (enterProgress - letterDelay * 0.5) / (1 - letterDelay * 0.5)))
            const ease = 1 - Math.pow(1 - t, 3)
            x = startX * (1 - ease)
            y = startY * (1 - ease)
            rotateX = startRotateX * (1 - ease)
            rotateZ = startRotateZ * (1 - ease)
            skewY = -30 * (1 - ease)
            opacity = t
          } else if (phase === 'hold') {
            opacity = 1
            // Subtle isometric wobble
            const wobble = Math.sin(holdProgress * Math.PI * 3 + i * 0.5) * 1.5
            y = wobble
            skewY = 0
          } else {
            const t = exitProgress
            const ease = t * t
            x = startX * ease * -0.5
            y = -height * 0.3 * ease
            rotateX = 30 * ease
            opacity = 1 - ease
            skewY = -20 * ease
          }

          return (
            <div
              key={i}
              style={{
                display: 'inline-block',
                fontFamily: "'Courier New', monospace",
                fontSize: `clamp(30px, 10vw, ${letterWidth}px)`,
                fontWeight: 700,
                color,
                opacity,
                transform: `translate(${x}px, ${y}px) perspective(600px) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg) skewY(${skewY}deg)`,
                textShadow: `0 0 6px ${color}40, 2px 4px 0 rgba(0,0,0,0.3)`,
                whiteSpace: 'nowrap',
                letterSpacing: 2,
                textTransform: 'uppercase',
                marginLeft: i > 0 ? '2px' : 0,
              }}
            >
              {letter}
            </div>
          )
        })}
        {/* Coordinate label */}
        {phase !== 'exit' && (
          <div style={{
            position: 'absolute',
            bottom: '18%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 10,
            color: `${color}60`,
            letterSpacing: 2,
            opacity: phase === 'enter' ? enterProgress : 1 - exitProgress,
          }}>
            [{Math.round(width / 2)}, {Math.round(height / 2)}, 0]
          </div>
        )}
      </div>
    )
  },
}

function IsometricTypeComponent(props: MotionGraphicProps<IsometricTypeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-isometric-type',
  title: 'Isometric Type',
  description: 'Text assembles from isometric 3D grid coordinates with perspective skew, scattered letters converge into position on an isometric projection grid',
  tags: ['kinetic', 'typography', 'isometric', '3d', 'grid', 'technical', 'cad', 'projection'],
  category: 'captions',
  component: IsometricTypeComponent as any,
  defaultConfig: {
    words: ['PLAN', 'GRID', 'AXIS', 'VIEW'],
    colors: ['#64B4FF', '#4DFFA6', '#64B4FF', '#4DFFA6'],
    bgColor: '#0a0f1a',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PLAN', 'GRID', 'AXIS', 'VIEW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#64B4FF', '#4DFFA6'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0f1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
