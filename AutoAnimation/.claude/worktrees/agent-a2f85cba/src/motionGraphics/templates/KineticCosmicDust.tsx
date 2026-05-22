import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CosmicDustConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Floating cosmic dust particles
    const particles = Array.from({ length: 60 }, (_, i) => {
      const baseX = ((i * 67 + 13) % 100)
      const baseY = ((i * 43 + 37) % 100)
      const driftX = Math.sin(time * 0.5 + i * 0.8) * 3
      const driftY = Math.cos(time * 0.4 + i * 1.1) * 2
      const size = 1 + ((i * 17) % 3)
      const hue = 220 + ((i * 31) % 80) // blues to purples
      const opacity = 0.15 + ((i * 23) % 6) / 20 + Math.sin(time * 1.5 + i * 0.7) * 0.08
      return { x: baseX + driftX, y: baseY + driftY, size, hue, opacity }
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Subtle cosmic gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 30% 40%, rgba(80,40,140,0.1) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(40,60,140,0.08) 0%, transparent 50%)',
          }}
        />
        {/* Dust particles */}
        {particles.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: `hsla(${p.hue}, 60%, 70%, ${p.opacity})`,
              boxShadow: `0 0 ${p.size * 2}px hsla(${p.hue}, 60%, 70%, ${p.opacity * 0.5})`,
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0

    if (phase === 'enter') {
      // Word assembles from scattered dust particles
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%)`,
            display: 'flex',
            gap: 'clamp(2px, 0.5vw, 6px)',
            whiteSpace: 'nowrap',
          }}
        >
          {word.split('').map((char, ci) => {
            const charDelay = ci / (word.length + 1) * 0.4
            const charProgress = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.6))
            const charEased = 1 - Math.pow(1 - charProgress, 3)
            const offsetX = (1 - charEased) * (((ci * 47 + 13) % 60) - 30)
            const offsetY = (1 - charEased) * (((ci * 31 + 7) % 40) - 20)
            return (
              <span
                key={ci}
                style={{
                  fontSize: 'clamp(40px, 12vw, 150px)',
                  fontWeight: 900,
                  fontFamily: "'Arial Black', 'Impact', sans-serif",
                  textTransform: 'uppercase',
                  color: '#FFFFFF',
                  opacity: charEased,
                  transform: `translate(${offsetX}px, ${offsetY}px)`,
                  textShadow: `0 0 ${10 + charEased * 15}px ${color}60`,
                  display: 'inline-block',
                }}
              >
                {char}
              </span>
            )
          })}
        </div>
      )
    } else if (phase === 'hold') {
      const shimmer = Math.sin(f * 0.1 + index * 2) * 0.1
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%)`,
            fontSize: 'clamp(40px, 12vw, 150px)',
            fontWeight: 900,
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            color: '#FFFFFF',
            textShadow: `0 0 20px ${color}80, 0 0 40px ${color}40`,
            opacity: 0.9 + shimmer,
          }}
        >
          {word}
        </div>
      )
    } else {
      // Word dissolves into dust particles
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%)`,
            display: 'flex',
            gap: 'clamp(2px, 0.5vw, 6px)',
            whiteSpace: 'nowrap',
          }}
        >
          {word.split('').map((char, ci) => {
            const charDelay = ci / (word.length + 1) * 0.3
            const charProgress = Math.max(0, Math.min(1, (exitProgress - charDelay) / 0.7))
            const offsetX = charProgress * (((ci * 53 + 19) % 80) - 40)
            const offsetY = charProgress * (((ci * 37 + 11) % 60) - 30)
            const charScale = 1 - charProgress * 0.5
            return (
              <span
                key={ci}
                style={{
                  fontSize: 'clamp(40px, 12vw, 150px)',
                  fontWeight: 900,
                  fontFamily: "'Arial Black', 'Impact', sans-serif",
                  textTransform: 'uppercase',
                  color: color,
                  opacity: 1 - charProgress,
                  transform: `translate(${offsetX}px, ${offsetY}px) scale(${charScale})`,
                  filter: `blur(${charProgress * 4}px)`,
                  display: 'inline-block',
                }}
              >
                {char}
              </span>
            )
          })}
        </div>
      )
    }
  },
}

function CosmicDustComponent(props: MotionGraphicProps<CosmicDustConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cosmic-dust',
  title: 'Kinetic Cosmic Dust',
  description: 'Words assemble from scattered cosmic dust particles and dissolve back, with floating dust on a deep space background',
  tags: ['kinetic', 'typography', 'space', 'cosmic', 'dust', 'particles', 'astronomy'],
  category: 'captions',
  component: CosmicDustComponent as any,
  defaultConfig: {
    words: ['COSMIC', 'DUST', 'FLOAT', 'DRIFT'],
    colors: ['#A78BFA', '#60A5FA', '#C084FC', '#818CF8'],
    bgColor: '#060814',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['COSMIC', 'DUST', 'FLOAT', 'DRIFT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#A78BFA', '#60A5FA', '#C084FC', '#818CF8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060814', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
