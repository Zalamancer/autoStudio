import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SynapseWebConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Subtle organic neural tissue texture -- faint branching dendrites
    const dendrites: { x1: number; y1: number; x2: number; y2: number; opacity: number }[] = []
    for (let i = 0; i < 30; i++) {
      const x1 = seededRand(i * 97 + 11) * width
      const y1 = seededRand(i * 53 + 29) * height
      const angle = seededRand(i * 71 + 43) * Math.PI * 2
      const len = 20 + seededRand(i * 37) * 60
      const x2 = x1 + Math.cos(angle) * len
      const y2 = y1 + Math.sin(angle) * len
      const pulse = Math.sin(frame * 0.04 + i * 0.7) * 0.5 + 0.5
      dendrites.push({ x1, y1, x2, y2, opacity: 0.02 + pulse * 0.03 })
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {dendrites.map((d, i) => (
            <line
              key={i}
              x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2}
              stroke={`rgba(180, 120, 255, ${d.opacity})`}
              strokeWidth={0.6}
              strokeLinecap="round"
            />
          ))}
        </svg>
        {/* Central cortex glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(140, 80, 255, 0.04) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const chars = word.split('')
    const charCount = chars.length

    // Calculate approximate character positions for synapse lines
    const charSpacing = Math.min(width * 0.7, charCount * 80) / charCount
    const baseX = width / 2 - (charCount * charSpacing) / 2

    if (phase === 'enter') {
      // Each character is a neuron node that fires sequentially
      // Synapse lines connect them as they activate
      const activeCount = Math.floor(enterProgress * (charCount + 1))

      const charElements = chars.map((ch, ci) => {
        const isActive = ci < activeCount
        const justFired = ci === activeCount - 1
        const charOpacity = isActive ? 1 : 0
        const nodeGlow = justFired ? 12 : 6
        const nodeColor = justFired ? '#FFFFFF' : color

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              opacity: charOpacity,
              color: nodeColor,
              textShadow: isActive
                ? `0 0 ${nodeGlow}px ${color}, 0 0 ${nodeGlow * 2}px ${color}40`
                : 'none',
              transform: isActive ? 'scale(1)' : 'scale(0.3)',
              mixBlendMode: justFired ? 'screen' : 'normal',
            }}
          >
            {ch}
          </span>
        )
      })

      // Synapse connection lines between active chars
      const synapseLines = chars.slice(0, Math.max(0, activeCount - 1)).map((_, ci) => {
        const x1 = baseX + ci * charSpacing + charSpacing * 0.5
        const x2 = baseX + (ci + 1) * charSpacing + charSpacing * 0.5
        const midY = height / 2
        const fireProgress = Math.max(0, Math.min(1, (enterProgress * charCount - ci) * 2))
        const arcY = -8 - seededRand(ci * 31 + index) * 12

        return (
          <path
            key={`syn-${ci}`}
            d={`M ${x1} ${midY} Q ${(x1 + x2) / 2} ${midY + arcY} ${x2} ${midY}`}
            stroke={`rgba(180, 120, 255, ${0.2 + fireProgress * 0.4})`}
            strokeWidth={1 + fireProgress}
            fill="none"
            strokeLinecap="round"
          />
        )
      })

      return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {synapseLines}
          </svg>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 12vw, 160px)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
            }}
          >
            {charElements}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Traveling electrical impulse along synapse connections
      const impulsePos = (Math.sin(f * 0.1) * 0.5 + 0.5) * charCount

      const charElements = chars.map((ch, ci) => {
        const dist = Math.abs(ci - impulsePos)
        const impulse = Math.max(0, 1 - dist * 0.5)
        const charColor = impulse > 0.5 ? '#FFFFFF' : color
        const glowSize = 6 + impulse * 16

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              color: charColor,
              textShadow: `0 0 ${glowSize}px ${color}, 0 0 ${glowSize * 1.5}px ${color}30`,
              mixBlendMode: impulse > 0.6 ? 'screen' : 'normal',
            }}
          >
            {ch}
          </span>
        )
      })

      // Animated synapse lines with traveling pulse
      const synapseLines = chars.slice(0, charCount - 1).map((_, ci) => {
        const x1 = baseX + ci * charSpacing + charSpacing * 0.5
        const x2 = baseX + (ci + 1) * charSpacing + charSpacing * 0.5
        const midY = height / 2
        const arcY = -8 - seededRand(ci * 31 + index) * 12
        const segImpulse = Math.max(0, 1 - Math.abs(ci - impulsePos) * 0.6)

        return (
          <path
            key={`syn-${ci}`}
            d={`M ${x1} ${midY} Q ${(x1 + x2) / 2} ${midY + arcY} ${x2} ${midY}`}
            stroke={`rgba(180, 120, 255, ${0.15 + segImpulse * 0.5})`}
            strokeWidth={0.8 + segImpulse * 1.5}
            fill="none"
            strokeLinecap="round"
          />
        )
      })

      return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {synapseLines}
          </svg>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 12vw, 160px)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
            }}
          >
            {charElements}
          </div>
        </div>
      )
    } else {
      // Exit: synapse connections break and chars drift apart like disconnecting neurons
      const charElements = chars.map((ch, ci) => {
        const charDelay = ci / (charCount + 1) * 0.4
        const prog = Math.max(0, Math.min(1, (exitProgress - charDelay) / 0.6))
        const driftX = (seededRand(ci * 47 + index) - 0.5) * prog * 40
        const driftY = (seededRand(ci * 83 + index) - 0.5) * prog * 30
        const charOpacity = 1 - prog

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              transform: `translate(${driftX}px, ${driftY}px)`,
              opacity: charOpacity,
              color: prog > 0.4 ? `rgba(180, 120, 255, ${charOpacity})` : color,
              textShadow: `0 0 ${4 + prog * 12}px rgba(180, 120, 255, ${charOpacity * 0.5})`,
            }}
          >
            {ch}
          </span>
        )
      })

      // Fading synapse lines
      const synapseLines = chars.slice(0, charCount - 1).map((_, ci) => {
        const x1 = baseX + ci * charSpacing + charSpacing * 0.5
        const x2 = baseX + (ci + 1) * charSpacing + charSpacing * 0.5
        const midY = height / 2
        const arcY = -8 - seededRand(ci * 31 + index) * 12
        const lineOpacity = Math.max(0, 0.3 - exitProgress * 0.5)

        return (
          <path
            key={`syn-${ci}`}
            d={`M ${x1} ${midY} Q ${(x1 + x2) / 2} ${midY + arcY} ${x2} ${midY}`}
            stroke={`rgba(180, 120, 255, ${lineOpacity})`}
            strokeWidth={0.6}
            fill="none"
            strokeDasharray={exitProgress > 0.3 ? '4 4' : 'none'}
          />
        )
      })

      return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {synapseLines}
          </svg>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(40px, 12vw, 160px)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
            }}
          >
            {charElements}
          </div>
        </div>
      )
    }
  },
}

function SynapseWebComponent(props: MotionGraphicProps<SynapseWebConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-synapse-web',
  title: 'Kinetic Synapse Web',
  description: 'Characters are neuron nodes connected by animated synapse arcs with traveling electrical impulses and sequential firing',
  tags: ['kinetic', 'typography', 'synapse', 'neural', 'brain', 'impulse', 'science', 'futuristic'],
  category: 'captions',
  component: SynapseWebComponent as any,
  defaultConfig: {
    words: ['FIRE', 'THINK', 'LINK', 'SPARK'],
    colors: ['#B478FF', '#78D4FF', '#FF78D4', '#78FFB4'],
    bgColor: '#08061a',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FIRE', 'THINK', 'LINK', 'SPARK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#B478FF', '#78D4FF', '#FF78D4', '#78FFB4'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#08061a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
