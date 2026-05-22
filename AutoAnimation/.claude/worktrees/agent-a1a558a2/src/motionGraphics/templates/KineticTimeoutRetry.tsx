import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TimeoutRetryConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Simulate a progress bar fill 0..1 that stalls and resets */
function timeoutBar(progress: number, attemptCount: number): { fill: number; attempt: number; timedOut: boolean } {
  // Each attempt occupies 1/attemptCount of the enter phase
  // Attempts 0..attemptCount-2 stall at ~80% and reset; last one succeeds
  const attemptDuration = 1 / attemptCount
  const attempt = Math.min(attemptCount - 1, Math.floor(progress / attemptDuration))
  const attemptProgress = (progress - attempt * attemptDuration) / attemptDuration
  const isLastAttempt = attempt === attemptCount - 1
  const stallPoint = 0.8
  let fill: number
  let timedOut = false
  if (isLastAttempt) {
    fill = attemptProgress
  } else if (attemptProgress >= stallPoint) {
    fill = stallPoint + (attemptProgress - stallPoint) * 0.05 // creeps barely
    timedOut = attemptProgress > 0.9
  } else {
    fill = attemptProgress
  }
  return { fill, attempt: attempt + 1, timedOut }
}

const ATTEMPT_COUNT = 3

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Rotating timeout spinner top-left */}
        <div style={{
          position: 'absolute', top: 10, left: 12,
          fontFamily: "'Courier New', monospace", fontSize: 8,
          color: 'rgba(255,100,60,0.18)',
          transform: `rotate(${(time * 120) % 360}deg)`,
          width: 12, height: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          /
        </div>
        {/* Request log */}
        <div style={{
          position: 'absolute', top: 8, left: 30,
          fontFamily: "'Courier New', monospace", fontSize: 7,
          color: 'rgba(255,100,60,0.15)', lineHeight: 1.7,
        }}>
          GET / HTTP/1.1<br />
          Host: api.example.com<br />
          Timeout: 30s
        </div>
        {/* Error code top right */}
        <div style={{
          position: 'absolute', top: 8, right: 10,
          fontFamily: "'Courier New', monospace", fontSize: 8,
          color: 'rgba(255,60,60,0.18)', textAlign: 'right', lineHeight: 1.6,
        }}>
          ERR_TIMED_OUT<br />
          ECONNRESET<br />
          {Math.floor(rand(Math.floor(time * 0.5)) * 3 + 1)}/{ATTEMPT_COUNT} RETRIES
        </div>
        {/* Connection attempt dots */}
        <div style={{
          position: 'absolute', bottom: 10, left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', gap: 6, alignItems: 'center',
        }}>
          {Array.from({ length: ATTEMPT_COUNT }, (_, i) => {
            const attempt = Math.floor(time * 1.2)
            const isPast = i < attempt
            const isCurrent = i === attempt % ATTEMPT_COUNT
            return (
              <div key={i} style={{
                width: 5, height: 5, borderRadius: '50%',
                background: isPast
                  ? 'rgba(255,60,60,0.25)'
                  : isCurrent
                  ? 'rgba(255,150,60,0.30)'
                  : 'rgba(255,255,255,0.06)',
              }} />
            )
          })}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 181 + 53

    const wrap = (content: React.ReactNode, extraStyle?: React.CSSProperties) => (
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', whiteSpace: 'nowrap', width: '80%', ...extraStyle }}>
        {content}
      </div>
    )

    if (phase === 'enter') {
      const { fill, attempt, timedOut } = timeoutBar(enterProgress, ATTEMPT_COUNT)
      const isSuccess = attempt === ATTEMPT_COUNT && fill > 0.9
      const barColor = isSuccess ? color : timedOut ? '#FF3C3C' : '#FF8C3C'
      const opacity = isSuccess ? 1 : 0.3

      return wrap(
        <div style={{ textAlign: 'center' }}>
          {/* The text — partially revealed based on fill */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* Gray ghost text */}
            <span style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 10vw, 140px)',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.08)',
              whiteSpace: 'nowrap',
            }}>
              {word}
            </span>
            {/* Revealed portion clipped by fill */}
            <div style={{
              position: 'absolute', inset: 0,
              overflow: 'hidden',
              width: `${fill * 100}%`,
            }}>
              <span style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(36px, 10vw, 140px)',
                fontWeight: 700,
                color: barColor,
                whiteSpace: 'nowrap',
                textShadow: isSuccess ? `0 0 12px ${color}60` : `0 0 8px ${barColor}50`,
              }}>
                {word}
              </span>
            </div>
          </div>
          {/* Status bar */}
          <div style={{
            marginTop: 8,
            height: 3,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${fill * 100}%`,
              background: barColor,
              borderRadius: 2,
              boxShadow: `0 0 6px ${barColor}80`,
            }} />
          </div>
          {/* Attempt counter */}
          <div style={{
            marginTop: 4,
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: timedOut ? 'rgba(255,60,60,0.5)' : 'rgba(255,140,60,0.4)',
            letterSpacing: 2,
          }}>
            {timedOut ? 'TIMEOUT — RETRY ' + attempt + '/' + ATTEMPT_COUNT : 'ATTEMPT ' + attempt + '/' + ATTEMPT_COUNT}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Success — bright stable text with success glow
      const pulse = 0.85 + Math.sin(holdProgress * Math.PI * 2) * 0.15
      return wrap(
        <div style={{ textAlign: 'center' }}>
          <span style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 10vw, 140px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 ${10 * pulse}px ${color}60, 0 0 30px ${color}20`,
            whiteSpace: 'nowrap',
          }}>
            {word}
          </span>
          <div style={{
            marginTop: 8,
            height: 3,
            background: color,
            borderRadius: 2,
            opacity: 0.3,
            boxShadow: `0 0 6px ${color}`,
          }} />
          <div style={{
            marginTop: 4,
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: `${color}60`,
            letterSpacing: 2,
          }}>
            200 OK
          </div>
        </div>
      )
    } else {
      // Exit: connection close — text drains out via bar depleting
      const drain = exitProgress
      return wrap(
        <div style={{ textAlign: 'center', opacity: 1 - drain * 0.9 }}>
          <span style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 10vw, 140px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
          }}>
            {word}
          </span>
          <div style={{
            marginTop: 8, height: 3,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 2, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${(1 - drain) * 100}%`,
              background: color,
              borderRadius: 2,
              marginLeft: 'auto',
            }} />
          </div>
        </div>
      )
    }
  },
}

function TimeoutRetryComponent(props: MotionGraphicProps<TimeoutRetryConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-timeout-retry',
  title: 'Kinetic Timeout Retry',
  description: 'Connection timeout & retry logic — text loads via progress bar, stalls, times out with ERR_TIMED_OUT, retries, finally succeeds',
  tags: ['kinetic', 'typography', 'timeout', 'retry', 'http', 'network', 'loading', 'error', 'glitch', 'protocol'],
  category: 'captions',
  component: TimeoutRetryComponent as any,
  defaultConfig: {
    words: ['CONNECT', 'TIMEOUT', 'RETRY', 'SUCCESS'],
    colors: ['#FF6B35', '#FF3C3C', '#FF8C3C', '#00DC82'],
    bgColor: '#080302',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CONNECT', 'TIMEOUT', 'RETRY', 'SUCCESS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6B35', '#FF3C3C', '#FF8C3C', '#00DC82'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080302', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 5, group: 'Timing' },
  ],
})
