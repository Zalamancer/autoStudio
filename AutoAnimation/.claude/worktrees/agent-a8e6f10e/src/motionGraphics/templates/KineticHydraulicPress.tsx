import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HydraulicPressConfig extends KineticBaseConfig {
  pressForce: number
}

function pseudo(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Heavy deceleration — fast slam, slow compression at bottom
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

// Bounce back — hydraulic recoil after impact
function easeOutBounce(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) { const t2 = t - 1.5 / 2.75; return 7.5625 * t2 * t2 + 0.75 }
  if (t < 2.5 / 2.75) { const t2 = t - 2.25 / 2.75; return 7.5625 * t2 * t2 + 0.9375 }
  const t2 = t - 2.625 / 2.75
  return 7.5625 * t2 * t2 + 0.984375
}

// Accelerating retract for exit
function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    const plateSize = 28
    const pulsePressure = 60 + Math.sin(t * 1.2) * 15

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Diamond plate steel pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(45deg, transparent, transparent ${plateSize - 1}px, rgba(160,170,180,0.04) ${plateSize - 1}px, rgba(160,170,180,0.04) ${plateSize}px),
              repeating-linear-gradient(-45deg, transparent, transparent ${plateSize - 1}px, rgba(160,170,180,0.03) ${plateSize - 1}px, rgba(160,170,180,0.03) ${plateSize}px)
            `,
          }}
        />
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Left hydraulic cylinder */}
          <rect x={width * 0.08} y={0} width={14} height={height} fill="rgba(100,110,120,0.12)" rx={3} />
          <rect x={width * 0.08 + 3} y={0} width={2} height={height} fill="rgba(180,190,200,0.06)" />
          {/* Right hydraulic cylinder */}
          <rect x={width * 0.92 - 14} y={0} width={14} height={height} rx={3} fill="rgba(100,110,120,0.12)" />
          <rect x={width * 0.92 - 11} y={0} width={2} height={height} fill="rgba(180,190,200,0.06)" />
          {/* Top press plate */}
          <rect x={width * 0.08} y={0} width={width * 0.84} height={6} fill="rgba(140,150,160,0.15)" rx={1} />
          {/* Bottom anvil plate */}
          <rect x={width * 0.12} y={height - 8} width={width * 0.76} height={8} fill="rgba(140,150,160,0.18)" rx={1} />
          {/* Pressure gauge */}
          <circle cx={width * 0.08 - 12} cy={height * 0.2} r={16} fill="none" stroke="rgba(180,190,200,0.1)" strokeWidth={1.5} />
          <text x={width * 0.08 - 12} y={height * 0.2 + 3} textAnchor="middle"
            fill="rgba(220,80,60,0.2)" fontSize={7} fontFamily="'Courier New', monospace">
            {Math.round(pulsePressure)}T
          </text>
          {/* Warning stripes */}
          {Array.from({ length: Math.ceil(width / 24) }, (_, i) => (
            <rect key={`hs${i}`} x={i * 24} y={height - 3} width={12} height={3}
              fill={i % 2 === 0 ? 'rgba(220,180,40,0.08)' : 'transparent'} />
          ))}
        </svg>
        {/* Status line */}
        <div style={{
          position: 'absolute', bottom: 12, left: 12,
          fontFamily: "'Courier New', monospace", fontSize: 7,
          color: 'rgba(220,80,60,0.18)', letterSpacing: 1.5,
        }}>
          PSI: {Math.round(2800 + Math.sin(t * 0.8) * 200)} | STROKE: 450mm | TONNAGE: {Math.round(pulsePressure)}T
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const fontSize = Math.min(width / (totalChars * 0.58), 140)
    const totalTextWidth = totalChars * fontSize * 0.6
    const startX = (width - totalTextWidth) / 2

    if (phase === 'enter') {
      // Press ram descends and STAMPS each letter in sequence
      const ramBaseY = -height * 0.4

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {chars.map((ch, ci) => {
            const charDelay = (ci / totalChars) * 0.55
            const charT = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay + 0.01)))
            const slamT = easeOutBounce(charT)

            const ramY = ramBaseY + (height * 0.5 - ramBaseY) * slamT
            const impacted = charT > 0.4
            const letterOpacity = impacted ? Math.min(1, (charT - 0.4) / 0.3) : 0
            const squashY = impacted ? 1 + (1 - Math.min(1, (charT - 0.4) / 0.4)) * 0.25 : 1
            const squashX = impacted ? 1 - (1 - Math.min(1, (charT - 0.4) / 0.4)) * 0.12 : 1

            const sparkActive = charT > 0.35 && charT < 0.65
            const sparkProgress = sparkActive ? (charT - 0.35) / 0.3 : 0
            const letterX = startX + ci * fontSize * 0.6

            return (
              <div key={ci}>
                {/* Press ram descending */}
                {charT > 0 && charT < 0.7 && (
                  <div style={{
                    position: 'absolute',
                    left: letterX + fontSize * 0.15,
                    top: ramY - 30,
                    width: fontSize * 0.4,
                    height: 30,
                    background: 'linear-gradient(180deg, rgba(120,130,140,0.3), rgba(160,170,180,0.5))',
                    borderRadius: '2px 2px 0 0',
                  }} />
                )}
                {/* Stamped letter with compression squash */}
                <div style={{
                  position: 'absolute',
                  left: letterX,
                  top: '50%',
                  transform: `translateY(-50%) scaleX(${squashX}) scaleY(${squashY})`,
                  transformOrigin: 'center bottom',
                  fontFamily: "'Impact', 'Arial Black', sans-serif",
                  fontSize: `clamp(32px, 10vw, ${fontSize}px)`,
                  fontWeight: 900,
                  color,
                  textTransform: 'uppercase',
                  opacity: letterOpacity,
                }}>
                  {ch}
                </div>
                {/* Metal sparks on impact */}
                {sparkActive && (
                  <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    {Array.from({ length: 6 }, (_, si) => {
                      const angle = pseudo(ci * 31 + si * 17) * Math.PI - Math.PI / 2
                      const dist = (8 + pseudo(ci * 23 + si * 11) * 25) * sparkProgress
                      const sx = letterX + fontSize * 0.3 + Math.cos(angle) * dist
                      const sy = height * 0.5 + Math.sin(angle) * dist * 0.6 + dist * 0.4
                      const sparkOp = (1 - sparkProgress) * 0.7
                      return (
                        <circle key={si} cx={sx} cy={sy} r={1 + pseudo(ci + si) * 1.5}
                          fill={`rgba(255, 200, 100, ${sparkOp})`} />
                      )
                    })}
                  </svg>
                )}
              </div>
            )
          })}
        </div>
      )
    } else if (phase === 'hold') {
      // Stamped — vibration from idling press, heat stress shimmer
      const vibeX = Math.sin(holdProgress * Math.PI * 14) * 0.6
      const vibeY = Math.cos(holdProgress * Math.PI * 11) * 0.4
      const heatPulse = 0.85 + Math.sin(holdProgress * Math.PI * 6) * 0.15

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Heat glow layer */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: `translate(calc(-50% + ${vibeX}px), calc(-50% + ${vibeY}px))`,
            display: 'flex', whiteSpace: 'nowrap', filter: 'blur(6px)',
            opacity: 0.2 * heatPulse,
          }}>
            {chars.map((ch, ci) => (
              <span key={ci} style={{
                fontFamily: "'Impact', 'Arial Black', sans-serif",
                fontSize: `clamp(32px, 10vw, ${fontSize}px)`,
                fontWeight: 900, color: '#FF8844', textTransform: 'uppercase',
                display: 'inline-block',
              }}>
                {ch}
              </span>
            ))}
          </div>
          {/* Solid text with per-char micro-vibration */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: `translate(calc(-50% + ${vibeX}px), calc(-50% + ${vibeY}px))`,
            display: 'flex', whiteSpace: 'nowrap',
          }}>
            {chars.map((ch, ci) => {
              const charVibe = Math.sin(holdProgress * Math.PI * 18 + ci * 2.1) * 0.3
              return (
                <span key={ci} style={{
                  fontFamily: "'Impact', 'Arial Black', sans-serif",
                  fontSize: `clamp(32px, 10vw, ${fontSize}px)`,
                  fontWeight: 900, color,
                  textTransform: 'uppercase',
                  display: 'inline-block',
                  transform: `translateY(${charVibe}px)`,
                  textShadow: `0 2px 8px rgba(255, 120, 40, ${0.15 * heatPulse})`,
                }}>
                  {ch}
                </span>
              )
            })}
          </div>
          {/* Tonnage readout */}
          <div style={{
            position: 'absolute', bottom: '16%', left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace", fontSize: 8,
            color: 'rgba(220,80,60,0.25)', letterSpacing: 2,
          }}>
            STAMP CYCLE {index + 1} — HOLD PRESSURE
          </div>
        </div>
      )
    } else {
      // Exit: press retracts, letters released — fall with per-char gravity
      const retractT = easeInCubic(exitProgress)

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Press ram retracting upward */}
          <div style={{
            position: 'absolute',
            left: '50%', transform: 'translateX(-50%)',
            top: height * 0.5 - 30 - retractT * height * 0.5,
            width: totalTextWidth * 0.8, height: 8,
            background: 'rgba(160,170,180,0.15)',
            borderRadius: 2, opacity: 1 - retractT,
          }} />
          {/* Letters fall with staggered gravity + rotation */}
          {chars.map((ch, ci) => {
            const charDelay = (ci / totalChars) * 0.3
            const fallT = Math.max(0, Math.min(1, (exitProgress - charDelay) / (1 - charDelay + 0.01)))
            const gravity = easeInCubic(fallT)
            const fallY = gravity * 80
            const rotate = (pseudo(ci * 41 + index) - 0.5) * 35 * gravity
            const opacity = 1 - gravity

            return (
              <div key={ci} style={{
                position: 'absolute',
                left: startX + ci * fontSize * 0.6,
                top: '50%',
                transform: `translateY(calc(-50% + ${fallY}px)) rotate(${rotate}deg)`,
                transformOrigin: 'center',
                fontFamily: "'Impact', 'Arial Black', sans-serif",
                fontSize: `clamp(32px, 10vw, ${fontSize}px)`,
                fontWeight: 900, color,
                textTransform: 'uppercase', opacity,
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

function HydraulicPressComponent(props: MotionGraphicProps<HydraulicPressConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-hydraulic-press',
  title: 'Hydraulic Press',
  description: 'Industrial hydraulic press stamps letters into steel one by one with bounce impact, metal sparks, compression squash, vibrating hold, and gravity-release exit',
  tags: ['kinetic', 'typography', 'hydraulic', 'press', 'stamp', 'industrial', 'metal', 'impact', 'mechanical'],
  category: 'captions',
  component: HydraulicPressComponent as any,
  defaultConfig: {
    words: ['CRUSH', 'FORGE', 'STAMP', 'PRESS'],
    colors: ['#E8D0A0', '#D4BC8C', '#F0DDB0', '#C8B080'],
    bgColor: '#101418',
    cycleDuration: 1.4,
    pressForce: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CRUSH', 'FORGE', 'STAMP', 'PRESS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8D0A0', '#D4BC8C', '#F0DDB0', '#C8B080'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#101418', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
    { key: 'pressForce', label: 'Press Force', type: 'number', defaultValue: 1, min: 0.5, max: 3, group: 'Animation' },
  ],
})
