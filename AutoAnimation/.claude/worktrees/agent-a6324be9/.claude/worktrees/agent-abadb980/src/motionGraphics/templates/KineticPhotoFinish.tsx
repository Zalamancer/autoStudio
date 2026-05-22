import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PhotoFinishConfig extends KineticBaseConfig {}

function pseudoRandom(seed: number): number {
  return Math.abs(Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Slit-scan sweep position (0-100%)
    const scanX = (time * 60) % 140 - 20

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Running track lane lines -- horizontal stripes */}
        {Array.from({ length: 9 }, (_, i) => {
          const laneY = 10 + i * 10
          return (
            <div
              key={`lane-${i}`}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${laneY}%`,
                height: 1,
                background: `rgba(255,255,255,${i % 2 === 0 ? 0.06 : 0.03})`,
              }}
            />
          )
        })}

        {/* Vertical finish line */}
        <div
          style={{
            position: 'absolute',
            left: '72%',
            top: 0,
            bottom: 0,
            width: 4,
            background: 'repeating-linear-gradient(180deg, #ffffff 0px, #ffffff 4px, #000000 4px, #000000 8px)',
            opacity: 0.15,
          }}
        />

        {/* Photo-finish slit scan bar */}
        <div
          style={{
            position: 'absolute',
            left: `${scanX}%`,
            top: 0,
            bottom: 0,
            width: 2,
            background: 'linear-gradient(180deg, rgba(255,50,50,0.5), rgba(255,50,50,0.8), rgba(255,50,50,0.5))',
            boxShadow: '0 0 12px rgba(255,50,50,0.3), 0 0 30px rgba(255,50,50,0.1)',
          }}
        />

        {/* Timing strip at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 24,
            background: 'rgba(0,0,0,0.6)',
            borderBottom: '1px solid rgba(255,50,50,0.3)',
          }}
        >
          {/* Tick marks along top */}
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={`tick-${i}`}
              style={{
                position: 'absolute',
                left: `${i * 5 + 2.5}%`,
                top: 14,
                width: 1,
                height: i % 5 === 0 ? 10 : 5,
                background: `rgba(255,255,255,${i % 5 === 0 ? 0.4 : 0.15})`,
              }}
            />
          ))}
        </div>

        {/* Motion blur overlay -- horizontal streaks */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(255,255,255,0.008) 3px, rgba(255,255,255,0.008) 4px)',
            pointerEvents: 'none',
          }}
        />

        {/* Camera vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.5) 100%)',
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

    // Timing display in top bar
    const baseTime = 9.58 + pseudoRandom(index * 41) * 2
    const displayTime = baseTime.toFixed(2)

    let masterOpacity = 0
    let slitProgress = 0 // 0..1 horizontal reveal
    let timingOpacity = 0
    let flashIntensity = 0

    if (phase === 'enter') {
      const t = enterProgress
      masterOpacity = Math.min(1, t * 3)
      // Slit-scan reveal: characters appear left-to-right as the scan bar passes
      slitProgress = t * t // ease-in: accelerating reveal like a sprint finish
      // Camera flash at moment of capture
      if (t > 0.15 && t < 0.3) {
        flashIntensity = (1 - (t - 0.15) / 0.15) * 0.4
      }
      timingOpacity = Math.max(0, (t - 0.6) / 0.4)
    } else if (phase === 'hold') {
      masterOpacity = 1
      slitProgress = 1
      timingOpacity = 1
      // Active hold: timing digits flicker like an electronic clock
      flashIntensity = Math.sin(holdProgress * Math.PI * 6) * 0.03
    } else {
      const t = exitProgress
      masterOpacity = 1 - t * t
      // Reverse slit-scan: characters disappear right-to-left
      slitProgress = 1 - t * t
      timingOpacity = 1 - t * 2
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Camera flash overlay */}
        {flashIntensity > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `rgba(255,255,255,${flashIntensity})`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Per-character slit-scan reveal */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 0,
            opacity: masterOpacity,
          }}
        >
          {chars.map((char, ci) => {
            const charDelay = ci / totalChars
            const charProgress = Math.max(0, Math.min(1, (slitProgress - charDelay * 0.7) / 0.4))
            // Each character slides in from right with motion blur
            const slideX = (1 - charProgress) * 40
            const charOpacity = charProgress
            // Motion streak per character during reveal
            const streakWidth = charProgress < 1 ? (1 - charProgress) * 20 : 0
            const seed = pseudoRandom(ci * 73 + index * 31)

            return (
              <div
                key={ci}
                style={{
                  position: 'relative',
                  display: 'inline-block',
                }}
              >
                {/* Motion streak behind character */}
                {streakWidth > 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '10%',
                      left: `calc(50% + ${slideX}px)`,
                      width: streakWidth,
                      height: '80%',
                      background: `linear-gradient(90deg, ${color}40, transparent)`,
                      filter: 'blur(2px)',
                    }}
                  />
                )}
                <span
                  style={{
                    display: 'inline-block',
                    fontFamily: "'Impact', 'Arial Black', sans-serif",
                    fontSize: 'clamp(42px, 12vw, 160px)',
                    fontWeight: 900,
                    color,
                    textTransform: 'uppercase',
                    letterSpacing: 3,
                    transform: `translateX(${slideX}px)`,
                    opacity: charOpacity,
                    textShadow: `${2 + seed * 2}px 0 ${4 + seed * 3}px rgba(255,50,50,0.3)`,
                  }}
                >
                  {char}
                </span>
              </div>
            )
          })}
        </div>

        {/* Electronic timing readout */}
        <div
          style={{
            position: 'absolute',
            top: 3,
            right: '12%',
            opacity: Math.max(0, timingOpacity) * masterOpacity,
            fontFamily: "'Courier New', 'Consolas', monospace",
            fontSize: 'clamp(10px, 2.5vw, 16px)',
            fontWeight: 700,
            color: '#FF3333',
            letterSpacing: 2,
            textShadow: '0 0 6px rgba(255,50,50,0.5)',
          }}
        >
          {displayTime}s
        </div>

        {/* Lane position indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: Math.max(0, timingOpacity) * masterOpacity * 0.6,
            fontFamily: "'Arial', sans-serif",
            fontSize: 'clamp(9px, 2vw, 14px)',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          LANE {(index % 8) + 1} -- PHOTO FINISH
        </div>

        {/* Red horizontal timing line through text center */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '10%',
            right: '10%',
            height: 1,
            background: `linear-gradient(90deg, transparent, rgba(255,50,50,${0.15 * masterOpacity}), transparent)`,
            transform: 'translateY(-50%)',
          }}
        />
      </div>
    )
  },
}

function PhotoFinishComponent(props: MotionGraphicProps<PhotoFinishConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-photo-finish',
  title: 'Kinetic Photo Finish',
  description:
    'Photo-finish camera slit-scan reveal with per-character staggered entry, motion streaks, electronic timing readout, lane markings, and camera flash burst',
  tags: ['kinetic', 'typography', 'sports', 'sprint', 'photo-finish', 'racing', 'track', 'timing', 'high-speed'],
  category: 'captions',
  component: PhotoFinishComponent as any,
  defaultConfig: {
    words: ['FASTEST', 'RECORD', 'SPRINT', 'FINISH'],
    colors: ['#FF3333', '#FFD700', '#FF3333', '#FFFFFF'],
    bgColor: '#0a0a14',
    cycleDuration: 1.3,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['FASTEST', 'RECORD', 'SPRINT', 'FINISH'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF3333', '#FFD700', '#FF3333', '#FFFFFF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.3,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
