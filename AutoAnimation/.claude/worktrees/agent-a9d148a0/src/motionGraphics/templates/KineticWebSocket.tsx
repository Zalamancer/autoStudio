import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WebSocketConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const WS_EVENTS = [
  'CONNECTING',
  'OPEN',
  'SEND: ping',
  'RECV: pong',
  'MESSAGE',
  'RECV: data',
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const eventIdx = Math.floor(time * 1.0) % WS_EVENTS.length
    const isConnected = eventIdx >= 1

    // WebSocket frame bytes scrolling in background (opcode + payload)
    const frameBytes = Array.from({ length: 12 }, (_, i) =>
      Math.floor(rand(i * 73 + Math.floor(time * 8)) * 256)
        .toString(16).padStart(2, '0').toUpperCase()
    )

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* WS connection status top-left */}
        <div style={{
          position: 'absolute', top: 8, left: 10,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {/* Connection pulse dot */}
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: isConnected
              ? `rgba(0,220,100,${0.4 + Math.sin(time * 4) * 0.2})`
              : 'rgba(255,200,0,0.3)',
            boxShadow: isConnected
              ? `0 0 6px rgba(0,220,100,0.4)`
              : 'none',
          }} />
          <span style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 7, letterSpacing: 1,
            color: isConnected ? 'rgba(0,220,100,0.25)' : 'rgba(255,200,0,0.25)',
          }}>
            WS {isConnected ? 'OPEN' : 'CONNECTING...'}
          </span>
        </div>
        {/* Event log */}
        <div style={{
          position: 'absolute', top: 24, left: 10,
          fontFamily: "'Courier New', monospace", fontSize: 7,
          lineHeight: 1.7,
        }}>
          {WS_EVENTS.slice(0, eventIdx + 1).map((evt, i) => (
            <div key={i} style={{
              color: i === eventIdx
                ? 'rgba(0,220,100,0.22)'
                : 'rgba(0,220,100,0.08)',
            }}>
              [{((time - (eventIdx - i) * 1.0) % 60).toFixed(2)}] {evt}
            </div>
          ))}
        </div>
        {/* WS frame hex right side */}
        <div style={{
          position: 'absolute', top: 8, right: 10,
          fontFamily: "'Courier New', monospace",
          fontSize: 6, letterSpacing: 1.5,
          color: 'rgba(0,200,120,0.10)',
          textAlign: 'right', lineHeight: 1.6,
        }}>
          FIN=1 OP=0x{Math.floor(rand(Math.floor(time * 3)) * 10).toString(16)}<br />
          MASK={frameBytes.slice(0, 4).join(' ')}<br />
          {frameBytes.slice(4, 8).join(' ')}<br />
          {frameBytes.slice(8, 12).join(' ')}
        </div>
        {/* Heartbeat waveform bottom */}
        <div style={{
          position: 'absolute', bottom: 10, left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'flex-end', gap: 1,
          height: 16,
        }}>
          {Array.from({ length: 24 }, (_, i) => {
            const t = (time * 12 - i) % 24
            const isHeartbeat = (i % 6 === 0)
            const h = isHeartbeat ? 14 : 3 + rand(i * 53 + Math.floor(time * 6)) * 5
            return (
              <div key={i} style={{
                width: 2, height: h,
                background: isHeartbeat
                  ? 'rgba(0,220,100,0.35)'
                  : 'rgba(0,200,120,0.12)',
                borderRadius: 1,
                alignSelf: 'flex-end',
              }} />
            )
          })}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 163 + 41
    const chars = word.split('')

    const wrap = (content: React.ReactNode) => (
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', whiteSpace: 'nowrap', textAlign: 'center' }}>
        {content}
      </div>
    )

    if (phase === 'enter') {
      // WebSocket real-time stream: chars arrive one-by-one at uniform intervals
      // with a blinking cursor at the insertion point
      const charsRevealed = enterProgress * chars.length
      const fullCharsCount = Math.floor(charsRevealed)
      const cursorVisible = Math.floor(f * 0.4) % 2 === 0

      return wrap(
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {chars.map((ch, ci) => {
            const revealed = ci < fullCharsCount
            const isCurrent = ci === fullCharsCount
            return (
              <span key={ci} style={{ position: 'relative', display: 'inline-block' }}>
                {/* Cursor before current char */}
                {isCurrent && cursorVisible && (
                  <span style={{
                    position: 'absolute',
                    left: 0, top: 0, bottom: 0,
                    width: 3,
                    background: color,
                    opacity: 0.8,
                    boxShadow: `0 0 6px ${color}`,
                  }} />
                )}
                <span style={{
                  display: 'inline-block',
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(36px, 10vw, 140px)',
                  fontWeight: 700,
                  color: revealed ? color : 'transparent',
                  textShadow: revealed ? `0 0 8px ${color}50` : 'none',
                  opacity: revealed ? 1 : 0,
                }}>
                  {ch}
                </span>
              </span>
            )
          })}
          {/* Trailing cursor after last char */}
          {fullCharsCount >= chars.length && cursorVisible && (
            <span style={{
              display: 'inline-block',
              width: 3,
              height: 'clamp(30px, 8vw, 110px)',
              background: color,
              opacity: 0.8,
              verticalAlign: 'middle',
              boxShadow: `0 0 6px ${color}`,
              marginLeft: 4,
            }} />
          )}
        </div>
      )
    } else if (phase === 'hold') {
      // Live — cursor blinks at end, subtle ping-pong glow
      const cursorOn = Math.floor(f * 0.35) % 2 === 0
      const pulse = 0.85 + Math.sin(holdProgress * Math.PI * 3) * 0.15
      return wrap(
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 10vw, 140px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 ${8 * pulse}px ${color}50`,
          }}>
            {word}
          </span>
          {cursorOn && (
            <span style={{
              display: 'inline-block',
              width: 3,
              height: 'clamp(30px, 8vw, 110px)',
              background: color,
              opacity: 0.7,
              verticalAlign: 'middle',
              boxShadow: `0 0 6px ${color}`,
              marginLeft: 4,
            }} />
          )}
        </div>
      )
    } else {
      // Exit: WebSocket close frame — chars vanish right to left (connection draining)
      return wrap(
        chars.map((ch, ci) => {
          const vanishAt = (chars.length - 1 - ci) / chars.length * 0.8
          const t = Math.max(0, Math.min(1, (exitProgress - vanishAt) / 0.2))
          return (
            <span key={ci} style={{
              display: 'inline-block',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 10vw, 140px)',
              fontWeight: 700,
              color,
              opacity: 1 - t,
              transform: `translateY(${t * 10}px)`,
            }}>
              {ch}
            </span>
          )
        })
      )
    }
  },
}

function WebSocketComponent(props: MotionGraphicProps<WebSocketConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-websocket',
  title: 'Kinetic WebSocket',
  description: 'WebSocket real-time stream — text chars stream in one-by-one with blinking cursor, WS event log, heartbeat waveform, frame hex overlay',
  tags: ['kinetic', 'typography', 'websocket', 'stream', 'realtime', 'network', 'cursor', 'terminal', 'protocol', 'live'],
  category: 'captions',
  component: WebSocketComponent as any,
  defaultConfig: {
    words: ['STREAM', 'LIVE', 'SOCKET', 'PUSH'],
    colors: ['#00DC82', '#00FF96', '#00DC82', '#64FFB4'],
    bgColor: '#020A06',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['STREAM', 'LIVE', 'SOCKET', 'PUSH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00DC82', '#00FF96', '#00DC82', '#64FFB4'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020A06', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
  ],
})
