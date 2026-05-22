import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WaxImpressConfig extends KineticBaseConfig {}

function easeOutBounce(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) { const t2 = t - 1.5 / 2.75; return 7.5625 * t2 * t2 + 0.75 }
  if (t < 2.5 / 2.75) { const t2 = t - 2.25 / 2.75; return 7.5625 * t2 * t2 + 0.9375 }
  const t2 = t - 2.625 / 2.75
  return 7.5625 * t2 * t2 + 0.984375
}

function easeInCubic(t: number): number {
  return t * t * t
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Parchment paper texture */}
        <div
          style={{
            position: 'absolute',
            inset: '8%',
            background: 'linear-gradient(170deg, #EDE4D0 0%, #E5DAC4 40%, #DDD0B8 100%)',
            borderRadius: 3,
            boxShadow: '0 3px 16px rgba(0,0,0,0.2), inset 0 1px 3px rgba(255,245,220,0.4)',
          }}
        >
          {/* Paper fiber lines */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `
                repeating-linear-gradient(175deg, transparent 0px, transparent 40px, rgba(180,160,130,0.04) 40px, rgba(180,160,130,0.04) 41px)
              `,
              borderRadius: 3,
              mixBlendMode: 'multiply' as const,
            }}
          />
          {/* Faint calligraphy text lines */}
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${15 + i * 10}%`,
                left: '15%',
                width: `${50 + rand(i * 31) * 20}%`,
                height: 1,
                background: `rgba(60,45,30,${0.04 + rand(i * 17) * 0.02})`,
              }}
            />
          ))}
          {/* Crease/fold line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: '50%',
              width: 1,
              background: 'linear-gradient(180deg, transparent 5%, rgba(0,0,0,0.02) 30%, rgba(0,0,0,0.03) 50%, rgba(0,0,0,0.02) 70%, transparent 95%)',
            }}
          />
        </div>
        {/* Wax drip stain on the paper from previous seals */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            right: '15%',
            width: 20,
            height: 24,
            background: 'rgba(139,26,26,0.04)',
            borderRadius: '40% 60% 70% 30%',
            transform: 'rotate(-10deg)',
          }}
        />
        {/* Candle flame flicker glow */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            right: '12%',
            width: 80,
            height: 80,
            background: `radial-gradient(circle, rgba(255,200,80,${0.04 + Math.sin(time * 4) * 0.02}), transparent 60%)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    let masterOpacity = 1
    let stampScale = 1
    let stampRotation = 0
    let waxOpacity = 0
    let embossDepth = 0
    let yPosition = 0

    if (phase === 'enter') {
      if (enterProgress < 0.3) {
        // Molten wax drips down to position
        const p = enterProgress / 0.3
        waxOpacity = p * 0.7
        stampScale = 0.6 + p * 0.1
        yPosition = (1 - p) * -30
        masterOpacity = p
      } else if (enterProgress < 0.6) {
        // Wax pools and spreads
        const p = (enterProgress - 0.3) / 0.3
        waxOpacity = 0.7 + p * 0.3
        stampScale = 0.7 + p * 0.15
        yPosition = 0
        masterOpacity = 1
      } else {
        // Stamp presses down with bounce — text impressed into wax
        const p = (enterProgress - 0.6) / 0.4
        const ep = easeOutBounce(p)
        waxOpacity = 1
        stampScale = 0.85 + ep * 0.15
        embossDepth = ep
        stampRotation = (1 - ep) * 3
        yPosition = 0
        masterOpacity = 1
      }
    } else if (phase === 'hold') {
      waxOpacity = 1
      embossDepth = 1
      stampScale = 1
      // Subtle wax cooling shimmer
      stampRotation = Math.sin(t * 1.5) * 0.4
      yPosition = Math.sin(t * 1.2 + index * 0.5) * 1
      masterOpacity = 1
    } else {
      // Wax cracks and crumbles away
      const ep = easeInCubic(exitProgress)
      waxOpacity = 1 - ep * 0.6
      embossDepth = 1 - ep * 0.3
      stampScale = 1 - ep * 0.15
      stampRotation = -ep * 8
      yPosition = ep * 15
      masterOpacity = 1 - ep
    }

    // Wax color derivation
    const waxColor = color

    // Irregular wax blob shape
    const blobPhase = t * 0.2 + index * 0.8
    const br1 = 44 + Math.sin(blobPhase) * 6
    const br2 = 56 - Math.sin(blobPhase * 1.2) * 5
    const br3 = 48 + Math.cos(blobPhase * 0.9) * 7
    const br4 = 52 - Math.cos(blobPhase * 1.1) * 4

    const chars = word.split('').map((ch, ci) => {
      // Per-character emboss timing stagger
      const charEmboss = Math.max(0, Math.min(1, embossDepth * 1.3 - ci * 0.08))

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color: 'transparent',
            WebkitTextStroke: `0.5px rgba(255,255,255,${charEmboss * 0.2})`,
            textShadow: charEmboss > 0.3
              ? `0 1px 1px rgba(255,255,255,${charEmboss * 0.3}), 0 -1px 1px rgba(0,0,0,${charEmboss * 0.4}), 0 0 3px rgba(0,0,0,${charEmboss * 0.15})`
              : 'none',
            opacity: charEmboss,
            transform: `scale(${0.9 + charEmboss * 0.1})`,
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: '55%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${stampScale}) rotate(${stampRotation}deg) translateY(${yPosition}px)`,
            opacity: masterOpacity,
          }}
        >
          {/* Wax blob */}
          <div
            style={{
              position: 'relative',
              padding: '20px 32px',
              borderRadius: `${br1}% ${br2}% ${br3}% ${br4}%`,
              background: waxOpacity > 0
                ? `radial-gradient(ellipse at 38% 32%, ${waxColor}DD, ${waxColor} 60%, ${waxColor}CC)`
                : 'transparent',
              opacity: waxOpacity,
              boxShadow: waxOpacity > 0.5
                ? `0 4px 14px rgba(0,0,0,0.3), inset 0 2px 6px rgba(255,255,255,0.08), inset 0 -3px 8px rgba(0,0,0,0.2)`
                : 'none',
              overflow: 'hidden',
            }}
          >
            {/* Wax surface sheen */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 'inherit',
                background: 'radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.15), transparent 45%)',
                mixBlendMode: 'screen' as const,
                pointerEvents: 'none',
              }}
            />
            {/* Wax drip edges */}
            {waxOpacity > 0.6 && [
              { bottom: '-8%', left: '20%', w: 18, h: 12 },
              { bottom: '-5%', right: '25%', w: 14, h: 10 },
              { top: '-6%', left: '55%', w: 12, h: 8 },
            ].map((drip, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  ...drip,
                  width: drip.w,
                  height: drip.h,
                  background: waxColor,
                  borderRadius: '50%',
                  opacity: 0.7,
                }}
              />
            ))}
            {/* Embossed rim ring */}
            {embossDepth > 0.5 && (
              <div
                style={{
                  position: 'absolute',
                  inset: '8%',
                  borderRadius: '50%',
                  border: `1px solid rgba(255,255,255,${embossDepth * 0.12})`,
                  boxShadow: `inset 0 1px 2px rgba(0,0,0,${embossDepth * 0.1})`,
                  pointerEvents: 'none',
                }}
              />
            )}
            {/* Text — impressed into wax surface */}
            <div
              style={{
                position: 'relative',
                fontFamily: "'Georgia', 'Palatino Linotype', serif",
                fontSize: 'clamp(40px, 12vw, 160px)',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                letterSpacing: 4,
                textTransform: 'uppercase',
                textAlign: 'center',
                zIndex: 2,
              }}
            >
              {chars}
            </div>
          </div>
        </div>
      </div>
    )
  },
}

function WaxImpressComponent(props: MotionGraphicProps<WaxImpressConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-wax-impress',
  title: 'Kinetic Wax Impress',
  description:
    'Molten wax drips and pools, then text is stamped/impressed into the wax with a bounce press. Large prominent embossed text, wax sheen, drip edges, and crumble exit.',
  tags: ['kinetic', 'typography', 'wax', 'seal', 'stamp', 'impress', 'handmade', 'warm', 'organic'],
  category: 'captions',
  component: WaxImpressComponent as any,
  defaultConfig: {
    words: ['SEAL', 'MARK', 'CREST', 'BOND'],
    colors: ['#8B1A1A', '#1A4A8B', '#2A6B3A', '#8B6B1A'],
    bgColor: '#2A2018',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SEAL', 'MARK', 'CREST', 'BOND'], group: 'Content' },
    { key: 'colors', label: 'Wax Colors', type: 'text-array', defaultValue: ['#8B1A1A', '#1A4A8B', '#2A6B3A', '#8B6B1A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2A2018', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
