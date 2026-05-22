import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DNSResolveConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Pick a "DNS gibberish" char from domain-like character set */
function dnsGibberish(seed: number): string {
  const charset = 'xvkqzwjmfp0123456789-_.abcde'
  return charset[Math.floor(rand(seed) * charset.length)]
}

const DNS_STEPS = [
  'QUERYING ROOT NS...',
  'ITERATING TLD...',
  'RESOLVING AUTH NS...',
  'A RECORD FOUND',
  'TTL: 300s',
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const stepIdx = Math.min(DNS_STEPS.length - 1, Math.floor(time * 1.5))

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* DNS resolution log on left edge */}
        <div style={{
          position: 'absolute', top: 12, left: 10,
          fontFamily: "'Courier New', monospace", fontSize: 7,
          color: 'rgba(100,200,255,0.15)', lineHeight: 1.8,
        }}>
          {DNS_STEPS.slice(0, stepIdx + 1).map((step, i) => (
            <div key={i} style={{ color: i === stepIdx ? 'rgba(100,200,255,0.22)' : 'rgba(100,200,255,0.08)' }}>
              &gt; {step}
            </div>
          ))}
        </div>
        {/* IP address resolving bottom right */}
        <div style={{
          position: 'absolute', bottom: 10, right: 10,
          fontFamily: "'Courier New', monospace", fontSize: 7,
          color: 'rgba(0,255,150,0.15)', textAlign: 'right', lineHeight: 1.6,
        }}>
          {Math.floor(rand(Math.floor(time * 0.3)) * 223 + 10)}.
          {Math.floor(rand(Math.floor(time * 0.3) + 1) * 254)}.
          {Math.floor(rand(Math.floor(time * 0.3) + 2) * 254)}.
          {Math.floor(rand(Math.floor(time * 0.3) + 3) * 254)}<br />
          CNAME CHAIN: {Math.floor(rand(Math.floor(time)) * 4 + 1)}
        </div>
        {/* Nameserver hops as faint horizontal connections */}
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: width * 0.1,
            top: height * 0.25 + i * height * 0.15,
            width: width * 0.8,
            height: 1,
            background: `rgba(100,200,255,${0.02 + (i <= stepIdx ? 0.04 : 0)})`,
          }} />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 157 + 23
    const chars = word.split('')

    const wrap = (content: React.ReactNode) => (
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', whiteSpace: 'nowrap' }}>
        {content}
      </div>
    )

    if (phase === 'enter') {
      // DNS lookup: show gibberish domain chars first, gradually resolve each char to correct letter
      // Each char resolves at a slightly different time
      return wrap(
        chars.map((ch, ci) => {
          const resolveStart = ci / chars.length * 0.5
          const resolveEnd = resolveStart + 0.3
          const t = Math.max(0, Math.min(1, (enterProgress - resolveStart) / (resolveEnd - resolveStart)))

          // Before resolve: show cycling gibberish
          // During: flicker between gibberish and real char
          // After: show real char
          let displayChar: string
          if (t >= 1) {
            displayChar = ch
          } else if (t > 0) {
            // Flickering phase — deterministic based on frame
            const flickerRate = Math.floor(f * 0.4 + ci * 7)
            displayChar = flickerRate % 3 === 0 ? ch : dnsGibberish(seed + ci * 31 + flickerRate)
          } else {
            displayChar = dnsGibberish(seed + ci * 17 + Math.floor(f * 0.3 + ci))
          }

          const isResolved = t >= 1
          const isResolving = t > 0 && t < 1

          return (
            <span
              key={ci}
              style={{
                display: 'inline-block',
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(36px, 10vw, 140px)',
                fontWeight: 700,
                color: isResolved ? color : isResolving ? `rgba(100,200,255,0.9)` : 'rgba(80,160,200,0.5)',
                textShadow: isResolved
                  ? `0 0 10px ${color}50`
                  : isResolving
                  ? '0 0 6px rgba(100,200,255,0.4)'
                  : 'none',
              }}
            >
              {displayChar}
            </span>
          )
        })
      )
    } else if (phase === 'hold') {
      // Stable resolved text — very occasional single char briefly re-queries (TTL expiry flicker)
      return wrap(
        chars.map((ch, ci) => {
          const ttlExpiry = rand(seed + ci * 73 + Math.floor(holdProgress * 6)) < 0.03
          const displayChar = ttlExpiry ? dnsGibberish(seed + ci + f) : ch
          return (
            <span
              key={ci}
              style={{
                display: 'inline-block',
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(36px, 10vw, 140px)',
                fontWeight: 700,
                color: ttlExpiry ? 'rgba(100,200,255,0.7)' : color,
                textShadow: `0 0 8px ${color}30`,
              }}
            >
              {displayChar}
            </span>
          )
        })
      )
    } else {
      // Exit: NXDOMAIN — chars dissolve back to gibberish
      return wrap(
        chars.map((ch, ci) => {
          const dissolveStart = ci / chars.length * 0.5
          const t = Math.max(0, Math.min(1, (exitProgress - dissolveStart) / 0.5))
          const dissolved = t > 0.7
          const flickerRate = Math.floor(f * 0.5 + ci * 11)
          const displayChar = t > 0.3
            ? (flickerRate % 3 === 0 ? ch : dnsGibberish(seed + ci * 19 + flickerRate))
            : ch

          return (
            <span
              key={ci}
              style={{
                display: 'inline-block',
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(36px, 10vw, 140px)',
                fontWeight: 700,
                color: dissolved ? 'rgba(100,200,255,0.3)' : color,
                opacity: 1 - t * 0.9,
              }}
            >
              {displayChar}
            </span>
          )
        })
      )
    }
  },
}

function DNSResolveComponent(props: MotionGraphicProps<DNSResolveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dns-resolve',
  title: 'Kinetic DNS Resolve',
  description: 'DNS lookup animation — gibberish domain characters resolve letter-by-letter to readable text as nameserver queries complete',
  tags: ['kinetic', 'typography', 'dns', 'network', 'resolve', 'domain', 'glitch', 'protocol', 'internet'],
  category: 'captions',
  component: DNSResolveComponent as any,
  defaultConfig: {
    words: ['RESOLVE', 'LOOKUP', 'NXDOMAIN', 'CACHED'],
    colors: ['#64C8FF', '#00FF96', '#64C8FF', '#FFCC00'],
    bgColor: '#020810',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RESOLVE', 'LOOKUP', 'NXDOMAIN', 'CACHED'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#64C8FF', '#00FF96', '#64C8FF', '#FFCC00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020810', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.3, max: 5, group: 'Timing' },
  ],
})
