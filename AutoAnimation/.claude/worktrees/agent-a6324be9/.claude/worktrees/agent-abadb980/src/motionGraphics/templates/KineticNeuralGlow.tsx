import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NeuralGlowConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

// Pre-defined neural network node layout (deterministic)
const NODE_COUNT = 16
const NODES = Array.from({ length: NODE_COUNT }, (_, i) => ({
  x: seededRand(i * 17 + 3) * 80 + 10,   // 10%–90% of width
  y: seededRand(i * 17 + 7) * 70 + 15,   // 15%–85% of height
  layer: Math.floor(seededRand(i * 17 + 11) * 4), // 0..3 layer
  radius: 3 + seededRand(i * 17 + 13) * 4,
}))

// Deterministic connections between nodes (each node connects to 2 near nodes in next layer)
const CONNECTIONS: [number, number][] = []
for (let i = 0; i < NODE_COUNT; i++) {
  for (let j = i + 1; j < NODE_COUNT; j++) {
    if (NODES[j].layer === NODES[i].layer + 1 && CONNECTIONS.filter(c => c[0] === i).length < 2) {
      CONNECTIONS.push([i, j])
    }
  }
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Neural network SVG layer */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Connection lines */}
          {CONNECTIONS.map(([a, b], i) => {
            const pulse = Math.abs(Math.sin(frame * 0.04 + i * 0.7))
            const opacity = 0.06 + pulse * 0.1
            return (
              <line
                key={i}
                x1={NODES[a].x}
                y1={NODES[a].y}
                x2={NODES[b].x}
                y2={NODES[b].y}
                stroke={i % 2 === 0 ? '#00FFFF' : '#FF00FF'}
                strokeWidth="0.15"
                opacity={opacity}
              />
            )
          })}

          {/* Node circles */}
          {NODES.map((node, i) => {
            const pulse = 0.5 + Math.abs(Math.sin(frame * 0.06 + i * 1.1)) * 0.5
            const r = node.radius * 0.08 * pulse
            return (
              <g key={i}>
                {/* Outer glow */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r * 2.5}
                  fill={i % 3 === 0 ? '#00FFFF' : i % 3 === 1 ? '#FF00FF' : '#0066FF'}
                  opacity={0.04 * pulse}
                />
                {/* Core dot */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r}
                  fill={i % 3 === 0 ? '#00FFFF' : i % 3 === 1 ? '#FF00FF' : '#0066FF'}
                  opacity={0.25 + pulse * 0.2}
                />
              </g>
            )
          })}
        </svg>

        {/* Radial bloom at center */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(0,102,255,0.04) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />

        {/* Status label */}
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            right: 18,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(0,255,255,0.22)',
            letterSpacing: 2,
          }}
        >
          NEURONS: {NODE_COUNT} | CONNECTIONS: {CONNECTIONS.length}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    if (phase === 'enter') {
      // Text assembles from node-like dots converging to center
      const opacity = enterProgress
      const scale = 0.7 + enterProgress * 0.3
      const letters = word.split('')

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            opacity,
          }}
        >
          {/* Convergence ring */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: `${120 + (1 - enterProgress) * 80}px`,
              height: `${60 + (1 - enterProgress) * 40}px`,
              borderRadius: '50%',
              border: `1px solid ${color}30`,
              opacity: 1 - enterProgress,
            }}
          />

          <div style={{ display: 'flex', gap: 0 }}>
            {letters.map((ch, i) => {
              const letterDelay = i / letters.length
              const letterProgress = Math.max(0, Math.min(1, (enterProgress - letterDelay * 0.4) / 0.6))
              return (
                <span
                  key={i}
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 'clamp(40px, 10vw, 150px)',
                    fontWeight: 700,
                    color,
                    textShadow: `0 0 ${8 * letterProgress}px ${color}, 0 0 ${20 * letterProgress}px ${color}60`,
                    opacity: letterProgress,
                    letterSpacing: '0.06em',
                    lineHeight: 1,
                    display: 'inline-block',
                    transform: `translateY(${(1 - letterProgress) * 8}px)`,
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
      // Pulsing neural glow — connections emanate from letters
      const pulse = 0.75 + Math.sin(holdProgress * Math.PI * 4) * 0.25
      const outerGlow = 30 + pulse * 20

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Pulsing halo behind text */}
          <div
            style={{
              position: 'absolute',
              inset: `-${20 * pulse}px`,
              borderRadius: 8,
              background: `radial-gradient(ellipse at center, ${color}10 0%, transparent 70%)`,
              filter: `blur(${8 * pulse}px)`,
            }}
          />

          <div
            style={{
              position: 'relative',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 10vw, 150px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 10px ${color}, 0 0 ${outerGlow}px ${color}60, 0 0 ${outerGlow * 2}px ${color}20`,
              whiteSpace: 'nowrap',
              letterSpacing: '0.06em',
              lineHeight: 1,
            }}
          >
            {word}
          </div>
        </div>
      )
    } else {
      // Exit: text dissolves back into node scatter
      const opacity = 1 - exitProgress
      const spread = exitProgress * 12

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
          }}
        >
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 10vw, 150px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 ${8 + spread}px ${color}`,
              whiteSpace: 'nowrap',
              letterSpacing: '0.06em',
              filter: `blur(${spread * 0.3}px)`,
            }}
          >
            {word}
          </div>
        </div>
      )
    }
  },
}

function NeuralGlowComponent(props: MotionGraphicProps<NeuralGlowConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-neural-glow',
  title: 'Kinetic Neural Glow',
  description: 'Neural network nodes pulse and connect in the background while text assembles with synaptic glow and converging letter animation',
  tags: ['kinetic', 'typography', 'neural', 'network', 'ai', 'glow', 'nodes', 'futuristic', 'sci-fi'],
  category: 'captions',
  component: NeuralGlowComponent as any,
  defaultConfig: {
    words: ['NEURAL', 'LEARN', 'ADAPT', 'EVOLVE'],
    colors: ['#00FFFF', '#FF00FF', '#0066FF', '#00FFFF'],
    bgColor: '#0a0a12',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['NEURAL', 'LEARN', 'ADAPT', 'EVOLVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFFF', '#FF00FF', '#0066FF', '#00FFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a12', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
