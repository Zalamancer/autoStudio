import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AIGenerateConfig extends KineticBaseConfig {}

const SLOT_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*?<>{}[]'

function slotChar(seed: number): string {
  return SLOT_CHARS[Math.abs(Math.floor(Math.sin(seed * 127.1 + 311.7) * 43758.5453)) % SLOT_CHARS.length]
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame }: BackgroundRenderProps) => {
    // Subtle neural network node-like dots pulsing
    const nodes: { x: number; y: number; pulse: number }[] = []
    for (let i = 0; i < 12; i++) {
      const x = 10 + (Math.sin(i * 2.1 + 0.5) * 0.5 + 0.5) * 80
      const y = 10 + (Math.cos(i * 1.7 + 0.3) * 0.5 + 0.5) * 80
      const pulse = 0.03 + Math.sin(frame * 0.05 + i * 0.7) * 0.02
      nodes.push({ x, y, pulse })
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Grid dots */}
        {nodes.map((n, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${n.x}%`,
              top: `${n.y}%`,
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: `rgba(100, 200, 255, ${n.pulse})`,
              boxShadow: `0 0 6px rgba(100, 200, 255, ${n.pulse})`,
            }}
          />
        ))}
        {/* Subtle label */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 14,
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: 'rgba(100, 200, 255, 0.15)',
          }}
        >
          AI GENERATING...
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const totalChars = word.length
    const f = frame ?? 0

    if (phase === 'enter') {
      // Each char settles at slightly different times (slot machine effect)
      const chars = word.split('').map((realChar, ci) => {
        // Stagger: first char settles earliest, last settles latest
        const charDelay = ci / (totalChars + 1) * 0.6
        const charProgress = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.4))

        if (charProgress >= 1) {
          return (
            <span key={ci} style={{ color }}>
              {realChar}
            </span>
          )
        }
        // Cycling through random chars, slowing down as it settles
        const cycleSpeed = Math.max(1, Math.floor((1 - charProgress) * 6))
        const currentChar = slotChar(ci * 97 + index * 31 + Math.floor(f / cycleSpeed))

        return (
          <span key={ci} style={{ color: `${color}88`, opacity: 0.5 + charProgress * 0.5 }}>
            {currentChar}
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
            textShadow: `0 0 10px ${color}40`,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
          }}
        >
          {chars}
        </div>
      )
    } else if (phase === 'hold') {
      // Stable with occasional micro-glitch on random char
      const glitchChar = Math.floor(holdProgress * 8) % totalChars
      const isGlitch = holdProgress > 0.3 && holdProgress < 0.35

      const chars = word.split('').map((ch, ci) => {
        if (isGlitch && ci === glitchChar) {
          return (
            <span key={ci} style={{ color: '#FF6666', opacity: 0.8 }}>
              {slotChar(ci + f)}
            </span>
          )
        }
        return (
          <span key={ci} style={{ color }}>
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
            textShadow: `0 0 10px ${color}, 0 0 25px ${color}30`,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
          }}
        >
          {chars}
        </div>
      )
    } else {
      // Exit: chars dissolve back into random
      const chars = word.split('').map((realChar, ci) => {
        const charDelay = ci / (totalChars + 1) * 0.4
        const charProgress = Math.max(0, Math.min(1, (exitProgress - charDelay) / 0.6))

        if (charProgress >= 1) {
          return (
            <span key={ci} style={{ opacity: 0.15, color }}>
              {slotChar(ci * 41 + f)}
            </span>
          )
        }
        if (charProgress > 0) {
          return (
            <span key={ci} style={{ opacity: 1 - charProgress * 0.7, color }}>
              {slotChar(ci * 73 + f)}
            </span>
          )
        }
        return (
          <span key={ci} style={{ color }}>
            {realChar}
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
            opacity: 1 - exitProgress * 0.5,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 700,
            textShadow: `0 0 10px ${color}40`,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
          }}
        >
          {chars}
        </div>
      )
    }
  },
}

function AIGenerateComponent(props: MotionGraphicProps<AIGenerateConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ai-generate',
  title: 'Kinetic AI Generate',
  description: 'AI text generation effect with slot-machine character cycling that settles per-character at staggered intervals',
  tags: ['kinetic', 'typography', 'ai', 'generate', 'decode', 'tech', 'futuristic'],
  category: 'captions',
  component: AIGenerateComponent as any,
  defaultConfig: {
    words: ['THINK', 'LEARN', 'BUILD', 'SHIP'],
    colors: ['#64C8FF', '#A78BFA', '#64C8FF', '#A78BFA'],
    bgColor: '#080818',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['THINK', 'LEARN', 'BUILD', 'SHIP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#64C8FF', '#A78BFA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080818', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
