import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DNAHelixConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // DNA base pair rungs in background
    const rungs = Array.from({ length: 14 }, (_, i) => {
      const y = ((i / 14) * 120 - 10 + time * 8) % 120 - 10
      const twist = Math.sin((y * 0.06) + time * 2) * 0.35
      const opacity = 0.04 + Math.abs(twist) * 0.06
      return { y, twist, opacity }
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Double helix strands in background */}
        {rungs.map((rung, i) => {
          const xLeft = 50 + Math.sin((rung.y * 0.06) + time * 2) * 18
          const xRight = 50 - Math.sin((rung.y * 0.06) + time * 2) * 18
          return (
            <div key={i}>
              {/* Left strand node */}
              <div
                style={{
                  position: 'absolute',
                  left: `${xLeft}%`,
                  top: `${rung.y}%`,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#00BFFF',
                  opacity: rung.opacity,
                  boxShadow: '0 0 6px #00BFFF40',
                }}
              />
              {/* Right strand node */}
              <div
                style={{
                  position: 'absolute',
                  left: `${xRight}%`,
                  top: `${rung.y}%`,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#FF6EC7',
                  opacity: rung.opacity,
                  boxShadow: '0 0 6px #FF6EC740',
                }}
              />
              {/* Connecting rung */}
              <div
                style={{
                  position: 'absolute',
                  left: `${Math.min(xLeft, xRight)}%`,
                  top: `${rung.y}%`,
                  width: `${Math.abs(xLeft - xRight)}%`,
                  height: 1,
                  background: `linear-gradient(90deg, #00BFFF30, #FF6EC730)`,
                  opacity: rung.opacity * 0.5,
                }}
              />
            </div>
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, fps }: WordRenderProps) => {
    const time = frame / fps
    let opacity = 0
    let rotateY = 0
    let translateX = 0
    let translateY = 0
    let scale = 1

    if (phase === 'enter') {
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      opacity = eased
      // Spiral in along helix path
      rotateY = (1 - eased) * 360
      translateX = Math.sin((1 - eased) * Math.PI * 3) * 120
      translateY = (1 - eased) * -80
      scale = 0.3 + eased * 0.7
    } else if (phase === 'hold') {
      opacity = 1
      // Gentle DNA twist motion during hold
      const t = time * 1.5 + index * 0.5
      rotateY = Math.sin(t) * 15
      translateX = Math.sin(t) * 25
      translateY = Math.cos(t * 0.7) * 8
    } else {
      const eased = exitProgress * exitProgress
      opacity = 1 - eased
      rotateY = eased * -360
      translateX = Math.sin(eased * Math.PI * 3) * -120
      translateY = eased * 80
      scale = 1 - eased * 0.7
    }

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: 1000,
        }}
      >
        <div
          style={{
            transform: `translateX(${translateX}px) translateY(${translateY}px) rotateY(${rotateY}deg) scale(${scale})`,
            opacity,
            fontSize: 'clamp(42px, 11vw, 150px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            textShadow: `0 0 20px ${color}55, 0 0 50px ${color}22`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function DNAHelixComponent(props: MotionGraphicProps<DNAHelixConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dna-helix',
  title: 'Kinetic DNA Helix',
  description: 'Text rotates in a DNA double helix pattern with spiraling base pair background and 3D twist motion',
  tags: ['kinetic', 'typography', 'science', 'dna', 'biology', 'helix', 'lab'],
  category: 'captions',
  component: DNAHelixComponent as any,
  defaultConfig: {
    words: ['GENOME', 'HELIX', 'SPLICE', 'CODE'],
    colors: ['#00BFFF', '#FF6EC7', '#00FF88', '#FFD700'],
    bgColor: '#0a0e1a',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GENOME', 'HELIX', 'SPLICE', 'CODE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00BFFF', '#FF6EC7', '#00FF88', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0e1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
  ],
})
