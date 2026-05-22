import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MetalEngraveConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Polished metal surface with directional brushed finish
    const reflectionX = (Math.sin(t * 0.4) * 0.5 + 0.5) * 100

    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(160deg, #B8B8C0 0%, ${bgColor} 35%, #E8E8EC 50%, ${bgColor} 65%, #A8A8B4 100%)`,
      }}>
        {/* Brushed metal directional grain */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.02) 1px, rgba(255,255,255,0.02) 2px),
            repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.01) 3px, rgba(0,0,0,0.01) 4px)
          `,
        }} />
        {/* Moving highlight — polished reflection */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at ${reflectionX}% 40%, rgba(255,255,255,0.12) 0%, transparent 50%)`,
        }} />
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Plate edge bevel */}
          <rect x={10} y={10} width={width - 20} height={height - 20}
            fill="none" stroke="rgba(160, 160, 175, 0.3)" strokeWidth={1.5} />
          <rect x={12} y={12} width={width - 24} height={height - 24}
            fill="none" stroke="rgba(220, 220, 230, 0.15)" strokeWidth={0.5} />
          {/* Corner screws */}
          {[
            { x: 20, y: 20 }, { x: width - 20, y: 20 },
            { x: 20, y: height - 20 }, { x: width - 20, y: height - 20 },
          ].map((s, i) => (
            <g key={`screw${i}`}>
              <circle cx={s.x} cy={s.y} r={4}
                fill="rgba(180, 180, 195, 0.3)" stroke="rgba(140, 140, 160, 0.2)" strokeWidth={0.5} />
              <line x1={s.x - 2.5} y1={s.y} x2={s.x + 2.5} y2={s.y}
                stroke="rgba(100, 100, 120, 0.3)" strokeWidth={0.8} />
            </g>
          ))}
          {/* Fine crosshatch pattern in corners */}
          {[{ x: 30, y: 30 }, { x: width - 60, y: height - 60 }].map((area, ai) => (
            <g key={`hatch${ai}`} opacity={0.06}>
              {Array.from({ length: 8 }, (_, i) => (
                <g key={i}>
                  <line x1={area.x + i * 3} y1={area.y} x2={area.x + i * 3} y2={area.y + 25}
                    stroke="rgba(80, 80, 100, 1)" strokeWidth={0.3} />
                  <line x1={area.x} y1={area.y + i * 3} x2={area.x + 25} y2={area.y + i * 3}
                    stroke="rgba(80, 80, 100, 1)" strokeWidth={0.3} />
                </g>
              ))}
            </g>
          ))}
          {/* Engraver's mark */}
          <text x={width - 15} y={height - 10} textAnchor="end"
            fill="rgba(140, 140, 160, 0.1)" fontSize={6}
            fontFamily="'Courier New', monospace">
            BURIN CUT • FINE LINE • .925
          </text>
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const fontSize = Math.min(width / (word.length * 0.5), 110)
    const f = frame ?? 0
    const chars = word.split('')

    if (phase === 'enter') {
      // Burin tool cuts text — fine line traces character outlines
      const traceP = enterProgress

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Engraved groove shadow — cut below surface */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(calc(-50% + 0.5px), calc(-50% + 1px))',
            fontFamily: "'Bodoni Moda', 'Didot', 'Georgia', serif",
            fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
            fontWeight: 700,
            color: 'transparent',
            WebkitTextStroke: `1px rgba(60, 60, 80, ${0.3 * traceP})`,
            textTransform: 'uppercase',
            letterSpacing: 6,
            whiteSpace: 'nowrap',
            clipPath: `inset(0 ${100 - traceP * 100}% 0 0)`,
          }}>
            {word}
          </div>
          {/* Bright edge — light catches engraved groove */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(calc(-50% - 0.5px), calc(-50% - 0.5px))',
            fontFamily: "'Bodoni Moda', 'Didot', 'Georgia', serif",
            fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
            fontWeight: 700,
            color: 'transparent',
            WebkitTextStroke: `0.5px rgba(255, 255, 255, ${0.25 * traceP})`,
            textTransform: 'uppercase',
            letterSpacing: 6,
            whiteSpace: 'nowrap',
            clipPath: `inset(0 ${100 - traceP * 100}% 0 0)`,
          }}>
            {word}
          </div>
          {/* Main engraved line */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Bodoni Moda', 'Didot', 'Georgia', serif",
            fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: 6,
            whiteSpace: 'nowrap',
            clipPath: `inset(0 ${100 - traceP * 100}% 0 0)`,
          }}>
            {word}
          </div>
          {/* Burin tool cursor */}
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {/* Metal shaving curl */}
            {traceP > 0.05 && traceP < 0.95 && (
              <g>
                <circle
                  cx={width * 0.15 + traceP * width * 0.7}
                  cy={height * 0.5}
                  r={2}
                  fill="rgba(200, 200, 220, 0.4)" />
                {/* Tiny shavings */}
                {Array.from({ length: 3 }, (_, i) => (
                  <circle key={i}
                    cx={width * 0.15 + traceP * width * 0.7 + 3 + i * 2}
                    cy={height * 0.5 + 2 + rand(f + i * 7) * 4}
                    r={0.6}
                    fill="rgba(200, 200, 220, 0.25)" />
                ))}
              </g>
            )}
          </svg>
        </div>
      )
    } else if (phase === 'hold') {
      // Polished engraving catches shifting light
      const lightAngle = holdProgress * Math.PI * 2
      const lightX = Math.cos(lightAngle) * 1.5
      const lightY = Math.sin(lightAngle) * 0.8
      const shimmer = 0.2 + Math.sin(holdProgress * Math.PI * 6) * 0.05

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Groove shadow */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: `translate(calc(-50% + ${0.5 + lightX * 0.3}px), calc(-50% + ${1 + lightY * 0.3}px))`,
            fontFamily: "'Bodoni Moda', 'Didot', 'Georgia', serif",
            fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
            fontWeight: 700,
            color: 'transparent',
            WebkitTextStroke: `1px rgba(60, 60, 80, 0.3)`,
            textTransform: 'uppercase',
            letterSpacing: 6,
            whiteSpace: 'nowrap',
          }}>
            {word}
          </div>
          {/* Light edge */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: `translate(calc(-50% - ${0.5 + lightX * 0.2}px), calc(-50% - ${0.5 + lightY * 0.2}px))`,
            fontFamily: "'Bodoni Moda', 'Didot', 'Georgia', serif",
            fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
            fontWeight: 700,
            color: 'transparent',
            WebkitTextStroke: `0.5px rgba(255, 255, 255, ${shimmer})`,
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
            fontFamily: "'Bodoni Moda', 'Didot', 'Georgia', serif",
            fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: 6,
            whiteSpace: 'nowrap',
          }}>
            {word}
          </div>
          {/* Fine crosshatch fill beneath — engraver's shading */}
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <line x1={width * 0.3} y1={height * 0.6}
              x2={width * 0.7} y2={height * 0.6}
              stroke="rgba(140, 140, 165, 0.12)" strokeWidth={0.5} />
            <line x1={width * 0.35} y1={height * 0.63}
              x2={width * 0.65} y2={height * 0.63}
              stroke="rgba(140, 140, 165, 0.08)" strokeWidth={0.3} />
          </svg>
        </div>
      )
    } else {
      // Exit: reflection moves away, engraving becomes less visible
      const fade = exitProgress
      const reflectionShift = fade * 30

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Reflection sweeps across then fades */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: `translate(calc(-50% + ${reflectionShift}px), -50%)`,
            fontFamily: "'Bodoni Moda', 'Didot', 'Georgia', serif",
            fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: 6,
            whiteSpace: 'nowrap',
            opacity: 1 - fade,
            textShadow: `${1 - fade}px ${1 - fade}px 0 rgba(60, 60, 80, ${0.3 * (1 - fade)})`,
          }}>
            {word}
          </div>
        </div>
      )
    }
  },
}

function MetalEngraveComponent(props: MotionGraphicProps<MetalEngraveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-metal-engrave',
  title: 'Metal Engrave',
  description: 'Metal plate engraving with text cut into polished silver/gold surface by burin tool, fine line crosshatch shading, and reflective highlights',
  tags: ['kinetic', 'typography', 'metal', 'engrave', 'silver', 'gold', 'burin', 'precision', 'luxury', 'material'],
  category: 'captions',
  component: MetalEngraveComponent as any,
  defaultConfig: {
    words: ['ENGRAVE', 'SILVER', 'FINE', 'LINE'],
    colors: ['#4A4A5C', '#3C3C50', '#555568', '#42424F'],
    bgColor: '#C8C8D4',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ENGRAVE', 'SILVER', 'FINE', 'LINE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#4A4A5C', '#3C3C50', '#555568', '#42424F'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#C8C8D4', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
