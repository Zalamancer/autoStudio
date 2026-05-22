import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NebulaGlowConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Nebula gas clouds — large blurred circles that drift
    const clouds = Array.from({ length: 6 }, (_, i) => {
      const baseX = 20 + ((i * 43) % 60)
      const baseY = 15 + ((i * 67) % 70)
      const driftX = Math.sin(time * 0.3 + i * 1.7) * 5
      const driftY = Math.cos(time * 0.25 + i * 2.3) * 4
      const size = 120 + ((i * 37) % 100)
      const hue = [280, 240, 320, 200, 260, 300][i]
      const opacity = 0.12 + ((i * 19) % 5) / 50
      return { x: baseX + driftX, y: baseY + driftY, size, hue, opacity, i }
    })

    // Tiny stars
    const stars = Array.from({ length: 50 }, (_, i) => ({
      x: ((i * 73 + 11) % 100),
      y: ((i * 47 + 29) % 100),
      size: 1 + ((i * 13) % 2),
      opacity: 0.3 + ((i * 29) % 5) / 10 + Math.sin(time * 2 + i) * 0.15,
    }))

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Nebula clouds */}
        {clouds.map(({ x, y, size, hue, opacity, i }) => (
          <div
            key={`cloud-${i}`}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              borderRadius: '50%',
              background: `radial-gradient(circle, hsla(${hue},70%,50%,${opacity}) 0%, hsla(${hue},60%,30%,${opacity * 0.3}) 50%, transparent 70%)`,
              filter: 'blur(30px)',
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
        {/* Stars */}
        {stars.map((star, i) => (
          <div
            key={`star-${i}`}
            style={{
              position: 'absolute',
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              borderRadius: '50%',
              background: '#FFFFFF',
              opacity: star.opacity,
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let glowIntensity = 0

    if (phase === 'enter') {
      // Word materializes from nebula gas
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      opacity = eased
      scale = 0.9 + eased * 0.1
      glowIntensity = eased
    } else if (phase === 'hold') {
      opacity = 1
      // Gentle nebula glow pulse
      glowIntensity = 0.7 + Math.sin(Date.now() * 0.002 + index * 1.5) * 0.3
    } else {
      const eased = exitProgress * exitProgress
      opacity = 1 - eased
      scale = 1 + eased * 0.15
      glowIntensity = 1 - eased
    }

    const glowSize = 15 + glowIntensity * 25

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          whiteSpace: 'nowrap',
        }}
      >
        {/* Outer nebula glow layer */}
        <div
          style={{
            position: 'absolute',
            inset: -30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(44px, 13vw, 160px)',
            fontWeight: 900,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            textTransform: 'uppercase',
            letterSpacing: 'clamp(2px, 0.5vw, 6px)',
            color: color,
            filter: `blur(${glowSize}px)`,
            opacity: 0.4 * glowIntensity,
          }}
        >
          {word}
        </div>
        {/* Inner glow */}
        <div
          style={{
            position: 'absolute',
            inset: -15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(44px, 13vw, 160px)',
            fontWeight: 900,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            textTransform: 'uppercase',
            letterSpacing: 'clamp(2px, 0.5vw, 6px)',
            color: color,
            filter: `blur(${glowSize * 0.4}px)`,
            opacity: 0.3 * glowIntensity,
          }}
        >
          {word}
        </div>
        {/* Main text */}
        <div
          style={{
            position: 'relative',
            fontSize: 'clamp(44px, 13vw, 160px)',
            fontWeight: 900,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            textTransform: 'uppercase',
            letterSpacing: 'clamp(2px, 0.5vw, 6px)',
            color: '#FFFFFF',
            textShadow: `0 0 10px ${color}80, 0 0 30px ${color}40, 0 0 60px ${color}20`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function NebulaGlowComponent(props: MotionGraphicProps<NebulaGlowConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-nebula-glow',
  title: 'Kinetic Nebula Glow',
  description: 'Text surrounded by drifting nebula gas clouds with pulsing cosmic glow, purple and blue hues on deep space black',
  tags: ['kinetic', 'typography', 'space', 'nebula', 'glow', 'cosmic', 'astronomy'],
  category: 'captions',
  component: NebulaGlowComponent as any,
  defaultConfig: {
    words: ['NEBULA', 'COSMOS', 'STELLAR', 'GLOW'],
    colors: ['#A78BFA', '#818CF8', '#C084FC', '#7C3AED'],
    bgColor: '#070512',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['NEBULA', 'COSMOS', 'STELLAR', 'GLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#A78BFA', '#818CF8', '#C084FC', '#7C3AED'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#070512', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
