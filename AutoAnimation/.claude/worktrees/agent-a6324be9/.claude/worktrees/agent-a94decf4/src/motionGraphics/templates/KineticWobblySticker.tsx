import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Text arrives as a sticker slapped onto the screen — thick white border,
// drop shadow, slight random tilt. Enters with elastic overshoot scale-pop.
// Hold phase: gentle continuous wobble/sway (sticker that won't stay still).
// Exit: peels off corner-first with rotation and scale-down.
// Perfect for cute game reviews, girly day-in-my-life, and unboxing videos.

interface WobblyStickerConfig extends KineticBaseConfig {
  borderWidth: number
}

function easeOutBack(t: number, overshoot = 2.2): number {
  const c3 = overshoot + 1
  return 1 + c3 * Math.pow(t - 1, 3) + overshoot * Math.pow(t - 1, 2)
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

// Per-word deterministic tilt and peel direction
function getStickerProps(seed: number): {
  tilt: number
  borderColor: string
  shadowColor: string
} {
  const tilt = ((seed % 11) - 5) * 3.2   // -16..+16 degrees
  // Alternating shadow tone
  const isDark = seed % 2 === 0
  const shadowColor = isDark ? 'rgba(0,0,0,0.35)' : 'rgba(80,0,120,0.2)'
  const borderColor = '#ffffff'
  return { tilt, borderColor, shadowColor }
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Pastel gradient shift — feels kawaii/cute
    const shift = Math.sin(t * 0.8) * 15
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Soft wavy gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 100% 80% at ${50 + shift}% 40%,
              rgba(255,255,255,0.18) 0%,
              transparent 70%
            )`,
          }}
        />
        {/* Tiny heart pattern — kawaii background */}
        {Array.from({ length: 16 }).map((_, i) => {
          const hx = ((i * 137) % 100)
          const hy = ((i * 97) % 100)
          const hs = 8 + (i % 4) * 3
          const hop = 0.06 + (i % 5) * 0.03
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${hx}%`,
                top: `${hy}%`,
                fontSize: hs,
                opacity: hop,
                color: '#ff69b4',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            >
              ♥
            </div>
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame = 0 }: WordRenderProps) => {
    const seed = index * 79 + 23
    const { tilt, borderColor, shadowColor } = getStickerProps(seed)

    let scale = 1
    let rotation = tilt
    let opacity = 1
    let translateX = 0
    let translateY = 0
    let stickerSkew = 0

    if (phase === 'enter') {
      // Pop in with elastic overshoot from slightly off-center
      const eased = easeOutBack(enterProgress, 2.2)
      scale = eased * 0.9 + 0.1
      // Slap rotation — starts exaggerated, settles to tilt
      const rotOvershoot = tilt * 3.5
      rotation = rotOvershoot + (tilt - rotOvershoot) * Math.min(1, eased)
      opacity = Math.min(1, enterProgress * 4)
      // Brief landing skew (sticker being pressed down)
      stickerSkew = (1 - Math.min(1, enterProgress * 3)) * 8

    } else if (phase === 'hold') {
      // Sticker wobble: slow pendulum sway with occasional hiccup
      const swayT = holdProgress * Math.PI * 2.5
      const wobble = Math.sin(swayT) * 3.5
      const hiccup = Math.sin(holdProgress * Math.PI * 9) * 0.8 * Math.max(0, 1 - holdProgress * 2)
      rotation = tilt + wobble + hiccup
      // Subtle scale breathe
      scale = 1 + Math.sin(swayT * 0.7) * 0.02
      // Very slight translation to feel like it's alive
      translateY = Math.sin(swayT * 0.6 + 1) * 3
      translateX = Math.cos(swayT * 0.4) * 2

    } else {
      // Peel off — rotate off to a corner, shrink, fade
      const eased = easeInQuart(exitProgress)
      const peelDir = seed % 2 === 0 ? 1 : -1
      rotation = tilt + peelDir * 45 * eased
      scale = 1 - eased * 0.6
      translateX = peelDir * width * 0.3 * eased
      translateY = -height * 0.3 * eased
      opacity = Math.max(0, 1 - exitProgress * 2.5)
    }

    // Build "sticker" layers — multiple white borders for chunky sticker look
    const borderPx = 10
    const borderLayers = [
      { spread: borderPx * 3, blur: 2, color: 'rgba(255,255,255,0.4)' },
      { spread: borderPx * 1.5, blur: 0, color: '#ffffff' },
    ]

    const boxShadow = [
      ...borderLayers.map(b => `0 0 ${b.blur}px ${b.spread}px ${b.color}`),
      `4px 8px 16px ${shadowColor}`,
      `8px 14px 28px ${shadowColor.replace('0.35', '0.15')}`,
    ].join(', ')

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${translateX}px) translateY(${translateY}px) rotate(${rotation}deg) scale(${scale}) skewX(${stickerSkew}deg)`,
          opacity,
        }}
      >
        {/* Sticker backing with chunky white border */}
        <div
          style={{
            padding: 'clamp(12px, 3vw, 32px) clamp(20px, 6vw, 64px)',
            background: color,
            borderRadius: 16,
            boxShadow,
            position: 'relative',
            border: `${borderPx}px solid ${borderColor}`,
          }}
        >
          {/* Glossy shine */}
          <div
            style={{
              position: 'absolute',
              top: 6,
              left: '15%',
              width: '40%',
              height: '30%',
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              background: 'rgba(255,255,255,0.22)',
              pointerEvents: 'none',
            }}
          />

          {/* Text */}
          <div
            style={{
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(38px, 10vw, 140px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: '#ffffff',
              WebkitTextStroke: '2px rgba(0,0,0,0.15)',
              textShadow: '0 2px 4px rgba(0,0,0,0.25)',
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              userSelect: 'none',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function WobblyStickerComponent(props: MotionGraphicProps<WobblyStickerConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-wobbly-sticker',
  title: 'Kinetic Wobbly Sticker',
  description:
    'Text enters as a sticker slapped onto the screen — chunky white border, drop shadow, elastic pop-in with rotation overshoot. Wobbles like a sticker that won\'t stay still during hold. Peels off corner-first on exit. Cute game reviews and girly day-in-my-life content.',
  tags: ['kinetic', 'typography', 'sticker', 'wobble', 'elastic', 'pop', 'cute', 'kawaii', 'playful', 'fun', 'game-review', 'vlog', 'girly', 'unboxing'],
  category: 'captions',
  component: WobblyStickerComponent as any,
  defaultConfig: {
    words: ['CUTE!', 'LOVE IT', 'SO FUN', '10/10'],
    colors: ['#FF6B9D', '#FF9F43', '#54A0FF', '#5F27CD'],
    bgColor: '#FFCCE7',
    cycleDuration: 1.5,
    borderWidth: 10,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['CUTE!', 'LOVE IT', 'SO FUN', '10/10'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Sticker Colors',
      type: 'text-array',
      defaultValue: ['#FF6B9D', '#FF9F43', '#54A0FF', '#5F27CD'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFCCE7', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 6,
      group: 'Timing',
    },
    {
      key: 'borderWidth',
      label: 'Border Width (px)',
      type: 'number',
      defaultValue: 10,
      min: 4,
      max: 24,
      group: 'Style',
    },
  ],
})
