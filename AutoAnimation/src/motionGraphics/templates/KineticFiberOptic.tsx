import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FiberOpticConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const FIBER_COLORS = [
  '#00DDFF', '#00FF88', '#FF3388', '#FFAA00',
  '#8833FF', '#33FFCC', '#FF5500', '#00AAFF',
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Fiber optic strands in background
    const fibers: React.ReactNode[] = []
    const numFibers = 20

    for (let i = 0; i < numFibers; i++) {
      const startX = rand(i * 41 + 7) * width
      const startY = height + 10
      const endX = rand(i * 67 + 13) * width
      const endY = -10
      const fiberColor = FIBER_COLORS[i % FIBER_COLORS.length]
      const alpha = 0.06 + rand(i * 29) * 0.06

      // Light pulse traveling along fiber
      const pulseSpeed = 0.8 + rand(i * 53) * 1.5
      const pulsePos = ((t * pulseSpeed + rand(i * 37) * 10) % 1.4) - 0.2

      // Control point for curve
      const cpX = (startX + endX) / 2 + (rand(i * 83) - 0.5) * width * 0.3
      const cpY = height / 2 + (rand(i * 97) - 0.5) * height * 0.2

      // Approximate fiber as a series of segments
      const segments = 12
      for (let s = 0; s < segments; s++) {
        const t1 = s / segments
        const t2 = (s + 1) / segments
        // Quadratic bezier
        const x1 = (1 - t1) * (1 - t1) * startX + 2 * (1 - t1) * t1 * cpX + t1 * t1 * endX
        const y1 = (1 - t1) * (1 - t1) * startY + 2 * (1 - t1) * t1 * cpY + t1 * t1 * endY
        const x2 = (1 - t2) * (1 - t2) * startX + 2 * (1 - t2) * t2 * cpX + t2 * t2 * endX
        const y2 = (1 - t2) * (1 - t2) * startY + 2 * (1 - t2) * t2 * cpY + t2 * t2 * endY

        const dx = x2 - x1
        const dy = y2 - y1
        const len = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx) * 180 / Math.PI

        // Pulse glow near pulsePos
        const segMid = (t1 + t2) / 2
        const distFromPulse = Math.abs(segMid - pulsePos)
        const pulseGlow = Math.max(0, 1 - distFromPulse * 6)

        fibers.push(
          <div
            key={`f${i}_${s}`}
            style={{
              position: 'absolute',
              left: x1,
              top: y1,
              width: len,
              height: 1.2,
              transformOrigin: '0% 50%',
              transform: `rotate(${angle}deg)`,
              background: fiberColor,
              opacity: alpha + pulseGlow * 0.15,
              boxShadow: pulseGlow > 0.1 ? `0 0 ${pulseGlow * 6}px ${fiberColor}` : undefined,
            }}
          />,
        )
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {fibers}
        {/* Ambient data transmission glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% ${50 + Math.sin(t * 0.4) * 10}%, rgba(0,180,255,0.03), transparent 60%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('')

    if (phase === 'enter') {
      // Each letter transmitted through a fiber strand, arriving at endpoint
      const charElements = chars.map((ch, ci) => {
        const delay = ci / (chars.length + 1) * 0.5
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.5))
        const ep = easeOutQuart(p)

        // Fiber strand carrying letter from bottom to center
        const fiberColor = FIBER_COLORS[(ci + index) % FIBER_COLORS.length]
        const startY = height * 0.8
        const endY = 0
        const currentY = startY + (endY - startY) * ep

        // Character opacity: dim while traveling, bright at arrival
        const charOpacity = p > 0.7 ? (p - 0.7) / 0.3 : 0
        const travelOpacity = p < 0.8 ? Math.min(1, p * 3) * 0.6 : 0

        // Glow at endpoint when char arrives
        const arrivalGlow = p > 0.85 ? (p - 0.85) / 0.15 : 0

        return (
          <span key={ci} style={{ display: 'inline-block', position: 'relative' }}>
            {/* Traveling light pulse */}
            {travelOpacity > 0 && (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: currentY,
                  width: 4,
                  height: 4,
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  background: fiberColor,
                  opacity: travelOpacity,
                  boxShadow: `0 0 8px ${fiberColor}, 0 0 16px ${fiberColor}60`,
                }}
              />
            )}
            {/* Arrival glow */}
            {arrivalGlow > 0 && (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: 30,
                  height: 30,
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${fiberColor}${Math.round(arrivalGlow * 60).toString(16).padStart(2, '0')}, transparent 70%)`,
                  pointerEvents: 'none',
                }}
              />
            )}
            <span
              style={{
                color: charOpacity > 0.5 ? color : fiberColor,
                opacity: charOpacity,
                textShadow: arrivalGlow > 0 ? `0 0 10px ${fiberColor}80` : undefined,
              }}
            >
              {ch}
            </span>
          </span>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Consolas', 'Courier New', monospace",
            fontSize: 'clamp(42px, 12vw, 155px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          {charElements}
        </div>
      )
    }

    if (phase === 'hold') {
      // Text stable with fiber glow pulsing through each character
      const charElements = chars.map((ch, ci) => {
        const fiberColor = FIBER_COLORS[(ci + index) % FIBER_COLORS.length]
        const pulse = Math.sin(t * 3 + ci * 0.6) * 0.5 + 0.5
        const glowColor = pulse > 0.6 ? fiberColor : color

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              color: glowColor,
              textShadow: `0 0 ${4 + pulse * 8}px ${fiberColor}${Math.round(pulse * 100).toString(16).padStart(2, '0')}, 0 0 2px rgba(255,255,255,0.3)`,
            }}
          >
            {ch}
          </span>
        )
      })

      // Fiber strands connecting to each character
      const fiberConnections: React.ReactNode[] = chars.map((_, ci) => {
        const fiberColor = FIBER_COLORS[(ci + index) % FIBER_COLORS.length]
        const charX = width * 0.5 + (ci - (chars.length - 1) / 2) * (width * 0.06)
        const charY = height * 0.5

        // Subtle fiber coming from below
        const pulseTravel = ((t * 2 + ci * 0.3) % 1)
        const pulseY = charY + (height * 0.35) * (1 - pulseTravel)
        const alpha = 0.08 + Math.sin(t * 2 + ci) * 0.03

        return (
          <div key={`fc${ci}`}>
            {/* Fiber strand */}
            <div
              style={{
                position: 'absolute',
                left: charX,
                top: charY,
                width: 1,
                height: height * 0.35,
                background: `linear-gradient(180deg, ${fiberColor}${Math.round(alpha * 255).toString(16).padStart(2, '0')}, transparent)`,
              }}
            />
            {/* Traveling pulse */}
            <div
              style={{
                position: 'absolute',
                left: charX - 2,
                top: pulseY,
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: fiberColor,
                opacity: 0.4,
                boxShadow: `0 0 6px ${fiberColor}`,
              }}
            />
          </div>
        )
      })

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {fiberConnections}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Consolas', 'Courier New', monospace",
              fontSize: 'clamp(42px, 12vw, 155px)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              textTransform: 'uppercase',
            }}
          >
            {charElements}
          </div>
        </div>
      )
    }

    // Exit: letters transmit back through fibers, light drains away
    const charElements = chars.map((ch, ci) => {
      const delay = (chars.length - 1 - ci) / (chars.length + 1) * 0.4
      const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.6))
      const ep = easeInCubic(p)
      const fiberColor = FIBER_COLORS[(ci + index) % FIBER_COLORS.length]

      // Character fades to fiber color then disappears
      const charColor = p > 0.3 ? fiberColor : color
      const charOpacity = 1 - ep

      return (
        <span key={ci} style={{ display: 'inline-block', position: 'relative' }}>
          {/* Departing light pulse */}
          {ep > 0.2 && ep < 0.9 && (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: `${ep * 120}%`,
                width: 4,
                height: 4,
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                background: fiberColor,
                opacity: (1 - ep) * 0.6,
                boxShadow: `0 0 6px ${fiberColor}`,
              }}
            />
          )}
          <span
            style={{
              color: charColor,
              opacity: charOpacity,
              textShadow: ep > 0.1 ? `0 0 ${ep * 12}px ${fiberColor}40` : undefined,
              filter: ep > 0.5 ? `blur(${(ep - 0.5) * 4}px)` : undefined,
            }}
          >
            {ch}
          </span>
        </span>
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Consolas', 'Courier New', monospace",
          fontSize: 'clamp(42px, 12vw, 155px)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          letterSpacing: 4,
          textTransform: 'uppercase',
        }}
      >
        {charElements}
      </div>
    )
  },
}

function FiberOpticComponent(props: MotionGraphicProps<FiberOpticConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-fiber-optic',
  title: 'Kinetic Fiber Optic',
  description: 'Text transmitted as light through fiber optic bundle, each letter carried by a color-coded strand with endpoint glow and data transmission pulses',
  tags: ['kinetic', 'typography', 'fiber', 'optic', 'light', 'data', 'transmission', 'optics'],
  category: 'captions',
  component: FiberOpticComponent as any,
  defaultConfig: {
    words: ['DATA', 'PULSE', 'FIBER', 'LIGHT'],
    colors: ['#E0F0FF', '#D0E8FF', '#E8F4FF', '#C8E0FF'],
    bgColor: '#06080e',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DATA', 'PULSE', 'FIBER', 'LIGHT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E0F0FF', '#D0E8FF', '#E8F4FF', '#C8E0FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#06080e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
