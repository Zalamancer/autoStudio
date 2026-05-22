import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BufferOverflowConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random from integer seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const HEX_CHARS = '0123456789ABCDEF'

function hexAddr(seed: number): string {
  let addr = '0x'
  for (let i = 0; i < 8; i++) {
    addr += HEX_CHARS[Math.floor(rand(seed * 13 + i * 47) * 16)]
  }
  return addr
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Memory address column on the left — scrolling hex addresses
    const addrCount = 16
    const lineH = 16
    const scrollOffset = (time * 30) % (addrCount * lineH)

    const addrs: { text: string; y: number; alpha: number }[] = []
    for (let i = 0; i < addrCount; i++) {
      const y = i * lineH - scrollOffset + height * 0.1
      const alpha = 0.06 + (i % 4) * 0.02
      addrs.push({ text: hexAddr(i + Math.floor(time * 2)), y, alpha })
    }

    // Memory usage bar filling up at the top
    const fillPct = Math.min(100, ((time * 8) % 120))
    const barColor = fillPct > 85 ? '#FF3333' : fillPct > 60 ? '#FFAA00' : '#00FF66'

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Memory addresses */}
        {addrs.map((a, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 8,
              top: a.y,
              fontFamily: "'Courier New', monospace",
              fontSize: 10,
              color: `rgba(255, 80, 80, ${a.alpha})`,
              whiteSpace: 'nowrap',
            }}
          >
            {a.text}
          </div>
        ))}
        {/* Memory bar */}
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 10,
            width: 100,
            height: 6,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div style={{ width: `${fillPct}%`, height: '100%', background: barColor, borderRadius: 3 }} />
        </div>
        <div
          style={{
            position: 'absolute',
            top: 5,
            right: 116,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(255,255,255,0.12)',
          }}
        >
          MEM
        </div>
        {/* Overflow warning flash */}
        {fillPct > 90 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `rgba(255, 0, 0, ${Math.sin(time * 12) > 0 ? 0.03 : 0})`,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 173 + 41
    const chars = word.split('')
    const totalChars = chars.length

    if (phase === 'enter') {
      // Characters fall into a container from the top, stacking
      const containerW = Math.min(width * 0.8, totalChars * 80)
      const charW = containerW / totalChars

      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          {chars.map((ch, ci) => {
            const charDelay = ci / totalChars * 0.6
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.4))
            // Drop from above into position
            const yOff = (1 - p) * -120
            const bounce = p >= 1 ? 0 : Math.sin(p * Math.PI) * 8 * (1 - p)
            const opacity = Math.min(1, p * 3)

            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  width: charW,
                  textAlign: 'center',
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(36px, 10vw, 140px)',
                  fontWeight: 700,
                  color,
                  transform: `translateY(${yOff + bounce}px)`,
                  opacity,
                  textShadow: `0 0 6px ${color}40`,
                }}
              >
                {ch}
              </span>
            )
          })}
        </div>
      )
    } else if (phase === 'hold') {
      // Characters start overflowing — duplicates spill out in random directions
      const overflowCount = Math.floor(holdProgress * totalChars * 2)
      const spills: { ch: string; x: number; y: number; rot: number; alpha: number }[] = []

      for (let i = 0; i < overflowCount; i++) {
        const ci = i % totalChars
        const angle = rand(seed + i * 37) * Math.PI * 2
        const dist = 30 + rand(seed + i * 53) * 120 * holdProgress
        spills.push({
          ch: chars[ci],
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          rot: (rand(seed + i * 71) - 0.5) * 60,
          alpha: Math.max(0.15, 0.6 - holdProgress * 0.4),
        })
      }

      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          {/* Spilled overflow characters */}
          {spills.map((sp, i) => (
            <span
              key={`sp-${i}`}
              style={{
                position: 'absolute',
                left: sp.x,
                top: sp.y,
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(14px, 4vw, 50px)',
                fontWeight: 700,
                color: '#FF4444',
                opacity: sp.alpha,
                transform: `translate(-50%, -50%) rotate(${sp.rot}deg)`,
              }}
            >
              {sp.ch}
            </span>
          ))}
          {/* Main word — stable center */}
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 10vw, 140px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 10px ${color}, 0 0 30px ${color}30`,
              whiteSpace: 'nowrap',
              position: 'relative',
            }}
          >
            {word}
          </span>
        </div>
      )
    } else {
      // Exit: all characters collapse downward like a memory dump
      const gravity = exitProgress * exitProgress * 300
      return (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          {chars.map((ch, ci) => {
            const drift = (rand(seed + ci * 29) - 0.5) * 80 * exitProgress
            const rot = (rand(seed + ci * 43) - 0.5) * 180 * exitProgress
            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(36px, 10vw, 140px)',
                  fontWeight: 700,
                  color,
                  opacity: 1 - exitProgress,
                  transform: `translate(${drift}px, ${gravity}px) rotate(${rot}deg)`,
                }}
              >
                {ch}
              </span>
            )
          })}
        </div>
      )
    }
  },
}

function BufferOverflowComponent(props: MotionGraphicProps<BufferOverflowConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-buffer-overflow',
  title: 'Kinetic Buffer Overflow',
  description: 'Memory leak aesthetic — characters drop into a container then spill and stack as the buffer overflows, with hex addresses and memory bar',
  tags: ['kinetic', 'typography', 'buffer', 'overflow', 'memory', 'digital', 'corruption', 'tech'],
  category: 'captions',
  component: BufferOverflowComponent as any,
  defaultConfig: {
    words: ['MALLOC', 'OVERFLOW', 'HEAP', 'DUMP'],
    colors: ['#FF4444', '#FF6644', '#FF4444', '#FF8844'],
    bgColor: '#0a0208',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MALLOC', 'OVERFLOW', 'HEAP', 'DUMP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF4444', '#FF6644', '#FF4444', '#FF8844'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0208', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
