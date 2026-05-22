import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ChemicalReactionConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Rising bubbles
    const bubbles = Array.from({ length: 18 }, (_, i) => {
      const x = ((i * 71 + 13) % 100)
      const speed = 0.6 + ((i * 37) % 10) / 10
      const size = 4 + ((i * 23) % 12)
      const y = ((100 + 20) - ((time * speed * 15 + i * 17) % 130))
      const wobble = Math.sin(time * 2 + i * 1.3) * 8
      return { x: x + wobble, y, size }
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Bubbles */}
        {bubbles.map((b, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: b.size,
              height: b.size,
              borderRadius: '50%',
              border: '1px solid rgba(0,255,180,0.15)',
              background: 'radial-gradient(circle at 30% 30%, rgba(0,255,180,0.08), transparent)',
            }}
          />
        ))}

        {/* Beaker outline at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60%',
            height: '25%',
            borderLeft: '1px solid rgba(0,255,180,0.08)',
            borderRight: '1px solid rgba(0,255,180,0.08)',
            borderBottom: '1px solid rgba(0,255,180,0.08)',
            borderRadius: '0 0 8px 8px',
          }}
        />

        {/* Liquid surface wobble */}
        <div
          style={{
            position: 'absolute',
            bottom: '24%',
            left: '20%',
            right: '20%',
            height: 3,
            background: `linear-gradient(90deg, transparent, rgba(0,255,180,0.12), transparent)`,
            transform: `scaleY(${1 + Math.sin(time * 4) * 0.5})`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, fps }: WordRenderProps) => {
    const time = frame / fps
    let opacity = 0
    let translateY = 0
    let scale = 1
    let blur = 0

    if (phase === 'enter') {
      // Bubble up from bottom
      const eased = 1 - Math.pow(1 - enterProgress, 2)
      opacity = Math.min(1, enterProgress * 3)
      translateY = (1 - eased) * 200
      scale = 0.5 + eased * 0.5
      // Wobble while rising
      const wobble = Math.sin(enterProgress * Math.PI * 6) * (1 - eased) * 15
      translateY += wobble
    } else if (phase === 'hold') {
      opacity = 1
      // Effervescent jitter
      const t = time * 3 + index
      translateY = Math.sin(t) * 5 + Math.sin(t * 2.3) * 3
      scale = 1 + Math.sin(t * 1.7) * 0.03
    } else {
      // Dissolve and pop like a bubble
      const eased = exitProgress * exitProgress
      opacity = 1 - eased
      scale = 1 + eased * 0.4
      blur = eased * 12
      translateY = eased * -40
    }

    // Bubble particles around the text during hold
    const particleCount = phase === 'hold' ? 6 : 0
    const particles = Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2 + time * 1.5
      const dist = 60 + Math.sin(time * 2 + i) * 15
      return {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist - Math.sin(time * 3 + i * 2) * 10,
        size: 3 + Math.sin(time * 4 + i) * 2,
      }
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
          {/* Floating reaction particles */}
          {particles.map((p, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: p.size,
                height: p.size,
                borderRadius: '50%',
                background: `${color}60`,
                transform: `translate(${p.x}px, ${p.y}px)`,
                boxShadow: `0 0 6px ${color}40`,
              }}
            />
          ))}
          <div
            style={{
              transform: `translateY(${translateY}px) scale(${scale})`,
              opacity,
              filter: blur > 0 ? `blur(${blur}px)` : undefined,
              fontSize: 'clamp(42px, 11vw, 150px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              textShadow: `0 0 20px ${color}40, 0 2px 8px rgba(0,0,0,0.3)`,
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function ChemicalReactionComponent(props: MotionGraphicProps<ChemicalReactionConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-chemical-reaction',
  title: 'Kinetic Chemical Reaction',
  description: 'Text bubbles and reacts like chemicals in a beaker with rising bubbles, effervescent jitter, and dissolve exit',
  tags: ['kinetic', 'typography', 'science', 'chemistry', 'reaction', 'bubble', 'lab'],
  category: 'captions',
  component: ChemicalReactionComponent as any,
  defaultConfig: {
    words: ['REACT', 'BOND', 'FUSE', 'SPLIT'],
    colors: ['#00FFB4', '#FF6EC7', '#FFD700', '#64D8FF'],
    bgColor: '#0a1018',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['REACT', 'BOND', 'FUSE', 'SPLIT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFB4', '#FF6EC7', '#FFD700', '#64D8FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a1018', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
