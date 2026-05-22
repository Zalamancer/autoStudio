import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RateLimitedConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const BUCKET_SIZE = 10
// Token bucket: replenish rate per second
const REPLENISH_RATE = 2

/** Get token bucket fill level 0..1 at given time, deterministic */
function tokenBucket(time: number): number {
  // Starts full, drains during burst, refills slowly
  const drainPeriod = 3.0
  const cycleT = time % drainPeriod
  if (cycleT < 1.0) {
    // Burst phase — rapid drain
    return Math.max(0, 1 - cycleT * 0.9)
  }
  // Refill phase
  return Math.min(1, (cycleT - 1.0) * (REPLENISH_RATE / BUCKET_SIZE))
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const fill = tokenBucket(time)
    const isLimited = fill < 0.15
    const requestsRemaining = Math.floor(fill * BUCKET_SIZE)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Token bucket visualization — vertical gauge right side */}
        <div style={{
          position: 'absolute', right: 14, top: height * 0.2,
          width: 10, height: height * 0.6,
          border: '1px solid rgba(255,80,0,0.15)',
          borderRadius: 2, overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: `${fill * 100}%`,
            background: isLimited
              ? 'rgba(255,30,30,0.35)'
              : 'rgba(255,140,0,0.30)',
            transition: 'none',
          }} />
        </div>
        {/* Bucket label */}
        <div style={{
          position: 'absolute', right: 26, top: height * 0.2,
          fontFamily: "'Courier New', monospace", fontSize: 6,
          color: isLimited ? 'rgba(255,30,30,0.25)' : 'rgba(255,140,0,0.20)',
          writingMode: 'vertical-rl', textOrientation: 'mixed',
          letterSpacing: 1,
        }}>
          TOKENS {requestsRemaining}/{BUCKET_SIZE}
        </div>
        {/* 429 banner — flashes when limited */}
        {isLimited && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: 18,
            background: 'rgba(255,30,30,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 7, letterSpacing: 3,
              color: 'rgba(255,30,30,0.30)',
            }}>
              429 TOO MANY REQUESTS
            </span>
          </div>
        )}
        {/* Request log left */}
        <div style={{
          position: 'absolute', top: 24, left: 10,
          fontFamily: "'Courier New', monospace", fontSize: 7,
          color: 'rgba(255,140,0,0.12)', lineHeight: 1.8,
        }}>
          {Array.from({ length: 5 }, (_, i) => {
            const reqTime = time - i * 0.3
            const reqFill = tokenBucket(reqTime)
            const blocked = reqFill < 0.1
            return (
              <div key={i} style={{ color: blocked ? 'rgba(255,30,30,0.18)' : 'rgba(255,140,0,0.12)' }}>
                {blocked ? '[429]' : '[200]'} POST /api {(reqTime % 60).toFixed(1)}s
              </div>
            )
          })}
        </div>
        {/* Retry-After countdown */}
        {isLimited && (
          <div style={{
            position: 'absolute', bottom: 10, left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 8, letterSpacing: 3,
            color: 'rgba(255,30,30,0.22)',
          }}>
            Retry-After: {Math.ceil((0.15 - fill) / REPLENISH_RATE * 10)}s
          </div>
        )}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 193 + 67
    const chars = word.split('')

    const wrap = (content: React.ReactNode) => (
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', whiteSpace: 'nowrap', textAlign: 'center' }}>
        {content}
      </div>
    )

    if (phase === 'enter') {
      // Rate limiting: chars appear one-by-one with enforced delays
      // Every N chars there's a longer pause (rate limit hit)
      const BURST = 3 // chars before rate limit pause
      const PAUSE_DURATION = 0.12 // fraction of enter spent waiting

      // Pre-compute when each char actually appears
      let schedule: number[] = []
      let cursor = 0
      for (let ci = 0; ci < chars.length; ci++) {
        if (ci > 0 && ci % BURST === 0) cursor += PAUSE_DURATION
        schedule.push(cursor)
        cursor += (1 - PAUSE_DURATION * Math.floor(chars.length / BURST)) / chars.length
      }
      const maxSchedule = schedule[schedule.length - 1] + 0.1
      const normalizedSchedule = schedule.map(t => t / maxSchedule)

      return wrap(
        <div>
          <div>
            {chars.map((ch, ci) => {
              const arrivalT = normalizedSchedule[ci]
              const arrived = enterProgress > arrivalT
              const justArrived = arrived && enterProgress < arrivalT + 0.06
              // Show throttle indicator between bursts
              const isAfterBurst = ci > 0 && ci % BURST === 0

              return (
                <span key={ci} style={{ display: 'inline-block', position: 'relative' }}>
                  {/* Rate limit separator marker */}
                  {isAfterBurst && enterProgress > normalizedSchedule[ci - 1] && enterProgress < arrivalT && (
                    <span style={{
                      display: 'inline-block',
                      fontFamily: "'Courier New', monospace",
                      fontSize: 'clamp(8px, 2vw, 20px)',
                      color: 'rgba(255,30,30,0.5)',
                      verticalAlign: 'middle',
                      margin: '0 2px',
                    }}>|</span>
                  )}
                  <span style={{
                    display: 'inline-block',
                    fontFamily: "'Courier New', monospace",
                    fontSize: 'clamp(36px, 10vw, 140px)',
                    fontWeight: 700,
                    color: arrived ? color : 'transparent',
                    opacity: arrived ? 1 : 0,
                    transform: justArrived ? `translateY(${-6}px)` : 'none',
                    textShadow: arrived ? `0 0 8px ${color}50` : 'none',
                  }}>
                    {ch}
                  </span>
                </span>
              )
            })}
          </div>
          {/* 429 flash if mid-pause */}
          {(() => {
            const inPause = chars.some((_, ci) => {
              if (ci % BURST !== 0 || ci === 0) return false
              const pauseStart = normalizedSchedule[ci - 1]
              const pauseEnd = normalizedSchedule[ci]
              return enterProgress > pauseStart && enterProgress < pauseEnd
            })
            return inPause ? (
              <div style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 9, letterSpacing: 3,
                color: 'rgba(255,30,30,0.50)',
                marginTop: 4,
              }}>
                429 — THROTTLED
              </div>
            ) : null
          })()}
        </div>
      )
    } else if (phase === 'hold') {
      // Stable but with occasional char-level throttle flicker
      const pulse = 0.85 + Math.sin(holdProgress * Math.PI * 4) * 0.15
      return wrap(
        <div style={{ textAlign: 'center' }}>
          <span style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 10vw, 140px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 ${8 * pulse}px ${color}40`,
          }}>
            {chars.map((ch, ci) => {
              const flicker = rand(seed + ci * 41 + Math.floor(holdProgress * 15)) < 0.03
              return (
                <span key={ci} style={{ color: flicker ? 'rgba(255,30,30,0.7)' : color }}>
                  {flicker ? '|' : ch}
                </span>
              )
            })}
          </span>
        </div>
      )
    } else {
      // Exit: rate limit exhausted — chars vanish slowly, throttled
      return wrap(
        chars.map((ch, ci) => {
          const vanishAt = rand(seed + ci * 29) * 0.7
          const vanished = exitProgress > vanishAt
          const vanishFrac = vanished ? Math.min(1, (exitProgress - vanishAt) / 0.25) : 0
          return (
            <span key={ci} style={{
              display: 'inline-block',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 10vw, 140px)',
              fontWeight: 700,
              color,
              opacity: 1 - vanishFrac,
            }}>
              {ch}
            </span>
          )
        })
      )
    }
  },
}

function RateLimitedComponent(props: MotionGraphicProps<RateLimitedConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-rate-limited',
  title: 'Kinetic Rate Limited',
  description: '429 rate limiting — text chars appear in throttled bursts with pauses, token-bucket gauge, Retry-After countdown overlay',
  tags: ['kinetic', 'typography', 'rate-limit', '429', 'throttle', 'api', 'network', 'glitch', 'protocol', 'http'],
  category: 'captions',
  component: RateLimitedComponent as any,
  defaultConfig: {
    words: ['THROTTLED', 'LIMIT', 'BLOCKED', 'QUEUED'],
    colors: ['#FF4500', '#FF6B35', '#FF4500', '#FF8C00'],
    bgColor: '#090300',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['THROTTLED', 'LIMIT', 'BLOCKED', 'QUEUED'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF4500', '#FF6B35', '#FF4500', '#FF8C00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#090300', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 5, group: 'Timing' },
  ],
})
