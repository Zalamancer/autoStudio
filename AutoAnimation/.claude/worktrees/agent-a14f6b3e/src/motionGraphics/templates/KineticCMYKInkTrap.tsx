import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CMYKInkTrapConfig extends KineticBaseConfig {
  stampForce: number
}

// CMYK channels with stamp delay offsets
const CMYK_PLATES = [
  { color: '#00FFFF', label: 'C', stampDelay: 0.0 },
  { color: '#FF00FF', label: 'M', stampDelay: 0.12 },
  { color: '#FFFF00', label: 'Y', stampDelay: 0.24 },
  { color: '#000000', label: 'K', stampDelay: 0.36 },
]

function easeOutBounce(t: number): number {
  if (t < 1 / 2.75) {
    return 7.5625 * t * t
  } else if (t < 2 / 2.75) {
    const t2 = t - 1.5 / 2.75
    return 7.5625 * t2 * t2 + 0.75
  } else if (t < 2.5 / 2.75) {
    const t2 = t - 2.25 / 2.75
    return 7.5625 * t2 * t2 + 0.9375
  } else {
    const t2 = t - 2.625 / 2.75
    return 7.5625 * t2 * t2 + 0.984375
  }
}

function easeInBack(t: number): number {
  const c = 1.70158
  return (c + 1) * t * t * t - c * t * t
}

function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    const grainShift = Math.floor(t * 14) * 0.9
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Heavy paper stock texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle 0.7px, rgba(255,255,255,0.025) 100%, transparent 100%)`,
            backgroundSize: '5px 5px',
            backgroundPosition: `${grainShift}px ${grainShift * 0.6}px`,
          }}
        />
        {/* Letterpress impression shadow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 80% 40% at 50% 55%, rgba(0,0,0,0.15), transparent 60%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, enterProgress, holdProgress, exitProgress, phase, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const chars = word.split('')

    const sharedFont: React.CSSProperties = {
      fontFamily: "'Arial Black', 'Impact', sans-serif",
      fontSize: 'clamp(44px, 13vw, 170px)',
      fontWeight: 900,
      whiteSpace: 'nowrap',
      lineHeight: 1,
      letterSpacing: '0.02em',
    }

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Per-character rendering with CMYK plate stamps */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
          }}
        >
          {chars.map((ch, ci) => {
            const charDelay = ci * 0.04

            return (
              <div
                key={ci}
                style={{
                  position: 'relative',
                  display: 'inline-block',
                }}
              >
                {/* Render CMYK plates for each character */}
                {CMYK_PLATES.map((plate) => {
                  const isKey = plate.label === 'K'
                  const totalDelay = plate.stampDelay + charDelay

                  let stampScale = 1
                  let stampY = 0
                  let plateOpacity = 1
                  let bleedRadius = 0
                  let splashSpread = 0

                  if (phase === 'enter') {
                    const p = Math.max(0, Math.min(1, (enterProgress - totalDelay) / (1 - totalDelay)))
                    if (p <= 0) {
                      // Not yet stamped
                      stampScale = 1.8
                      stampY = -40
                      plateOpacity = 0
                    } else if (p < 0.4) {
                      // Stamp coming down hard
                      const downP = p / 0.4
                      stampScale = 1.8 - 0.8 * easeOutBounce(downP)
                      stampY = -40 * (1 - easeOutBounce(downP))
                      plateOpacity = Math.min(1, downP * 3)
                      // Ink splash outward on impact
                      splashSpread = downP > 0.6 ? (downP - 0.6) / 0.4 * 6 : 0
                    } else {
                      // Settled — slight ink bleed starting
                      stampScale = 1
                      stampY = 0
                      plateOpacity = isKey ? 1 : 0.85
                      const bleedP = (p - 0.4) / 0.6
                      bleedRadius = bleedP * 0.5
                    }
                  } else if (phase === 'hold') {
                    // Ink slowly bleeds at overlap edges
                    const bleedWave = Math.sin(holdProgress * Math.PI * 2 + ci * 0.5 + plate.stampDelay * 8)
                    bleedRadius = 0.5 + bleedWave * 0.3
                    plateOpacity = isKey ? 1 : 0.85
                    // Subtle impression depth shift
                    stampY = Math.sin(holdProgress * Math.PI + ci * 0.3) * 0.5
                  } else {
                    // Reverse bleed — ink absorbs back
                    const p = Math.max(0, Math.min(1, (exitProgress - charDelay) / (1 - charDelay)))
                    bleedRadius = Math.max(0, 0.5 * (1 - p * 2))
                    plateOpacity = isKey ? 1 - easeInBack(p) : 0.85 * (1 - easeInBack(p))
                    stampScale = 1 + easeInBack(p) * 0.3
                  }

                  return (
                    <span
                      key={plate.label}
                      style={{
                        position: plate.label === 'C' ? 'relative' : 'absolute',
                        top: plate.label === 'C' ? undefined : 0,
                        left: plate.label === 'C' ? undefined : 0,
                        display: 'inline-block',
                        color: plate.color,
                        ...sharedFont,
                        opacity: plateOpacity,
                        transform: `translateY(${stampY}px) scale(${stampScale})`,
                        mixBlendMode: isKey ? 'normal' : 'multiply',
                        filter: bleedRadius > 0.1 ? `blur(${bleedRadius}px)` : 'none',
                        textShadow: splashSpread > 0
                          ? `${splashSpread}px 0 0 ${plate.color}, -${splashSpread}px 0 0 ${plate.color}, 0 ${splashSpread}px 0 ${plate.color}, 0 -${splashSpread}px 0 ${plate.color}`
                          : 'none',
                      }}
                    >
                      {ch}
                    </span>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Impression marks — letterpress deboss lines */}
        {phase === 'hold' && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80%',
              height: 2,
              marginTop: 'clamp(30px, 8vw, 90px)',
              background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.04) 20%, rgba(255,255,255,0.04) 80%, transparent)`,
            }}
          />
        )}
      </div>
    )
  },
}

function CMYKInkTrapComponent(props: MotionGraphicProps<CMYKInkTrapConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cmyk-ink-trap',
  title: 'Kinetic CMYK Ink Trap',
  description:
    'Letterpress ink trap effect. Letters stamp down hard with ink splash, each CMYK plate stamping with slight delay. Hold phase shows slow ink bleed at overlap edges. Exit reverses the bleed, absorbing ink back into the letters.',
  tags: ['kinetic', 'typography', 'cmyk', 'print', 'letterpress', 'ink-trap', 'stamp', 'multiply', 'bleed', 'impact'],
  category: 'captions',
  component: CMYKInkTrapComponent as any,
  defaultConfig: {
    words: ['PRINT', 'CMYK', 'COLOR', 'PRESS'],
    colors: ['#00FFFF', '#FF00FF', '#FFFF00', '#000000'],
    bgColor: '#1a1a1a',
    cycleDuration: 1.3,
    stampForce: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PRINT', 'CMYK', 'COLOR', 'PRESS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFFF', '#FF00FF', '#FFFF00', '#000000'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
    { key: 'stampForce', label: 'Stamp Force', type: 'number', defaultValue: 1, min: 0.3, max: 3, group: 'Animation' },
  ],
})
