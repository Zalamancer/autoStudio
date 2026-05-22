import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ConcreteStampConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutBounce(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) { const t2 = t - 1.5 / 2.75; return 7.5625 * t2 * t2 + 0.75 }
  if (t < 2.5 / 2.75) { const t2 = t - 2.25 / 2.75; return 7.5625 * t2 * t2 + 0.9375 }
  const t2 = t - 2.625 / 2.75
  return 7.5625 * t2 * t2 + 0.984375
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Aggregate stones in the concrete
    const aggregates: { x: number; y: number; rx: number; ry: number; rot: number; shade: number }[] = []
    for (let i = 0; i < 35; i++) {
      aggregates.push({
        x: rand(i * 11 + 3) * width,
        y: rand(i * 17 + 7) * height,
        rx: 2 + rand(i * 23 + 13) * 5,
        ry: 1.5 + rand(i * 29 + 19) * 3,
        rot: rand(i * 31) * 180,
        shade: 0.04 + rand(i * 37 + 23) * 0.06,
      })
    }

    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(175deg, #9E9E9E 0%, ${bgColor} 40%, #8A8A8A 100%)`,
      }}>
        {/* Concrete surface noise texture */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            repeating-linear-gradient(87deg, transparent, transparent 3px, rgba(0,0,0,0.01) 3px, rgba(0,0,0,0.01) 4px),
            repeating-linear-gradient(173deg, transparent, transparent 5px, rgba(255,255,255,0.008) 5px, rgba(255,255,255,0.008) 6px)
          `,
        }} />
        {/* Wet sheen on fresh pour */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at ${50 + Math.sin(t * 0.2) * 10}% 40%, rgba(255,255,255,0.06) 0%, transparent 60%)`,
        }} />
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Aggregate stones */}
          {aggregates.map((a, i) => (
            <ellipse key={`agg${i}`} cx={a.x} cy={a.y} rx={a.rx} ry={a.ry}
              fill={`rgba(120, 115, 105, ${a.shade})`}
              transform={`rotate(${a.rot} ${a.x} ${a.y})`} />
          ))}
          {/* Expansion joint lines */}
          <line x1={width * 0.33} y1={0} x2={width * 0.33} y2={height}
            stroke="rgba(60, 60, 60, 0.12)" strokeWidth={2} />
          <line x1={width * 0.66} y1={0} x2={width * 0.66} y2={height}
            stroke="rgba(60, 60, 60, 0.12)" strokeWidth={2} />
          <line x1={0} y1={height * 0.5} x2={width} y2={height * 0.5}
            stroke="rgba(60, 60, 60, 0.08)" strokeWidth={1.5} />
          {/* Edge form marks */}
          <rect x={0} y={0} width={width} height={height}
            fill="none" stroke="rgba(80, 80, 80, 0.15)" strokeWidth={4} />
          {/* Fresh pour trowel marks — curved sweeps */}
          {Array.from({ length: 3 }, (_, i) => {
            const cy = height * (0.25 + i * 0.25)
            return (
              <path key={`trowel${i}`}
                d={`M ${width * 0.1} ${cy} Q ${width * 0.3} ${cy - 8} ${width * 0.5} ${cy + 3} Q ${width * 0.7} ${cy + 12} ${width * 0.9} ${cy - 2}`}
                fill="none" stroke={`rgba(130, 130, 130, 0.05)`} strokeWidth={8} />
            )
          })}
          {/* Concrete label */}
          <text x={12} y={height - 8}
            fill="rgba(60, 60, 60, 0.08)" fontSize={6}
            fontFamily="'Courier New', monospace">
            4000 PSI • 28-DAY CURE • CLASS C
          </text>
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const fontSize = Math.min(width / (word.length * 0.6), 120)
    const f = frame ?? 0

    if (phase === 'enter') {
      // Stamp pressed into wet concrete — comes down from above with bounce
      const stampP = easeOutBounce(Math.min(1, enterProgress * 1.15))
      const yOffset = (1 - stampP) * -40
      const opacity = Math.min(1, enterProgress * 4)

      // Wet concrete splash on impact
      const impactPhase = enterProgress < 0.2
      const splashOpacity = impactPhase ? (1 - enterProgress / 0.2) * 0.3 : 0

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Impact ripple in wet concrete */}
          {splashOpacity > 0 && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: `${60 + enterProgress * 200}%`, height: 40,
              borderRadius: '50%',
              border: `1px solid rgba(180, 180, 180, ${splashOpacity})`,
              pointerEvents: 'none',
            }} />
          )}
          {/* Pressed impression shadow */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: `translate(-50%, calc(-50% + ${yOffset + 2}px))`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 900,
            color: 'transparent',
            WebkitTextStroke: `2px rgba(50, 50, 50, ${0.2 * opacity})`,
            textTransform: 'uppercase',
            letterSpacing: 6,
            whiteSpace: 'nowrap',
            filter: 'blur(2px)',
          }}>
            {word}
          </div>
          {/* Main stamped text */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: `translate(-50%, calc(-50% + ${yOffset}px))`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 900,
            color,
            textTransform: 'uppercase',
            letterSpacing: 6,
            whiteSpace: 'nowrap',
            opacity,
            textShadow: `inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 3px rgba(0,0,0,0.25)`,
          }}>
            {word}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Settled impression — concrete setting, subtle moisture glistens
      const moisturePulse = Math.sin(holdProgress * Math.PI * 4) * 0.04

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Indentation shadow */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(calc(-50% + 1px), calc(-50% + 2px))',
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 900,
            color: 'transparent',
            WebkitTextStroke: `1.5px rgba(50, 50, 50, 0.2)`,
            textTransform: 'uppercase',
            letterSpacing: 6,
            whiteSpace: 'nowrap',
            filter: 'blur(1.5px)',
          }}>
            {word}
          </div>
          {/* Highlight on upper edge of indentation */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(calc(-50% - 0.5px), calc(-50% - 0.5px))',
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 900,
            color: 'transparent',
            WebkitTextStroke: `0.5px rgba(200, 200, 200, ${0.15 + moisturePulse})`,
            textTransform: 'uppercase',
            letterSpacing: 6,
            whiteSpace: 'nowrap',
          }}>
            {word}
          </div>
          {/* Main text */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 900,
            color,
            textTransform: 'uppercase',
            letterSpacing: 6,
            whiteSpace: 'nowrap',
            textShadow: '0 2px 3px rgba(0,0,0,0.2)',
          }}>
            {word}
          </div>
          {/* Wet concrete timestamp */}
          <div style={{
            position: 'absolute', bottom: '22%', left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace", fontSize: 8,
            color: 'rgba(80, 80, 80, 0.15)', letterSpacing: 2,
          }}>
            FRESH POUR &mdash; DO NOT WALK
          </div>
        </div>
      )
    } else {
      // Exit: concrete hardens and text sinks in, edges crumble
      const harden = exitProgress
      const chars = word.split('')
      const letterWidth = fontSize * 0.65

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {chars.map((ch, ci) => {
            const crumble = harden * (0.5 + rand(ci * 19 + index * 7) * 0.5)
            const yDrift = crumble * 8
            const rotate = (rand(ci * 23) - 0.5) * crumble * 10
            const baseX = (width - chars.length * letterWidth) / 2 + ci * letterWidth

            return (
              <div key={ci} style={{
                position: 'absolute',
                left: baseX,
                top: '50%',
                transform: `translateY(calc(-50% + ${yDrift}px)) rotate(${rotate}deg)`,
                fontFamily: "'Impact', 'Arial Black', sans-serif",
                fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
                fontWeight: 900,
                color,
                textTransform: 'uppercase',
                opacity: 1 - crumble,
                textShadow: `0 ${2 - crumble * 2}px 3px rgba(0,0,0,${0.2 * (1 - crumble)})`,
              }}>
                {ch}
              </div>
            )
          })}
        </div>
      )
    }
  },
}

function ConcreteStampComponent(props: MotionGraphicProps<ConcreteStampConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-concrete-stamp',
  title: 'Concrete Stamp',
  description: 'Stamped concrete with text pressed into wet concrete, aggregate texture, expansion joint lines, industrial gray, and fresh pour aesthetic',
  tags: ['kinetic', 'typography', 'concrete', 'stamp', 'industrial', 'construction', 'wet', 'urban', 'material'],
  category: 'captions',
  component: ConcreteStampComponent as any,
  defaultConfig: {
    words: ['POUR', 'SET', 'CURE', 'FORM'],
    colors: ['#555555', '#4A4A4A', '#606060', '#505050'],
    bgColor: '#949494',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['POUR', 'SET', 'CURE', 'FORM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#555555', '#4A4A4A', '#606060', '#505050'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#949494', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
