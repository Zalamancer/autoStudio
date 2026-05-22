import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WebSocketReconnectConfig extends KineticBaseConfig {}

// WebSocket reconnection: connection drops, exponential backoff, reconnect
// Text pulses with connection state: disconnected → connecting → connected
// Heartbeat ping/pong visible as animated dots

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Connection state machine simulation
    const cycle = time % 6
    const wsState = cycle < 0.5 ? 'CLOSED' : cycle < 1.5 ? 'CONNECTING' : cycle < 5 ? 'OPEN' : 'CLOSING'
    const retryCount = Math.floor(time / 6)

    // Heartbeat dots
    const heartbeatVisible = wsState === 'OPEN'
    const heartbeatPhase = (time % 2) / 2

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* WS state indicator */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background:
                wsState === 'OPEN'
                  ? 'rgba(100,255,100,0.6)'
                  : wsState === 'CONNECTING'
                    ? 'rgba(255,200,0,0.6)'
                    : 'rgba(255,60,60,0.5)',
            }}
          />
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 8,
              color:
                wsState === 'OPEN'
                  ? 'rgba(100,255,100,0.35)'
                  : wsState === 'CONNECTING'
                    ? 'rgba(255,200,0,0.35)'
                    : 'rgba(255,60,60,0.3)',
              letterSpacing: 1,
            }}
          >
            WS: {wsState}
          </div>
        </div>
        {/* Heartbeat ping/pong */}
        {heartbeatVisible && (
          <div
            style={{
              position: 'absolute',
              top: 22,
              left: 10,
              fontFamily: "'Courier New', monospace",
              fontSize: 7,
              color: 'rgba(100,255,100,0.2)',
            }}
          >
            {heartbeatPhase < 0.5 ? '→ ping' : '← pong'} {Math.floor(heartbeatPhase * 200) % 100}ms
          </div>
        )}
        {/* Retry counter */}
        {retryCount > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              right: 10,
              fontFamily: "'Courier New', monospace",
              fontSize: 7,
              color: 'rgba(255,200,0,0.25)',
            }}
          >
            reconnect #{retryCount} backoff: {Math.min(30, 2 ** Math.min(retryCount, 5))}s
          </div>
        )}
        {/* Frame separator */}
        <div
          style={{
            position: 'absolute',
            bottom: 22,
            left: 10,
            right: 10,
            height: 1,
            background: wsState === 'OPEN' ? 'rgba(100,255,100,0.06)' : 'rgba(255,80,80,0.04)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    // WebSocket message frames arrive as text
    // Each char = a WebSocket message frame arriving

    if (phase === 'enter') {
      // Reconnection sequence: connecting → each char arrives as a ws frame
      const chars = word.split('')
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
            // Exponential backoff: early chars arrive after a delay
            const arrivalDelay = (ci / chars.length) * 0.6
            const charProgress = Math.max(0, Math.min(1, (enterProgress - arrivalDelay) / 0.3))
            // Each frame arrives with a brief "received" flash
            const justArrived = charProgress > 0 && charProgress < 0.2

            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  color: justArrived ? '#AAFFAA' : color,
                  opacity: charProgress,
                  textShadow: justArrived ? '0 0 15px #AAFFAA, 0 0 30px #AAFFAA' : `0 0 8px ${color}40`,
                  transform: charProgress < 1 ? `translateX(${(1 - charProgress) * -10}px)` : 'none',
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
      // Heartbeat pulse: periodic ping makes text pulse slightly
      const heartbeatPhase = (holdProgress * 2) % 1
      const heartbeatPulse = Math.max(0, Math.sin(heartbeatPhase * Math.PI * 2) * 0.08)

      // Connection drop mid-hold
      const dropMoment = holdProgress > 0.5 && holdProgress < 0.58
      const dropIntensity = dropMoment ? Math.sin(((holdProgress - 0.5) / 0.08) * Math.PI) : 0

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${1 + heartbeatPulse})`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 10vw, 150px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            opacity: 1 - dropIntensity * 0.7,
            filter: dropMoment ? `blur(${dropIntensity * 2}px)` : 'none',
            textShadow: `0 0 ${8 + heartbeatPulse * 20}px ${color}50`,
          }}
        >
          {word}
        </div>
      )
    }

    // Exit: connection closes — frames drain out
    const chars = word.split('')
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
          opacity: 1 - exitProgress * 0.9,
        }}
      >
        {chars.map((ch, ci) => {
          const drainAt = (ci / chars.length) * 0.7
          const drained = exitProgress > drainAt
          return (
            <span
              key={ci}
              style={{
                display: 'inline-block',
                color,
                opacity: drained ? Math.max(0, 1 - (exitProgress - drainAt) * 3) : 1,
                transform: drained ? `translateX(${(exitProgress - drainAt) * 20}px)` : 'none',
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

function WebSocketReconnectComponent(props: MotionGraphicProps<WebSocketReconnectConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-websocket-reconnect',
  title: 'Kinetic WebSocket Reconnect',
  description:
    'WebSocket reconnection sequence — chars arrive as ws message frames with exponential backoff, heartbeat pulse, and connection state indicator',
  tags: ['kinetic', 'typography', 'network', 'websocket', 'reconnect', 'backoff', 'realtime', 'digital', 'protocol'],
  category: 'captions',
  component: WebSocketReconnectComponent as any,
  defaultConfig: {
    words: ['CONNECT', 'PING', 'PONG', 'LIVE'],
    colors: ['#66FF88', '#44EE66', '#77FF99', '#55FF77'],
    bgColor: '#000a04',
    cycleDuration: 1.4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['CONNECT', 'PING', 'PONG', 'LIVE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#66FF88', '#44EE66', '#77FF99', '#55FF77'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000a04', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
