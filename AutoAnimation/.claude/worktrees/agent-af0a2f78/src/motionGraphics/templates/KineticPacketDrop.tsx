import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PacketDropConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Sequence number headers scrolling across background
    const seqCount = 8
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Horizontal packet lanes */}
        {Array.from({ length: seqCount }, (_, i) => {
          const laneY = (i / seqCount) * height
          const speed = 30 + rand(i * 43) * 50
          const x = ((time * speed + i * 140) % (width + 120)) - 60
          const seq = (Math.floor(time * 3) * seqCount + i) % 256
          const dropped = rand(i * 97 + Math.floor(time * 2)) < 0.25
          return (
            <div key={i} style={{ position: 'absolute', left: x, top: laneY + 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 28 + rand(i * 13) * 20,
                height: 5,
                background: dropped ? 'rgba(255,60,60,0.12)' : 'rgba(0,220,130,0.10)',
                borderRadius: 2,
                border: dropped ? '1px solid rgba(255,60,60,0.2)' : '1px solid rgba(0,220,130,0.15)',
              }} />
              <span style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 7,
                color: dropped ? 'rgba(255,60,60,0.18)' : 'rgba(0,220,130,0.15)',
                letterSpacing: 1,
              }}>SEQ {seq}</span>
            </div>
          )
        })}
        {/* TCP header overlay top-right */}
        <div style={{
          position: 'absolute', top: 8, right: 10,
          fontFamily: "'Courier New', monospace", fontSize: 7,
          color: 'rgba(0,200,100,0.12)', lineHeight: 1.5,
          textAlign: 'right',
        }}>
          TCP SYN-ACK<br />
          WIN={Math.floor(rand(Math.floor(time)) * 65535)}<br />
          DROP {Math.floor(rand(frame * 0.1) * 30 + 5)}%
        </div>
        {/* Reorder indicator bottom-left */}
        <div style={{
          position: 'absolute', bottom: 8, left: 10,
          fontFamily: "'Courier New', monospace", fontSize: 7,
          color: 'rgba(255,180,0,0.12)',
        }}>
          RESEQUENCING...
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 173 + 61
    const chars = word.split('')
    const total = chars.length

    const wrap = (children: React.ReactNode) => (
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', whiteSpace: 'nowrap' }}>
        {children}
      </div>
    )

    if (phase === 'enter') {
      // Packets arrive out of order — chars appear at scrambled positions then snap into sequence
      // Phase 1 (0..0.5): chars appear at wrong slots
      // Phase 2 (0.5..1): each char slides to correct position
      const resequenced = enterProgress > 0.5
      const reseqProgress = resequenced ? (enterProgress - 0.5) / 0.5 : 0

      // Assign each char a random arrival slot
      const arrivals = chars.map((_, ci) => {
        const arrivalTime = rand(seed + ci * 53) * 0.5
        const arrived = enterProgress > arrivalTime
        const wrongSlot = Math.floor(rand(seed + ci * 29) * total)
        return { arrived, wrongSlot }
      })

      return wrap(
        chars.map((ch, ci) => {
          const { arrived, wrongSlot } = arrivals[ci]
          if (!arrived) return null

          // During scramble phase: render at wrongSlot position
          // During resequence: lerp from wrongSlot to correct slot (ci)
          const correctX = ci * 1 // relative — handled by inline-block stacking trick
          const slotDiff = (wrongSlot - ci) * (resequenced ? (1 - reseqProgress) : 1)
          const wrongColor = `hsl(${(wrongSlot * 60) % 360}, 70%, 60%)`
          const displayColor = resequenced ? color : wrongColor

          return (
            <span
              key={ci}
              style={{
                display: 'inline-block',
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(36px, 10vw, 140px)',
                fontWeight: 700,
                color: displayColor,
                transform: `translateX(${slotDiff * 18}px)`,
                textShadow: `0 0 8px ${displayColor}50`,
                transition: 'none',
              }}
            >
              {ch}
            </span>
          )
        })
      )
    } else if (phase === 'hold') {
      // Stable — occasional single char jitters as late packet triggers reorder
      return wrap(
        chars.map((ch, ci) => {
          const dropSeed = seed + ci * 37 + Math.floor(holdProgress * 8)
          const jitter = rand(dropSeed) < 0.04 ? (rand(f + ci) - 0.5) * 8 : 0
          const recolor = rand(dropSeed + 1) < 0.04
          return (
            <span
              key={ci}
              style={{
                display: 'inline-block',
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(36px, 10vw, 140px)',
                fontWeight: 700,
                color: recolor ? '#FF8C00' : color,
                transform: `translateY(${jitter}px)`,
                textShadow: `0 0 8px ${color}35`,
              }}
            >
              {ch}
            </span>
          )
        })
      )
    } else {
      // Exit: chars drop out in reverse order (like TCP FIN handshake teardown)
      return wrap(
        chars.map((ch, ci) => {
          const dropAt = (total - 1 - ci) / total * 0.7
          const dropping = exitProgress > dropAt
          const dropFraction = dropping ? Math.min(1, (exitProgress - dropAt) / 0.3) : 0
          return (
            <span
              key={ci}
              style={{
                display: 'inline-block',
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(36px, 10vw, 140px)',
                fontWeight: 700,
                color,
                opacity: 1 - dropFraction,
                transform: `translateY(${dropFraction * 30}px)`,
              }}
            >
              {ch}
            </span>
          )
        })
      )
    }
  },
}

function PacketDropComponent(props: MotionGraphicProps<PacketDropConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-packet-drop',
  title: 'Kinetic Packet Drop',
  description: 'Network packet drop & TCP resequencing — letters arrive out of order in wrong colors then snap to correct sequence positions',
  tags: ['kinetic', 'typography', 'network', 'tcp', 'packet', 'drop', 'resequence', 'glitch', 'protocol'],
  category: 'captions',
  component: PacketDropComponent as any,
  defaultConfig: {
    words: ['DROPPED', 'RETRY', 'ACK', 'RESEND'],
    colors: ['#00DC82', '#00AAFF', '#00DC82', '#FFAA00'],
    bgColor: '#040D08',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DROPPED', 'RETRY', 'ACK', 'RESEND'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00DC82', '#00AAFF', '#00DC82', '#FFAA00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#040D08', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
  ],
})
