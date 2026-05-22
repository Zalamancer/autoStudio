import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WeldSparkConfig extends KineticBaseConfig {
  sparkIntensity: number
}

function pseudo(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Arc welding: fast strike, decelerating bead deposit
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

// Slag cooling: slow start then rapid crumble
function easeInBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return c3 * t * t * t - c1 * t * t
}

// Smooth weld bead traverse
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Welding table: steel workbench with clamps and spatter marks
    const amps = 120 + Math.sin(t * 3) * 15

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Brushed steel work surface */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(140,150,160,0.02) 3px, rgba(140,150,160,0.02) 4px)
          `,
        }} />
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Welding table T-slot grooves */}
          {Array.from({ length: 5 }, (_, i) => {
            const y = height * 0.15 + i * (height * 0.7 / 4)
            return (
              <line key={`slot${i}`} x1={width * 0.05} y1={y} x2={width * 0.95} y2={y}
                stroke="rgba(80,90,100,0.08)" strokeWidth={2} />
            )
          })}
          {/* Clamp fixtures — two corners */}
          {[
            { x: width * 0.1, y: height * 0.15 },
            { x: width * 0.9, y: height * 0.85 },
          ].map((c, i) => (
            <g key={`clamp${i}`}>
              <rect x={c.x - 8} y={c.y - 4} width={16} height={8} rx={2}
                fill="rgba(100,110,120,0.12)" stroke="rgba(140,150,160,0.08)" strokeWidth={0.5} />
              <circle cx={c.x} cy={c.y} r={2} fill="rgba(160,170,180,0.15)" />
            </g>
          ))}
          {/* Old spatter marks (deterministic) */}
          {Array.from({ length: 20 }, (_, i) => {
            const sx = pseudo(i * 53 + 3) * width
            const sy = pseudo(i * 37 + 7) * height
            const sr = 0.5 + pseudo(i * 19) * 1.5
            return (
              <circle key={`sp${i}`} cx={sx} cy={sy} r={sr}
                fill={`rgba(180,140,80,${0.03 + pseudo(i * 11) * 0.04})`} />
            )
          })}
          {/* Ground clamp cable */}
          <path d={`M ${width * 0.92} ${height * 0.9} Q ${width * 0.95} ${height * 0.7} ${width * 0.88} ${height * 0.5}`}
            fill="none" stroke="rgba(60,60,60,0.1)" strokeWidth={3} strokeLinecap="round" />
          <circle cx={width * 0.92} cy={height * 0.9} r={4} fill="rgba(80,90,100,0.12)" />
        </svg>
        {/* Welder settings */}
        <div style={{
          position: 'absolute', top: 8, left: 12,
          fontFamily: "'Courier New', monospace", fontSize: 7,
          color: 'rgba(255,160,40,0.15)', letterSpacing: 1.5,
        }}>
          MIG 75/25 | {Math.round(amps)}A | 22V | WFS: 280 IPM
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const fontSize = Math.min(width / (totalChars * 0.58), 135)
    const totalTextWidth = totalChars * fontSize * 0.6
    const startX = (width - totalTextWidth) / 2
    const baseY = height * 0.5

    if (phase === 'enter') {
      // Robot arm welds each letter: arc strikes left-to-right, bead builds per char
      // Weld puddle follows the torch, sparks spray outward

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Weld bead buildup — glowing orange line behind letters */}
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {/* Weld bead (hot metal line along bottom of text) */}
            {chars.map((_, ci) => {
              const charStart = (ci / totalChars) * 0.55
              const charT = Math.max(0, Math.min(1, (enterProgress - charStart) / 0.5))
              if (charT <= 0) return null
              const beadX = startX + ci * fontSize * 0.6
              const beadW = fontSize * 0.6 * easeInOutCubic(charT)
              const beadY = baseY + fontSize * 0.35
              const heat = Math.max(0, 1 - charT * 0.6)
              return (
                <g key={`bead${ci}`}>
                  {/* Hot bead glow */}
                  <rect x={beadX} y={beadY} width={beadW} height={3} rx={1.5}
                    fill={`rgba(255,${Math.round(120 + heat * 80)},${Math.round(40 * heat)},${0.3 + heat * 0.4})`}
                    filter="url(#weldGlow)" />
                  {/* Solidified bead */}
                  <rect x={beadX} y={beadY + 1} width={beadW} height={2} rx={1}
                    fill={`rgba(180,160,140,${0.15 * (1 - heat)})`} />
                </g>
              )
            })}
            {/* SVG filter for glow */}
            <defs>
              <filter id="weldGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          </svg>

          {chars.map((ch, ci) => {
            const charStart = (ci / totalChars) * 0.55
            const charT = Math.max(0, Math.min(1, (enterProgress - charStart) / 0.5))
            const weldT = easeOutExpo(charT)

            const letterX = startX + ci * fontSize * 0.6
            const letterOpacity = Math.min(1, charT * 2.5)

            // Arc torch position — follows weld puddle
            const torchX = letterX + weldT * fontSize * 0.6
            const torchY = baseY

            // Arc active only during this char's weld window
            const arcActive = charT > 0.02 && charT < 0.85
            const sparkBurst = charT > 0 && charT < 0.9

            return (
              <div key={ci}>
                {/* Letter revealed by weld deposit */}
                <div style={{
                  position: 'absolute',
                  left: letterX,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontFamily: "'Impact', 'Arial Black', sans-serif",
                  fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
                  fontWeight: 900,
                  color,
                  textTransform: 'uppercase',
                  opacity: letterOpacity,
                  textShadow: arcActive
                    ? `0 0 12px rgba(255,180,60,${0.4 * (1 - charT)}), 0 0 4px rgba(255,220,140,${0.3 * (1 - charT)})`
                    : 'none',
                }}>
                  {ch}
                </div>
                {/* Arc flash + torch */}
                {arcActive && (
                  <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    {/* Arc flash — intense white center */}
                    <circle cx={torchX} cy={torchY} r={10}
                      fill="rgba(255,220,140,0.15)" />
                    <circle cx={torchX} cy={torchY} r={5}
                      fill="rgba(255,240,200,0.35)" />
                    <circle cx={torchX} cy={torchY} r={2}
                      fill="rgba(255,255,240,0.8)" />
                    {/* Weld puddle beneath arc */}
                    <ellipse cx={torchX} cy={torchY + fontSize * 0.35} rx={6} ry={3}
                      fill="rgba(255,160,40,0.25)" />
                  </svg>
                )}
                {/* Spark spray */}
                {sparkBurst && (
                  <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    {Array.from({ length: 10 }, (_, si) => {
                      const angle = pseudo(ci * 29 + si * 43 + index) * Math.PI * 1.4 - Math.PI * 0.7
                      const speed = 0.4 + pseudo(ci * 17 + si * 31) * 0.8
                      const life = (pseudo(ci * 7 + si * 53) + charT * 2) % 1
                      const dist = life * (15 + pseudo(si * 41) * 35) * speed
                      const gravity = life * life * 15
                      const sx = torchX + Math.cos(angle) * dist
                      const sy = torchY + Math.sin(angle) * dist + gravity
                      const sparkOp = (1 - life) * 0.6
                      const sparkSize = (1 - life) * (0.8 + pseudo(si) * 1.2)
                      return (
                        <circle key={si} cx={sx} cy={sy} r={sparkSize}
                          fill={`rgba(255,${Math.round(180 + pseudo(si) * 75)},${Math.round(40 + pseudo(si + 1) * 60)},${sparkOp})`} />
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
      // Welded text cooling — color shifts from orange-hot to final color, per-char heat pulse
      const coolT = holdProgress
      const overallPulse = Math.sin(holdProgress * Math.PI * 5)

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Heat haze layer */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex', whiteSpace: 'nowrap',
            filter: `blur(5px)`, opacity: 0.08 + overallPulse * 0.04,
          }}>
            {chars.map((ch, ci) => (
              <span key={ci} style={{
                fontFamily: "'Impact', 'Arial Black', sans-serif",
                fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
                fontWeight: 900, color: '#FF9940',
                textTransform: 'uppercase', display: 'inline-block',
              }}>
                {ch}
              </span>
            ))}
          </div>
          {/* Weld bead glow beneath text */}
          <div style={{
            position: 'absolute', top: `calc(50% + ${fontSize * 0.35}px)`, left: '50%',
            transform: 'translateX(-50%)',
            width: totalTextWidth, height: 3,
            background: `rgba(255,140,40,${0.15 - coolT * 0.1})`,
            borderRadius: 2, filter: 'blur(2px)',
          }} />
          {/* Characters with per-char cooling shimmer */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex', whiteSpace: 'nowrap',
          }}>
            {chars.map((ch, ci) => {
              const charHeat = Math.sin(holdProgress * Math.PI * 7 + ci * 1.9) * 0.1
              const glowRadius = 6 + charHeat * 15
              return (
                <span key={ci} style={{
                  fontFamily: "'Impact', 'Arial Black', sans-serif",
                  fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
                  fontWeight: 900, color,
                  textTransform: 'uppercase',
                  display: 'inline-block',
                  textShadow: `0 0 ${glowRadius}px rgba(255,160,40,${0.15 + charHeat})`,
                }}>
                  {ch}
                </span>
              )
            })}
          </div>
          {/* Weld inspection tag */}
          <div style={{
            position: 'absolute', bottom: '16%', left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace", fontSize: 8,
            color: 'rgba(255,160,40,0.2)', letterSpacing: 2,
          }}>
            WELD ID: {word}-{String(index + 1).padStart(3, '0')} — COOLING
          </div>
        </div>
      )
    } else {
      // Exit: slag crumbles off — per-char pieces crack and fall away
      // Mirrors welding: slag (dark crust) peels off revealing nothing underneath

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {chars.map((ch, ci) => {
            const charDelay = (ci / totalChars) * 0.4
            const charT = Math.max(0, Math.min(1, (exitProgress - charDelay) / (1 - charDelay + 0.01)))
            const crumbleT = easeInBack(Math.min(1, charT * 1.2))

            // Letter splits into 2 fragments that fall apart
            const letterX = startX + ci * fontSize * 0.6
            const splitAngle1 = (pseudo(ci * 37 + index) - 0.4) * 30 * crumbleT
            const splitAngle2 = (pseudo(ci * 53 + index) - 0.6) * 30 * crumbleT
            const fallY1 = crumbleT * crumbleT * 50
            const fallY2 = crumbleT * crumbleT * 65
            const driftX1 = (pseudo(ci * 23) - 0.5) * 20 * crumbleT
            const driftX2 = (pseudo(ci * 47) - 0.5) * 20 * crumbleT
            const opacity = Math.max(0, 1 - crumbleT)

            // Slag flakes falling from crack point
            const flakeActive = charT > 0.1 && charT < 0.8

            return (
              <div key={ci}>
                {/* Top half fragment */}
                <div style={{
                  position: 'absolute',
                  left: letterX + driftX1,
                  top: '50%',
                  transform: `translateY(calc(-50% + ${fallY1}px)) rotate(${splitAngle1}deg)`,
                  transformOrigin: 'center bottom',
                  fontFamily: "'Impact', 'Arial Black', sans-serif",
                  fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
                  fontWeight: 900, color,
                  textTransform: 'uppercase', opacity,
                  clipPath: 'inset(0 0 50% 0)',
                }}>
                  {ch}
                </div>
                {/* Bottom half fragment */}
                <div style={{
                  position: 'absolute',
                  left: letterX + driftX2,
                  top: '50%',
                  transform: `translateY(calc(-50% + ${fallY2}px)) rotate(${splitAngle2}deg)`,
                  transformOrigin: 'center top',
                  fontFamily: "'Impact', 'Arial Black', sans-serif",
                  fontSize: `clamp(30px, 10vw, ${fontSize}px)`,
                  fontWeight: 900, color,
                  textTransform: 'uppercase', opacity,
                  clipPath: 'inset(50% 0 0 0)',
                }}>
                  {ch}
                </div>
                {/* Slag flake particles */}
                {flakeActive && (
                  <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    {Array.from({ length: 4 }, (_, fi) => {
                      const flakeLife = (charT - 0.1) / 0.7
                      const fx = letterX + fontSize * 0.3 + (pseudo(ci * 11 + fi * 29) - 0.5) * 20
                      const fy = baseY + flakeLife * flakeLife * 40 + pseudo(fi * 17) * 10
                      const fOp = (1 - flakeLife) * 0.4
                      return (
                        <rect key={fi} x={fx} y={fy} width={2 + pseudo(fi) * 3} height={1}
                          fill={`rgba(80,70,60,${fOp})`}
                          transform={`rotate(${pseudo(ci + fi) * 180}, ${fx}, ${fy})`} />
                      )
                    })}
                  </svg>
                )}
              </div>
            )
          })}
        </div>
      )
    }
  },
}

function WeldSparkComponent(props: MotionGraphicProps<WeldSparkConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-weld-spark',
  title: 'Weld Spark',
  description: 'Industrial robot arc welding traces letters with molten puddle, spark spray with gravity, weld bead buildup, cooling heat shimmer, and slag-crumble exit',
  tags: ['kinetic', 'typography', 'weld', 'spark', 'arc', 'industrial', 'robot', 'metal', 'fabrication', 'mechanical'],
  category: 'captions',
  component: WeldSparkComponent as any,
  defaultConfig: {
    words: ['WELD', 'FUSE', 'BOND', 'ARC'],
    colors: ['#F0D8A0', '#E8C888', '#FFE4B0', '#D8B878'],
    bgColor: '#0C0E10',
    cycleDuration: 1.4,
    sparkIntensity: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WELD', 'FUSE', 'BOND', 'ARC'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F0D8A0', '#E8C888', '#FFE4B0', '#D8B878'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0C0E10', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
    { key: 'sparkIntensity', label: 'Spark Intensity', type: 'number', defaultValue: 1, min: 0.5, max: 3, group: 'Animation' },
  ],
})
