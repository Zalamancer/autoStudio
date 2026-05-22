import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ProjectorBeamConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // Dust particles floating in the projector beam
    const particles = Array.from({ length: 35 }, (_, i) => {
      const seed = i * 73 + 19
      const baseX = 20 + rand(seed) * 60
      const baseY = 15 + rand(seed + 1) * 70
      const driftX = Math.sin(time * (0.3 + rand(seed + 2) * 0.4) + seed) * 8
      const driftY = Math.sin(time * (0.2 + rand(seed + 3) * 0.3) + seed * 2) * 5
      const size = 1.5 + rand(seed + 4) * 3
      const particleOpacity = 0.15 + rand(seed + 5) * 0.35

      // Only show particles inside the beam cone
      const beamLeft = 25
      const beamRight = 75
      const x = baseX + driftX
      if (x < beamLeft || x > beamRight) return null

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${baseY + driftY}%`,
            width: size,
            height: size,
            borderRadius: '50%',
            background: `rgba(255,240,200,${particleOpacity})`,
            boxShadow: `0 0 ${size * 2}px rgba(255,220,150,${particleOpacity * 0.5})`,
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Projector light cone */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, transparent 0%, rgba(255,240,200,0.02) 10%, rgba(255,240,200,0.06) 30%, rgba(255,240,200,0.08) 50%, rgba(255,240,200,0.06) 70%, rgba(255,240,200,0.02) 90%, transparent 100%)`,
            clipPath: 'polygon(40% 0%, 60% 0%, 80% 100%, 20% 100%)',
          }}
        />
        {/* Beam edge glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(90deg, transparent 20%, rgba(255,230,180,0.03) 25%, transparent 30%, transparent 70%, rgba(255,230,180,0.03) 75%, transparent 80%)`,
          }}
        />
        {/* Film reel flicker */}
        {frame % 4 === 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255,240,200,0.015)',
            }}
          />
        )}
        {particles}
        {/* Projector source glow at top */}
        <div
          style={{
            position: 'absolute',
            top: -20,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 60,
            height: 40,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,240,200,0.3) 0%, transparent 70%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    let opacity = 0
    let scaleX = 1
    let scaleY = 1
    let blur = 0

    if (phase === 'enter') {
      // Focus in: text starts blurry and sharpens as projector focuses
      const focusProgress = Math.pow(enterProgress, 0.6)
      opacity = Math.min(1, enterProgress * 2)
      blur = 12 * (1 - focusProgress)
      scaleX = 1.1 - focusProgress * 0.1
      scaleY = 0.9 + focusProgress * 0.1
    } else if (phase === 'hold') {
      opacity = 0.9 + Math.sin(f * 0.15) * 0.1
      // Subtle film gate weave
      scaleX = 1 + Math.sin(holdProgress * Math.PI * 6) * 0.003
      scaleY = 1 + Math.cos(holdProgress * Math.PI * 4) * 0.003
      blur = 0
    } else {
      // Projector reel change: text washes out bright then gone
      opacity = 1 - Math.pow(exitProgress, 0.5)
      blur = exitProgress * 8
      scaleX = 1 + exitProgress * 0.15
      scaleY = 1 + exitProgress * 0.05
    }

    // Film grain jitter
    const jitterX = (f % 3 === 0) ? (rand(f + index * 31) - 0.5) * 1.5 : 0
    const jitterY = (f % 5 === 0) ? (rand(f + index * 47) - 0.5) * 1 : 0

    return (
      <>
        {/* Hot spot glow behind text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            height: '40%',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, rgba(255,240,200,${opacity * 0.08}) 0%, transparent 70%)`,
          }}
        />
        {/* Main projected text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${jitterX}px), calc(-50% + ${jitterY}px)) scaleX(${scaleX}) scaleY(${scaleY})`,
            fontFamily: "'Courier New', 'Courier', monospace",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 8,
            color,
            textShadow: `0 0 20px rgba(255,240,200,${opacity * 0.4}), 0 0 40px rgba(255,220,150,${opacity * 0.2})`,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            opacity,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Film scratches overlay */}
        {f % 7 === 0 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: `${30 + rand(f) * 40}%`,
              width: 1,
              height: '100%',
              background: 'rgba(255,255,255,0.06)',
            }}
          />
        )}
      </>
    )
  },
}

function ProjectorBeamComponent(props: MotionGraphicProps<ProjectorBeamConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-projector-beam',
  title: 'Kinetic Projector Beam',
  description: 'Movie projector light cone with floating dust particles, text appears in the warm beam with film-grain jitter and focus effects',
  tags: ['kinetic', 'typography', 'projector', 'cinema', 'film', 'dust', 'beam', 'vintage', 'light'],
  category: 'captions',
  component: ProjectorBeamComponent as any,
  defaultConfig: {
    words: ['CINEMA', 'REEL', 'SCENE', 'CUT'],
    colors: ['#F5E6C8', '#E8D5B0', '#F0DCC0', '#E0CCA0'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CINEMA', 'REEL', 'SCENE', 'CUT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F5E6C8', '#E8D5B0', '#F0DCC0', '#E0CCA0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
