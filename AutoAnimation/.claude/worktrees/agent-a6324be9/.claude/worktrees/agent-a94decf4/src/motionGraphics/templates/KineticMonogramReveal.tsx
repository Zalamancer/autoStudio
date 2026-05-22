import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MonogramRevealConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Slowly rotating subtle diamond pattern overlay
    const rotation = time * 2
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Centered diamond frame */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 'min(70vw, 380px)',
            height: 'min(70vw, 380px)',
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            border: '0.5px solid rgba(212,175,55,0.08)',
            borderRadius: 2,
          }}
        />
        {/* Second diamond offset */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 'min(55vw, 300px)',
            height: 'min(55vw, 300px)',
            transform: `translate(-50%, -50%) rotate(${45 + rotation * 0.5}deg)`,
            border: '0.5px solid rgba(212,175,55,0.05)',
            borderRadius: 2,
          }}
        />
        {/* Subtle radial vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 50%, transparent 30%, rgba(0,0,0,0.25) 100%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    const letters = word.split('')
    const letterCount = letters.length
    if (letterCount === 0) return null

    // Monogram: during enter, letters overlap at center then separate
    // During hold, full word is displayed
    // During exit, letters collapse back to monogram then fade

    if (phase === 'enter') {
      // All letters start stacked at center, then spread apart
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      const maxSpread = letterCount > 1 ? 0.6 : 0 // em units of final spacing

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {letters.map((letter, i) => {
            const centerOffset = i - (letterCount - 1) / 2
            const spreadPx = centerOffset * eased * 52 // pixels of spread
            const rotation = (1 - eased) * centerOffset * 15 // slight rotation when stacked
            const letterScale = 1 + (1 - eased) * 0.3 // slightly larger when overlapping
            const letterOpacity = Math.min(1, enterProgress * 3)

            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  position: letterCount > 1 ? 'absolute' : 'relative',
                  transform: `translateX(${spreadPx}px) rotate(${rotation}deg) scale(${letterScale})`,
                  fontFamily: "'Didot', 'Bodoni MT', 'Playfair Display', 'Georgia', serif",
                  fontSize: 'clamp(56px, 14vw, 180px)',
                  fontWeight: 400,
                  textTransform: 'uppercase',
                  color,
                  opacity: letterOpacity,
                  lineHeight: 1,
                }}
              >
                {letter}
              </span>
            )
          })}
        </div>
      )
    }

    if (phase === 'hold') {
      // Full word displayed elegantly with subtle gold underline pulse
      const underlineOpacity = 0.3 + Math.sin(holdProgress * Math.PI * 2) * 0.15
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontFamily: "'Didot', 'Bodoni MT', 'Playfair Display', 'Georgia', serif",
              fontSize: 'clamp(56px, 14vw, 180px)',
              fontWeight: 400,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color,
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
          >
            {word}
          </div>
          {/* Ornamental double-line below */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginTop: 14 }}>
            <div style={{ width: 50, height: 0.5, background: '#D4AF37', opacity: underlineOpacity }} />
            <div style={{ width: 30, height: 0.5, background: '#D4AF37', opacity: underlineOpacity * 0.6 }} />
          </div>
        </div>
      )
    }

    // Exit: collapse back to monogram stack, then fade
    const eased = exitProgress * exitProgress
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 1 - exitProgress,
        }}
      >
        {letters.map((letter, i) => {
          const centerOffset = i - (letterCount - 1) / 2
          const spreadPx = centerOffset * (1 - eased) * 52
          const rotation = eased * centerOffset * 15
          const letterScale = 1 + eased * 0.3

          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                position: letterCount > 1 ? 'absolute' : 'relative',
                transform: `translateX(${spreadPx}px) rotate(${rotation}deg) scale(${letterScale})`,
                fontFamily: "'Didot', 'Bodoni MT', 'Playfair Display', 'Georgia', serif",
                fontSize: 'clamp(56px, 14vw, 180px)',
                fontWeight: 400,
                textTransform: 'uppercase',
                color,
                lineHeight: 1,
              }}
            >
              {letter}
            </span>
          )
        })}
      </div>
    )
  },
}

function KineticMonogramRevealComponent(props: MotionGraphicProps<MonogramRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-monogram-reveal',
  title: 'Monogram Reveal',
  description: 'Interlocking monogram letters stacked at center that separate to reveal the full word. Luxury brand logo reveal style.',
  tags: ['kinetic', 'typography', 'fashion', 'monogram', 'luxury', 'brand', 'logo', 'reveal'],
  category: 'captions',
  component: KineticMonogramRevealComponent as any,
  defaultConfig: {
    words: ['LV', 'GG', 'CD', 'YSL'],
    colors: ['#D4AF37', '#D4AF37', '#D4AF37', '#D4AF37'],
    bgColor: '#0C0C0C',
    cycleDuration: 2,
  },
  configSchema: [
    { key: 'words', label: 'Monograms', type: 'text-array', defaultValue: ['LV', 'GG', 'CD', 'YSL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D4AF37', '#D4AF37', '#D4AF37', '#D4AF37'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0C0C0C', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2, min: 0.5, max: 5, group: 'Timing' },
  ],
})
