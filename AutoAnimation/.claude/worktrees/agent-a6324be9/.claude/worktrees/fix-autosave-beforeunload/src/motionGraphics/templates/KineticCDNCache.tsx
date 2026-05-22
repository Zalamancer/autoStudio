import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CDNCacheConfig extends KineticBaseConfig {
  staleWord: string
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const CDN_NODES = ['SFO', 'LHR', 'SIN', 'FRA', 'NRT', 'GRU']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const activeNode = Math.floor(time * 0.6) % CDN_NODES.length

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* CDN node indicators */}
        <div style={{
          position: 'absolute', top: 8, left: 10,
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          {CDN_NODES.map((node, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}>
              <div style={{
                width: 5, height: 5, borderRadius: '50%',
                background: i === activeNode
                  ? 'rgba(255,200,0,0.5)'
                  : i < activeNode
                  ? 'rgba(0,220,100,0.25)'
                  : 'rgba(255,255,255,0.08)',
              }} />
              <span style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 5,
                color: i === activeNode
                  ? 'rgba(255,200,0,0.35)'
                  : 'rgba(255,255,255,0.08)',
                letterSpacing: 0.5,
              }}>{node}</span>
            </div>
          ))}
        </div>
        {/* Cache-Control header */}
        <div style={{
          position: 'absolute', bottom: 10, left: 10,
          fontFamily: "'Courier New', monospace", fontSize: 7,
          color: 'rgba(255,200,0,0.12)', lineHeight: 1.7,
        }}>
          Cache-Control: max-age=3600<br />
          Age: {Math.floor(rand(Math.floor(time * 0.2)) * 3600)}s<br />
          X-Cache: {time % 4 < 2 ? 'HIT' : 'MISS'}
        </div>
        {/* ETag right */}
        <div style={{
          position: 'absolute', bottom: 10, right: 10,
          fontFamily: "'Courier New', monospace", fontSize: 7,
          color: 'rgba(255,200,0,0.10)', textAlign: 'right',
        }}>
          ETag: "{Array.from({ length: 8 }, (_, i) =>
            Math.floor(rand(i * 37 + Math.floor(time * 0.1)) * 16).toString(16)
          ).join('')}"
        </div>
        {/* Horizontal cache invalidation sweep line */}
        {(() => {
          const sweepT = (time * 0.4) % 1
          const sweepX = sweepT * width
          return sweepT < 0.95 ? (
            <div style={{
              position: 'absolute',
              left: sweepX,
              top: 0, bottom: 0,
              width: 1,
              background: 'rgba(255,200,0,0.06)',
            }} />
          ) : null
        })()}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 167 + 31

    // CDN cache pattern: enter shows "stale" version (slightly off-color, degraded),
    // mid-enter invalidates and the fresh version replaces it with a wipe
    const STALE_CHARS = word.split('').map((ch, ci) => {
      // Stale version: some chars are slightly wrong (off by one in alphabet)
      const isStale = rand(seed + ci * 43) < 0.3
      if (!isStale) return ch
      const code = ch.charCodeAt(0)
      if (code >= 65 && code <= 90) return String.fromCharCode(65 + (code - 65 + 1) % 26)
      return ch
    })

    const wrap = (content: React.ReactNode) => (
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', whiteSpace: 'nowrap', textAlign: 'center' }}>
        {content}
      </div>
    )

    if (phase === 'enter') {
      // 0..0.4: stale content loads in (faded, slightly wrong chars)
      // 0.4..0.6: CDN invalidation — horizontal wipe erases stale
      // 0.6..1.0: fresh content wipes in
      const staleLoad = Math.min(1, enterProgress / 0.4)
      const invalidating = enterProgress > 0.4 && enterProgress < 0.65
      const invalidateProgress = invalidating ? (enterProgress - 0.4) / 0.25 : enterProgress > 0.65 ? 1 : 0
      const freshLoad = enterProgress > 0.6 ? Math.min(1, (enterProgress - 0.6) / 0.4) : 0
      const freshWipeX = freshLoad * 100 // percent width revealed

      const chars = word.split('')

      return wrap(
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {/* Stale layer */}
          <div style={{
            position: 'relative',
            opacity: staleLoad * (1 - invalidateProgress),
          }}>
            {chars.map((ch, ci) => (
              <span key={ci} style={{
                display: 'inline-block',
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(36px, 10vw, 140px)',
                fontWeight: 700,
                color: 'rgba(180,150,50,0.6)',
                textDecoration: invalidating ? 'line-through' : 'none',
              }}>
                {STALE_CHARS[ci]}
              </span>
            ))}
          </div>
          {/* Fresh layer — wipes in over stale */}
          {freshLoad > 0 && (
            <div style={{
              position: 'absolute', top: 0, left: 0,
              overflow: 'hidden',
              width: `${freshWipeX}%`,
            }}>
              <span style={{
                display: 'inline-block',
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(36px, 10vw, 140px)',
                fontWeight: 700,
                color,
                whiteSpace: 'nowrap',
                textShadow: `0 0 12px ${color}50`,
              }}>
                {word}
              </span>
            </div>
          )}
          {/* Invalidation sweep line */}
          {invalidating && (
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              left: `${invalidateProgress * 100}%`,
              width: 2,
              background: 'rgba(255,200,0,0.6)',
              boxShadow: '0 0 8px rgba(255,200,0,0.4)',
            }} />
          )}
          {/* Cache status label */}
          <div style={{
            marginTop: 6,
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: freshLoad > 0.5
              ? `${color}60`
              : invalidating
              ? 'rgba(255,200,0,0.5)'
              : 'rgba(180,150,50,0.35)',
            letterSpacing: 2,
            textAlign: 'center',
          }}>
            {freshLoad > 0.8 ? 'CACHE: FRESH' : invalidating ? 'INVALIDATING...' : 'CACHE: STALE'}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      const pulse = 0.85 + Math.sin(holdProgress * Math.PI * 2) * 0.15
      return wrap(
        <div style={{ textAlign: 'center' }}>
          <span style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 10vw, 140px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 ${8 * pulse}px ${color}40`,
            whiteSpace: 'nowrap',
          }}>
            {word}
          </span>
          <div style={{
            marginTop: 6, fontFamily: "'Courier New', monospace", fontSize: 9,
            color: `${color}50`, letterSpacing: 2,
          }}>
            X-Cache: HIT
          </div>
        </div>
      )
    } else {
      // Exit: cache eviction — text pixelates and dissolves
      return wrap(
        <div style={{ textAlign: 'center', opacity: 1 - exitProgress }}>
          <span style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 10vw, 140px)',
            fontWeight: 700,
            color,
            filter: `blur(${exitProgress * 4}px)`,
            whiteSpace: 'nowrap',
          }}>
            {word}
          </span>
          <div style={{
            marginTop: 6, fontFamily: "'Courier New', monospace", fontSize: 9,
            color: 'rgba(255,200,0,0.3)', letterSpacing: 2,
          }}>
            EVICTED
          </div>
        </div>
      )
    }
  },
}

function CDNCacheComponent(props: MotionGraphicProps<CDNCacheConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cdn-cache',
  title: 'Kinetic CDN Cache',
  description: 'CDN cache invalidation — stale cached text loads first then a wipe sweep replaces it with fresh content, with X-Cache headers',
  tags: ['kinetic', 'typography', 'cdn', 'cache', 'invalidate', 'network', 'http', 'stale', 'fresh', 'glitch'],
  category: 'captions',
  component: CDNCacheComponent as any,
  defaultConfig: {
    words: ['STALE', 'PURGE', 'REFRESH', 'CACHED'],
    colors: ['#FFCC00', '#FFD740', '#FFCC00', '#FFA500'],
    bgColor: '#080600',
    cycleDuration: 2.0,
    staleWord: '',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['STALE', 'PURGE', 'REFRESH', 'CACHED'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFCC00', '#FFD740', '#FFCC00', '#FFA500'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080600', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 5, group: 'Timing' },
  ],
})
