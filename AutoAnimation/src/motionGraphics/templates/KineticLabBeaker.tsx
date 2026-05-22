import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LabBeakerConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = (frame ?? 0) / (fps ?? 30)

    // Measurement markers on the beaker
    const markers = Array.from({ length: 6 }, (_, i) => ({
      y: 20 + i * 12,
      label: `${(6 - i) * 100}ml`,
    }))

    // Rising steam particles
    const steamParticles = Array.from({ length: 8 }, (_, i) => {
      const speed = 0.8 + ((i * 31) % 10) / 20
      const x = 40 + ((i * 17) % 20)
      const y = ((time * speed * 12 + i * 20) % 50)
      const opacity = Math.max(0, 0.08 - y * 0.002)
      return { x, y: 10 - y, opacity, size: 6 + i * 2 }
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Beaker outline */}
        <div
          style={{
            position: 'absolute',
            bottom: '8%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '55%',
            height: '70%',
            borderLeft: '2px solid rgba(255,255,255,0.06)',
            borderRight: '2px solid rgba(255,255,255,0.06)',
            borderBottom: '2px solid rgba(255,255,255,0.06)',
            borderRadius: '0 0 6px 6px',
          }}
        >
          {/* Beaker lip */}
          <div
            style={{
              position: 'absolute',
              top: -1,
              left: -6,
              right: -6,
              height: 2,
              background: 'rgba(255,255,255,0.06)',
            }}
          />
          {/* Spout */}
          <div
            style={{
              position: 'absolute',
              top: -10,
              left: -8,
              width: 12,
              height: 12,
              borderLeft: '2px solid rgba(255,255,255,0.06)',
              borderBottom: '2px solid rgba(255,255,255,0.06)',
              borderRadius: '0 0 0 6px',
            }}
          />
        </div>

        {/* Measurement markers */}
        {markers.map((m, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '24%',
              top: `${m.y}%`,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <div style={{ width: 10, height: 1, background: 'rgba(255,255,255,0.04)' }} />
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.06)', fontFamily: 'monospace' }}>{m.label}</span>
          </div>
        ))}

        {/* Steam */}
        {steamParticles.map((s, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              filter: 'blur(3px)',
              opacity: s.opacity,
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, fps, height }: WordRenderProps) => {
    const time = (frame ?? 0) / (fps ?? 30)
    let opacity = 0
    let translateY = 0
    let scale = 1
    let clipPercent = 100

    if (phase === 'enter') {
      // Fill up like liquid rising in a beaker
      const eased = 1 - Math.pow(1 - enterProgress, 2)
      opacity = 1
      clipPercent = (1 - eased) * 100 // Reveal from bottom to top
      scale = 0.9 + eased * 0.1
    } else if (phase === 'hold') {
      opacity = 1
      clipPercent = 0
      // Liquid sloshing motion
      const t = time * 2 + index
      translateY = Math.sin(t) * 4
      const wobble = Math.sin(t * 1.5) * 1
      scale = 1 + wobble * 0.01
    } else {
      // Drain out — clip from top
      const eased = exitProgress * exitProgress
      opacity = 1 - eased * 0.3
      clipPercent = eased * 100
      translateY = eased * 30
      scale = 1 - eased * 0.15
    }

    // Bubble particles around text during enter
    const bubbleCount = phase === 'enter' ? 5 : 0
    const bubbles = Array.from({ length: bubbleCount }, (_, i) => {
      const bx = Math.sin(time * 3 + i * 2.1) * 50
      const by = -20 - i * 15 + Math.sin(time * 2 + i) * 10
      return { x: bx, y: by, size: 4 + (i % 3) * 2 }
    })

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ position: 'relative' }}>
          {bubbles.map((b, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: b.size,
                height: b.size,
                borderRadius: '50%',
                border: `1px solid ${color}40`,
                background: `${color}10`,
                transform: `translate(${b.x}px, ${b.y}px)`,
              }}
            />
          ))}
          <div
            style={{
              transform: `translateY(${translateY}px) scale(${scale})`,
              opacity,
              clipPath: `inset(${clipPercent}% 0 0 0)`,
              fontSize: 'clamp(42px, 11vw, 150px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              textShadow: `0 0 20px ${color}44, 0 4px 12px rgba(0,0,0,0.3)`,
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function LabBeakerComponent(props: MotionGraphicProps<LabBeakerConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-lab-beaker',
  title: 'Kinetic Lab Beaker',
  description: 'Text fills up like liquid in a beaker with rising bubbles, measurement markers, and sloshing hold animation',
  tags: ['kinetic', 'typography', 'science', 'chemistry', 'beaker', 'liquid', 'lab'],
  category: 'captions',
  component: LabBeakerComponent as any,
  defaultConfig: {
    words: ['POUR', 'MIX', 'BOIL', 'TEST'],
    colors: ['#00FFB4', '#64D8FF', '#FF6EC7', '#FFD700'],
    bgColor: '#0a0e18',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['POUR', 'MIX', 'BOIL', 'TEST'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFB4', '#64D8FF', '#FF6EC7', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0e18', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
