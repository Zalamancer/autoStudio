import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GlassEtchConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Light refraction caustics moving slowly across the glass
    const causticShift = t * 8

    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(135deg, ${bgColor} 0%, rgba(200, 220, 235, 0.95) 30%, ${bgColor} 60%, rgba(210, 225, 240, 0.9) 100%)`,
      }}>
        {/* Glass transparency effect — faint objects behind glass */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(ellipse at ${30 + Math.sin(t * 0.3) * 10}% ${40 + Math.cos(t * 0.2) * 10}%, rgba(255,255,255,0.08) 0%, transparent 50%),
            radial-gradient(ellipse at ${70 + Math.cos(t * 0.25) * 10}% ${60 + Math.sin(t * 0.35) * 10}%, rgba(200,220,240,0.06) 0%, transparent 40%)
          `,
        }} />
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Glass edge bevel — thin bright line */}
          <rect x={6} y={6} width={width - 12} height={height - 12}
            fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth={1} rx={2} />
          <rect x={8} y={8} width={width - 16} height={height - 16}
            fill="none" stroke="rgba(180, 200, 220, 0.08)" strokeWidth={0.5} rx={1} />
          {/* Light caustic streaks */}
          {Array.from({ length: 5 }, (_, i) => {
            const cx = (causticShift + i * width * 0.22) % (width + 100) - 50
            const cy = height * (0.2 + i * 0.15)
            const angle = 25 + i * 5
            return (
              <line key={`c${i}`}
                x1={cx} y1={cy - 30}
                x2={cx + 60} y2={cy + 30}
                stroke={`rgba(255, 255, 255, ${0.03 + rand(i * 7) * 0.03})`}
                strokeWidth={15 + rand(i * 13) * 20}
                transform={`rotate(${angle} ${cx + 30} ${cy})`} />
            )
          })}
          {/* Sandblast texture dots — very faint */}
          {Array.from({ length: 30 }, (_, i) => (
            <circle key={`dot${i}`}
              cx={rand(i * 47) * width} cy={rand(i * 53 + 7) * height}
              r={0.5 + rand(i * 61) * 1}
              fill={`rgba(255, 255, 255, ${0.02 + rand(i * 71) * 0.02})`} />
          ))}
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const fontSize = Math.min(width / (word.length * 0.5), 120)
    const f = frame ?? 0

    if (phase === 'enter') {
      // Acid cream applied — frosted surface spreads across text
      const etchP = easeOutQuart(enterProgress)
      const clipPercent = etchP * 100

      // Frosting noise that builds up
      const frostOpacity = etchP * 0.6

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Frosted glass halo around text */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Garamond', serif",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'transparent',
            WebkitTextStroke: `4px rgba(255, 255, 255, ${frostOpacity * 0.3})`,
            textTransform: 'uppercase',
            letterSpacing: 8,
            whiteSpace: 'nowrap',
            filter: 'blur(6px)',
            clipPath: `inset(0 ${100 - clipPercent}% 0 0)`,
          }}>
            {word}
          </div>
          {/* Etched text revealing */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Garamond', serif",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 400,
            fontStyle: 'italic',
            color,
            textTransform: 'uppercase',
            letterSpacing: 8,
            whiteSpace: 'nowrap',
            clipPath: `inset(0 ${100 - clipPercent}% 0 0)`,
            textShadow: '0 1px 2px rgba(255, 255, 255, 0.3)',
          }}>
            {word}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Fully etched — frosted text catches light
      const lightShift = Math.sin(holdProgress * Math.PI * 2) * 2
      const shimmer = 0.15 + Math.sin(holdProgress * Math.PI * 4) * 0.05

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Frosted halo */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Garamond', serif",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 400,
            fontStyle: 'italic',
            color: 'transparent',
            WebkitTextStroke: `3px rgba(255, 255, 255, ${shimmer})`,
            textTransform: 'uppercase',
            letterSpacing: 8,
            whiteSpace: 'nowrap',
            filter: 'blur(5px)',
          }}>
            {word}
          </div>
          {/* Main frosted etched text */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: `translate(calc(-50% + ${lightShift}px), -50%)`,
            fontFamily: "'Georgia', 'Garamond', serif",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 400,
            fontStyle: 'italic',
            color,
            textTransform: 'uppercase',
            letterSpacing: 8,
            whiteSpace: 'nowrap',
            textShadow: `0 1px 2px rgba(255, 255, 255, 0.25), 0 -1px 1px rgba(0, 0, 0, 0.05)`,
          }}>
            {word}
          </div>
          {/* Elegant monogram underline */}
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <line x1={width * 0.25} y1={height * 0.6}
              x2={width * 0.75} y2={height * 0.6}
              stroke="rgba(255, 255, 255, 0.1)" strokeWidth={0.5} />
            {/* Decorative diamond center */}
            <polygon
              points={`${width / 2},${height * 0.6 - 4} ${width / 2 + 4},${height * 0.6} ${width / 2},${height * 0.6 + 4} ${width / 2 - 4},${height * 0.6}`}
              fill="rgba(255, 255, 255, 0.08)" />
          </svg>
        </div>
      )
    } else {
      // Exit: light shifts away and frosting fades
      const fade = exitProgress
      const lightMove = fade * 20

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: `translate(calc(-50% + ${lightMove}px), -50%)`,
            fontFamily: "'Georgia', 'Garamond', serif",
            fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
            fontWeight: 400,
            fontStyle: 'italic',
            color,
            textTransform: 'uppercase',
            letterSpacing: 8,
            whiteSpace: 'nowrap',
            opacity: 1 - fade,
            textShadow: `0 1px 2px rgba(255, 255, 255, ${0.25 * (1 - fade)})`,
            filter: `blur(${fade * 3}px)`,
          }}>
            {word}
          </div>
        </div>
      )
    }
  },
}

function GlassEtchComponent(props: MotionGraphicProps<GlassEtchConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-glass-etch',
  title: 'Glass Etch',
  description: 'Glass etching with text frosted into clear glass via acid cream or sandblast, elegant monogram style with light refractions and caustics',
  tags: ['kinetic', 'typography', 'glass', 'etch', 'frost', 'elegant', 'monogram', 'transparent', 'material'],
  category: 'captions',
  component: GlassEtchComponent as any,
  defaultConfig: {
    words: ['FROST', 'ETCH', 'GLASS', 'PURE'],
    colors: ['rgba(255,255,255,0.7)', 'rgba(240,248,255,0.65)', 'rgba(255,255,255,0.7)', 'rgba(230,240,250,0.65)'],
    bgColor: '#D8E8F0',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FROST', 'ETCH', 'GLASS', 'PURE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['rgba(255,255,255,0.7)', 'rgba(240,248,255,0.65)'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#D8E8F0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
