import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GoldLeafRevealConfig extends KineticBaseConfig {
  foilColor: string
}

/* ---------- Easing curves ---------- */

// Champagne pour — accelerates then glides to rest
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

// Silk draped — smooth cubic, no bounce
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// Gentle fadeout — exponential deceleration
function easeInQuad(t: number): number {
  return t * t
}

/* ---------- Deterministic pseudo-random ---------- */
function seededRand(seed: number): number {
  return (Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Subtle brushed texture — horizontal scan lines mimicking brushed metal/paper */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 3px,
              rgba(212, 175, 55, 0.012) 3px,
              rgba(212, 175, 55, 0.012) 4px
            )`,
          }}
        />

        {/* Vignette — frames composition like a luxury lookbook */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.45) 100%)`,
          }}
        />

        {/* Corner ornament marks — top-left and bottom-right */}
        <svg
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        >
          {/* Top-left corner mark */}
          <line x1={24} y1={24} x2={52} y2={24} stroke="rgba(212,175,55,0.18)" strokeWidth={1} />
          <line x1={24} y1={24} x2={24} y2={52} stroke="rgba(212,175,55,0.18)" strokeWidth={1} />
          {/* Bottom-right corner mark */}
          <line x1={width - 24} y1={height - 24} x2={width - 52} y2={height - 24} stroke="rgba(212,175,55,0.18)" strokeWidth={1} />
          <line x1={width - 24} y1={height - 24} x2={width - 24} y2={height - 52} stroke="rgba(212,175,55,0.18)" strokeWidth={1} />

          {/* Hairline rule across the bottom — editorial footer line */}
          <line
            x1={width * 0.15}
            y1={height - 36}
            x2={width * 0.85}
            y2={height - 36}
            stroke={`rgba(212, 175, 55, ${0.1 + Math.sin(time * 0.8) * 0.03})`}
            strokeWidth={0.5}
          />
        </svg>
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    width,
    height,
  }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const fontSize = Math.min(width / (totalChars * 0.62), 144)

    // Gold foil sweep: a bright vertical bar moves left-to-right, characters
    // appear beneath it as it passes — letter-by-letter reveal.
    const foilSweepX =
      phase === 'enter'
        ? easeOutQuart(enterProgress) * (width * 1.1)
        : phase === 'hold'
        ? width * 1.1
        : width * 1.1

    // Thin hairline under text — animates in from center
    const underlineScale =
      phase === 'enter'
        ? easeOutQuart(Math.max(0, (enterProgress - 0.5) / 0.5))
        : phase === 'hold'
        ? 1
        : 1 - easeInQuad(exitProgress)

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Characters — each revealed as foil sweep passes */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 0,
          }}
        >
          {chars.map((char, ci) => {
            const charW = fontSize * 0.62
            const textBlockLeft = width / 2 - (totalChars * charW) / 2
            const charMidX = textBlockLeft + ci * charW + charW / 2
            const charSeed = Math.abs(seededRand(ci * 127.1 + index * 311.7))

            let charOpacity = 0
            let charBlur = 0
            let yOffset = 0
            let scaleY = 1

            if (phase === 'enter') {
              // Character becomes visible once the foil sweep has passed over it
              const revealThreshold = charMidX
              const rawReveal = (foilSweepX - revealThreshold) / (charW * 2.5)
              const t = Math.max(0, Math.min(1, rawReveal))
              charOpacity = easeOutQuart(t)
              charBlur = (1 - t) * 2.5
              // Tiny upward settle as it appears — like gilding settling
              yOffset = (1 - easeOutQuart(t)) * 6
            } else if (phase === 'hold') {
              charOpacity = 1
              // Imperceptible breathing — a luxury watch ticking
              yOffset = Math.sin(holdProgress * Math.PI * 2 + ci * 0.4) * 0.8
              scaleY = 1 + Math.sin(holdProgress * Math.PI * 2.5 + ci * 0.6) * 0.003
            } else {
              // Exit: characters dissolve upward — like gold leaf lifting away
              const t = Math.max(0, Math.min(1, (exitProgress - ci * 0.04) / (1 - ci * 0.025)))
              const eased = easeInQuad(Math.min(1, t))
              charOpacity = 1 - eased
              yOffset = -eased * 14
              charBlur = eased * 1.5
            }

            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Didot', 'Bodoni MT', 'Times New Roman', serif",
                  fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                  fontWeight: 400,
                  color,
                  letterSpacing: '0.16em',
                  opacity: charOpacity,
                  transform: `translateY(${yOffset}px) scaleY(${scaleY})`,
                  filter: charBlur > 0.15 ? `blur(${charBlur}px)` : undefined,
                  textShadow: `0 1px 20px rgba(212,175,55,0.2)`,
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            )
          })}
        </div>

        {/* Foil sweep bar — glows as it passes */}
        {phase === 'enter' && enterProgress < 0.98 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: foilSweepX - width * 0.04,
              width: width * 0.08,
              background: `linear-gradient(90deg,
                transparent 0%,
                rgba(212,175,55,0.08) 30%,
                rgba(255,235,120,0.18) 50%,
                rgba(212,175,55,0.08) 70%,
                transparent 100%
              )`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Hairline underline — slides out from center after text is revealed */}
        <div
          style={{
            position: 'absolute',
            top: `calc(50% + ${fontSize * 0.55}px)`,
            left: '50%',
            width: `${Math.min(totalChars * fontSize * 0.62 * 0.85, width * 0.7)}px`,
            height: '0.5px',
            background: `linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)`,
            transform: `translateX(-50%) scaleX(${underlineScale})`,
            transformOrigin: 'center',
          }}
        />
      </div>
    )
  },
}

function GoldLeafRevealComponent(props: MotionGraphicProps<GoldLeafRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-gold-leaf-reveal',
  title: 'Gold Leaf Reveal',
  description:
    'A gold foil sweep moves across the frame, revealing each character as it passes — like luxury packaging being gilded. Didot serif, hairline underline, corner ornament marks. Premium product launch and editorial use.',
  tags: [
    'kinetic',
    'typography',
    'luxury',
    'gold',
    'foil',
    'editorial',
    'fashion',
    'reveal',
    'serif',
    'premium',
    'brand',
  ],
  category: 'captions',
  component: GoldLeafRevealComponent as any,
  defaultConfig: {
    words: ['MAISON', 'ÉLITE', 'SAISON', 'LUMIÈRE'],
    colors: ['#E8D5A0', '#F0E0B0', '#E0C880', '#EDD898'],
    bgColor: '#0A0806',
    cycleDuration: 1.8,
    foilColor: '#D4AF37',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['MAISON', 'ÉLITE', 'SAISON', 'LUMIÈRE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#E8D5A0', '#F0E0B0', '#E0C880', '#EDD898'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0806', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'foilColor',
      label: 'Foil Color',
      type: 'color',
      defaultValue: '#D4AF37',
      group: 'Style',
    },
  ],
})
