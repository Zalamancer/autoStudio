import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BrandRevealConfig extends KineticBaseConfig {
  pattern: string
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => {
    const cfg = (globalThis as any).__brandRevealCfg ?? { pattern: 'houndstooth' }
    const p = cfg.pattern || 'houndstooth'

    const c = 'rgba(255,255,255,0.15)'
    const c2 = 'rgba(255,255,255,0.10)'
    const c3 = 'rgba(255,255,255,0.20)'

    const patterns: Record<string, React.CSSProperties> = {
      houndstooth: {
        backgroundImage: `
          linear-gradient(45deg, ${c} 25%, transparent 25%),
          linear-gradient(-45deg, ${c} 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, ${c} 75%),
          linear-gradient(-45deg, transparent 75%, ${c} 75%)`,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0',
      },
      herringbone: {
        backgroundImage: `
          linear-gradient(135deg, ${c} 25%, transparent 25%),
          linear-gradient(225deg, ${c} 25%, transparent 25%),
          linear-gradient(315deg, ${c} 25%, transparent 25%),
          linear-gradient(45deg, ${c} 25%, transparent 25%)`,
        backgroundSize: '16px 8px',
        backgroundPosition: '0 0, 8px 0, 8px -4px, 0 4px',
      },
      pinstripe: {
        backgroundImage: `repeating-linear-gradient(
          90deg, transparent, transparent 14px, ${c2} 14px, ${c2} 16px)`,
      },
      plaid: {
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 24px, ${c2} 24px, ${c2} 26px),
          repeating-linear-gradient(90deg, transparent, transparent 24px, ${c2} 24px, ${c2} 26px),
          repeating-linear-gradient(0deg, transparent, transparent 48px, ${c} 48px, ${c} 51px),
          repeating-linear-gradient(90deg, transparent, transparent 48px, ${c} 48px, ${c} 51px)`,
      },
      argyle: {
        backgroundImage: `
          repeating-linear-gradient(120deg, ${c2}, ${c2} 1px, transparent 1px, transparent 30px),
          repeating-linear-gradient(60deg, ${c2}, ${c2} 1px, transparent 1px, transparent 30px),
          linear-gradient(45deg, ${c} 25%, transparent 25%, transparent 75%, ${c} 75%),
          linear-gradient(-45deg, ${c} 25%, transparent 25%, transparent 75%, ${c} 75%)`,
        backgroundSize: '30px 30px, 30px 30px, 40px 40px, 40px 40px',
      },
      chevron: {
        backgroundImage: `
          linear-gradient(135deg, ${c} 25%, transparent 25%),
          linear-gradient(225deg, ${c} 25%, transparent 25%)`,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 10px 0',
      },
      'diagonal-twill': {
        backgroundImage: `repeating-linear-gradient(
          45deg, transparent, transparent 8px, ${c} 8px, ${c} 11px)`,
      },
      gingham: {
        backgroundImage: `
          linear-gradient(0deg, ${c2} 50%, transparent 50%),
          linear-gradient(90deg, ${c2} 50%, transparent 50%)`,
        backgroundSize: '16px 16px',
      },
      windowpane: {
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 58px, ${c3} 58px, ${c3} 60px),
          repeating-linear-gradient(90deg, transparent, transparent 58px, ${c3} 58px, ${c3} 60px)`,
      },
      'basket-weave': {
        backgroundImage: `
          linear-gradient(45deg, ${c} 25%, transparent 25%, transparent 75%, ${c} 75%),
          linear-gradient(45deg, ${c} 25%, transparent 25%, transparent 75%, ${c} 75%)`,
        backgroundSize: '24px 24px',
        backgroundPosition: '0 0, 12px 12px',
      },
    }

    const patStyle = patterns[p] || patterns.houndstooth

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div style={{ position: 'absolute', inset: 0, ...patStyle }} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.4) 100%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // Phase 1 (0-60% of enter): outline clips in left-to-right
    // Phase 2 (40-100% of enter): fill fades in over the outline
    let clipRight = 100
    let fillOpacity = 0
    let letterSpacing = 0.3
    let lineWidth = 0

    if (phase === 'enter') {
      // Outline reveals across first 60% of enter
      const outlineP = Math.min(1, enterProgress / 0.6)
      const outlineEased = easeOutExpo(outlineP)
      clipRight = 100 - outlineEased * 100
      letterSpacing = 0.3 - outlineEased * 0.1

      // Fill starts at 40% of enter, completes at 100%
      const fillP = Math.max(0, (enterProgress - 0.4) / 0.6)
      fillOpacity = easeOutExpo(fillP)

      lineWidth = outlineEased * 100
    } else if (phase === 'hold') {
      clipRight = 0
      fillOpacity = 1
      letterSpacing = 0.2
      lineWidth = 100
    } else {
      const ep = easeInQuart(exitProgress)
      clipRight = 0
      fillOpacity = 1 - ep
      letterSpacing = 0.2 + ep * 0.1
      lineWidth = 100 - ep * 100
    }

    const fontStyle: React.CSSProperties = {
      fontFamily: "'Didot', 'Playfair Display', 'Georgia', serif",
      fontSize: 'clamp(32px, 7vw, 100px)',
      fontWeight: 400,
      letterSpacing: `${letterSpacing}em`,
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Outline layer — clips in left-to-right */}
        <div
          style={{
            ...fontStyle,
            clipPath: `inset(0 ${clipRight}% 0 0)`,
            color: 'transparent',
            WebkitTextStroke: `1px ${color}`,
          }}
        >
          {word}
        </div>

        {/* Fill layer — gold base */}
        <div
          style={{
            ...fontStyle,
            position: 'absolute',
            top: 0,
            left: 0,
            clipPath: `inset(0 ${clipRight}% 0 0)`,
            color,
            opacity: fillOpacity,
          }}
        >
          {word}
        </div>

        {/* Paper texture overlay ON the text */}
        <div
          style={{
            ...fontStyle,
            position: 'absolute',
            top: 0,
            left: 0,
            clipPath: `inset(0 ${clipRight}% 0 0)`,
            backgroundImage: 'url(/textures/paper-old.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(1.8) contrast(1.3)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            opacity: fillOpacity * 0.45,
            mixBlendMode: 'multiply',
          }}
        >
          {word}
        </div>

        {/* Thin accent line */}
        <div
          style={{
            width: `${lineWidth}%`,
            height: 1,
            background: color,
            opacity: 0.4,
            margin: '10px auto 0',
          }}
        />
      </div>
    )
  },
}

