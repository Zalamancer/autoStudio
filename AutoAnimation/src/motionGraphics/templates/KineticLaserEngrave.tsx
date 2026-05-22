import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LaserEngraveConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Brushed metal surface with subtle grain
    const grainLines: { y: number; opacity: number }[] = []
    for (let i = 0; i < 40; i++) {
      grainLines.push({
        y: seededRand(i * 67 + 19) * height,
        opacity: 0.02 + seededRand(i * 43) * 0.02,
      })
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Brushed metal grain -- horizontal streaks */}
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {grainLines.map((g, i) => (
            <line
              key={i}
              x1={0} y1={g.y} x2={width} y2={g.y}
              stroke={`rgba(180, 190, 200, ${g.opacity})`}
              strokeWidth={0.4}
            />
          ))}
        </svg>
        {/* Metallic sheen gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, rgba(120, 130, 140, 0.03) 0%, transparent 40%, rgba(120, 130, 140, 0.02) 60%, transparent 100%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Machine status bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 6,
            left: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 7,
            color: 'rgba(255, 160, 60, 0.12)',
            letterSpacing: 1,
          }}
        >
          ENGRAVE MODE | DEPTH: 0.05mm | FREQ: 40kHz
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const chars = word.split('')
    const charCount = chars.length

    if (phase === 'enter') {
      // Laser beam draws each character sequentially with fill reveal
      // Each char has a vertical scan that fills it top-to-bottom
      const charElements = chars.map((ch, ci) => {
        const charStart = ci / charCount
        const charEnd = (ci + 1) / charCount
        const charProg = Math.max(0, Math.min(1, (enterProgress - charStart) / (charEnd - charStart)))

        if (charProg <= 0) {
          return (
            <span key={ci} style={{ display: 'inline-block', opacity: 0 }}>
              {ch}
            </span>
          )
        }

        // Vertical reveal via clipPath
        const revealPercent = charProg * 100
        const isActiveChar = charProg > 0 && charProg < 1
        const heatGlow = isActiveChar ? 0.6 : Math.max(0, 0.4 - (enterProgress - charEnd) * 3)

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              position: 'relative',
            }}
          >
            {/* Heat glow underneath -- engraved burn */}
            <span
              style={{
                position: 'absolute',
                inset: 0,
                color: `rgba(255, 140, 40, ${heatGlow * 0.5})`,
                filter: `blur(3px)`,
                clipPath: `inset(0 0 ${100 - revealPercent}% 0)`,
                mixBlendMode: 'screen',
              }}
            >
              {ch}
            </span>
            {/* Engraved text */}
            <span
              style={{
                color,
                clipPath: `inset(0 0 ${100 - revealPercent}% 0)`,
                textShadow: isActiveChar
                  ? `0 0 4px rgba(255, 200, 120, 0.6), 0 0 10px rgba(255, 140, 40, 0.3)`
                  : `0 0 2px ${color}40`,
              }}
            >
              {ch}
            </span>
            {/* Laser point at cutting edge */}
            {isActiveChar && (
              <span
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: `${revealPercent}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 220, 0.9)',
                  boxShadow: '0 0 6px rgba(255, 200, 100, 0.8), 0 0 12px rgba(255, 140, 40, 0.4)',
                  pointerEvents: 'none',
                }}
              />
            )}
          </span>
        )
      })

      // Spark particles near the active character
      const activeCharIdx = Math.min(Math.floor(enterProgress * charCount), charCount - 1)
      const sparks = Array.from({ length: 5 }, (_, i) => {
        const sparkSeed = f * 7 + i * 31 + activeCharIdx * 13
        const angle = seededRand(sparkSeed) * Math.PI * 2
        const dist = 3 + seededRand(sparkSeed + 1) * 12
        const sparkLife = seededRand(sparkSeed + 2)
        const sparkOpacity = sparkLife > 0.5 ? (1 - sparkLife) * 1.2 : 0

        // Position relative to center of text
        const sparkX = width / 2 + (activeCharIdx - charCount / 2) * 50 + Math.cos(angle) * dist
        const sparkY = height / 2 + Math.sin(angle) * dist + dist * 0.5

        return (
          <div
            key={`spark-${i}`}
            style={{
              position: 'absolute',
              left: sparkX,
              top: sparkY,
              width: 2,
              height: 2,
              borderRadius: '50%',
              background: `rgba(255, 220, 100, ${sparkOpacity})`,
              boxShadow: `0 0 3px rgba(255, 180, 60, ${sparkOpacity * 0.5})`,
            }}
          />
        )
      })

      return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {sparks}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 12vw, 160px)',
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
    } else if (phase === 'hold') {
      // Complete engrave with cooling heat dissipation -- glow pulses down
      const heatWave = Math.sin(holdProgress * Math.PI * 3) * 0.3
      const coolPulse = 0.15 + heatWave * 0.1

      const charElements = chars.map((ch, ci) => {
        const charHeat = Math.sin(f * 0.1 + ci * 1.5) * 0.15

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              position: 'relative',
            }}
          >
            {/* Residual heat glow */}
            <span
              style={{
                position: 'absolute',
                inset: 0,
                color: `rgba(255, 140, 40, ${coolPulse + charHeat})`,
                filter: 'blur(3px)',
                mixBlendMode: 'screen',
              }}
            >
              {ch}
            </span>
            <span
              style={{
                color,
                textShadow: `0 0 3px ${color}40, 0 0 8px rgba(255, 140, 40, ${coolPulse})`,
              }}
            >
              {ch}
            </span>
          </span>
        )
      })

      return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 12vw, 160px)',
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
    } else {
      // Exit: metal cools completely -- text dims to a subtle emboss, then fades
      const coolDown = exitProgress
      const dimFactor = 1 - coolDown * 0.7

      const charElements = chars.map((ch, ci) => {
        const charDelay = ci / charCount * 0.2
        const charCool = Math.max(0, Math.min(1, (coolDown - charDelay) / 0.8))

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              position: 'relative',
            }}
          >
            {/* Emboss shadow effect as it cools */}
            {charCool > 0.3 && (
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  color: 'rgba(0, 0, 0, 0.3)',
                  transform: 'translate(1px, 1px)',
                  opacity: charCool * 0.5,
                }}
              >
                {ch}
              </span>
            )}
            <span
              style={{
                color,
                opacity: dimFactor - charCool * 0.3,
                textShadow: charCool < 0.5
                  ? `0 0 ${(1 - charCool * 2) * 6}px rgba(255, 140, 40, ${0.2 - charCool * 0.4})`
                  : 'none',
              }}
            >
              {ch}
            </span>
          </span>
        )
      })

      return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 12vw, 160px)',
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
  },
}

function LaserEngraveComponent(props: MotionGraphicProps<LaserEngraveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-laser-engrave',
  title: 'Kinetic Laser Engrave',
  description: 'Laser engraves each letter with vertical fill scan, hot sparks, heat glow that cools to embossed metal, per-character sequential reveal',
  tags: ['kinetic', 'typography', 'laser', 'engrave', 'metal', 'industrial', 'precision', 'fabrication'],
  category: 'captions',
  component: LaserEngraveComponent as any,
  defaultConfig: {
    words: ['ETCH', 'MARK', 'BURN', 'DEEP'],
    colors: ['#E0D0C0', '#C0B0A0', '#E0D0C0', '#D0C0B0'],
    bgColor: '#101418',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ETCH', 'MARK', 'BURN', 'DEEP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E0D0C0', '#C0B0A0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#101418', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
