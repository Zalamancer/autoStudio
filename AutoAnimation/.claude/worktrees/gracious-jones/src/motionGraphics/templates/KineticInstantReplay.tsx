import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface InstantReplayConfig extends KineticBaseConfig {}

function pseudoRandom(seed: number): number {
  return Math.abs(Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const TRAIL_COUNT = 4

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Broadcast field -- dark gradient with green tint (grass/field) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 60%, rgba(0,40,20,0.3) 0%, transparent 70%)',
          }}
        />

        {/* Horizontal interlace scan lines (broadcast feel) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)',
            pointerEvents: 'none',
          }}
        />

        {/* Slow-motion time dilation bars -- horizontal bands that drift */}
        {Array.from({ length: 3 }, (_, i) => {
          const barY = ((time * (8 + i * 3) + i * 35) % 120) - 10
          return (
            <div
              key={`bar-${i}`}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${barY}%`,
                height: 3,
                background: `linear-gradient(90deg, transparent, rgba(255,255,255,${0.03 + i * 0.01}), transparent)`,
                filter: 'blur(1px)',
              }}
            />
          )
        })}

        {/* REC indicator */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            opacity: 0.6 + Math.sin(time * 3) * 0.2,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#FF2222',
              boxShadow: '0 0 6px rgba(255,34,34,0.6)',
            }}
          />
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 11,
              fontWeight: 700,
              color: '#FF2222',
              letterSpacing: 2,
            }}
          >
            REPLAY
          </span>
        </div>

        {/* Timecode bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            right: 14,
            fontFamily: "'Courier New', monospace",
            fontSize: 10,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.25)',
            letterSpacing: 1,
          }}
        >
          {`00:${String(Math.floor(time) % 60).padStart(2, '0')}:${String(Math.floor((time % 1) * 30)).padStart(2, '0')}`}
        </div>

        {/* Broadcast vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 60px rgba(0,0,0,0.4)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const chars = word.split('')
    const totalChars = chars.length

    let masterOpacity = 0
    let trailOpacity = 0 // opacity of motion ghost trails
    let mainScale = 1
    let slowFactor = 1 // time dilation visual
    let rewindOffset = 0

    if (phase === 'enter') {
      const t = enterProgress
      masterOpacity = Math.min(1, t * 3)

      if (t < 0.5) {
        // First half: characters rush in fast (normal speed), then slow down
        const fastPhase = t / 0.5
        slowFactor = 1 - fastPhase * 0.7 // speed decelerating
        trailOpacity = (1 - fastPhase) * 0.6
        mainScale = 0.6 + easeOutBack(fastPhase) * 0.4
      } else {
        // Second half: slow-mo lock-in with slight overshoot
        const slowPhase = (t - 0.5) / 0.5
        slowFactor = 0.3 + slowPhase * 0.7
        trailOpacity = 0
        mainScale = 1.0 + Math.sin(slowPhase * Math.PI) * 0.05
      }
    } else if (phase === 'hold') {
      masterOpacity = 1
      mainScale = 1.0
      // Active hold: slow-motion oscillation -- text gently breathes like paused replay
      const breathe = Math.sin(holdProgress * Math.PI * 4)
      mainScale = 1.0 + breathe * 0.015
      // Subtle rewind jitter
      rewindOffset = Math.sin(holdProgress * Math.PI * 8) * 1.5
    } else {
      const t = exitProgress
      masterOpacity = 1 - easeInCubic(t)
      // Exit: fast-forward away -- speed ramps up, trails reappear
      trailOpacity = t * 0.5
      mainScale = 1 + t * 0.3
      rewindOffset = t * 30 // rush forward
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* "INSTANT REPLAY" broadcast bar */}
        {phase !== 'exit' && (
          <div
            style={{
              position: 'absolute',
              top: '18%',
              left: '50%',
              transform: 'translateX(-50%)',
              opacity: masterOpacity * 0.5,
              fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(8px, 1.8vw, 13px)',
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: 6,
              textTransform: 'uppercase',
              padding: '3px 14px',
              background: 'rgba(255,30,30,0.7)',
              borderRadius: 2,
            }}
          >
            INSTANT REPLAY
          </div>
        )}

        {/* Motion ghost trails behind text */}
        {trailOpacity > 0 &&
          Array.from({ length: TRAIL_COUNT }, (_, ti) => {
            const trailOffset = (ti + 1) * (phase === 'exit' ? -12 : 12)
            const trailAlpha = trailOpacity * (1 - ti / TRAIL_COUNT) * 0.4
            return (
              <div
                key={`trail-${ti}`}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(calc(-50% + ${trailOffset + rewindOffset}px), -50%) scale(${mainScale})`,
                  display: 'flex',
                  gap: 0,
                  opacity: trailAlpha,
                  filter: `blur(${1 + ti}px)`,
                }}
              >
                {chars.map((char, ci) => (
                  <span
                    key={ci}
                    style={{
                      fontFamily: "'Impact', 'Arial Black', sans-serif",
                      fontSize: 'clamp(40px, 12vw, 150px)',
                      fontWeight: 900,
                      color,
                      textTransform: 'uppercase',
                      letterSpacing: 4,
                    }}
                  >
                    {char}
                  </span>
                ))}
              </div>
            )
          })}

        {/* Per-character main text with staggered slow-mo entrance */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${rewindOffset}px), -50%) scale(${mainScale})`,
            display: 'flex',
            gap: 0,
            opacity: masterOpacity,
          }}
        >
          {chars.map((char, ci) => {
            // Per-character stagger: each letter decelerates at a slightly different rate
            const charDelay = ci * 0.06
            let charEnter = 1

            if (phase === 'enter') {
              charEnter = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.5)))
            }

            const charSlide = phase === 'enter' ? (1 - charEnter) * (20 + pseudoRandom(ci * 53 + index * 17) * 15) : 0
            const charOpacity = phase === 'enter' ? Math.min(1, charEnter * 2.5) : 1
            const charScale = phase === 'enter' ? 0.7 + charEnter * 0.3 : 1

            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Impact', 'Arial Black', sans-serif",
                  fontSize: 'clamp(40px, 12vw, 150px)',
                  fontWeight: 900,
                  color,
                  textTransform: 'uppercase',
                  letterSpacing: 4,
                  transform: `translateX(${charSlide}px) scale(${charScale})`,
                  opacity: charOpacity,
                  textShadow: `0 0 12px ${color}50, 0 2px 0 rgba(0,0,0,0.4)`,
                }}
              >
                {char}
              </span>
            )
          })}
        </div>

        {/* Slow-motion speed indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: '14%',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            opacity: masterOpacity * 0.45,
          }}
        >
          {/* Speed bar segments */}
          {Array.from({ length: 5 }, (_, i) => {
            const segActive = phase === 'hold'
              ? (Math.sin(holdProgress * Math.PI * 3 + i * 0.5) + 1) / 2 > 0.4
              : i < Math.floor(slowFactor * 5)
            return (
              <div
                key={`seg-${i}`}
                style={{
                  width: 'clamp(12px, 3vw, 24px)',
                  height: 3,
                  background: segActive ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)',
                  borderRadius: 1,
                }}
              />
            )
          })}
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(8px, 1.5vw, 11px)',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: 1,
              marginLeft: 4,
            }}
          >
            {phase === 'hold' ? '0.25x' : phase === 'enter' ? `${slowFactor.toFixed(1)}x` : '2.0x'}
          </span>
        </div>
      </div>
    )
  },
}

function InstantReplayComponent(props: MotionGraphicProps<InstantReplayConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-instant-replay',
  title: 'Kinetic Instant Replay',
  description:
    'Broadcast instant replay with slow-motion deceleration, per-character staggered entry, motion ghost trails, REC indicator, speed bar, and interlace scan lines',
  tags: ['kinetic', 'typography', 'sports', 'replay', 'slow-motion', 'broadcast', 'football', 'high-speed'],
  category: 'captions',
  component: InstantReplayComponent as any,
  defaultConfig: {
    words: ['GOAL', 'REPLAY', 'STRIKE', 'SAVED'],
    colors: ['#FFFFFF', '#FFD700', '#FF4444', '#00FF88'],
    bgColor: '#080c14',
    cycleDuration: 1.4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['GOAL', 'REPLAY', 'STRIKE', 'SAVED'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#FFD700', '#FF4444', '#00FF88'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080c14', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
