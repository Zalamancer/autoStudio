import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MagneticFieldConfig extends KineticBaseConfig {
  fieldStrength: number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

/** Magnetic field line offset — characters feel force of field poles */
function fieldDisplace(ci: number, wordLen: number, fieldAngle: number, strength: number): { dx: number; dy: number } {
  // Each char at position along letter acts like an iron filing in the field
  const norm = (ci / Math.max(1, wordLen - 1)) - 0.5  // -0.5..0.5
  const perpOffset = Math.sin(norm * Math.PI) * strength
  return {
    dx: perpOffset * Math.cos(fieldAngle + Math.PI / 2),
    dy: perpOffset * Math.sin(fieldAngle + Math.PI / 2),
  }
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    const fieldAngle = t * 0.4  // slowly rotating field

    // Draw field lines across background
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {Array.from({ length: 9 }, (_, i) => {
          const yFrac = 0.1 + i * 0.09
          const amp = 20 + (i % 3) * 10
          const phase = (i * 0.7) + fieldAngle * 2
          return (
            <svg
              key={i}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06 + (i % 3) * 0.015 }}
              viewBox={`0 0 ${width || 1080} ${height || 1920}`}
              preserveAspectRatio="none"
            >
              <path
                d={`M 0 ${(yFrac * (height || 1920)).toFixed(0)} Q ${((width || 1080) / 2).toFixed(0)} ${((yFrac * (height || 1920)) - amp * Math.sin(phase)).toFixed(0)} ${width || 1080} ${(yFrac * (height || 1920)).toFixed(0)}`}
                stroke="#4488FF"
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
          )
        })}
        {/* North pole */}
        <div
          style={{
            position: 'absolute',
            left: '15%',
            top: '50%',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#FF4444',
            boxShadow: `0 0 20px 6px rgba(255,68,68,0.4)`,
            transform: 'translate(-50%, -50%)',
          }}
        />
        {/* South pole */}
        <div
          style={{
            position: 'absolute',
            left: '85%',
            top: '50%',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#4466FF',
            boxShadow: `0 0 20px 6px rgba(68,102,255,0.4)`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const fieldAngle = t * 0.4

    const chars = word.split('').map((ch, ci) => {
      const charDelay = Math.abs(ci - word.length / 2) / word.length * 0.4
      let opacity = 1
      let xOff = 0
      let yOff = 0
      let scaleX = 1
      let scaleY = 1
      let rotate = 0
      let blur = 0

      if (phase === 'enter') {
        // Characters drawn in from far edges along field lines
        const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.7))
        const ep = easeOutBack(Math.min(1, p))

        const norm = (ci / Math.max(1, word.length - 1)) - 0.5
        // Start outside frame
        xOff = (1 - ep) * norm * width * 1.2
        yOff = (1 - ep) * Math.sin(norm * Math.PI) * height * 0.3
        rotate = (1 - ep) * norm * 45
        scaleX = 0.6 + ep * 0.4
        scaleY = 0.6 + ep * 0.4
        opacity = p < 0.1 ? p * 10 : 1
        blur = (1 - ep) * 3

      } else if (phase === 'hold') {
        // Iron-filing alignment: letters shift subtly along the oscillating field
        const disp = fieldDisplace(ci, word.length, fieldAngle, 8)
        xOff = disp.dx + Math.sin(t * 1.5 + ci * 0.6) * 1.5
        yOff = disp.dy + Math.cos(t * 1.2 + ci * 0.4) * 1.5
        // Slight orientation tilt along field line
        rotate = Math.sin(fieldAngle + ci * 0.3) * 3
        // Magnetic attraction/compression of letterforms
        scaleX = 1 + Math.sin(t * 2 + ci * 0.5) * 0.025
        scaleY = 1 - Math.sin(t * 2 + ci * 0.5) * 0.02

      } else {
        // Field collapses: letters fly outward centrifugally
        const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.2) / 0.9))
        const ep = easeInQuart(p)
        const norm = (ci / Math.max(1, word.length - 1)) - 0.5
        xOff = norm * ep * width * 1.5
        yOff = Math.sin(norm * Math.PI * 2) * ep * 80
        rotate = ep * norm * 180
        opacity = 1 - ep
        blur = ep * 6
        scaleX = 1 + ep * 0.6
        scaleY = 1 - ep * 0.4
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity,
            transform: `translate(${xOff}px, ${yOff}px) rotate(${rotate}deg) scaleX(${scaleX}) scaleY(${scaleY})`,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            textShadow: `0 0 15px rgba(68,136,255,0.4), 0 2px 8px rgba(0,0,0,0.5)`,
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Arial', sans-serif",
            fontSize: 'clamp(44px, 12vw, 152px)',
            fontWeight: 800,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function MagneticFieldComponent(props: MotionGraphicProps<MagneticFieldConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-magnetic-field',
  title: 'Kinetic Magnetic Field',
  description: 'Letters behave as iron filings in a magnetic field: drawn in along field lines, aligned by polarity, oscillating with field rotation. Field poles visible in background.',
  tags: ['kinetic', 'typography', 'magnetic', 'field', 'metal', 'iron', 'physics', 'poles', 'material-physics'],
  category: 'captions',
  component: MagneticFieldComponent as any,
  defaultConfig: {
    words: ['ATTRACT', 'REPEL', 'FIELD', 'FORCE'],
    colors: ['#88AADD', '#6688CC', '#99BBEE', '#7799BB'],
    bgColor: '#06080E',
    cycleDuration: 2.0,
    fieldStrength: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ATTRACT', 'REPEL', 'FIELD', 'FORCE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#88AADD', '#6688CC', '#99BBEE', '#7799BB'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#06080E', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 5, group: 'Timing' },
    { key: 'fieldStrength', label: 'Field Strength', type: 'number', defaultValue: 1, min: 0.3, max: 3, group: 'Animation' },
  ],
})
