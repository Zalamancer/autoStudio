import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CDNPropagationConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// CDN edge propagation: content propagates from origin → edge nodes
// Each character represents a different CDN edge node receiving the update
// Nodes light up as they receive the propagated content

const CDN_REGIONS = ['US-EAST', 'US-WEST', 'EU-WEST', 'AP-SE', 'SA-EAST', 'ME-NORTH']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    const w = width ?? 400
    const h = height ?? 700

    // Node positions (simplified world map layout)
    const nodes = [
      { x: 0.15, y: 0.4, region: 'NY' },
      { x: 0.08, y: 0.45, region: 'LA' },
      { x: 0.35, y: 0.35, region: 'LO' },
      { x: 0.42, y: 0.38, region: 'FR' },
      { x: 0.65, y: 0.45, region: 'SG' },
      { x: 0.75, y: 0.42, region: 'TK' },
      { x: 0.2, y: 0.65, region: 'SP' },
      { x: 0.55, y: 0.3, region: 'DU' },
    ]

    const propagationWave = (time * 0.4) % 1

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Placeholder for connection lines */}
        {/* CDN nodes */}
        {nodes.map((n, ni) => {
          const dist = Math.sqrt(Math.pow(n.x - 0.15, 2) + Math.pow(n.y - 0.4, 2))
          const received = propagationWave > dist * 0.6
          const pulse = received && Math.sin(time * 3 + ni) > 0.8
          return (
            <div
              key={ni}
              style={{
                position: 'absolute',
                left: n.x * w - 3,
                top: n.y * h - 3,
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: received ? (pulse ? '#ffffff' : 'rgba(100,200,255,0.6)') : 'rgba(100,100,150,0.25)',
                boxShadow: received ? `0 0 8px rgba(100,200,255,0.5)` : 'none',
              }}
            />
          )
        })}
        {/* Region labels */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 7,
            color: 'rgba(100,200,255,0.2)',
            letterSpacing: 0.5,
          }}
        >
          ORIGIN → {CDN_REGIONS[Math.floor(time * 0.8) % CDN_REGIONS.length]} propagating...
        </div>
        {/* TTL readout */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 7,
            color: 'rgba(100,200,255,0.15)',
          }}
        >
          TTL: {Math.floor(3600 - (time % 3600))}s CACHE: {Math.floor(80 + Math.sin(time * 0.3) * 15)}% HIT
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 179 + 49
    const chars = word.split('')

    // Each character = a CDN edge node
    // Propagation wave moves left to right, lighting up each node/char

    if (phase === 'enter') {
      // Propagation wave: chars light up as wave reaches them
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 10vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            display: 'flex',
          }}
        >
          {chars.map((ch, ci) => {
            const nodePos = ci / (chars.length - 1 || 1)
            const waveArrival = nodePos * 0.7 // wave arrives at 70% of enter
            const received = enterProgress > waveArrival
            const receivedProgress = received ? Math.min(1, (enterProgress - waveArrival) / 0.2) : 0
            // Brief flash on arrival
            const arrivalFlash = received && receivedProgress < 0.15

            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  color: arrivalFlash ? '#FFFFFF' : color,
                  opacity: received ? 0.3 + receivedProgress * 0.7 : 0.08,
                  textShadow: arrivalFlash
                    ? `0 0 20px ${color}, 0 0 40px ${color}`
                    : received
                      ? `0 0 8px ${color}60`
                      : 'none',
                  transform: received ? 'none' : 'scale(0.8)',
                }}
              >
                {ch}
              </span>
            )
          })}
        </div>
      )
    }

    if (phase === 'hold') {
      // Cache invalidation: random node gets a cache miss — flickers to stale content
      const staleMoment = holdProgress > 0.4 && holdProgress < 0.47
      const staleChar = Math.floor(rand(seed + Math.floor(holdProgress * 10)) * chars.length)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 10vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            display: 'flex',
          }}
        >
          {chars.map((ch, ci) => {
            const isStaleMiss = staleMoment && ci === staleChar
            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  color: isStaleMiss ? 'rgba(200,200,200,0.4)' : color,
                  textShadow: isStaleMiss ? 'none' : `0 0 6px ${color}40`,
                  // Stale node: shows dimmed (old cached version)
                  filter: isStaleMiss ? 'blur(0.5px)' : 'none',
                }}
              >
                {ch}
              </span>
            )
          })}
        </div>
      )
    }

    // Exit: cache expiry — nodes go dark one by one as TTL expires
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(36px, 10vw, 150px)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          letterSpacing: 3,
          display: 'flex',
        }}
      >
        {chars.map((ch, ci) => {
          const ttlExpire = (ci / chars.length) * 0.8
          const expired = exitProgress > ttlExpire
          return (
            <span
              key={ci}
              style={{
                display: 'inline-block',
                color,
                opacity: expired ? Math.max(0, 1 - (exitProgress - ttlExpire) * 3) : 1,
                textShadow: `0 0 6px ${color}30`,
              }}
            >
              {ch}
            </span>
          )
        })}
      </div>
    )
  },
}

function CDNPropagationComponent(props: MotionGraphicProps<CDNPropagationConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cdn-propagation',
  title: 'Kinetic CDN Propagation',
  description:
    'CDN edge propagation — each character lights up as content wave propagates from origin server to edge nodes, with cache hit rate and TTL countdown',
  tags: ['kinetic', 'typography', 'network', 'cdn', 'propagation', 'cache', 'edge', 'digital', 'server'],
  category: 'captions',
  component: CDNPropagationComponent as any,
  defaultConfig: {
    words: ['DEPLOY', 'PROPAGATE', 'CACHE', 'EDGE'],
    colors: ['#44DDFF', '#22CCEE', '#55EEFF', '#33BBDD'],
    bgColor: '#000c10',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['DEPLOY', 'PROPAGATE', 'CACHE', 'EDGE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#44DDFF', '#22CCEE', '#55EEFF', '#33BBDD'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000c10', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
