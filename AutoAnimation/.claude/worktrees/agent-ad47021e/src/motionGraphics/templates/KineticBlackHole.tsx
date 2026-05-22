import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BlackHoleConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const cx = width / 2
    const cy = height / 2
    const maxR = Math.min(width, height) * 0.18

    // Accretion disk rings
    const rings = Array.from({ length: 5 }, (_, i) => {
      const radius = maxR * 1.4 + i * maxR * 0.3
      const rotation = time * (30 - i * 5)
      const hue = 30 + i * 15 // Orange to amber
      const opacity = 0.15 - i * 0.02
      return { radius, rotation, hue, opacity, i }
    })

    // Distant stars warped by gravity
    const stars = Array.from({ length: 40 }, (_, i) => {
      const angle = ((i * 137.5) % 360) * (Math.PI / 180)
      const dist = 40 + ((i * 53) % 50)
      const x = 50 + Math.cos(angle + time * 0.05) * dist * 0.5
      const y = 50 + Math.sin(angle + time * 0.05) * dist * 0.5
      const size = 1 + ((i * 17) % 2)
      const opacity = 0.2 + ((i * 23) % 5) / 10
      return { x, y, size, opacity }
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Stars */}
        {stars.map((s, i) => (
          <div
            key={`s-${i}`}
            style={{
              position: 'absolute',
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              borderRadius: '50%',
              background: '#FFFFFF',
              opacity: s.opacity,
            }}
          />
        ))}
        {/* Accretion disk */}
        {rings.map(({ radius, rotation, hue, opacity, i }) => (
          <div
            key={`ring-${i}`}
            style={{
              position: 'absolute',
              left: cx,
              top: cy,
              width: radius * 2,
              height: radius * 0.5,
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              borderRadius: '50%',
              border: `2px solid hsla(${hue}, 90%, 60%, ${opacity})`,
              boxShadow: `0 0 12px hsla(${hue}, 90%, 60%, ${opacity * 0.5}), inset 0 0 8px hsla(${hue}, 90%, 60%, ${opacity * 0.3})`,
            }}
          />
        ))}
        {/* Black hole center (event horizon) */}
        <div
          style={{
            position: 'absolute',
            left: cx,
            top: cy,
            width: maxR * 2,
            height: maxR * 2,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #000000 60%, rgba(0,0,0,0.9) 75%, transparent 100%)',
            boxShadow: '0 0 40px rgba(0,0,0,0.8), 0 0 80px rgba(80,40,0,0.15)',
          }}
        />
        {/* Photon ring glow */}
        <div
          style={{
            position: 'absolute',
            left: cx,
            top: cy,
            width: maxR * 2.2,
            height: maxR * 2.2,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: '1px solid rgba(255,160,40,0.3)',
            boxShadow: `0 0 15px rgba(255,160,40,0.2), inset 0 0 15px rgba(255,160,40,0.1)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let rotation = 0
    let translateX = 0

    if (phase === 'enter') {
      // Word spirals in from the edge
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      opacity = eased
      scale = 0.5 + eased * 0.5
      rotation = (1 - eased) * 180
      translateX = (1 - eased) * 80
    } else if (phase === 'hold') {
      opacity = 1
      // Subtle gravitational wobble
      const wobble = Math.sin(Date.now() * 0.003 + index * 2)
      rotation = wobble * 2
      scale = 1 + wobble * 0.01
    } else {
      // Word spirals into the black hole (shrinks, rotates, fades)
      const eased = exitProgress * exitProgress * exitProgress
      opacity = 1 - eased
      scale = 1 - eased * 0.9
      rotation = eased * 360
      translateX = -eased * 30
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), -50%) rotate(${rotation}deg) scale(${scale})`,
          opacity,
          fontFamily: "'Arial Black', 'Impact', sans-serif",
          fontSize: 'clamp(40px, 11vw, 140px)',
          fontWeight: 900,
          letterSpacing: 'clamp(3px, 1vw, 10px)',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          color: 'transparent',
          backgroundImage: `linear-gradient(135deg, #FFA028 0%, ${color} 40%, #FFFFFF 70%, ${color} 100%)`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: `drop-shadow(0 0 12px rgba(255,160,40,0.5))`,
        }}
      >
        {word}
      </div>
    )
  },
}

function BlackHoleComponent(props: MotionGraphicProps<BlackHoleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-black-hole',
  title: 'Kinetic Black Hole',
  description: 'Text spirals into a black hole with accretion disk, photon ring, and gravitational distortion effects',
  tags: ['kinetic', 'typography', 'space', 'blackhole', 'gravity', 'cosmic', 'astronomy'],
  category: 'captions',
  component: BlackHoleComponent as any,
  defaultConfig: {
    words: ['EVENT', 'HORIZON', 'VOID', 'SINGULARITY'],
    colors: ['#FFA028', '#FF6B2B', '#FFD700', '#FF8C00'],
    bgColor: '#030308',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['EVENT', 'HORIZON', 'VOID', 'SINGULARITY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFA028', '#FF6B2B', '#FFD700', '#FF8C00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#030308', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
