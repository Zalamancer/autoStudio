import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PacketLossConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Network packet visualization — small rectangles flying across
    const packetCount = 10
    const packets: { x: number; y: number; w: number; color: string; alpha: number }[] = []

    for (let i = 0; i < packetCount; i++) {
      const speed = 60 + rand(i * 31) * 100
      const x = ((time * speed + i * 120) % (width + 80)) - 40
      const y = 20 + rand(i * 67) * (height - 40)
      const lost = rand(i * 97 + Math.floor(time * 3)) < 0.3
      packets.push({
        x,
        y,
        w: 20 + rand(i * 43) * 30,
        color: lost ? '#FF3333' : '#00CCFF',
        alpha: lost ? 0.06 : 0.08,
      })
    }

    // Dotted connection lines
    const lineCount = 3
    const lines: { y: number; dashOffset: number }[] = []
    for (let i = 0; i < lineCount; i++) {
      lines.push({
        y: height * 0.25 + i * height * 0.25,
        dashOffset: (time * 40) % 20,
      })
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Connection lines */}
        {lines.map((l, i) => (
          <div
            key={`l-${i}`}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: l.y,
              height: 1,
              backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,200,255,0.06) 0px, rgba(0,200,255,0.06) 4px, transparent 4px, transparent 10px)',
            }}
          />
        ))}
        {/* Flying packets */}
        {packets.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: p.w,
              height: 4,
              background: p.color,
              opacity: p.alpha,
              borderRadius: 1,
            }}
          />
        ))}
        {/* Packet loss indicator */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: 'rgba(255, 80, 80, 0.15)',
          }}
        >
          PKT LOSS: {Math.floor(rand(frame) * 40 + 10)}%
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 191 + 37
    const chars = word.split('')
    const totalChars = chars.length

    if (phase === 'enter') {
      // Characters arrive in fragments — some missing, gradually all appear
      // Each char has a "packet arrival" time; some are delayed (lost and retransmitted)
      const rendered = chars.map((ch, ci) => {
        const baseDelay = ci / totalChars * 0.4
        const isLost = rand(seed + ci * 73) < 0.4
        const extraDelay = isLost ? 0.3 + rand(seed + ci * 29) * 0.2 : 0
        const charArrival = baseDelay + extraDelay
        const arrived = enterProgress > charArrival

        if (!arrived) {
          // Show placeholder block for missing packet
          const flickerOn = Math.sin(f * 0.8 + ci * 5) > 0
          return (
            <span
              key={ci}
              style={{
                display: 'inline-block',
                width: 'clamp(20px, 5vw, 60px)',
                height: 'clamp(30px, 8vw, 100px)',
                background: flickerOn ? 'rgba(255, 50, 50, 0.15)' : 'transparent',
                borderBottom: '2px solid rgba(255, 50, 50, 0.3)',
                margin: '0 2px',
                verticalAlign: 'bottom',
              }}
            />
          )
        }

        // Arrived with jitter
        const jitterY = isLost && enterProgress < charArrival + 0.1
          ? (rand(f + ci) - 0.5) * 12
          : 0

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 10vw, 140px)',
              fontWeight: 700,
              color,
              transform: `translateY(${jitterY}px)`,
              textShadow: `0 0 6px ${color}40`,
            }}
          >
            {ch}
          </span>
        )
      })

      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', whiteSpace: 'nowrap' }}>
          {rendered}
        </div>
      )
    } else if (phase === 'hold') {
      // Stable but with occasional packet drops — chars briefly vanish and return
      const rendered = chars.map((ch, ci) => {
        const dropSeed = seed + ci * 41 + Math.floor(holdProgress * 10)
        const isDropped = rand(dropSeed) < 0.08
        const jitter = rand(f + ci * 17) < 0.05 ? (rand(f + ci) - 0.5) * 4 : 0

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 10vw, 140px)',
              fontWeight: 700,
              color: isDropped ? 'transparent' : color,
              transform: `translateY(${jitter}px)`,
              textShadow: `0 0 8px ${color}30, 0 0 20px ${color}15`,
              borderBottom: isDropped ? '2px solid rgba(255, 50, 50, 0.4)' : 'none',
            }}
          >
            {isDropped ? '\u00A0' : ch}
          </span>
        )
      })

      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', whiteSpace: 'nowrap' }}>
          {rendered}
        </div>
      )
    } else {
      // Exit: characters vanish in sequence like packets timing out
      const rendered = chars.map((ch, ci) => {
        const charTimeout = ci / totalChars * 0.6
        const gone = exitProgress > charTimeout + 0.3
        const fading = exitProgress > charTimeout

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 10vw, 140px)',
              fontWeight: 700,
              color,
              opacity: gone ? 0 : fading ? 1 - (exitProgress - charTimeout) / 0.3 : 1,
              transform: fading ? `translateY(${(exitProgress - charTimeout) * 40}px)` : 'none',
            }}
          >
            {ch}
          </span>
        )
      })

      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', whiteSpace: 'nowrap' }}>
          {rendered}
        </div>
      )
    }
  },
}

function PacketLossComponent(props: MotionGraphicProps<PacketLossConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-packet-loss',
  title: 'Kinetic Packet Loss',
  description: 'Network packet loss aesthetic — text arrives in fragments with missing chunks, placeholder blocks for lost data, jittery reassembly',
  tags: ['kinetic', 'typography', 'packet', 'network', 'digital', 'corruption', 'glitch', 'data'],
  category: 'captions',
  component: PacketLossComponent as any,
  defaultConfig: {
    words: ['PACKET', 'LOST', 'RETRY', 'TIMEOUT'],
    colors: ['#00CCFF', '#00AAFF', '#0088FF', '#00CCFF'],
    bgColor: '#060612',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PACKET', 'LOST', 'RETRY', 'TIMEOUT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00CCFF', '#00AAFF', '#0088FF', '#00CCFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060612', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