function BrandRevealComponent(props: MotionGraphicProps<BrandRevealConfig>) {
  ;(globalThis as any).__brandRevealCfg = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-soft-scale',
  title: 'Brand Reveal',
  description:
    'Outline draws in left-to-right, then fills with color. Elegant serif with accent underline. For brand names, product launches.',
  tags: ['kinetic', 'typography', 'brand', 'luxury', 'reveal', 'outline', 'serif', 'clean'],
  category: 'captions',
  component: BrandRevealComponent as any,
  defaultConfig: {
    words: ['CHANEL', 'HERMÈS', 'DIOR', 'PRADA'],
    colors: ['#d4af37', '#c9b97a', '#d4af37', '#c9b97a'],
    bgColor: '#0a0a0a',
    cycleDuration: 2.2,
    pattern: 'houndstooth',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['CHANEL', 'HERMÈS', 'DIOR', 'PRADA'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#d4af37', '#c9b97a', '#d4af37', '#c9b97a'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    {
      key: 'pattern',
      label: 'Fabric Pattern',
      type: 'select',
      defaultValue: 'houndstooth',
      options: [
        'houndstooth',
        'herringbone',
        'pinstripe',
        'plaid',
        'argyle',
        'chevron',
        'diagonal-twill',
        'gingham',
        'windowpane',
        'basket-weave',
      ],
      group: 'Style',
    },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.2,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
