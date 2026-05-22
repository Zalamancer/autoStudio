import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PerfumeAdConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Slowly drifting soft focus bloom circles
    const bloom1X = 50 + Math.sin(time * 0.3) * 15
    const bloom1Y = 50 + Math.cos(time * 0.25) * 10
    const bloom2X = 40 + Math.cos(time * 0.2) * 20
    const bloom2Y = 60 + Math.sin(time * 0.35) * 12

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Soft gold bloom 1 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 40% 50% at ${bloom1X}% ${bloom1Y}%, rgba(212,175,55,0.06) 0%, transparent 70%)`,
          }}
        />
        {/* Soft gold bloom 2 */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 35% 45% at ${bloom2X}% ${bloom2Y}%, rgba(212,175,55,0.04) 0%, transparent 65%)`,
          }}
        />
        {/* Deep vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 60% 55% at 50% 50%, transparent 30%, rgba(0,0,0,0.5) 100%)',
          }}
        />
        {/* Gold dust particles -- static dots with shimmer */}
        {Array.from({ length: 12 }).map((_, i) => {
          const px = ((i * 73 + 17) % 100)
          const py = ((i * 47 + 31) % 100)
          const flicker = Math.sin(time * (1.5 + i * 0.3) + i * 2.1) * 0.5 + 0.5
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${px}%`,
                top: `${py}%`,
                width: 2,
                height: 2,
                borderRadius: '50%',
                background: '#D4AF37',
                opacity: flicker * 0.15,
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    let opacity = 0
    let blur = 0
    let scale = 1
    let shimmerPos = -20

    if (phase === 'enter') {
      // Emerge from soft focus blur
      const eased = 1 - Math.pow(1 - enterProgress, 2.5)
      opacity = eased
      blur = (1 - eased) * 8
      scale = 0.97 + eased * 0.03
    } else if (phase === 'hold') {
      opacity = 1
      blur = 0
      scale = 1
      // Gold shimmer sweep across text
      shimmerPos = -10 + holdProgress * 120
    } else {
      // Dissolve back into soft focus
      const eased = exitProgress * exitProgress
      opacity = 1 - eased
      blur = eased * 10
      scale = 1 + eased * 0.02
    }

    // Gold gradient for shimmer during hold
    const useGoldShimmer = phase === 'hold'
    const textStyle: React.CSSProperties = {
      fontFamily: "'Didot', 'Bodoni MT', 'Playfair Display', 'Georgia', serif",
      fontSize: 'clamp(32px, 9vw, 120px)',
      fontWeight: 300,
      fontStyle: 'italic',
      textTransform: 'uppercase',
      letterSpacing: '0.2em',
      whiteSpace: 'nowrap',
      lineHeight: 1.1,
    }

    if (useGoldShimmer) {
      Object.assign(textStyle, {
        backgroundImage: `linear-gradient(90deg, ${color} 0%, ${color} ${shimmerPos - 12}%, #D4AF37 ${shimmerPos - 4}%, #FFF8DC ${shimmerPos}%, #D4AF37 ${shimmerPos + 4}%, ${color} ${shimmerPos + 12}%, ${color} 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      })
    } else {
      textStyle.color = color
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          filter: `blur(${blur}px)`,
          textAlign: 'center',
        }}
      >
        {/* Thin decorative line above */}
        <div
          style={{
            width: 30,
            height: 0.5,
            background: '#D4AF37',
            opacity: 0.4,
            margin: '0 auto 14px',
          }}
        />
        {/* Brand name */}
        <div style={textStyle}>{word}</div>
        {/* Tagline below */}
        <div
          style={{
            fontFamily: "'Helvetica Neue', 'Inter', sans-serif",
            fontSize: 'clamp(8px, 2vw, 16px)',
            fontWeight: 300,
            textTransform: 'uppercase',
            letterSpacing: '0.5em',
            color: '#D4AF37',
            opacity: 0.5,
            marginTop: 16,
          }}
        >
          Eau de Parfum
        </div>
      </div>
    )
  },
}

function KineticPerfumeAdComponent(props: MotionGraphicProps<PerfumeAdConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-perfume-ad',
  title: 'Perfume Ad',
  description: 'Luxury perfume advertisement text with soft focus bloom, gold shimmer particles on black. Italic serif with elegant reveal.',
  tags: ['kinetic', 'typography', 'fashion', 'perfume', 'luxury', 'gold', 'bloom', 'elegant'],
  category: 'captions',
  component: KineticPerfumeAdComponent as any,
  defaultConfig: {
    words: ['CHANEL', 'NOIR', 'ABSOLU', 'MYSTÈRE'],
    colors: ['#E8DCC8', '#E8DCC8', '#E8DCC8', '#E8DCC8'],
    bgColor: '#050505',
    cycleDuration: 2.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CHANEL', 'NOIR', 'ABSOLU', 'MYSTÈRE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8DCC8', '#E8DCC8', '#E8DCC8', '#E8DCC8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050505', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.2, min: 0.5, max: 5, group: 'Timing' },
  ],
})
