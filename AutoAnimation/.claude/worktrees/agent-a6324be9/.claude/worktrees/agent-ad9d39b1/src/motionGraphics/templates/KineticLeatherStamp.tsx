import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LeatherStampConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Saddle leather grain texture lines
    const grainLines: { x: number; y: number; w: number; angle: number; opacity: number }[] = []
    for (let i = 0; i < 40; i++) {
      grainLines.push({
        x: rand(i * 13) * width,
        y: rand(i * 17 + 3) * height,
        w: 30 + rand(i * 23 + 7) * 120,
        angle: -5 + rand(i * 31 + 11) * 10,
        opacity: 0.03 + rand(i * 41 + 19) * 0.06,
      })
    }

    // Border tooling pattern — decorative western border
    const borderInset = 20
    const cornerSize = 30

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Leather grain texture */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            repeating-linear-gradient(15deg, transparent, transparent 8px, rgba(0,0,0,0.02) 8px, rgba(0,0,0,0.02) 9px),
            repeating-linear-gradient(-8deg, transparent, transparent 12px, rgba(255,255,255,0.015) 12px, rgba(255,255,255,0.015) 13px)
          `,
        }} />
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Leather grain lines */}
          {grainLines.map((g, i) => (
            <line key={`g${i}`} x1={g.x} y1={g.y}
              x2={g.x + g.w * Math.cos(g.angle * Math.PI / 180)}
              y2={g.y + g.w * Math.sin(g.angle * Math.PI / 180)}
              stroke={`rgba(60, 35, 15, ${g.opacity})`} strokeWidth={0.5} />
          ))}
          {/* Tooling border — dashed rectangle with beveled corners */}
          <rect x={borderInset} y={borderInset}
            width={width - borderInset * 2} height={height - borderInset * 2}
            fill="none" stroke="rgba(90, 55, 25, 0.15)" strokeWidth={1.5} rx={4} />
          <rect x={borderInset + 8} y={borderInset + 8}
            width={width - borderInset * 2 - 16} height={height - borderInset * 2 - 16}
            fill="none" stroke="rgba(90, 55, 25, 0.1)" strokeWidth={0.8} rx={2} />
          {/* Corner rosette stamps */}
          {[
            { x: borderInset + 12, y: borderInset + 12 },
            { x: width - borderInset - 12, y: borderInset + 12 },
            { x: borderInset + 12, y: height - borderInset - 12 },
            { x: width - borderInset - 12, y: height - borderInset - 12 },
          ].map((c, i) => (
            <g key={`corner${i}`}>
              <circle cx={c.x} cy={c.y} r={6} fill="none"
                stroke="rgba(90, 55, 25, 0.12)" strokeWidth={0.8} />
              {Array.from({ length: 6 }, (_, j) => {
                const a = (j / 6) * Math.PI * 2
                return (
                  <circle key={j} cx={c.x + Math.cos(a) * 4} cy={c.y + Math.sin(a) * 4} r={1.2}
                    fill="rgba(90, 55, 25, 0.08)" />
                )
              })}
            </g>
          ))}
          {/* Running border stamp pattern — small repeating leaf/shell */}
          {Array.from({ length: Math.floor(width / 30) }, (_, i) => {
            const bx = borderInset + 25 + i * 30
            if (bx > width - borderInset - 25) return null
            return (
              <g key={`bt${i}`}>
                <ellipse cx={bx} cy={borderInset + 4} rx={4} ry={2}
                  fill="rgba(90, 55, 25, 0.06)" />
                <ellipse cx={bx} cy={height - borderInset - 4} rx={4} ry={2}
                  fill="rgba(90, 55, 25, 0.06)" />
              </g>
            )
          })}
          {/* Swivel knife tool mark — faint label */}
          <text x={width / 2} y={height - 10} textAnchor="middle"
            fill="rgba(90, 55, 25, 0.08)" fontSize={7}
            fontFamily="'Georgia', serif">
            HAND TOOLED • SADDLE LEATHER • FULL GRAIN
          </text>
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const fontSize = Math.min(width / (word.length * 0.55), 130)
    const f = frame ?? 0

    if (phase === 'enter') {
      // Mallet stamps text down — text scales from large to 1 with overshoot
      const stampP = easeOutBack(Math.min(1, enterProgress * 1.1))
      const scale = 1.4 - 0.4 * stampP
      const opacity = Math.min(1, enterProgress * 3)

      // Impact flash
      const impactFlash = enterProgress < 0.15 ? (1 - enterProgress / 0.15) * 0.4 : 0

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Impact flash overlay */}
          {impactFlash > 0 && (
            <div style={{
              position: 'absolute', inset: 0,
              background: `rgba(255, 240, 200, ${impactFlash})`,
              pointerEvents: 'none',
            }} />
          )}
          {/* Embossed shadow layer — offset for depth */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 700,
            color: 'transparent',
            textShadow: `2px 3px 1px rgba(30, 15, 5, ${0.35 * opacity}), -1px -1px 0 rgba(255, 240, 220, ${0.1 * opacity})`,
            WebkitTextStroke: `1px rgba(30, 15, 5, ${0.2 * opacity})`,
            textTransform: 'uppercase',
            letterSpacing: 6,
            whiteSpace: 'nowrap',
          }}>
            {word}
          </div>
          {/* Main stamped text */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: 6,
            whiteSpace: 'nowrap',
            opacity,
            textShadow: `inset 0 0 0 ${color}, 1px 2px 0 rgba(30, 15, 5, 0.3), -1px -1px 0 rgba(255, 240, 220, 0.15)`,
          }}>
            {word}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Settled embossed text with gentle bevel shimmer
      const shimmer = Math.sin(holdProgress * Math.PI * 4) * 0.08
      const lightAngle = holdProgress * Math.PI * 2

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Bevel highlight — top-left light source */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 700,
            color: 'transparent',
            WebkitTextStroke: `1.5px rgba(255, 240, 210, ${0.12 + shimmer})`,
            textTransform: 'uppercase',
            letterSpacing: 6,
            whiteSpace: 'nowrap',
            filter: 'blur(1px)',
            transform: 'translate(calc(-50% - 1px), calc(-50% - 1px))',
          }}>
            {word}
          </div>
          {/* Bevel shadow — bottom-right */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(calc(-50% + 1px), calc(-50% + 2px))',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 700,
            color: 'transparent',
            WebkitTextStroke: `1.5px rgba(30, 15, 5, 0.3)`,
            textTransform: 'uppercase',
            letterSpacing: 6,
            whiteSpace: 'nowrap',
            filter: 'blur(0.5px)',
          }}>
            {word}
          </div>
          {/* Main stamped text */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: 6,
            whiteSpace: 'nowrap',
            textShadow: `1px 2px 1px rgba(30, 15, 5, 0.35), -1px -1px 0 rgba(255, 240, 220, 0.12)`,
          }}>
            {word}
          </div>
          {/* Swivel knife line beneath */}
          <div style={{
            position: 'absolute', top: '62%', left: '50%',
            transform: 'translateX(-50%)',
            width: '50%', height: 1,
            background: `linear-gradient(90deg, transparent, rgba(90, 55, 25, 0.2), transparent)`,
          }} />
        </div>
      )
    } else {
      // Exit: text impression fades as if leather relaxes back
      const fade = exitProgress
      const flatten = 1 + fade * 0.02

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: `translate(-50%, -50%) scaleY(${flatten})`,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: 6,
            whiteSpace: 'nowrap',
            opacity: 1 - fade,
            textShadow: `${1 - fade}px ${2 - fade * 2}px 1px rgba(30, 15, 5, ${0.35 * (1 - fade)})`,
            filter: `blur(${fade * 2}px)`,
          }}>
            {word}
          </div>
        </div>
      )
    }
  },
}

function LeatherStampComponent(props: MotionGraphicProps<LeatherStampConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-leather-stamp',
  title: 'Leather Stamp',
  description: 'Leather tooling with text stamped and embossed into saddle leather, featuring beveling, swivel knife cuts, mallet press impact, and warm brown tones',
  tags: ['kinetic', 'typography', 'leather', 'stamp', 'emboss', 'tooling', 'craft', 'western', 'material'],
  category: 'captions',
  component: LeatherStampComponent as any,
  defaultConfig: {
    words: ['STAMP', 'BEVEL', 'PRESS', 'HIDE'],
    colors: ['#5A3719', '#4A2D14', '#6B4226', '#3E2010'],
    bgColor: '#C4915A',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['STAMP', 'BEVEL', 'PRESS', 'HIDE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#5A3719', '#4A2D14', '#6B4226', '#3E2010'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#C4915A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
