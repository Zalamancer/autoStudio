import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CeramicGlazeConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Crackle finish pattern — network of fine lines on glazed terracotta
    const crackleLines: { x1: number; y1: number; x2: number; y2: number; opacity: number }[] = []
    for (let i = 0; i < 50; i++) {
      const cx = rand(i * 13) * width
      const cy = rand(i * 17 + 5) * height
      const angle = rand(i * 23 + 11) * Math.PI * 2
      const len = 15 + rand(i * 29 + 7) * 40
      crackleLines.push({
        x1: cx,
        y1: cy,
        x2: cx + Math.cos(angle) * len,
        y2: cy + Math.sin(angle) * len,
        opacity: 0.04 + rand(i * 31 + 3) * 0.06,
      })
    }

    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 45% 45%, #D4A574 0%, ${bgColor} 50%, #A8734A 100%)`,
      }}>
        {/* Terracotta clay body texture */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            repeating-linear-gradient(35deg, transparent, transparent 4px, rgba(120, 70, 30, 0.02) 4px, rgba(120, 70, 30, 0.02) 5px),
            repeating-linear-gradient(-25deg, transparent, transparent 6px, rgba(160, 90, 40, 0.015) 6px, rgba(160, 90, 40, 0.015) 7px)
          `,
        }} />
        {/* Glaze pooling — areas where glaze runs thicker */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(ellipse at 30% 70%, rgba(180, 120, 60, 0.1) 0%, transparent 30%),
            radial-gradient(ellipse at 70% 30%, rgba(180, 120, 60, 0.08) 0%, transparent 25%),
            radial-gradient(ellipse at 50% 80%, rgba(140, 90, 40, 0.06) 0%, transparent 35%)
          `,
        }} />
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Crackle network */}
          {crackleLines.map((c, i) => (
            <line key={`cr${i}`} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
              stroke={`rgba(90, 50, 20, ${c.opacity})`} strokeWidth={0.4} />
          ))}
          {/* Pottery wheel ring marks — very subtle concentric arcs */}
          {Array.from({ length: 4 }, (_, i) => {
            const r = 80 + i * 50
            return (
              <circle key={`ring${i}`} cx={width / 2} cy={height / 2} r={r}
                fill="none" stroke={`rgba(100, 60, 25, ${0.03 + i * 0.005})`}
                strokeWidth={0.5} strokeDasharray="8 12" />
            )
          })}
          {/* Kiln mark */}
          <text x={width / 2} y={height - 10} textAnchor="middle"
            fill="rgba(90, 50, 20, 0.08)" fontSize={6}
            fontFamily="'Georgia', serif">
            CONE 6 • OXIDATION • STONEWARE
          </text>
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const fontSize = Math.min(width / (word.length * 0.55), 120)
    const f = frame ?? 0
    const chars = word.split('')

    if (phase === 'enter') {
      // Glaze flows and pools into letterforms — liquid filling from bottom
      const fillP = easeInOutCubic(enterProgress)

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Glaze puddle shadow beneath letters */}
          <div style={{
            position: 'absolute', top: '52%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
            fontWeight: 700,
            color: 'transparent',
            WebkitTextStroke: `2px rgba(80, 45, 15, ${0.15 * fillP})`,
            textTransform: 'uppercase',
            letterSpacing: 4,
            whiteSpace: 'nowrap',
            filter: 'blur(4px)',
            clipPath: `inset(${(1 - fillP) * 100}% 0 0 0)`,
          }}>
            {word}
          </div>
          {/* Main glaze text filling up */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: 4,
            whiteSpace: 'nowrap',
            clipPath: `inset(${(1 - fillP) * 100}% 0 0 0)`,
            textShadow: `0 2px 4px rgba(60, 30, 10, 0.3), 0 0 8px rgba(180, 120, 60, ${0.15 * fillP})`,
          }}>
            {word}
          </div>
          {/* Wet glaze shimmer at fill line */}
          {fillP > 0.1 && fillP < 0.9 && (
            <div style={{
              position: 'absolute',
              top: `${50 - fillP * 12 + 6}%`,
              left: '25%', width: '50%', height: 2,
              background: `linear-gradient(90deg, transparent, rgba(255, 240, 200, ${0.15 * (1 - Math.abs(fillP - 0.5) * 2)}), transparent)`,
              pointerEvents: 'none',
            }} />
          )}
        </div>
      )
    } else if (phase === 'hold') {
      // Kiln firing — glaze glosses over, crackle forms
      const fireGlow = Math.sin(holdProgress * Math.PI * 3) * 0.1
      const glossShift = Math.sin(holdProgress * Math.PI * 2) * 1.5

      // Crackle lines forming on text during hold
      const crackleAlpha = Math.min(1, holdProgress * 2) * 0.15

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Gloss reflection */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: `translate(calc(-50% + ${glossShift}px), calc(-50% - 2px))`,
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
            fontWeight: 700,
            color: 'transparent',
            WebkitTextStroke: `1px rgba(255, 240, 210, ${0.12 + fireGlow})`,
            textTransform: 'uppercase',
            letterSpacing: 4,
            whiteSpace: 'nowrap',
            filter: 'blur(2px)',
          }}>
            {word}
          </div>
          {/* Main glazed text */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: 4,
            whiteSpace: 'nowrap',
            textShadow: `0 2px 4px rgba(60, 30, 10, 0.3), 0 -1px 0 rgba(255, 240, 210, 0.1)`,
          }}>
            {word}
          </div>
          {/* Crackle texture overlay on text area */}
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {Array.from({ length: 12 }, (_, i) => {
              const cx = width * 0.3 + rand(i * 41 + index * 7) * width * 0.4
              const cy = height * 0.4 + rand(i * 47 + index * 11) * height * 0.2
              const angle = rand(i * 53) * Math.PI * 2
              const len = 8 + rand(i * 59) * 15
              return (
                <line key={`tc${i}`}
                  x1={cx} y1={cy}
                  x2={cx + Math.cos(angle) * len} y2={cy + Math.sin(angle) * len}
                  stroke={`rgba(60, 30, 10, ${crackleAlpha})`} strokeWidth={0.3} />
              )
            })}
          </svg>
        </div>
      )
    } else {
      // Exit: ceramic cools, glaze dulls and text fades
      const cool = exitProgress
      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: 4,
            whiteSpace: 'nowrap',
            opacity: 1 - cool,
            filter: `saturate(${1 - cool * 0.5}) brightness(${1 - cool * 0.3})`,
            textShadow: `0 ${2 - cool * 2}px 4px rgba(60, 30, 10, ${0.3 * (1 - cool)})`,
          }}>
            {word}
          </div>
        </div>
      )
    }
  },
}

function CeramicGlazeComponent(props: MotionGraphicProps<CeramicGlazeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ceramic-glaze',
  title: 'Ceramic Glaze',
  description: 'Ceramic glaze with text painted on pottery then kiln-fired, glaze flows and pools in letterforms, crackle finish on terracotta body',
  tags: ['kinetic', 'typography', 'ceramic', 'glaze', 'pottery', 'kiln', 'terracotta', 'craft', 'material'],
  category: 'captions',
  component: CeramicGlazeComponent as any,
  defaultConfig: {
    words: ['GLAZE', 'KILN', 'FIRE', 'CLAY'],
    colors: ['#5C3A1E', '#7A4F2A', '#4A2E14', '#6B4222'],
    bgColor: '#C49060',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GLAZE', 'KILN', 'FIRE', 'CLAY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#5C3A1E', '#7A4F2A', '#4A2E14', '#6B4222'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#C49060', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
