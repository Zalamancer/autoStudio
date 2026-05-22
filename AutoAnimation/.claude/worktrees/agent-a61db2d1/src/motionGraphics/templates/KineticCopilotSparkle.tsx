import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// ── R11: Copilot Sparkle ────────────────────────────────────────────────────
// Microsoft Copilot-inspired sparkle convergence. Letters materialize from
// converging sparkle particles on a soft gradient background with floating
// diamond/star shapes. Copilot blue-purple-pink gradient palette.
// Hold: traveling specular highlight shimmer. Exit: dissolve into sparkle dust.

interface CopilotSparkleConfig extends KineticBaseConfig {}

// Deterministic pseudo-random for sparkle positions
function sparkleRand(seed: number): number {
  return Math.abs(Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453) % 1
}

// Ease: smooth cubic out
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// Copilot gradient colors
const COPILOT_GRADIENT = 'linear-gradient(135deg, #0078D4 0%, #8661C5 50%, #E8458B 100%)'
const COPILOT_COLORS = ['#0078D4', '#6B5CE7', '#8661C5', '#C454B2', '#E8458B']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // Floating diamond/star shapes drifting gently
    const floatingShapes = Array.from({ length: 18 }, (_, i) => {
      const seed = i * 41 + 7
      const baseX = sparkleRand(seed) * 100
      const baseY = sparkleRand(seed + 1) * 100
      const size = 6 + sparkleRand(seed + 2) * 14
      const driftX = Math.sin(time * (0.3 + sparkleRand(seed + 3) * 0.4) + seed) * 8
      const driftY = Math.cos(time * (0.2 + sparkleRand(seed + 4) * 0.3) + seed * 2) * 6
      const rotation = time * (15 + sparkleRand(seed + 5) * 30) + seed * 60
      const opacity = 0.04 + sparkleRand(seed + 6) * 0.08
      const colorIdx = i % COPILOT_COLORS.length
      const isDiamond = i % 3 !== 0

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${baseX + driftX}%`,
            top: `${baseY + driftY}%`,
            width: size,
            height: size,
            transform: `rotate(${rotation}deg)${isDiamond ? ' rotate(45deg)' : ''}`,
            borderRadius: isDiamond ? '2px' : '50%',
            background: COPILOT_COLORS[colorIdx],
            opacity,
            mixBlendMode: 'screen',
            pointerEvents: 'none' as const,
          }}
        />
      )
    })

    // Soft radial glow in center
    const pulseOpacity = 0.06 + Math.sin(time * 1.2) * 0.03

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Subtle gradient wash at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(180deg, rgba(134,97,197,0.06) 0%, transparent 100%)',
            pointerEvents: 'none' as const,
          }}
        />
        {/* Center radial glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '70%',
            height: '70%',
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(134,97,197,0.12) 0%, transparent 70%)',
            opacity: pulseOpacity / 0.06,
            pointerEvents: 'none' as const,
          }}
        />
        {/* Subtle grid dots — Microsoft design language */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(134,97,197,0.06) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            pointerEvents: 'none' as const,
          }}
        />
        {floatingShapes}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length

    if (phase === 'enter') {
      // Sparkle particles converge into letterforms
      const eased = easeOutCubic(enterProgress)

      return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              gap: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {chars.map((ch, ci) => {
              const charDelay = ci / totalChars
              const charProgress = Math.max(0, Math.min(1, (enterProgress - charDelay * 0.5) / 0.5))
              const charEased = easeOutCubic(charProgress)

              // Sparkle burst offset — starts scattered, converges to 0
              const scatterX = (1 - charEased) * (sparkleRand(ci * 17 + index) - 0.5) * 80
              const scatterY = (1 - charEased) * (sparkleRand(ci * 31 + index) - 0.5) * 60
              const charScale = 0.3 + charEased * 0.7
              const charOpacity = Math.min(1, charProgress * 2.5)

              // Per-character sparkle particles (3 per char during enter)
              const sparkles = charProgress < 0.95 ? Array.from({ length: 3 }, (_, si) => {
                const sx = (sparkleRand(ci * 7 + si * 13) - 0.5) * 40 * (1 - charEased)
                const sy = (sparkleRand(ci * 11 + si * 19) - 0.5) * 40 * (1 - charEased)
                const sSize = 2 + sparkleRand(ci * 3 + si) * 4
                const sOp = (1 - charEased) * 0.9

                return (
                  <div
                    key={si}
                    style={{
                      position: 'absolute',
                      left: `calc(50% + ${sx}px)`,
                      top: `calc(50% + ${sy}px)`,
                      width: sSize,
                      height: sSize,
                      transform: `rotate(45deg) translate(-50%, -50%)`,
                      background: COPILOT_COLORS[(ci + si) % COPILOT_COLORS.length],
                      opacity: sOp,
                      borderRadius: '1px',
                      mixBlendMode: 'screen' as const,
                      pointerEvents: 'none' as const,
                    }}
                  />
                )
              }) : null

              // Gradient color for each character
              const charColor = COPILOT_COLORS[ci % COPILOT_COLORS.length]

              return (
                <div
                  key={ci}
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                  }}
                >
                  {sparkles}
                  <span
                    style={{
                      fontFamily: "'Segoe UI', 'Inter', -apple-system, sans-serif",
                      fontSize: 'clamp(44px, 13vw, 170px)',
                      fontWeight: 700,
                      color: charColor,
                      opacity: charOpacity,
                      transform: `translate(${scatterX}px, ${scatterY}px) scale(${charScale})`,
                      display: 'inline-block',
                      textShadow: `0 0 ${20 * charEased}px ${charColor}40, 0 0 ${40 * charEased}px ${charColor}20`,
                      letterSpacing: '0.02em',
                      lineHeight: 1,
                    }}
                  >
                    {ch}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Traveling specular highlight shimmer across letters
      const highlightPos = (holdProgress * 1.4 - 0.2) * totalChars

      return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              gap: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {chars.map((ch, ci) => {
              const charColor = COPILOT_COLORS[ci % COPILOT_COLORS.length]
              // Specular highlight — gaussian proximity to sweep position
              const dist = Math.abs(ci - highlightPos)
              const specular = Math.exp(-dist * dist * 0.5) * 0.6
              const brightness = 1 + specular

              // Subtle breathing scale
              const breathe = 1 + Math.sin(holdProgress * Math.PI * 4 + ci * 0.4) * 0.015

              return (
                <span
                  key={ci}
                  style={{
                    fontFamily: "'Segoe UI', 'Inter', -apple-system, sans-serif",
                    fontSize: 'clamp(44px, 13vw, 170px)',
                    fontWeight: 700,
                    color: charColor,
                    display: 'inline-block',
                    transform: `scale(${breathe})`,
                    filter: `brightness(${brightness})`,
                    textShadow: specular > 0.1
                      ? `0 0 ${12 + specular * 30}px rgba(255,255,255,${specular * 0.7}), 0 0 ${24 + specular * 50}px ${charColor}60`
                      : `0 0 12px ${charColor}30`,
                    letterSpacing: '0.02em',
                    lineHeight: 1,
                  }}
                >
                  {ch}
                </span>
              )
            })}
          </div>
          {/* Ambient sparkle particles during hold */}
          {Array.from({ length: 6 }, (_, i) => {
            const sx = sparkleRand(i * 23 + index + Math.floor(holdProgress * 8)) * 80 + 10
            const sy = sparkleRand(i * 37 + index + Math.floor(holdProgress * 8)) * 60 + 20
            const sSize = 2 + sparkleRand(i * 7) * 3
            const sOp = 0.3 + Math.sin(holdProgress * Math.PI * 6 + i * 2) * 0.3

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${sx}%`,
                  top: `${sy}%`,
                  width: sSize,
                  height: sSize,
                  transform: 'rotate(45deg)',
                  background: COPILOT_COLORS[i % COPILOT_COLORS.length],
                  opacity: Math.max(0, sOp),
                  borderRadius: '1px',
                  mixBlendMode: 'screen' as const,
                  pointerEvents: 'none' as const,
                }}
              />
            )
          })}
        </div>
      )
    } else {
      // Exit: letters dissolve into sparkle particles that float away
      const eased = easeOutCubic(exitProgress)

      return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              gap: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {chars.map((ch, ci) => {
              const charDelay = ci / totalChars
              const charProgress = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.3) / 0.7))
              const charEased = easeOutCubic(charProgress)
              const charColor = COPILOT_COLORS[ci % COPILOT_COLORS.length]

              // Letter fades and scatters upward
              const driftY = -charEased * 30
              const charOpacity = Math.max(0, 1 - charProgress * 1.8)
              const charScale = 1 - charEased * 0.3

              // Dissolve sparkle particles emanating from each letter
              const exitSparkles = charProgress > 0.1 ? Array.from({ length: 4 }, (_, si) => {
                const angle = (si / 4) * Math.PI * 2 + sparkleRand(ci * 3 + si) * 1.5
                const dist = charEased * (20 + sparkleRand(ci * 5 + si) * 30)
                const sx = Math.cos(angle) * dist
                const sy = Math.sin(angle) * dist - charEased * 20
                const sSize = (1 - charEased * 0.5) * (2 + sparkleRand(ci * 9 + si) * 4)
                const sOp = Math.max(0, (1 - charEased) * 0.8)

                return (
                  <div
                    key={si}
                    style={{
                      position: 'absolute',
                      left: `calc(50% + ${sx}px)`,
                      top: `calc(50% + ${sy}px)`,
                      width: sSize,
                      height: sSize,
                      transform: 'rotate(45deg)',
                      background: COPILOT_COLORS[(ci + si) % COPILOT_COLORS.length],
                      opacity: sOp,
                      borderRadius: '1px',
                      mixBlendMode: 'screen' as const,
                      pointerEvents: 'none' as const,
                    }}
                  />
                )
              }) : null

              return (
                <div
                  key={ci}
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                  }}
                >
                  {exitSparkles}
                  <span
                    style={{
                      fontFamily: "'Segoe UI', 'Inter', -apple-system, sans-serif",
                      fontSize: 'clamp(44px, 13vw, 170px)',
                      fontWeight: 700,
                      color: charColor,
                      opacity: charOpacity,
                      transform: `translateY(${driftY}px) scale(${charScale})`,
                      display: 'inline-block',
                      textShadow: `0 0 ${20 * (1 - charEased)}px ${charColor}40`,
                      letterSpacing: '0.02em',
                      lineHeight: 1,
                    }}
                  >
                    {ch}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )
    }
  },
}

function CopilotSparkleComponent(props: MotionGraphicProps<CopilotSparkleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-copilot-sparkle',
  title: 'Kinetic Copilot Sparkle',
  description: 'Microsoft Copilot-inspired sparkle effect: letters materialize from converging sparkle particles on a soft gradient. Traveling specular highlight shimmer on hold, dissolve into sparkle dust on exit. Clean light background with blue-purple-pink accents.',
  tags: ['kinetic', 'typography', 'microsoft', 'copilot', 'sparkle', 'ai', 'modern', 'corporate', 'gradient', 'playful'],
  category: 'captions',
  component: CopilotSparkleComponent as any,
  defaultConfig: {
    words: ['COPILOT', 'CREATE', 'DESIGN', 'MAGIC'],
    colors: ['#0078D4', '#8661C5', '#E8458B', '#6B5CE7'],
    bgColor: '#F5F5F7',
    cycleDuration: 0.7,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['COPILOT', 'CREATE', 'DESIGN', 'MAGIC'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#0078D4', '#8661C5', '#E8458B', '#6B5CE7'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5F5F7', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 0.7, min: 0.3, max: 5, group: 'Timing' },
  ],
})
