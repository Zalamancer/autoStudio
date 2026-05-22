import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WoodBurnConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Wood grain horizontal lines
    const grainLines: { y: number; thickness: number; opacity: number; offset: number }[] = []
    for (let i = 0; i < 60; i++) {
      grainLines.push({
        y: rand(i * 7 + 3) * height,
        thickness: 0.5 + rand(i * 11 + 5) * 2.5,
        opacity: 0.04 + rand(i * 19 + 9) * 0.08,
        offset: rand(i * 23 + 13) * 20 - 10,
      })
    }

    // Knot holes
    const knots = [
      { x: width * 0.12, y: height * 0.25, r: 8 },
      { x: width * 0.85, y: height * 0.7, r: 6 },
    ]

    // Smoke wisps rising from burn point
    const smokeParticles: { x: number; y: number; opacity: number; size: number }[] = []
    for (let i = 0; i < 8; i++) {
      const seed = i * 37 + Math.floor(frame * 0.08) % 60
      const life = (rand(seed + 50) + t * 0.3) % 1
      smokeParticles.push({
        x: width * 0.5 + Math.sin(life * Math.PI * 2 + i) * 30 + (rand(seed) - 0.5) * 60,
        y: height * 0.45 - life * height * 0.35,
        opacity: (1 - life) * 0.08,
        size: 4 + life * 20,
      })
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Wood grain pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            repeating-linear-gradient(2deg, transparent, transparent 6px, rgba(80, 50, 20, 0.03) 6px, rgba(80, 50, 20, 0.03) 7px),
            repeating-linear-gradient(-1deg, transparent, transparent 14px, rgba(120, 75, 30, 0.025) 14px, rgba(120, 75, 30, 0.025) 15px)
          `,
        }} />
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Detailed grain lines */}
          {grainLines.map((g, i) => (
            <path key={`grain${i}`}
              d={`M 0 ${g.y} Q ${width * 0.25} ${g.y + g.offset} ${width * 0.5} ${g.y + g.offset * 0.5} Q ${width * 0.75} ${g.y} ${width} ${g.y + g.offset * 0.3}`}
              fill="none" stroke={`rgba(80, 50, 20, ${g.opacity})`}
              strokeWidth={g.thickness} />
          ))}
          {/* Wood knots */}
          {knots.map((k, i) => (
            <g key={`knot${i}`}>
              <ellipse cx={k.x} cy={k.y} rx={k.r} ry={k.r * 0.7}
                fill="rgba(60, 35, 12, 0.15)" stroke="rgba(60, 35, 12, 0.08)"
                strokeWidth={0.5} />
              <ellipse cx={k.x} cy={k.y} rx={k.r * 0.5} ry={k.r * 0.35}
                fill="rgba(40, 22, 8, 0.12)" />
            </g>
          ))}
          {/* Smoke wisps */}
          {smokeParticles.map((s, i) => (
            <circle key={`smoke${i}`} cx={s.x} cy={s.y} r={s.size}
              fill={`rgba(180, 160, 140, ${s.opacity})`} />
          ))}
          {/* Edge darkening — natural wood plank edge */}
          <rect x={0} y={0} width={width} height={height}
            fill="none" stroke="rgba(40, 25, 10, 0.1)" strokeWidth={8} />
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const fontSize = Math.min(width / (word.length * 0.55), 120)
    const f = frame ?? 0
    const chars = word.split('')

    if (phase === 'enter') {
      // Pyrography pen burns text left to right, char by char
      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            whiteSpace: 'nowrap',
          }}>
            {chars.map((ch, ci) => {
              const charDelay = ci / chars.length * 0.6
              const charP = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.4))

              // Burn glow at the active char
              const isActive = charP > 0.1 && charP < 0.9
              const burnGlow = isActive ? 0.6 : 0

              return (
                <span key={ci} style={{
                  display: 'inline-block', position: 'relative',
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                  fontWeight: 700,
                  color: charP > 0.3 ? color : 'transparent',
                  textTransform: 'uppercase',
                  letterSpacing: 4,
                  opacity: charP > 0.1 ? Math.min(1, charP * 2) : 0,
                  textShadow: burnGlow > 0
                    ? `0 0 8px rgba(255, 120, 30, ${burnGlow}), 0 0 16px rgba(255, 80, 10, ${burnGlow * 0.5})`
                    : `0 0 3px rgba(0, 0, 0, 0.4)`,
                  filter: charP < 0.5 ? `blur(${(1 - charP * 2) * 2}px)` : 'none',
                }}>
                  {ch}
                  {/* Heated pen tip glow */}
                  {isActive && (
                    <span style={{
                      position: 'absolute', right: -4, top: '40%',
                      width: 6, height: 6, borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(255, 200, 50, 0.9), rgba(255, 100, 20, 0.4), transparent)',
                      pointerEvents: 'none',
                    }} />
                  )}
                </span>
              )
            })}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Fully burned text with warm char glow pulsing
      const pulse = Math.sin(holdProgress * Math.PI * 3) * 0.15
      const charEdgeGlow = 0.2 + pulse

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Char/scorch halo */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
            fontWeight: 700,
            color: 'transparent',
            WebkitTextStroke: `3px rgba(60, 30, 5, ${charEdgeGlow})`,
            textTransform: 'uppercase',
            letterSpacing: 4,
            whiteSpace: 'nowrap',
            filter: 'blur(3px)',
          }}>
            {word}
          </div>
          {/* Main burned text */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: 4,
            whiteSpace: 'nowrap',
            textShadow: `0 0 4px rgba(0, 0, 0, 0.5), 0 0 ${8 + pulse * 6}px rgba(180, 80, 20, 0.15)`,
          }}>
            {word}
          </div>
          {/* Subtle "handmade" label */}
          <div style={{
            position: 'absolute', bottom: '22%', left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Georgia', serif", fontSize: 8,
            color: 'rgba(80, 50, 20, 0.15)', letterSpacing: 3,
          }}>
            PYROGRAPHY
          </div>
        </div>
      )
    } else {
      // Exit: burn marks cool and fade, text darkens then disappears
      const cool = exitProgress
      const darken = Math.min(1, cool * 1.5)

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: 4,
            whiteSpace: 'nowrap',
            opacity: 1 - cool,
            filter: `brightness(${1 - darken * 0.5}) blur(${cool * 1.5}px)`,
            textShadow: `0 0 ${3 - cool * 3}px rgba(0, 0, 0, 0.4)`,
          }}>
            {word}
          </div>
        </div>
      )
    }
  },
}

function WoodBurnComponent(props: MotionGraphicProps<WoodBurnConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-wood-burn',
  title: 'Wood Burn',
  description: 'Pyrography wood burning with text burned into wood grain by heated pen, char marks, smoke wisps, and natural wood background',
  tags: ['kinetic', 'typography', 'wood', 'burn', 'pyrography', 'craft', 'natural', 'rustic', 'material'],
  category: 'captions',
  component: WoodBurnComponent as any,
  defaultConfig: {
    words: ['BURN', 'CHAR', 'GRAIN', 'WOOD'],
    colors: ['#2C1506', '#3A1E0A', '#1E0E02', '#331A08'],
    bgColor: '#B8864E',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BURN', 'CHAR', 'GRAIN', 'WOOD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2C1506', '#3A1E0A', '#1E0E02', '#331A08'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#B8864E', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
