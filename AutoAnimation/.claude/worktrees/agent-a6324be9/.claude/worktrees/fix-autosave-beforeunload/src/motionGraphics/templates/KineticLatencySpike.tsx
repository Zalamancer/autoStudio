import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LatencySpikeConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Easing: overshoot rubber-band */
function rubberBand(t: number): number {
  if (t < 0.5) return 4 * t * t * t
  const f = 2 * t - 2
  return 1 + 0.5 * f * f * f
}

/** Easing: elastic overshoot */
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1
}

const PING_HISTORY = [12, 18, 14, 220, 850, 1200, 340, 22, 16, 19]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Ping graph at bottom
    const graphW = width * 0.6
    const graphH = 40
    const graphX = width * 0.2
    const graphY = height - 56
    const maxPing = 1200
    const barW = graphW / PING_HISTORY.length

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Latency graph bars */}
        {PING_HISTORY.map((ping, i) => {
          const barH = (ping / maxPing) * graphH
          const isSpike = ping > 200
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: graphX + i * barW,
                top: graphY + graphH - barH,
                width: barW - 2,
                height: barH,
                background: isSpike ? 'rgba(255,60,60,0.18)' : 'rgba(0,200,100,0.12)',
                borderRadius: '1px 1px 0 0',
              }}
            />
          )
        })}
        {/* Graph baseline */}
        <div style={{
          position: 'absolute',
          left: graphX, top: graphY + graphH,
          width: graphW, height: 1,
          background: 'rgba(255,255,255,0.06)',
        }} />
        {/* Ping label */}
        <div style={{
          position: 'absolute', bottom: 10, left: graphX,
          fontFamily: "'Courier New', monospace", fontSize: 7,
          color: 'rgba(255,60,60,0.2)', letterSpacing: 2,
        }}>
          PING {PING_HISTORY[Math.floor(time * 2) % PING_HISTORY.length]}ms
        </div>
        {/* Top-right status */}
        <div style={{
          position: 'absolute', top: 8, right: 10,
          fontFamily: "'Courier New', monospace", fontSize: 7,
          color: 'rgba(255,60,60,0.15)', lineHeight: 1.6, textAlign: 'right',
        }}>
          RTT: {Math.floor(rand(Math.floor(time * 4)) * 800 + 12)}ms<br />
          JITTER: HIGH<br />
          QOS: DEGRADED
        </div>
        {/* Rubber-band grid lines — oscillating */}
        {Array.from({ length: 5 }, (_, i) => {
          const baseY = (i / 5) * height
          const wobble = Math.sin(time * (2 + i * 0.7) + i) * 3
          return (
            <div key={i} style={{
              position: 'absolute', left: 0, right: 0,
              top: baseY + wobble,
              height: 1,
              background: 'rgba(255,120,0,0.04)',
            }} />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 211 + 83
    const chars = word.split('')

    const wrap = (children: React.ReactNode, extraStyle?: React.CSSProperties) => (
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', whiteSpace: 'nowrap', ...extraStyle }}>
        {children}
      </div>
    )

    if (phase === 'enter') {
      // High-latency rubber-band: each char overshoots then settles
      // Stagger chars — later chars arrive much later simulating lag spikes
      return wrap(
        chars.map((ch, ci) => {
          const lagDelay = rand(seed + ci * 41) * 0.5 // variable per-char lag
          const arrivalStart = ci / chars.length * 0.3 + lagDelay * 0.4
          const arrivalEnd = arrivalStart + 0.35
          const t = Math.max(0, Math.min(1, (enterProgress - arrivalStart) / (arrivalEnd - arrivalStart)))
          const elastic = elasticOut(t)
          const scale = 0.3 + elastic * 0.7
          const translateY = (1 - elastic) * -40
          return (
            <span
              key={ci}
              style={{
                display: 'inline-block',
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(36px, 10vw, 140px)',
                fontWeight: 700,
                color,
                opacity: t > 0 ? Math.min(1, t * 3) : 0,
                transform: `translateY(${translateY}px) scale(${scale})`,
                textShadow: `0 0 12px ${color}60`,
              }}
            >
              {ch}
            </span>
          )
        })
      )
    } else if (phase === 'hold') {
      // Rubber-band oscillation — whole word bobs with decaying amplitude
      const decay = Math.pow(0.3, holdProgress * 3)
      const bounce = Math.sin(holdProgress * Math.PI * 8) * decay * 12
      const scaleX = 1 + Math.sin(holdProgress * Math.PI * 8) * decay * 0.04
      return wrap(
        <span style={{
          display: 'inline-block',
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(36px, 10vw, 140px)',
          fontWeight: 700,
          color,
          transform: `translateY(${bounce}px) scaleX(${scaleX})`,
          textShadow: `0 0 10px ${color}40`,
        }}>
          {word}
        </span>
      )
    } else {
      // Exit: lag spike — word freezes, then teleports away
      const freeze = exitProgress < 0.5
      const teleport = !freeze
      const tp = (exitProgress - 0.5) / 0.5
      const stretchX = freeze ? 1 + exitProgress * 0.15 : 1 + (1 - tp) * 0.15
      const opacity = teleport ? Math.max(0, 1 - tp * 2) : 1
      const translateX = teleport ? tp * tp * 120 : 0
      return wrap(
        <span style={{
          display: 'inline-block',
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(36px, 10vw, 140px)',
          fontWeight: 700,
          color,
          opacity,
          transform: `translateX(${translateX}px) scaleX(${stretchX})`,
          textShadow: `0 0 8px ${color}30`,
        }}>
          {word}
        </span>
      )
    }
  },
}

function LatencySpikeComponent(props: MotionGraphicProps<LatencySpikeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-latency-spike',
  title: 'Kinetic Latency Spike',
  description: 'High-latency rubber-band effect — letters arrive with elastic overshoot stagger, oscillate to rest, exit with lag-freeze teleport',
  tags: ['kinetic', 'typography', 'latency', 'ping', 'rubber-band', 'network', 'lag', 'glitch', 'elastic'],
  category: 'captions',
  component: LatencySpikeComponent as any,
  defaultConfig: {
    words: ['LAGGING', 'RUBBER', 'JITTER', 'SPIKE'],
    colors: ['#FF6B35', '#FF4040', '#FF8C00', '#FF6B35'],
    bgColor: '#0A0500',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LAGGING', 'RUBBER', 'JITTER', 'SPIKE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6B35', '#FF4040', '#FF8C00', '#FF6B35'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0500', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.3, max: 5, group: 'Timing' },
  ],
})
