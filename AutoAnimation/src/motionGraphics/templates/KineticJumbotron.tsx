import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface JumbotronConfig extends KineticBaseConfig {}

function pseudoRandom(seed: number): number {
  return Math.abs(Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1
}

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1
}

function easeInQuad(t: number): number {
  return t * t
}

const LED_COLS = 24
const LED_ROWS = 14

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* LED pixel grid -- the jumbotron screen texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              radial-gradient(circle 0.8px at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 100%)
            `,
            backgroundSize: `${100 / LED_COLS}% ${100 / LED_ROWS}%`,
            pointerEvents: 'none',
          }}
        />

        {/* Scoreboard frame -- top bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 32,
            background: 'linear-gradient(180deg, #1a1a1a, #0d0d0d)',
            borderBottom: '2px solid #333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 5%',
          }}
        >
          <span
            style={{
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 11,
              fontWeight: 900,
              color: '#FF4444',
              letterSpacing: 2,
            }}
          >
            HOME
          </span>
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 14,
              fontWeight: 700,
              color: '#FFD700',
              letterSpacing: 1,
            }}
          >
            {Math.floor(time * 2) % 90}:
            {String(Math.floor((time * 60) % 60)).padStart(2, '0')}
          </span>
          <span
            style={{
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 11,
              fontWeight: 900,
              color: '#4488FF',
              letterSpacing: 2,
            }}
          >
            AWAY
          </span>
        </div>

        {/* Scoreboard frame -- bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 24,
            background: 'linear-gradient(0deg, #1a1a1a, #0d0d0d)',
            borderTop: '2px solid #333',
          }}
        />

        {/* Side pillars (jumbotron mounting) */}
        <div
          style={{
            position: 'absolute',
            top: 32,
            bottom: 24,
            left: 0,
            width: 6,
            background: 'linear-gradient(90deg, #222, #111)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 32,
            bottom: 24,
            right: 0,
            width: 6,
            background: 'linear-gradient(270deg, #222, #111)',
          }}
        />

        {/* Crowd roar shimmer -- ambient light flashes from audience */}
        {Array.from({ length: 8 }, (_, i) => {
          const flicker = pseudoRandom(i * 41 + Math.floor(time * 12))
          if (flicker < 0.3) return null
          const x = pseudoRandom(i * 67 + Math.floor(time * 8)) * 100
          const y = pseudoRandom(i * 83 + Math.floor(time * 6)) * 100
          return (
            <div
              key={`crowd-${i}`}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: 3,
                height: 3,
                borderRadius: '50%',
                background: `rgba(255,255,255,${flicker * 0.08})`,
                boxShadow: `0 0 ${4 + flicker * 6}px rgba(255,255,255,${flicker * 0.04})`,
              }}
            />
          )
        })}

        {/* LED screen glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, rgba(${40 + Math.sin(time * 2) * 15},${30 + Math.sin(time * 2.5) * 10},${60 + Math.sin(time * 1.8) * 20},0.15) 0%, transparent 65%)`,
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
    let scale = 1
    let crowdFlash = 0
    let pixelReveal = 0 // 0..1 LED pixel assembly

    if (phase === 'enter') {
      const t = enterProgress

      if (t < 0.35) {
        // Phase 1: LED pixels assemble row by row
        pixelReveal = t / 0.35
        masterOpacity = Math.min(1, t * 5)
        scale = 1.0
      } else if (t < 0.6) {
        // Phase 2: snap to full with elastic overshoot
        const snapT = (t - 0.35) / 0.25
        pixelReveal = 1
        masterOpacity = 1
        scale = easeOutElastic(snapT) * 0.15 + 0.95
        // Crowd roar flash on snap
        crowdFlash = (1 - snapT) * 0.3
      } else {
        // Phase 3: settled
        pixelReveal = 1
        masterOpacity = 1
        scale = 1.1
      }
    } else if (phase === 'hold') {
      masterOpacity = 1
      pixelReveal = 1
      scale = 1.1
      // Active hold: pulsing LED glow + crowd flash bursts
      const pulse = Math.sin(holdProgress * Math.PI * 6)
      scale = 1.1 + pulse * 0.02
      crowdFlash = (Math.sin(holdProgress * Math.PI * 4) + 1) * 0.04
    } else {
      const t = exitProgress
      masterOpacity = 1 - easeInQuad(t)
      pixelReveal = 1 - t
      scale = 1.1 - t * 0.3
      // LED pixels dissolve outward (reverse of assembly)
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Crowd flash overlay */}
        {crowdFlash > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse at 50% 50%, rgba(255,220,100,${crowdFlash}) 0%, transparent 60%)`,
              pointerEvents: 'none',
              mixBlendMode: 'screen',
            }}
          />
        )}

        {/* Per-character LED assembly */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            display: 'flex',
            gap: 'clamp(2px, 0.8vw, 6px)',
            opacity: masterOpacity,
          }}
        >
          {chars.map((char, ci) => {
            // Staggered LED reveal: each character lights up with a cascade delay
            const charDelay = ci / totalChars
            const charPixelProgress = Math.max(0, Math.min(1, (pixelReveal - charDelay * 0.5) / 0.6))
            const seed = pseudoRandom(ci * 71 + index * 37)

            // LED glow color -- warm amber/golden for jumbotron
            const ledGlow = charPixelProgress >= 0.9

            return (
              <div
                key={ci}
                style={{ position: 'relative', display: 'inline-block' }}
              >
                {/* LED pixel buildup effect behind char */}
                {charPixelProgress < 0.9 && charPixelProgress > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexWrap: 'wrap',
                      overflow: 'hidden',
                      opacity: 0.4,
                    }}
                  >
                    {Array.from({ length: 12 }, (_, pi) => {
                      const pRand = pseudoRandom(pi * 53 + ci * 31)
                      const lit = pRand < charPixelProgress
                      return (
                        <div
                          key={pi}
                          style={{
                            width: '25%',
                            height: '33%',
                            background: lit
                              ? `rgba(${color === '#FFD700' ? '255,215,0' : '255,255,255'},0.3)`
                              : 'transparent',
                            borderRadius: 1,
                          }}
                        />
                      )
                    })}
                  </div>
                )}

                {/* Main character */}
                <span
                  style={{
                    display: 'inline-block',
                    fontFamily: "'Impact', 'Arial Black', sans-serif",
                    fontSize: 'clamp(44px, 13vw, 170px)',
                    fontWeight: 900,
                    color: charPixelProgress >= 0.9 ? color : `${color}60`,
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    textShadow: ledGlow
                      ? `0 0 15px ${color}80, 0 0 30px ${color}40, 0 0 50px ${color}20`
                      : 'none',
                    opacity: Math.max(0.1, charPixelProgress),
                    transform: `scaleY(${0.85 + charPixelProgress * 0.15})`,
                    transition: 'none',
                  }}
                >
                  {char}
                </span>

                {/* Per-char LED reflection bar beneath */}
                {ledGlow && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -4,
                      left: '10%',
                      right: '10%',
                      height: 3,
                      background: `linear-gradient(90deg, transparent, ${color}30, transparent)`,
                      filter: 'blur(2px)',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Score display during hold */}
        {phase === 'hold' && (
          <div
            style={{
              position: 'absolute',
              bottom: '16%',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              opacity: 0.5,
            }}
          >
            <span
              style={{
                fontFamily: "'Impact', sans-serif",
                fontSize: 'clamp(16px, 4vw, 32px)',
                fontWeight: 900,
                color: '#FF4444',
              }}
            >
              {3 + (index % 4)}
            </span>
            <span
              style={{
                fontFamily: "'Arial', sans-serif",
                fontSize: 'clamp(8px, 1.5vw, 12px)',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.3)',
                letterSpacing: 2,
              }}
            >
              vs
            </span>
            <span
              style={{
                fontFamily: "'Impact', sans-serif",
                fontSize: 'clamp(16px, 4vw, 32px)',
                fontWeight: 900,
                color: '#4488FF',
              }}
            >
              {1 + (index % 3)}
            </span>
          </div>
        )}

        {/* Horizontal LED divider lines */}
        <div
          style={{
            position: 'absolute',
            top: '35%',
            left: '8%',
            right: '8%',
            height: 2,
            background: `linear-gradient(90deg, transparent, rgba(255,200,50,${0.08 * masterOpacity}), transparent)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '65%',
            left: '8%',
            right: '8%',
            height: 2,
            background: `linear-gradient(90deg, transparent, rgba(255,200,50,${0.08 * masterOpacity}), transparent)`,
          }}
        />
      </div>
    )
  },
}

function JumbotronComponent(props: MotionGraphicProps<JumbotronConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-jumbotron',
  title: 'Kinetic Jumbotron',
  description:
    'Stadium jumbotron LED display with per-character pixel assembly, scoreboard framing, crowd camera flashes, elastic snap-in, and pulsing LED glow',
  tags: ['kinetic', 'typography', 'sports', 'stadium', 'jumbotron', 'led', 'scoreboard', 'arena', 'high-speed'],
  category: 'captions',
  component: JumbotronComponent as any,
  defaultConfig: {
    words: ['TOUCHDOWN', 'SLAM DUNK', 'HAT TRICK', 'HOME RUN'],
    colors: ['#FFD700', '#FF4444', '#4488FF', '#00FF88'],
    bgColor: '#060608',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['TOUCHDOWN', 'SLAM DUNK', 'HAT TRICK', 'HOME RUN'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFD700', '#FF4444', '#4488FF', '#00FF88'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060608', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
