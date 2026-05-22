import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface KaleidoscopeConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutBack(t: number): number {
  const c = 1.7
  return 1 + (t - 1) * (t - 1) * ((c + 1) * (t - 1) + c)
}

function easeInQuad(t: number): number {
  return t * t
}

const KALEIDOSCOPE_COLORS = [
  '#FF3366', '#FF9933', '#FFDD33', '#33CC66',
  '#3399FF', '#9933FF', '#FF33CC', '#33DDDD',
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    const cx = width / 2
    const cy = height / 2

    // Kaleidoscope mirror triangles rotating in background
    const segments: React.ReactNode[] = []
    const numSegments = 12
    const maxRadius = Math.min(width, height) * 0.45

    for (let s = 0; s < numSegments; s++) {
      const baseAngle = (s / numSegments) * 360 + t * 15
      const angleRad = (baseAngle * Math.PI) / 180
      const segColor = KALEIDOSCOPE_COLORS[s % KALEIDOSCOPE_COLORS.length]
      const innerR = maxRadius * 0.2
      const outerR = maxRadius * (0.5 + Math.sin(t * 0.8 + s * 0.5) * 0.15)
      const alpha = 0.06 + Math.sin(t * 1.2 + s * 0.4) * 0.03

      // Triangle-like segment
      const x1 = cx + Math.cos(angleRad) * innerR
      const y1 = cy + Math.sin(angleRad) * innerR
      const segWidth = outerR - innerR
      const segAngle = (360 / numSegments) * 0.8

      segments.push(
        <div
          key={s}
          style={{
            position: 'absolute',
            left: x1,
            top: y1,
            width: segWidth,
            height: segWidth * Math.tan((segAngle * Math.PI) / 360),
            transformOrigin: '0% 50%',
            transform: `rotate(${baseAngle}deg)`,
            background: `linear-gradient(${90 + s * 30}deg, ${segColor}${Math.round(alpha * 255).toString(16).padStart(2, '0')}, transparent)`,
            borderRadius: 2,
          }}
        />,
      )
    }

    // Center mandala glow
    const mandalaPulse = 0.06 + Math.sin(t * 1.5) * 0.02

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {segments}
        {/* Center mandala */}
        <div
          style={{
            position: 'absolute',
            left: cx,
            top: cy,
            width: maxRadius * 0.4,
            height: maxRadius * 0.4,
            transform: `translate(-50%, -50%) rotate(${t * 20}deg)`,
            borderRadius: '50%',
            background: `conic-gradient(
              rgba(255,51,102,${mandalaPulse}),
              rgba(255,153,51,${mandalaPulse}),
              rgba(255,221,51,${mandalaPulse}),
              rgba(51,204,102,${mandalaPulse}),
              rgba(51,153,255,${mandalaPulse}),
              rgba(153,51,255,${mandalaPulse}),
              rgba(255,51,102,${mandalaPulse})
            )`,
            filter: 'blur(10px)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    // Number of mirror reflections
    const numReflections = 6

    if (phase === 'enter') {
      const ep = easeOutBack(Math.min(1, enterProgress * 1.1))

      // Text fragments multiply into kaleidoscope pattern
      const reflections: React.ReactNode[] = []

      for (let r = 0; r < numReflections; r++) {
        const angle = (r / numReflections) * 360 + t * 10
        const angleRad = (angle * Math.PI) / 180
        const radius = 80 * (1 - ep) + 10
        const rx = Math.cos(angleRad) * radius
        const ry = Math.sin(angleRad) * radius
        const reflColor = KALEIDOSCOPE_COLORS[r % KALEIDOSCOPE_COLORS.length]
        const reflOpacity = ep * 0.25
        const reflScale = 0.3 + ep * 0.15
        const mirrorX = r % 2 === 0 ? 1 : -1

        reflections.push(
          <div
            key={r}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${rx}px), calc(-50% + ${ry}px)) rotate(${angle}deg) scaleX(${mirrorX}) scale(${reflScale})`,
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(42px, 12vw, 155px)',
              fontWeight: 800,
              color: reflColor,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              textTransform: 'uppercase',
              opacity: reflOpacity,
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>,
        )
      }

      // Main text emerging from center
      return (
        <>
          {reflections}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scale(${0.5 + ep * 0.5})`,
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(42px, 12vw, 155px)',
              fontWeight: 800,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              textTransform: 'uppercase',
              opacity: ep,
              textShadow: `0 0 15px ${color}40`,
            }}
          >
            {word}
          </div>
        </>
      )
    }

    if (phase === 'hold') {
      // Kaleidoscope rotation with symmetric reflections
      const rotationSpeed = 12
      const reflections: React.ReactNode[] = []

      for (let r = 0; r < numReflections; r++) {
        const angle = (r / numReflections) * 360 + t * rotationSpeed
        const angleRad = (angle * Math.PI) / 180
        const breathRadius = 30 + Math.sin(t * 1.5 + r) * 10
        const rx = Math.cos(angleRad) * breathRadius
        const ry = Math.sin(angleRad) * breathRadius
        const reflColor = KALEIDOSCOPE_COLORS[(r + Math.floor(t * 2)) % KALEIDOSCOPE_COLORS.length]
        const mirrorX = r % 2 === 0 ? 1 : -1

        reflections.push(
          <div
            key={r}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${rx}px), calc(-50% + ${ry}px)) rotate(${angle}deg) scaleX(${mirrorX}) scale(0.4)`,
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(42px, 12vw, 155px)',
              fontWeight: 800,
              color: reflColor,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              textTransform: 'uppercase',
              opacity: 0.2 + Math.sin(t * 2 + r * 0.5) * 0.08,
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>,
        )
      }

      return (
        <>
          {reflections}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(42px, 12vw, 155px)',
              fontWeight: 800,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              textTransform: 'uppercase',
              textShadow: `0 0 12px ${color}30, 0 0 30px rgba(255,255,255,0.08)`,
            }}
          >
            {word}
          </div>
        </>
      )
    }

    // Exit: kaleidoscope spins faster and fragments scatter outward
    const ep = easeInQuad(exitProgress)
    const reflections: React.ReactNode[] = []

    for (let r = 0; r < numReflections; r++) {
      const angle = (r / numReflections) * 360 + t * (15 + ep * 40)
      const angleRad = (angle * Math.PI) / 180
      const scatterRadius = 30 + ep * 120
      const rx = Math.cos(angleRad) * scatterRadius
      const ry = Math.sin(angleRad) * scatterRadius
      const reflColor = KALEIDOSCOPE_COLORS[r % KALEIDOSCOPE_COLORS.length]
      const mirrorX = r % 2 === 0 ? 1 : -1

      reflections.push(
        <div
          key={r}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${rx}px), calc(-50% + ${ry}px)) rotate(${angle}deg) scaleX(${mirrorX}) scale(${0.4 - ep * 0.2})`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(42px, 12vw, 155px)',
            fontWeight: 800,
            color: reflColor,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            textTransform: 'uppercase',
            opacity: (1 - ep) * 0.2,
            mixBlendMode: 'screen',
          }}
        >
          {word}
        </div>,
      )
    }

    return (
      <>
        {reflections}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${1 - ep * 0.3})`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(42px, 12vw, 155px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            textTransform: 'uppercase',
            opacity: 1 - ep,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function KaleidoscopeComponent(props: MotionGraphicProps<KaleidoscopeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-kaleidoscope',
  title: 'Kinetic Kaleidoscope',
  description: 'Text fragments multiply into symmetric kaleidoscope pattern with rotating mirror triangles and colorful repetition',
  tags: ['kinetic', 'typography', 'kaleidoscope', 'mirror', 'symmetric', 'colorful', 'pattern', 'optics'],
  category: 'captions',
  component: KaleidoscopeComponent as any,
  defaultConfig: {
    words: ['MIRROR', 'PRISM', 'KALEID', 'COLOR'],
    colors: ['#FF3366', '#33CCFF', '#FFDD33', '#33FF99'],
    bgColor: '#08080e',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MIRROR', 'PRISM', 'KALEID', 'COLOR'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF3366', '#33CCFF', '#FFDD33', '#33FF99'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#08080e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
