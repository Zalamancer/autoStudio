import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NeuralNetConfig extends KineticBaseConfig {}

// Deterministic pseudo-random
function seededRand(seed: number): number {
  return ((Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Neural network nodes
    const nodes = Array.from({ length: 20 }, (_, i) => {
      const x = seededRand(i * 73 + 17) * 100
      const y = seededRand(i * 41 + 89) * 100
      const pulse = Math.sin(time * 2 + i * 0.8) * 0.5 + 0.5
      const size = 3 + seededRand(i * 31) * 4
      const isActive = Math.sin(time * 1.5 + i * 1.3) > 0.3
      const color = isActive ? 'rgba(0,255,255,0.6)' : 'rgba(180,0,255,0.3)'

      return (
        <div
          key={`node-${i}`}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            borderRadius: '50%',
            background: color,
            boxShadow: isActive ? `0 0 ${8 * pulse}px ${color}` : 'none',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        />
      )
    })

    // Connection lines between nodes using SVG
    const connections = Array.from({ length: 15 }, (_, i) => {
      const n1 = i % 20
      const n2 = (i * 3 + 7) % 20
      const x1 = seededRand(n1 * 73 + 17) * 100
      const y1 = seededRand(n1 * 41 + 89) * 100
      const x2 = seededRand(n2 * 73 + 17) * 100
      const y2 = seededRand(n2 * 41 + 89) * 100
      const pulse = Math.sin(time * 3 + i * 0.9) * 0.5 + 0.5
      const opacity = 0.03 + pulse * 0.05

      return (
        <line
          key={`conn-${i}`}
          x1={`${x1}%`}
          y1={`${y1}%`}
          x2={`${x2}%`}
          y2={`${y2}%`}
          stroke={i % 3 === 0 ? `rgba(255,0,255,${opacity})` : `rgba(0,255,255,${opacity})`}
          strokeWidth={0.5}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {connections}
        </svg>
        {nodes}
        {/* Central glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(0,255,255,0.03) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0

    if (phase === 'enter') {
      // Characters connect via neural paths, each appearing sequentially
      const chars = word.split('').map((ch, ci) => {
        const charDelay = ci / (word.length + 1) * 0.6
        const charProg = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.4))
        const scale = charProg < 1 ? 0.5 + charProg * 0.5 : 1
        const charOpacity = charProg

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              opacity: charOpacity,
              transform: `scale(${scale})`,
              color: charProg < 0.5 ? '#00FFFF' : color,
              textShadow: charProg < 1 ? `0 0 12px rgba(0,255,255,0.8)` : `0 0 8px ${color}`,
              transition: 'none',
            }}
          >
            {ch}
          </span>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 8,
          }}
        >
          {chars}
        </div>
      )
    } else if (phase === 'hold') {
      // Neural pulse travels through letters
      const pulsePos = (Math.sin(f * 0.08) * 0.5 + 0.5) * word.length

      const chars = word.split('').map((ch, ci) => {
        const dist = Math.abs(ci - pulsePos)
        const glow = Math.max(0, 1 - dist * 0.4)
        const charColor = glow > 0.5 ? '#00FFFF' : color

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              color: charColor,
              textShadow: glow > 0.3
                ? `0 0 ${8 + glow * 15}px rgba(0,255,255,${glow * 0.6}), 0 0 ${4 + glow * 8}px ${color}`
                : `0 0 8px ${color}40`,
            }}
          >
            {ch}
          </span>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 8,
          }}
        >
          {chars}
        </div>
      )
    } else {
      // Dissolve: nodes disconnect from right to left
      const chars = word.split('').map((ch, ci) => {
        const charDelay = (word.length - 1 - ci) / (word.length + 1) * 0.4
        const charProg = Math.max(0, Math.min(1, (exitProgress - charDelay) / 0.6))
        const yOffset = charProg * 20
        const charOpacity = 1 - charProg

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              opacity: charOpacity,
              transform: `translateY(${yOffset}px)`,
              color: charProg > 0.3 ? 'rgba(0,255,255,0.4)' : color,
              textShadow: `0 0 ${charProg * 15}px rgba(0,255,255,0.5)`,
            }}
          >
            {ch}
          </span>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 8,
          }}
        >
          {chars}
        </div>
      )
    }
  },
}

function NeuralNetComponent(props: MotionGraphicProps<NeuralNetConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-neural-net',
  title: 'Kinetic Neural Net',
  description: 'Text connected by neural network lines with pulsing nodes, sequential character reveal, and traveling light pulse',
  tags: ['kinetic', 'typography', 'neural', 'network', 'ai', 'cyberpunk', 'futuristic', 'tech'],
  category: 'captions',
  component: NeuralNetComponent as any,
  defaultConfig: {
    words: ['NEURAL', 'LINK', 'SYNC', 'PULSE'],
    colors: ['#00FFFF', '#B400FF', '#00FFFF', '#FF00FF'],
    bgColor: '#060a14',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['NEURAL', 'LINK', 'SYNC', 'PULSE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFFF', '#B400FF', '#00FFFF', '#FF00FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060a14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
