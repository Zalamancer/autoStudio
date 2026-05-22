import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface KaboomScaleConfig extends KineticBaseConfig {}

// Text scales up with explosion radiating lines — NOT a shape behind it.
// The explosion is pure line geometry: many thin straight lines radiating
// from behind the letters, growing outward as the text scales in.
// Lines are the explosion; text is the epicenter.

const LINE_COUNT = 48

// Build deterministic line angles spread around 360°, with slight irregularity
function buildLines(seed: number): Array<{ angle: number; length: number; thickness: number; opacity: number; delay: number }> {
  const lines = []
  for (let i = 0; i < LINE_COUNT; i++) {
    const s = seed + i * 37 + 11
    // Base angle with slight random spread so lines aren't perfectly even
    const baseAngle = (i / LINE_COUNT) * 360
    const jitter = ((s * 53) % 9) - 4        // ±4 degree jitter
    const angle = baseAngle + jitter

    // Vary line length — longer lines alternate with short ones (starburst feel)
    const isMajor = i % 3 !== 2
    const lengthVariance = (s * 17 % 30) / 100  // 0..0.3 extra
    const length = isMajor ? 0.55 + lengthVariance : 0.28 + lengthVariance

    const thickness = isMajor ? 2 + (s % 3) : 1 + (s % 2)
    const opacity = isMajor ? 0.75 + (s % 5) * 0.04 : 0.45 + (s % 4) * 0.04

    // Slight stagger so lines don't all appear simultaneously
    const delay = (s * 7 % 12) / 100  // 0..0.12

    lines.push({ angle, length, thickness, opacity, delay })
  }
  return lines
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Subtle pulsing radial gradient — energy in the background
    const pulse = 0.5 + Math.sin(time * 4) * 0.12
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Energy radial behind everything */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 70% 70% at 50% 50%, rgba(255,255,255,${pulse * 0.12}) 0%, transparent 70%)`,
          }}
        />
        {/* Fine halftone — comic page ground */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)',
            backgroundSize: '9px 9px',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width, height, frame = 0 }: WordRenderProps) => {
    const seed = index * 71 + 3
    const lines = buildLines(seed)

    const maxRadius = Math.max(width, height) * 0.7

    let textScale = 0
    let textOpacity = 0
    let lineProgress = 0   // 0..1 — how far lines have extended
    let lineOpacity = 1
    let containerOpacity = 1
    const tilt = ((seed % 7) - 3) * 2

    if (phase === 'enter') {
      // Lines blast out first, then text scales up right behind
      const eased = enterProgress < 0.5
        ? 4 * enterProgress * enterProgress * enterProgress
        : 1 - Math.pow(-2 * enterProgress + 2, 3) / 2

      lineProgress = eased
      lineOpacity = Math.min(1, enterProgress * 5)

      // Elastic overshoot on text scale
      const t = enterProgress
      if (t < 0.6) {
        textScale = (t / 0.6) * 1.25  // overshoot to 1.25
        textOpacity = Math.min(1, t / 0.3)
      } else {
        // Settle back to 1.0 with elastic bounce
        const settle = (t - 0.6) / 0.4
        textScale = 1.25 - settle * 0.3 + Math.sin(settle * Math.PI * 2) * (1 - settle) * 0.08
        textOpacity = 1
      }
      containerOpacity = Math.min(1, enterProgress * 2)

    } else if (phase === 'hold') {
      lineProgress = 1
      lineOpacity = 0.7
      textScale = 1 + Math.sin((frame / 30) * 2 + seed) * 0.02  // subtle breathing
      textOpacity = 1
      containerOpacity = 1

    } else {
      // Lines retract back toward text; text shrinks
      const eased = exitProgress * exitProgress
      lineProgress = 1 - eased * 0.8
      lineOpacity = Math.max(0, 1 - exitProgress * 1.5)
      textScale = 1 - exitProgress * 0.5
      textOpacity = Math.max(0, 1 - exitProgress * 2)
      containerOpacity = Math.max(0, 1 - exitProgress * 1.2)
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%)`,
          opacity: Math.max(0, containerOpacity),
        }}
      >
        {/* Explosion lines — radiate from center of text */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: 0, height: 0 }}>
          {lines.map((line, i) => {
            // Per-line stagger
            const adjustedProgress = Math.max(0, lineProgress - line.delay) / (1 - line.delay)
            const len = maxRadius * line.length * Math.min(1, adjustedProgress)
            const eLen = len * (1 - Math.pow(1 - Math.min(1, adjustedProgress), 2))

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: `${eLen}px`,
                  height: `${line.thickness}px`,
                  background: '#000000',
                  transformOrigin: '0 50%',
                  transform: `rotate(${line.angle}deg)`,
                  opacity: lineOpacity * line.opacity,
                  borderRadius: `0 ${line.thickness}px ${line.thickness}px 0`,
                }}
              />
            )
          })}

          {/* Second thinner ring of lines — color accent at half length */}
          {lines.filter((_, i) => i % 4 === 0).map((line, i) => {
            const adjustedProgress = Math.max(0, lineProgress - line.delay * 0.5) / (1 - line.delay * 0.5)
            const len = maxRadius * line.length * 0.45 * Math.min(1, adjustedProgress)
            const eLen = len * (1 - Math.pow(1 - Math.min(1, adjustedProgress), 2))

            return (
              <div
                key={`accent-${i}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: `${eLen}px`,
                  height: `${(line.thickness + 1)}px`,
                  background: color,
                  transformOrigin: '0 50%',
                  transform: `rotate(${line.angle + 3.75}deg)`,
                  opacity: lineOpacity * line.opacity * 0.9,
                  borderRadius: `0 ${line.thickness}px ${line.thickness}px 0`,
                }}
              />
            )
          })}
        </div>

        {/* Text — the epicenter of the explosion */}
        <div
          style={{
            position: 'relative',
            transform: `rotate(${tilt}deg) scale(${textScale})`,
            transformOrigin: 'center center',
            opacity: Math.max(0, textOpacity),
          }}
        >
          <div
            style={{
              fontFamily: "Impact, 'Arial Black', sans-serif",
              fontSize: 'clamp(56px, 15vw, 200px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: color,
              WebkitTextStroke: '4px #000000',
              textShadow: '5px 5px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 5px 0 #000, 5px 0 0 #000',
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              userSelect: 'none',
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function KaboomScaleComponent(props: MotionGraphicProps<KaboomScaleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-kaboom-scale',
  title: 'Kinetic Kaboom Scale',
  description: 'Text scales up with radiating explosion lines — 48 deterministic lines blast outward from the text epicenter with elastic overshoot, pure line geometry, no explosion shape',
  tags: ['kinetic', 'typography', 'comic', 'kaboom', 'explosion', 'radial', 'scale', 'impact', 'lines', 'starburst'],
  category: 'captions',
  component: KaboomScaleComponent as any,
  defaultConfig: {
    words: ['BOOM!', 'POW!', 'BAM!', 'ZAP!'],
    colors: ['#FF2200', '#FFD700', '#FF6600', '#00AAFF'],
    bgColor: '#FFEE00',
    cycleDuration: 1.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BOOM!', 'POW!', 'BAM!', 'ZAP!'], group: 'Content' },
    { key: 'colors', label: 'Text Colors', type: 'text-array', defaultValue: ['#FF2200', '#FFD700', '#FF6600', '#00AAFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFEE00', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.0, min: 0.4, max: 5, group: 'Timing' },
  ],
})
