import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DenimDistressConfig extends KineticBaseConfig {
  wearIntensity: number
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Ease-out cubic — heavy friction like denim dragging */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/** Ease-in quad — accelerating wear-through */
function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Denim twill weave — diagonal repeating pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              135deg,
              transparent 0px,
              transparent 3px,
              rgba(100,130,180,0.06) 3px,
              rgba(100,130,180,0.06) 4px
            ), repeating-linear-gradient(
              45deg,
              transparent 0px,
              transparent 5px,
              rgba(80,110,160,0.04) 5px,
              rgba(80,110,160,0.04) 6px
            )`,
            pointerEvents: 'none',
          }}
        />
        {/* Warp thread horizontal lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 2px,
              rgba(60,90,140,0.05) 2px,
              rgba(60,90,140,0.05) 3px
            )`,
            pointerEvents: 'none',
          }}
        />
        {/* Worn patches — lighter spots on denim */}
        {Array.from({ length: 5 }, (_, i) => {
          const px = rand(i * 31 + 7) * 100
          const py = rand(i * 47 + 13) * 100
          const size = 60 + rand(i * 23) * 80
          const breathe = Math.sin(time * 0.8 + i * 1.3) * 0.01
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${px}%`,
                top: `${py}%`,
                width: size,
                height: size * 0.6,
                borderRadius: '50%',
                background: `radial-gradient(ellipse, rgba(140,170,210,${0.04 + breathe}) 0%, transparent 70%)`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}
            />
          )
        })}
        {/* Selvedge edge — red/white stripe at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #8B2020 0%, #8B2020 48%, #F5F5DC 48%, #F5F5DC 52%, #8B2020 52%)',
            opacity: 0.3,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 2,
          whiteSpace: 'nowrap',
        }}
      >
        {chars.map((ch, ci) => {
          const charDelay = (ci / (totalChars + 1)) * 0.65
          let opacity = 0
          let distressAmount = 0
          let frayY = 0
          let wearThrough = 0
          let threadExpose = 0

          if (phase === 'enter') {
            // Sandpaper dragging across — reveals text through denim wear
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.5)))
            const eased = easeOutCubic(p)
            distressAmount = eased
            opacity = p > 0 ? Math.min(1, p * 2.5) : 0
            // Exposed white warp threads appear first, then color underneath
            threadExpose = Math.min(1, eased * 1.8)
            wearThrough = Math.max(0, eased - 0.4) / 0.6
          } else if (phase === 'hold') {
            opacity = 1
            distressAmount = 1
            wearThrough = 1
            threadExpose = 1
            // Fabric breathes — gentle sway like hanging denim
            frayY = Math.sin(holdProgress * Math.PI * 4 + ci * 0.9) * 1.5
          } else {
            // Exit: re-dyeing — indigo wash covers text back up
            const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.3) / (1 - charDelay * 0.2)))
            const eased = easeInQuad(p)
            opacity = 1 - eased
            distressAmount = 1 - eased * 0.7
            wearThrough = 1 - eased
            threadExpose = 1 - eased
          }

          // Per-char pseudo-random wear variation
          const wearVariance = rand(ci * 37 + index * 11)
          const frayWidth = 1 + rand(ci * 53 + 7) * 2

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
              }}
            >
              {/* Layer 1: Exposed white warp threads behind text */}
              {threadExpose > 0.1 && (
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    fontFamily: "'Georgia', 'Times New Roman', serif",
                    fontSize: 'clamp(42px, 11vw, 140px)',
                    fontWeight: 700,
                    color: `rgba(245, 240, 225, ${threadExpose * 0.35})`,
                    display: 'inline-block',
                    transform: `translateY(${frayY + 1}px)`,
                    letterSpacing: '0.02em',
                    filter: 'blur(0.8px)',
                    pointerEvents: 'none',
                  }}
                >
                  {ch}
                </span>
              )}
              {/* Layer 2: Distressed indigo dye — partially worn away */}
              <span
                style={{
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontSize: 'clamp(42px, 11vw, 140px)',
                  fontWeight: 700,
                  color: 'transparent',
                  WebkitTextStroke: `${1.5 + distressAmount * 1.5}px rgba(70, 100, 150, ${0.3 * (1 - wearThrough * 0.6)})`,
                  display: 'inline-block',
                  transform: `translateY(${frayY}px)`,
                  letterSpacing: '0.02em',
                  opacity,
                  pointerEvents: 'none',
                }}
              >
                {ch}
              </span>
              {/* Layer 3: Revealed color underneath — the actual text */}
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontSize: 'clamp(42px, 11vw, 140px)',
                  fontWeight: 700,
                  color,
                  display: 'inline-block',
                  transform: `translateY(${frayY}px)`,
                  letterSpacing: '0.02em',
                  opacity: wearThrough * opacity,
                  textShadow: `0 0 ${4 + distressAmount * 4}px rgba(200,180,140,${0.15 * wearThrough})`,
                  pointerEvents: 'none',
                }}
              >
                {ch}
              </span>
              {/* Frayed thread wisps around each character */}
              {distressAmount > 0.2 &&
                Array.from({ length: 4 }, (_, fi) => {
                  const threadAngle = rand(ci * 19 + fi * 41) * 360
                  const threadLen = 4 + rand(ci * 29 + fi * 13) * 10 * distressAmount
                  const threadX = (rand(ci * 61 + fi * 7) - 0.5) * 20
                  const threadY = (rand(ci * 43 + fi * 23) - 0.5) * 30
                  const sway = phase === 'hold' ? Math.sin(holdProgress * Math.PI * 3 + fi * 1.1 + ci * 0.5) * 3 : 0
                  return (
                    <div
                      key={fi}
                      style={{
                        position: 'absolute',
                        left: `calc(50% + ${threadX}px)`,
                        top: `calc(50% + ${threadY + frayY}px)`,
                        width: threadLen,
                        height: frayWidth,
                        background:
                          fi % 2 === 0
                            ? `rgba(200,190,170,${opacity * 0.4 * distressAmount})`
                            : `rgba(100,130,175,${opacity * 0.3 * distressAmount})`,
                        borderRadius: 1,
                        transform: `rotate(${threadAngle + sway}deg)`,
                        transformOrigin: '0% 50%',
                        pointerEvents: 'none',
                      }}
                    />
                  )
                })}
            </div>
          )
        })}
      </div>
    )
  },
}

function DenimDistressComponent(props: MotionGraphicProps<DenimDistressConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-denim-distress',
  title: 'Kinetic Denim Distress',
  description:
    'Text revealed through worn denim fabric — sandpaper-drag distressing exposes warp threads then color beneath, with frayed thread wisps and twill weave background',
  tags: ['kinetic', 'typography', 'denim', 'distress', 'fabric', 'textile', 'jeans', 'worn', 'craft'],
  category: 'captions',
  component: DenimDistressComponent as any,
  defaultConfig: {
    words: ['WORN', 'FADED', 'RAW', 'DENIM'],
    colors: ['#E8D5B7', '#D4A574', '#C8A882', '#DCC8A0'],
    bgColor: '#1A2744',
    cycleDuration: 1.4,
    wearIntensity: 1,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['WORN', 'FADED', 'RAW', 'DENIM'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#E8D5B7', '#D4A574', '#C8A882', '#DCC8A0'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A2744', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'wearIntensity',
      label: 'Wear Intensity',
      type: 'number',
      defaultValue: 1,
      min: 0.3,
      max: 2,
      group: 'Animation',
    },
  ],
})
