import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LuxuryBrandConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width }: BackgroundRenderProps) => {
    const time = frame / fps
    // Subtle gold shimmer sweep across background
    const sweepX = ((time * 60) % (width + 200)) - 100
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Very subtle vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.3) 100%)`,
          }}
        />
        {/* Gold shimmer sweep */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: sweepX,
            width: 80,
            background: `linear-gradient(90deg, transparent, rgba(212,175,55,0.03), rgba(212,175,55,0.06), rgba(212,175,55,0.03), transparent)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const letters = word.split('')
    const letterCount = letters.length

    if (phase === 'enter') {
      // Letters appear one by one with precision
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: '0.12em',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 300,
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
            color,
            whiteSpace: 'nowrap',
          }}
        >
          {letters.map((letter, i) => {
            const letterStart = i / letterCount
            const letterProg = Math.max(0, Math.min(1, (enterProgress - letterStart) / (1 / letterCount)))
            return (
              <span
                key={i}
                style={{
                  opacity: letterProg,
                  transform: `translateY(${(1 - letterProg) * 8}px)`,
                  display: 'inline-block',
                }}
              >
                {letter}
              </span>
            )
          })}
        </div>
      )
    }

    // Gold shimmer sweep during hold
    const shimmerPos = holdProgress * 120 - 10

    if (phase === 'hold') {
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 300,
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
            color,
            whiteSpace: 'nowrap',
            backgroundImage: `linear-gradient(90deg, ${color} 0%, ${color} ${shimmerPos - 15}%, #D4AF37 ${shimmerPos}%, ${color} ${shimmerPos + 15}%, ${color} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {word}
        </div>
      )
    }

    // Exit: elegant fade
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%)`,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(36px, 10vw, 130px)',
          fontWeight: 300,
          textTransform: 'uppercase',
          letterSpacing: '0.3em',
          color,
          whiteSpace: 'nowrap',
          opacity: 1 - exitProgress,
        }}
      >
        {word}
      </div>
    )
  },
}

function KineticLuxuryBrandComponent(props: MotionGraphicProps<LuxuryBrandConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-luxury-brand',
  title: 'Luxury Brand',
  description: 'Ultra-luxury brand text with thin serif, letters appearing one by one, gold shimmer sweep. Chanel/Gucci vibe.',
  tags: ['kinetic', 'typography', 'luxury', 'brand', 'fashion', 'gold', 'elegant'],
  category: 'captions',
  component: KineticLuxuryBrandComponent as any,
  defaultConfig: {
    words: ['CHANEL', 'HERMÈS', 'DIOR', 'PRADA'],
    colors: ['#D4AF37', '#D4AF37', '#D4AF37', '#D4AF37'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CHANEL', 'HERMÈS', 'DIOR', 'PRADA'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D4AF37', '#D4AF37', '#D4AF37', '#D4AF37'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
  ],
})
