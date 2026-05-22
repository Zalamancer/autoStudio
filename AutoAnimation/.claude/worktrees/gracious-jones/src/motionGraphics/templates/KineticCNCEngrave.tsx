import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CNCEngraveConfig extends KineticBaseConfig {
  feedRate: number
}

function pseudo(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// CNC acceleration profile — smooth start, constant mid, smooth stop
function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

// Rapid retract motion
function easeInQuart(t: number): number {
  return t * t * t * t
}

// Smooth approach to final position
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    const gridMajor = 50
    const gridMinor = 10

    // Animated spindle RPM indicator
    const rpm = 18000 + Math.sin(t * 2) * 500

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* CNC work surface — aluminum stock with machining grid */}
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Minor grid — 10px machining resolution */}
          {Array.from({ length: Math.ceil(width / gridMinor) + 1 }, (_, i) => (
            <line key={`vmin${i}`} x1={i * gridMinor} y1={0} x2={i * gridMinor} y2={height}
              stroke="rgba(60,180,255,0.02)" strokeWidth={0.3} />
          ))}
          {Array.from({ length: Math.ceil(height / gridMinor) + 1 }, (_, i) => (
            <line key={`hmin${i}`} x1={0} y1={i * gridMinor} x2={width} y2={i * gridMinor}
              stroke="rgba(60,180,255,0.02)" strokeWidth={0.3} />
          ))}
          {/* Major grid — 50px */}
          {Array.from({ length: Math.ceil(width / gridMajor) + 1 }, (_, i) => (
            <line key={`vmaj${i}`} x1={i * gridMajor} y1={0} x2={i * gridMajor} y2={height}
              stroke="rgba(60,180,255,0.06)" strokeWidth={0.5} />
          ))}
          {Array.from({ length: Math.ceil(height / gridMajor) + 1 }, (_, i) => (
            <line key={`hmaj${i}`} x1={0} y1={i * gridMajor} x2={width} y2={i * gridMajor}
              stroke="rgba(60,180,255,0.06)" strokeWidth={0.5} />
          ))}
          {/* Origin crosshair */}
          <line x1={15} y1={height - 15} x2={45} y2={height - 15} stroke="rgba(60,180,255,0.15)" strokeWidth={1} />
          <line x1={15} y1={height - 15} x2={15} y2={height - 45} stroke="rgba(60,180,255,0.15)" strokeWidth={1} />
          <text x={48} y={height - 12} fill="rgba(60,180,255,0.12)" fontSize={7} fontFamily="'Courier New', monospace">X</text>
          <text x={12} y={height - 48} fill="rgba(60,180,255,0.12)" fontSize={7} fontFamily="'Courier New', monospace">Y</text>
          {/* Work envelope boundary */}
          <rect x={12} y={12} width={width - 24} height={height - 24}
            fill="none" stroke="rgba(60,180,255,0.05)" strokeWidth={0.5} strokeDasharray="8 4" />
          {/* Metal chip debris (deterministic) */}
          {Array.from({ length: 12 }, (_, i) => {
            const cx = pseudo(i * 37 + 5) * width
            const cy = pseudo(i * 23 + 9) * height
            const sz = 1 + pseudo(i * 13) * 2
            return (
              <rect key={`chip${i}`} x={cx} y={cy} width={sz} height={sz * 0.3}
                fill="rgba(180,200,220,0.04)"
                transform={`rotate(${pseudo(i * 7) * 360}, ${cx}, ${cy})`} />
            )
          })}
        </svg>
        {/* G-code status line */}
        <div style={{
          position: 'absolute', top: 8, right: 12,
          fontFamily: "'Courier New', monospace", fontSize: 7,
          color: 'rgba(60,180,255,0.15)', letterSpacing: 1, textAlign: 'right',
        }}>
          S{Math.round(rpm)} F2400 M03
        </div>
        <div style={{
          position: 'absolute', bottom: 8, right: 12,
          fontFamily: "'Courier New', monospace", fontSize: 7,
          color: 'rgba(60,180,255,0.12)', letterSpacing: 1,
        }}>
          TOOL: 1/8" FLAT END | DEPTH: -0.5mm | PASS: 1/1
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const fontSize = Math.min(width / (totalChars * 0.6), 130)
    const totalTextWidth = totalChars * fontSize * 0.62
    const startX = (width - totalTextWidth) / 2

    if (phase === 'enter') {
      // CNC toolhead traces each letter's engraving path left-to-right
      // Each character engraves via clipPath reveal following the tool

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {chars.map((ch, ci) => {
            // Staggered per-character: each letter gets its toolpath window
            const charStart = (ci / totalChars) * 0.6
            const charEnd = charStart + 0.55
            const charT = Math.max(0, Math.min(1, (enterProgress - charStart) / (charEnd - charStart)))
            const engraveT = easeInOutQuad(charT)

            const letterX = startX + ci * fontSize * 0.62
            const letterCx = letterX + fontSize * 0.3
            const letterCy = height * 0.5

            // Tool position: traces top-to-bottom per character
            const toolY = letterCy - fontSize * 0.5 + engraveT * fontSize

            // Engraved depth reveal — clip from top down
            const clipPercent = engraveT * 100

            // Chip spray from cutting tool
            const chipActive = charT > 0.05 && charT < 0.95
            const chipT = chipActive ? charT : 0

            return (
              <div key={ci}>
                {/* Shallow depth shadow (engraved groove) */}
                <div style={{
                  position: 'absolute',
                  left: letterX + 1,
                  top: 'calc(50% + 1px)',
                  transform: 'translateY(-50%)',
                  fontFamily: "'Courier New', 'Consolas', monospace",
                  fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                  fontWeight: 700,
                  color: 'rgba(0,0,0,0.3)',
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  clipPath: `inset(0 0 ${100 - clipPercent}% 0)`,
                  whiteSpace: 'nowrap',
                }}>
                  {ch}
                </div>
                {/* Engraved surface — bright machined metal */}
                <div style={{
                  position: 'absolute',
                  left: letterX,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontFamily: "'Courier New', 'Consolas', monospace",
                  fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                  fontWeight: 700,
                  color,
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  clipPath: `inset(0 0 ${100 - clipPercent}% 0)`,
                  whiteSpace: 'nowrap',
                }}>
                  {ch}
                </div>
                {/* Toolhead dot + spindle indicator */}
                {charT > 0 && charT < 1 && (
                  <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    {/* Spindle glow */}
                    <circle cx={letterCx} cy={toolY} r={8}
                      fill="rgba(60,180,255,0.08)" />
                    {/* Tool tip */}
                    <circle cx={letterCx} cy={toolY} r={3}
                      fill="rgba(60,180,255,0.4)" />
                    <circle cx={letterCx} cy={toolY} r={1.2}
                      fill="rgba(200,230,255,0.8)" />
                    {/* Crosshair on tool position */}
                    <line x1={letterCx - 6} y1={toolY} x2={letterCx + 6} y2={toolY}
                      stroke="rgba(60,180,255,0.2)" strokeWidth={0.5} />
                    <line x1={letterCx} y1={toolY - 6} x2={letterCx} y2={toolY + 6}
                      stroke="rgba(60,180,255,0.2)" strokeWidth={0.5} />
                  </svg>
                )}
                {/* Metal chip spray */}
                {chipActive && (
                  <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    {Array.from({ length: 5 }, (_, si) => {
                      const chipAngle = pseudo(ci * 19 + si * 41) * Math.PI * 0.8 + Math.PI * 0.1
                      const chipDist = (4 + pseudo(ci * 13 + si * 7) * 12) * (0.5 + chipT * 0.5)
                      const cx = letterCx + Math.cos(chipAngle) * chipDist
                      const cy = toolY + Math.sin(chipAngle) * chipDist * 0.4
                      const chipOp = 0.3 * (1 - Math.abs(chipT - 0.5) * 2)
                      return (
                        <rect key={si} x={cx} y={cy} width={2 + pseudo(si) * 2} height={0.8}
                          fill={`rgba(180,200,220,${chipOp})`}
                          transform={`rotate(${pseudo(ci + si * 3) * 180}, ${cx}, ${cy})`} />
                      )
                    })}
                  </svg>
                )}
              </div>
            )
          })}
          {/* G-code coordinate readout */}
          <div style={{
            position: 'absolute', top: '18%', left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace", fontSize: 8,
            color: 'rgba(60,180,255,0.2)', letterSpacing: 1,
          }}>
            G01 X{(enterProgress * totalTextWidth).toFixed(1)} Y{(height * 0.5).toFixed(0)} Z-0.5
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Fully engraved — machining marks shimmer, coolant mist effect
      const shimmerPhase = holdProgress * Math.PI * 8
      const mistPulse = 0.03 + Math.sin(holdProgress * Math.PI * 4) * 0.02

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Coolant mist layer */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex', whiteSpace: 'nowrap',
            filter: 'blur(8px)', opacity: mistPulse,
          }}>
            {chars.map((ch, ci) => (
              <span key={ci} style={{
                fontFamily: "'Courier New', 'Consolas', monospace",
                fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                fontWeight: 700, color: '#80C0FF',
                textTransform: 'uppercase', letterSpacing: 2,
                display: 'inline-block',
              }}>
                {ch}
              </span>
            ))}
          </div>
          {/* Engraved text with per-char machining shimmer */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex', whiteSpace: 'nowrap',
          }}>
            {chars.map((ch, ci) => {
              const charShimmer = Math.sin(shimmerPhase + ci * 1.8) * 0.08
              return (
                <span key={ci} style={{
                  fontFamily: "'Courier New', 'Consolas', monospace",
                  fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                  fontWeight: 700,
                  color,
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  display: 'inline-block',
                  textShadow: `0 0 ${4 + charShimmer * 20}px rgba(60,180,255,${0.15 + charShimmer})`,
                  filter: `brightness(${1 + charShimmer})`,
                }}>
                  {ch}
                </span>
              )
            })}
          </div>
          {/* Machine status */}
          <div style={{
            position: 'absolute', bottom: '16%', left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace", fontSize: 8,
            color: 'rgba(60,180,255,0.18)', letterSpacing: 2,
          }}>
            ENGRAVE COMPLETE — SURFACE FINISH: Ra 0.8
          </div>
        </div>
      )
    } else {
      // Exit: CNC rapid retract — letters dissolve as toolpaths are erased bottom-to-top
      const retractT = easeInQuart(exitProgress)

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {chars.map((ch, ci) => {
            const charDelay = (ci / totalChars) * 0.35
            const charT = Math.max(0, Math.min(1, (exitProgress - charDelay) / (1 - charDelay + 0.01)))
            const eraseT = easeOutExpo(charT)
            // Reverse clip: erase from bottom up (mirror of enter)
            const clipPercent = (1 - eraseT) * 100
            const letterX = startX + ci * fontSize * 0.62

            return (
              <div key={ci} style={{
                position: 'absolute',
                left: letterX,
                top: '50%',
                transform: 'translateY(-50%)',
                fontFamily: "'Courier New', 'Consolas', monospace",
                fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                fontWeight: 700,
                color,
                textTransform: 'uppercase',
                letterSpacing: 2,
                clipPath: `inset(0 0 ${100 - clipPercent}% 0)`,
                opacity: 1 - charT * 0.3,
                whiteSpace: 'nowrap',
              }}>
                {ch}
              </div>
            )
          })}
          {/* Rapid retract indicator */}
          <div style={{
            position: 'absolute', top: '18%', left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace", fontSize: 8,
            color: `rgba(60,180,255,${0.2 * (1 - retractT)})`, letterSpacing: 1,
          }}>
            G00 Z5.0 (RAPID RETRACT)
          </div>
        </div>
      )
    }
  },
}

function CNCEngraveComponent(props: MotionGraphicProps<CNCEngraveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cnc-engrave',
  title: 'CNC Engrave',
  description: 'CNC milling toolhead traces engraving paths per character with spindle glow, metal chip spray, G-code coordinates, coolant shimmer, and reverse-clip retract exit',
  tags: ['kinetic', 'typography', 'cnc', 'engrave', 'mill', 'machining', 'industrial', 'toolpath', 'mechanical'],
  category: 'captions',
  component: CNCEngraveComponent as any,
  defaultConfig: {
    words: ['MILL', 'CARVE', 'ROUTE', 'DEPTH'],
    colors: ['#C0D8F0', '#A8C4E0', '#D0E4FF', '#B0CCE8'],
    bgColor: '#0A0E14',
    cycleDuration: 1.5,
    feedRate: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MILL', 'CARVE', 'ROUTE', 'DEPTH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C0D8F0', '#A8C4E0', '#D0E4FF', '#B0CCE8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0E14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
    { key: 'feedRate', label: 'Feed Rate', type: 'number', defaultValue: 1, min: 0.5, max: 3, group: 'Animation' },
  ],
})
