import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CMYKPressRollConfig extends KineticBaseConfig {}

/* --- deterministic noise --- */
function hash(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/* --- smooth ease for roller wipe --- */
function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

/* CMYK channels in press order */
const CMYK_CHANNELS = [
  { color: '#00FFFF', label: 'C' },
  { color: '#FF00FF', label: 'M' },
  { color: '#FFFF00', label: 'Y' },
  { color: '#000000', label: 'K' },
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    /* Paper texture grain */
    const grainCount = 50
    const grains = Array.from({ length: grainCount }, (_, i) => {
      const x = hash(i * 11.3) * 100
      const y = hash(i * 7.1 + 3) * 100
      const size = 1 + hash(i * 5.7) * 1.5
      const alpha = 0.02 + hash(i * 23.3) * 0.04
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            borderRadius: '50%',
            background: `rgba(255,255,255,${alpha})`,
            pointerEvents: 'none',
          }}
        />
      )
    })

    /* Roller guide lines at top/bottom */
    const rollerAlpha = 0.08 + Math.sin(time * 3) * 0.02

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {grains}
        {/* Roller mechanics hint: horizontal guide lines */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `rgba(255,255,255,${rollerAlpha})`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `rgba(255,255,255,${rollerAlpha})`,
          }}
        />
        {/* Subtle horizontal press lines */}
        {[0.15, 0.35, 0.55, 0.75].map((yp, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${yp * 100}%`,
              left: 0,
              right: 0,
              height: 1,
              background: `rgba(255,255,255,${0.015 + Math.sin(time * 2 + i) * 0.005})`,
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    const chars = word.split('')

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {CMYK_CHANNELS.map((channel, ci) => {
          /*
           * Roller wipe: each color rolls down from top as a clipPath rect.
           * Staggered: C first, then M, Y, K with 0.2 delay each within enter phase.
           */
          let clipY = 0 // percentage of height revealed from top (0 = hidden, 100 = fully shown)
          let opacity = 1
          let feedVibY = 0

          if (phase === 'enter') {
            /* Each channel gets ~40% of the enter time, staggered by ci * 15% */
            const staggerStart = ci * 0.15
            const staggerEnd = staggerStart + 0.55
            const p = Math.max(0, Math.min(1, (enterProgress - staggerStart) / (staggerEnd - staggerStart)))
            clipY = easeInOutQuart(p) * 100
            opacity = Math.min(1, p * 4)
          } else if (phase === 'hold') {
            clipY = 100
            /* Paper feed vibration: subtle vertical jitter */
            const vibFreq = 18 + ci * 3
            const vibAmp = 0.6
            feedVibY =
              Math.sin(holdProgress * vibFreq) * vibAmp * (0.7 + hash(ci * 5 + Math.floor(holdProgress * 10)) * 0.6)
            opacity = 1
          } else {
            /* Exit: reverse roller wipe upward */
            const staggerStart = (CMYK_CHANNELS.length - 1 - ci) * 0.15
            const staggerEnd = staggerStart + 0.55
            const p = Math.max(0, Math.min(1, (exitProgress - staggerStart) / (staggerEnd - staggerStart)))
            /* Wipe up = clip from bottom, shrinking the visible portion */
            clipY = (1 - easeOutQuad(p)) * 100
            opacity = 1 - p * 0.3
          }

          /* Use polygon clip-path for roller wipe from top */
          const clipPath = `polygon(0% 0%, 100% 0%, 100% ${clipY}%, 0% ${clipY}%)`

          /* Roller shadow at the wipe edge */
          const rollerEdgeY = clipY
          const showRollerEdge = phase !== 'hold' && clipY > 0 && clipY < 100

          return (
            <div
              key={ci}
              style={{
                position: 'absolute',
                inset: 0,
                mixBlendMode: 'multiply',
                pointerEvents: 'none',
              }}
            >
              {/* The color layer with clip-path wipe */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  clipPath,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity,
                  transform: `translateY(${feedVibY}px)`,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Impact', 'Arial Black', sans-serif",
                    fontSize: 'clamp(44px, 13vw, 170px)',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                    color: channel.color,
                    display: 'flex',
                  }}
                >
                  {chars.map((ch, charIdx) => (
                    <span key={charIdx} style={{ display: 'inline-block' }}>
                      {ch === ' ' ? '\u00A0' : ch}
                    </span>
                  ))}
                </div>
              </div>

              {/* Roller edge shadow/highlight */}
              {showRollerEdge && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: `${rollerEdgeY}%`,
                    height: 6,
                    transform: 'translateY(-3px)',
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.12) 50%, transparent 100%)',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  },
}

function CMYKPressRollComponent(props: MotionGraphicProps<CMYKPressRollConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cmyk-press-roll',
  title: 'Kinetic CMYK Press Roll',
  description:
    'Four-color printing press simulation. Each CMYK layer rolls down from top with a roller wipe clip-path, staggered in press order: Cyan, Magenta, Yellow, Key. Hold phase features subtle paper feed vibration. Exit reverses with upward roller wipe. Multiply blend mode creates realistic color overlap.',
  tags: ['kinetic', 'typography', 'cmyk', 'print', 'press', 'roller', 'wipe', 'production'],
  category: 'captions',
  component: CMYKPressRollComponent as any,
  defaultConfig: {
    words: ['PRINT', 'CMYK', 'COLOR', 'PRESS'],
    colors: ['#00FFFF', '#FF00FF', '#FFFF00', '#000000'],
    bgColor: '#1a1a1a',
    cycleDuration: 1.3,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['PRINT', 'CMYK', 'COLOR', 'PRESS'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#00FFFF', '#FF00FF', '#FFFF00', '#000000'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a1a', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.3,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
