import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TornadoSpinConfig extends KineticBaseConfig {}

function DebrisParticles({ frame, width, height }: { frame: number; width: number; height: number }) {
  const particles = Array.from({ length: 25 }, (_, i) => {
    const seed = i * 73 + 41
    const angle = (frame * 0.04 + seed) % (Math.PI * 2)
    const radiusBase = 30 + (seed % 60)
    const radius = radiusBase + Math.sin(frame * 0.03 + seed) * 20
    const cx = width / 2 + Math.cos(angle) * radius * (width / 300)
    const cy = height * 0.5 + Math.sin(angle) * radius * 0.3 - (frame * 0.3 + seed * 5) % (height * 0.6) + height * 0.3
    const size = 2 + (seed % 4)
    const opacity = 0.15 + (seed % 5) / 15

    return { cx, cy, size, opacity }
  })

  return (
    <svg
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      width={width}
      height={height}
    >
      {particles.map((p, i) => (
        <rect
          key={i}
          x={p.cx}
          y={p.cy}
          width={p.size}
          height={p.size}
          fill="#8a7a6a"
          opacity={p.opacity}
          transform={`rotate(${i * 45 + frame * 3} ${p.cx + p.size / 2} ${p.cy + p.size / 2})`}
        />
      ))}
    </svg>
  )
}

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // Tornado funnel shape with rotating layers
    const funnelLayers = Array.from({ length: 8 }, (_, i) => {
      const layerY = 15 + i * 10
      const layerWidth = 8 + i * 5
      const wobble = Math.sin(time * (1.5 + i * 0.2) + i * 0.8) * (3 + i * 0.5)
      const layerOpacity = 0.12 + (i * 0.02)

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${50 - layerWidth / 2 + wobble}%`,
            top: `${layerY}%`,
            width: `${layerWidth}%`,
            height: '12%',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, rgba(90,80,70,${layerOpacity}), transparent 70%)`,
            transform: `rotate(${time * 60 + i * 45}deg)`,
          }}
        />
      )
    })

    return (
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, #2a3a28 0%, #4a5a3a 30%, #6a7a58 60%, #8a9a78 100%)`,
      }}>
        {/* Dark vortex overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 30%, rgba(30,25,20,0.5) 0%, transparent 60%)`,
        }} />
        {/* Rotating cloud mass */}
        <div style={{
          position: 'absolute',
          left: '20%',
          right: '20%',
          top: '0%',
          height: '35%',
          borderRadius: '0 0 50% 50%',
          background: `radial-gradient(ellipse at 50% 0%, rgba(50,50,50,0.8), rgba(70,65,55,0.4) 60%, transparent)`,
          transform: `rotate(${Math.sin(time * 0.3) * 2}deg)`,
        }} />
        {funnelLayers}
        <DebrisParticles frame={frame} width={width} height={height} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 1
    let rotate = 0
    let scale = 1
    let blur = 0
    let translateY = 0

    if (phase === 'enter') {
      // Spiral in from outside
      opacity = Math.min(1, enterProgress * 1.8)
      rotate = (1 - enterProgress) * 720
      scale = 0.3 + enterProgress * 0.7
      blur = (1 - enterProgress) * 6
    } else if (phase === 'hold') {
      opacity = 1
      // Continuous slow spin with wobble
      rotate = Math.sin(holdProgress * Math.PI * 4) * 3
      translateY = Math.sin(holdProgress * Math.PI * 6) * 4
      scale = 1 + Math.sin(holdProgress * Math.PI * 3) * 0.02
    } else {
      // Spin out
      opacity = 1 - exitProgress
      rotate = exitProgress * -360
      scale = 1 - exitProgress * 0.5
      blur = exitProgress * 8
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px)) rotate(${rotate}deg) scale(${scale})`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontSize: 'clamp(44px, 12vw, 160px)',
          fontWeight: 900,
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: '#F0E8D8',
          textShadow: `
            0 0 15px rgba(60,50,30,0.6),
            0 0 30px rgba(80,70,40,0.3),
            3px 3px 6px rgba(0,0,0,0.4)
          `,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function TornadoSpinComponent(props: MotionGraphicProps<TornadoSpinConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-tornado-spin',
  title: 'Kinetic Tornado Spin',
  description: 'Text spirals in a tornado funnel with rotating debris against an ominous storm sky',
  tags: ['kinetic', 'typography', 'tornado', 'spin', 'weather', 'storm', 'vortex'],
  category: 'captions',
  component: TornadoSpinComponent as any,
  defaultConfig: {
    words: ['TORNADO', 'VORTEX', 'SPIN', 'FURY'],
    colors: ['#D8C8A8', '#B0A080', '#E0D8C0', '#988860'],
    bgColor: '#2a3a28',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TORNADO', 'VORTEX', 'SPIN', 'FURY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D8C8A8', '#B0A080', '#E0D8C0', '#988860'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2a3a28', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
