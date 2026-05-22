import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StorefrontConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Dark storefront interior */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, #1a1510 0%, #0f0c08 60%, #0a0806 100%)',
          }}
        />
        {/* Glass window pane — subtle reflection */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 30%, rgba(255,255,255,0.02) 50%, transparent 70%, rgba(255,255,255,0.03) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Window frame — thick dark wood border */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: '12px solid #2a1f14',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
          }}
        />
        {/* Mullion — vertical center divider */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 12,
            bottom: 12,
            width: 6,
            transform: 'translateX(-50%)',
            background: 'linear-gradient(90deg, #1f1610, #2a1f14, #1f1610)',
            pointerEvents: 'none',
          }}
        />
        {/* Transom bar — horizontal upper divider */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: 12,
            right: 12,
            height: 5,
            background: 'linear-gradient(180deg, #1f1610, #2a1f14, #1f1610)',
            pointerEvents: 'none',
          }}
        />
        {/* Window condensation / age patina */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 30% 70%, rgba(180,160,120,0.03) 0%, transparent 50%), radial-gradient(ellipse at 70% 30%, rgba(180,160,120,0.02) 0%, transparent 40%)',
            pointerEvents: 'none',
          }}
        />
        {/* Subtle street light reflection streak on glass */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            right: '15%',
            width: '20%',
            height: '60%',
            background: 'linear-gradient(160deg, rgba(255,240,200,0.025) 0%, transparent 100%)',
            transform: 'skewX(-5deg)',
            filter: 'blur(8px)',
            pointerEvents: 'none',
          }}
        />
        {/* Inner shelf silhouette at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            right: 12,
            height: '12%',
            background: 'linear-gradient(180deg, transparent, rgba(15,10,5,0.7))',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const f = frame ?? 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '48%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 'clamp(2px, 0.8vw, 8px)',
          whiteSpace: 'nowrap',
        }}
      >
        {chars.map((ch, ci) => {
          const charDelay = ci / (totalChars + 1) * 0.5
          let charOpacity = 0
          let gilding = 0
          let brushY = 0

          if (phase === 'enter') {
            // Gold leaf application: brush stroke reveals each letter top-to-bottom
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.5)))
            const eased = easeOutCubic(p)
            charOpacity = eased
            gilding = eased
            // Brush wipes down during painting
            brushY = (1 - eased) * 15
          } else if (phase === 'hold') {
            charOpacity = 1
            gilding = 1
            brushY = 0
          } else {
            // Fade like light dimming in the shop
            const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.3) / (1 - charDelay * 0.2)))
            charOpacity = 1 - easeOutCubic(p)
            gilding = 1
          }

          if (ch === ' ') {
            return <div key={ci} style={{ width: 'clamp(8px, 2vw, 20px)' }} />
          }

          // Gold leaf shimmer — varies per character to look hand-applied
          const leafVariation = rand(ci * 13 + index * 7)
          const goldBase = color
          const goldHighlight = `rgba(255, 235, 160, ${0.3 + gilding * 0.4})`
          const edgeColor = `rgba(180, 140, 50, ${gilding * 0.6})`

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
                transform: `translateY(${brushY}px)`,
              }}
            >
              {/* Gold leaf letter */}
              <span
                style={{
                  fontFamily: "'Playfair Display', 'Georgia', 'Times New Roman', serif",
                  fontSize: 'clamp(36px, 10vw, 130px)',
                  fontWeight: 700,
                  color: goldBase,
                  opacity: charOpacity,
                  display: 'inline-block',
                  lineHeight: 1,
                  letterSpacing: 2,
                  // Gold leaf gradient — each char slightly different angle
                  background: gilding > 0.3
                    ? `linear-gradient(${155 + leafVariation * 40}deg, #C9A94E 0%, #F5D66A 25%, #E8C84A 50%, #D4A942 75%, #C49838 100%)`
                    : 'none',
                  WebkitBackgroundClip: gilding > 0.3 ? 'text' : undefined,
                  WebkitTextFillColor: gilding > 0.3 ? 'transparent' : undefined,
                  filter: gilding > 0.5
                    ? `drop-shadow(0 0 2px rgba(200,170,80,${gilding * 0.3})) drop-shadow(1px 2px 3px rgba(0,0,0,0.5))`
                    : undefined,
                }}
              >
                {ch}
              </span>
              {/* Gilded edge highlight — thin bright edge */}
              {gilding > 0.6 && (
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    fontFamily: "'Playfair Display', 'Georgia', 'Times New Roman', serif",
                    fontSize: 'clamp(36px, 10vw, 130px)',
                    fontWeight: 700,
                    color: 'transparent',
                    WebkitTextStroke: `1px rgba(255,240,180,${gilding * 0.15})`,
                    display: 'inline-block',
                    lineHeight: 1,
                    letterSpacing: 2,
                    pointerEvents: 'none',
                  }}
                >
                  {ch}
                </span>
              )}
            </div>
          )
        })}
      </div>
    )
  },
}

function StorefrontComponent(props: MotionGraphicProps<StorefrontConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-storefront',
  title: 'Storefront Window Lettering',
  description:
    'Gold leaf text hand-painted on a glass storefront window. Letters appear with a brush-stroke reveal, gilded edge highlights, and subtle shimmer against a dark vintage shop interior.',
  tags: ['kinetic', 'typography', 'storefront', 'gold', 'leaf', 'window', 'vintage', 'shop', 'signage', 'gilded'],
  category: 'captions',
  component: StorefrontComponent as any,
  defaultConfig: {
    words: ['BESPOKE', 'CURATED', 'ARTISAN', 'FINEST'],
    colors: ['#C9A94E', '#D4A942', '#E8C84A', '#F5D66A'],
    bgColor: '#0f0c08',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BESPOKE', 'CURATED', 'ARTISAN', 'FINEST'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C9A94E', '#D4A942', '#E8C84A', '#F5D66A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0c08', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
