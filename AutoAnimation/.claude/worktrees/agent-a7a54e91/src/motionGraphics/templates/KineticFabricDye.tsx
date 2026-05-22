import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FabricDyeConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: bgColor,
      }}>
        {/* Textile weave pattern — horizontal and vertical threads */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            repeating-linear-gradient(0deg,
              transparent, transparent 3px,
              rgba(200, 190, 170, 0.08) 3px, rgba(200, 190, 170, 0.08) 4px
            ),
            repeating-linear-gradient(90deg,
              transparent, transparent 3px,
              rgba(200, 190, 170, 0.06) 3px, rgba(200, 190, 170, 0.06) 4px
            )
          `,
        }} />
        {/* Weave crossover texture — diagonal pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            repeating-linear-gradient(45deg,
              transparent, transparent 6px,
              rgba(180, 170, 150, 0.02) 6px, rgba(180, 170, 150, 0.02) 7px
            ),
            repeating-linear-gradient(-45deg,
              transparent, transparent 6px,
              rgba(180, 170, 150, 0.02) 6px, rgba(180, 170, 150, 0.02) 7px
            )
          `,
        }} />
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Fabric wrinkle/fold lines */}
          {Array.from({ length: 5 }, (_, i) => {
            const y = height * (0.15 + i * 0.18)
            const wave = Math.sin(t * 0.2 + i * 0.5) * 3
            return (
              <path key={`fold${i}`}
                d={`M 0 ${y + wave} Q ${width * 0.3} ${y - 4 + wave} ${width * 0.5} ${y + 2 + wave} Q ${width * 0.7} ${y + 6 + wave} ${width} ${y - 1 + wave}`}
                fill="none" stroke={`rgba(160, 150, 130, 0.04)`}
                strokeWidth={1} />
            )
          })}
          {/* Screen frame registration marks */}
          {[
            { x: 15, y: 15 }, { x: width - 15, y: 15 },
            { x: 15, y: height - 15 }, { x: width - 15, y: height - 15 },
          ].map((m, i) => (
            <g key={`reg${i}`}>
              <circle cx={m.x} cy={m.y} r={5} fill="none"
                stroke="rgba(100, 90, 70, 0.06)" strokeWidth={0.5} />
              <line x1={m.x - 7} y1={m.y} x2={m.x + 7} y2={m.y}
                stroke="rgba(100, 90, 70, 0.05)" strokeWidth={0.3} />
              <line x1={m.x} y1={m.y - 7} x2={m.x} y2={m.y + 7}
                stroke="rgba(100, 90, 70, 0.05)" strokeWidth={0.3} />
            </g>
          ))}
          {/* Selvedge edge lines */}
          <line x1={8} y1={0} x2={8} y2={height}
            stroke="rgba(100, 90, 70, 0.06)" strokeWidth={1} strokeDasharray="2 4" />
          <line x1={width - 8} y1={0} x2={width - 8} y2={height}
            stroke="rgba(100, 90, 70, 0.06)" strokeWidth={1} strokeDasharray="2 4" />
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const fontSize = Math.min(width / (word.length * 0.55), 120)
    const f = frame ?? 0
    const chars = word.split('')

    if (phase === 'enter') {
      // Squeegee pulls dye across screen — reveals text left to right with bleed
      const squeegeP = easeOutQuad(enterProgress)
      const clipPercent = squeegeP * 100

      // Dye bleeding effect — slightly larger fuzzy version
      const bleedAmount = (1 - squeegeP) * 3 + 1

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Dye bleed/absorption halo */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 800,
            color,
            textTransform: 'uppercase',
            letterSpacing: 3,
            whiteSpace: 'nowrap',
            filter: `blur(${bleedAmount}px)`,
            opacity: 0.4 * squeegeP,
            clipPath: `inset(0 ${100 - clipPercent - 5}% 0 0)`,
          }}>
            {word}
          </div>
          {/* Main dye text */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 800,
            color,
            textTransform: 'uppercase',
            letterSpacing: 3,
            whiteSpace: 'nowrap',
            clipPath: `inset(0 ${100 - clipPercent}% 0 0)`,
          }}>
            {word}
          </div>
          {/* Squeegee bar */}
          {squeegeP > 0.02 && squeegeP < 0.95 && (
            <div style={{
              position: 'absolute',
              left: `${15 + squeegeP * 70}%`,
              top: '35%', height: '30%', width: 3,
              background: `linear-gradient(180deg, rgba(80, 70, 50, 0.15), rgba(80, 70, 50, 0.25), rgba(80, 70, 50, 0.15))`,
              borderRadius: 1,
              pointerEvents: 'none',
            }} />
          )}
        </div>
      )
    } else if (phase === 'hold') {
      // Dye absorbed into fabric — slight texture wobble, ink saturation
      const breathe = Math.sin(holdProgress * Math.PI * 3) * 0.5
      const satPulse = 1 + Math.sin(holdProgress * Math.PI * 5) * 0.05

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Absorbed dye bleed */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 800,
            color,
            textTransform: 'uppercase',
            letterSpacing: 3,
            whiteSpace: 'nowrap',
            filter: 'blur(2px)',
            opacity: 0.25,
          }}>
            {word}
          </div>
          {/* Sharp dyed text on fabric */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: `translate(-50%, calc(-50% + ${breathe}px))`,
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 800,
            color,
            textTransform: 'uppercase',
            letterSpacing: 3,
            whiteSpace: 'nowrap',
            filter: `saturate(${satPulse})`,
          }}>
            {word}
          </div>
          {/* Fabric weave visible through text — subtle overlay */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 800,
            color: 'transparent',
            textTransform: 'uppercase',
            letterSpacing: 3,
            whiteSpace: 'nowrap',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 3px)`,
          }}>
            {word}
          </div>
          {/* Screen print color swatch */}
          <div style={{
            position: 'absolute', bottom: '22%', left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex', gap: 3, alignItems: 'center',
          }}>
            <div style={{ width: 8, height: 8, background: color, opacity: 0.3, borderRadius: 1 }} />
            <span style={{
              fontFamily: "'Courier New', monospace", fontSize: 7,
              color: 'rgba(100, 90, 70, 0.12)', letterSpacing: 2,
            }}>
              1-COLOR SCREEN
            </span>
          </div>
        </div>
      )
    } else {
      // Exit: dye washes/fades as if fabric is rinsed
      const wash = exitProgress
      const blurGrow = wash * 4

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: `translate(-50%, calc(-50% + ${wash * 5}px))`,
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 800,
            color,
            textTransform: 'uppercase',
            letterSpacing: 3,
            whiteSpace: 'nowrap',
            opacity: 1 - wash * 0.8,
            filter: `blur(${blurGrow}px) saturate(${1 - wash * 0.6})`,
          }}>
            {word}
          </div>
        </div>
      )
    }
  },
}

function FabricDyeComponent(props: MotionGraphicProps<FabricDyeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-fabric-dye',
  title: 'Fabric Dye',
  description: 'Fabric screen dye with text transferred through silk screen onto fabric, dye absorption and bleeding with visible textile weave texture',
  tags: ['kinetic', 'typography', 'fabric', 'dye', 'screen', 'print', 'textile', 'craft', 'material'],
  category: 'captions',
  component: FabricDyeComponent as any,
  defaultConfig: {
    words: ['PRINT', 'PRESS', 'BLEND', 'WASH'],
    colors: ['#2D4A6F', '#1E3A5F', '#3B5A82', '#264770'],
    bgColor: '#E8DFD0',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PRINT', 'PRESS', 'BLEND', 'WASH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2D4A6F', '#1E3A5F', '#3B5A82', '#264770'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#E8DFD0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
