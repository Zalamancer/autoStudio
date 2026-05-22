import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface QuantumResolveConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Quantum field -- subtle probability wave interference pattern
    const waveOpacity = 0.03 + Math.sin(frame * 0.03) * 0.01

    // Floating probability particles
    const particles: { x: number; y: number; size: number; opacity: number }[] = []
    for (let i = 0; i < 20; i++) {
      const baseX = seededRand(i * 83 + 7) * width
      const baseY = seededRand(i * 47 + 13) * height
      const drift = Math.sin(frame * 0.02 + i * 1.3) * 15
      const driftY = Math.cos(frame * 0.025 + i * 0.9) * 10
      particles.push({
        x: baseX + drift,
        y: baseY + driftY,
        size: 1.5 + seededRand(i * 61) * 2,
        opacity: 0.08 + Math.sin(frame * 0.04 + i * 2.1) * 0.06,
      })
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Concentric probability rings */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: width * 0.8,
            height: width * 0.8,
            borderRadius: '50%',
            border: `1px solid rgba(100, 200, 255, ${waveOpacity})`,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: width * 0.5,
            height: width * 0.5,
            borderRadius: '50%',
            border: `1px solid rgba(100, 200, 255, ${waveOpacity * 1.5})`,
            pointerEvents: 'none',
          }}
        />
        {/* Probability particles */}
        {particles.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: `rgba(100, 180, 255, ${p.opacity})`,
              boxShadow: `0 0 4px rgba(100, 180, 255, ${p.opacity * 0.5})`,
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const chars = word.split('')
    // Number of superposition ghost copies
    const ghostCount = 4

    if (phase === 'enter') {
      // Multiple blurry ghost copies (superposition states) converge into one resolved form
      const convergence = enterProgress * enterProgress // ease-in for dramatic resolution

      const ghosts = Array.from({ length: ghostCount }, (_, gi) => {
        const angle = (gi / ghostCount) * Math.PI * 2
        const radius = (1 - convergence) * 35
        const offsetX = Math.cos(angle + f * 0.05) * radius
        const offsetY = Math.sin(angle + f * 0.05) * radius
        const ghostBlur = (1 - convergence) * 6
        const ghostOpacity = convergence < 0.8 ? 0.3 : 0.3 * (1 - (convergence - 0.8) * 5)

        return (
          <div
            key={`ghost-${gi}`}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 12vw, 160px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              opacity: ghostOpacity,
              transform: `translate(${offsetX}px, ${offsetY}px)`,
              filter: `blur(${ghostBlur}px)`,
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
        )
      })

      // Resolved main text
      const resolvedOpacity = convergence > 0.6 ? (convergence - 0.6) * 2.5 : 0

      return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {ghosts}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {chars.map((ch, ci) => {
              const charDelay = ci * 0.08
              const charResolved = Math.max(0, Math.min(1, (convergence - 0.5 - charDelay) * 4))

              return (
                <span
                  key={ci}
                  style={{
                    display: 'inline-block',
                    fontFamily: "'Courier New', monospace",
                    fontSize: 'clamp(40px, 12vw, 160px)',
                    fontWeight: 700,
                    color,
                    letterSpacing: 4,
                    opacity: Math.max(resolvedOpacity, charResolved),
                    textShadow: charResolved > 0.5
                      ? `0 0 8px ${color}, 0 0 20px ${color}30`
                      : 'none',
                  }}
                >
                  {ch}
                </span>
              )
            })}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Resolved but with subtle quantum uncertainty -- chars wobble microscopically
      const charElements = chars.map((ch, ci) => {
        const wobbleX = Math.sin(f * 0.15 + ci * 2.3) * 0.8
        const wobbleY = Math.cos(f * 0.12 + ci * 1.7) * 0.5
        const glowPulse = 6 + Math.sin(f * 0.08 + ci * 1.5) * 4

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 12vw, 160px)',
              fontWeight: 700,
              color,
              letterSpacing: 4,
              transform: `translate(${wobbleX}px, ${wobbleY}px)`,
              textShadow: `0 0 ${glowPulse}px ${color}, 0 0 ${glowPulse * 2}px ${color}20`,
            }}
          >
            {ch}
          </span>
        )
      })

      // Faint lingering ghost at random position
      const ghostX = Math.sin(f * 0.07) * 4
      const ghostY = Math.cos(f * 0.09) * 3

      return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {/* Residual superposition ghost */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 12vw, 160px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              opacity: 0.08,
              transform: `translate(${ghostX}px, ${ghostY}px)`,
              filter: 'blur(3px)',
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
          {/* Main resolved text */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {charElements}
          </div>
        </div>
      )
    } else {
      // Exit: wavefunction collapses in reverse -- text splits back into diverging ghosts
      const decoherence = exitProgress * exitProgress

      const ghosts = Array.from({ length: ghostCount }, (_, gi) => {
        const angle = (gi / ghostCount) * Math.PI * 2 + index * 0.5
        const radius = decoherence * 50
        const offsetX = Math.cos(angle) * radius
        const offsetY = Math.sin(angle) * radius
        const ghostBlur = decoherence * 8
        const ghostOpacity = decoherence * 0.25

        return (
          <div
            key={`ghost-${gi}`}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 12vw, 160px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              opacity: ghostOpacity,
              transform: `translate(${offsetX}px, ${offsetY}px)`,
              filter: `blur(${ghostBlur}px)`,
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
        )
      })

      return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {ghosts}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 12vw, 160px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 4,
              opacity: 1 - decoherence,
              textShadow: `0 0 ${4 + decoherence * 12}px ${color}`,
            }}
          >
            {word}
          </div>
        </div>
      )
    }
  },
}

function QuantumResolveComponent(props: MotionGraphicProps<QuantumResolveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-quantum-resolve',
  title: 'Kinetic Quantum Resolve',
  description: 'Quantum superposition states as blurry ghost copies that converge and collapse into one resolved text form with screen blend',
  tags: ['kinetic', 'typography', 'quantum', 'superposition', 'physics', 'science', 'futuristic', 'abstract'],
  category: 'captions',
  component: QuantumResolveComponent as any,
  defaultConfig: {
    words: ['QUBIT', 'STATE', 'WAVE', 'FORM'],
    colors: ['#64C8FF', '#C8A0FF', '#64FFD2', '#FFA0C8'],
    bgColor: '#060818',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['QUBIT', 'STATE', 'WAVE', 'FORM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#64C8FF', '#C8A0FF', '#64FFD2', '#FFA0C8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060818', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
