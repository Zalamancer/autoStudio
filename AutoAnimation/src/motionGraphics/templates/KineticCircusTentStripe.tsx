import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CircusTentStripeConfig extends KineticBaseConfig {
  stripeColor: string
  stripeAngle: number
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const STRIPE_COUNT = 7

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, config }: BackgroundRenderProps) => {
    const cfg = config as unknown as CircusTentStripeConfig
    const stripeColor = cfg?.stripeColor ?? '#c8102e'
    const angle = cfg?.stripeAngle ?? -45

    // Static circus tent stripe background
    const stripeGradient = `repeating-linear-gradient(
      ${angle}deg,
      ${stripeColor} 0px,
      ${stripeColor} 20px,
      ${bgColor} 20px,
      ${bgColor} 40px
    )`

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: stripeGradient,
            opacity: 0.15,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, config }: WordRenderProps) => {
    const cfg = config as unknown as CircusTentStripeConfig
    const stripeColor = cfg?.stripeColor ?? '#c8102e'
    const angle = cfg?.stripeAngle ?? -45

    // Each diagonal stripe panel reveals a slice of the text, left→right
    // On exit: stripes close right→left like a tent being drawn shut
    const stripes = Array.from({ length: STRIPE_COUNT }, (_, i) => {
      const frac = i / STRIPE_COUNT
      let clipProgress = 0

      if (phase === 'enter') {
        // Staggered: each stripe starts at frac delay, finishes at frac + 1/STRIPE_COUNT
        const p = easeOutBack(Math.min(1, Math.max(0, (enterProgress - frac * 0.6) / 0.6)))
        clipProgress = p
      } else if (phase === 'exit') {
        // Close from left, each strip lags slightly
        const revFrac = 1 - frac
        const p = easeInOutQuad(Math.min(1, Math.max(0, (exitProgress - revFrac * 0.5) / 0.6)))
        clipProgress = 1 - p
      } else {
        clipProgress = 1
      }

      // Each stripe is a vertical band; we clip from top using scaleY
      return { clipProgress }
    })

    const enterScale = phase === 'enter' ? 0.85 + 0.15 * easeOutBack(Math.min(1, enterProgress)) : 1
    const exitOpacity = phase === 'exit' ? 1 - exitProgress * 0.4 : 1

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${enterScale.toFixed(3)})`,
          opacity: exitOpacity,
        }}
      >
        {/* Stripe panels that reveal the text — drawn as clip masks */}
        <div style={{ position: 'relative' }}>
          {/* Base text (always rendered, behind clip) */}
          <div
            style={{
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(40px, 9vw, 130px)',
              fontWeight: 900,
              letterSpacing: '0.06em',
              color,
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              visibility: 'hidden', // spacer
            }}
          >
            {word}
          </div>

          {/* Stripe-clipped copies laid over each other */}
          {stripes.map(({ clipProgress }, i) => {
            const pct = (i / STRIPE_COUNT) * 100
            const width = (1 / STRIPE_COUNT) * 100
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: `${pct}%`,
                  width: `${width}%`,
                  height: '100%',
                  overflow: 'hidden',
                  transform: `scaleY(${clipProgress.toFixed(3)})`,
                  transformOrigin: 'top center',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: `-${pct}%`,
                    width: `${STRIPE_COUNT * width}%`,
                    fontFamily: "'Impact', 'Arial Black', sans-serif",
                    fontSize: 'clamp(40px, 9vw, 130px)',
                    fontWeight: 900,
                    letterSpacing: '0.06em',
                    color,
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                  }}
                >
                  {word}
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom banner stripe — the classic circus marquee underline */}
        <div
          style={{
            marginTop: 6,
            height: 8,
            background: `repeating-linear-gradient(90deg, ${stripeColor} 0px, ${stripeColor} 16px, ${color} 16px, ${color} 32px)`,
            transform: `scaleX(${phase === 'enter' ? easeOutBack(Math.min(1, enterProgress * 1.2)).toFixed(3) : phase === 'exit' ? (1 - exitProgress).toFixed(3) : '1'})`,
            transformOrigin: 'center',
          }}
        />
      </div>
    )
  },
}

function CircusTentStripeComponent(props: MotionGraphicProps<CircusTentStripeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-circus-tent-stripe',
  title: 'Circus Tent Stripe',
  description: 'Diagonal stripe panels wipe open left-to-right like a circus tent being raised, revealing text beneath, then close like a curtain on exit.',
  tags: ['kinetic', 'typography', 'carnival', 'circus', 'stripe', 'wipe', 'reveal', 'tent'],
  category: 'captions',
  component: CircusTentStripeComponent as any,
  defaultConfig: {
    words: ['AMAZING', 'DAZZLING', 'SPECTACULAR', 'GRAND'],
    colors: ['#ffffff', '#ffe100', '#ffffff', '#ffe100'],
    bgColor: '#1a0000',
    cycleDuration: 1.6,
    stripeColor: '#c8102e',
    stripeAngle: -45,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['AMAZING', 'DAZZLING', 'SPECTACULAR', 'GRAND'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#ffe100', '#ffffff', '#ffe100'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0000', group: 'Style' },
    { key: 'stripeColor', label: 'Stripe Color', type: 'color', defaultValue: '#c8102e', group: 'Style' },
    { key: 'stripeAngle', label: 'Stripe Angle (deg)', type: 'number', defaultValue: -45, min: -90, max: 90, group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.6, max: 5, group: 'Timing' },
  ],
})
