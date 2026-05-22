import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BrandManifestoConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width }: BackgroundRenderProps) => {
    const time = frame / fps
    // Barely-visible slow horizontal scan line
    const scanY = ((time * 8) % 110) - 5
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 65% 60% at 50% 50%, transparent 40%, rgba(0,0,0,0.35) 100%)',
          }}
        />
        {/* Horizontal scan line */}
        <div
          style={{
            position: 'absolute',
            top: `${scanY}%`,
            left: 0,
            right: 0,
            height: 1,
            background: 'rgba(255,255,255,0.015)',
          }}
        />
        {/* Left margin line */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            bottom: '20%',
            left: '15%',
            width: 0.5,
            background: 'rgba(255,255,255,0.03)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    // Word-by-word reveal with extreme letter spacing
    // Each word appears alone with dramatic spacing, then compresses slightly during hold
    const letters = word.split('')
    const letterCount = letters.length

    if (phase === 'enter') {
      // Letters appear one by one from left, with extreme initial spacing
      const baseSpacing = 1.2 // em
      const enteredLetterCount = Math.floor(enterProgress * (letterCount + 1))
      const currentLetterProg = (enterProgress * (letterCount + 1)) % 1

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
            gap: '0.05em',
          }}
        >
          {letters.map((letter, i) => {
            let letterOpacity = 0
            let letterY = 0

            if (i < enteredLetterCount) {
              letterOpacity = 1
              letterY = 0
            } else if (i === enteredLetterCount) {
              letterOpacity = currentLetterProg
              letterY = (1 - currentLetterProg) * 6
            }

            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Helvetica Neue', 'Inter', 'Arial', sans-serif",
                  fontSize: 'clamp(28px, 7vw, 90px)',
                  fontWeight: 200,
                  textTransform: 'uppercase',
                  letterSpacing: `${baseSpacing}em`,
                  color,
                  opacity: letterOpacity,
                  transform: `translateY(${letterY}px)`,
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
      // Full word with breathing letter-spacing
      const breathe = Math.sin(holdProgress * Math.PI * 2) * 0.08
      const spacing = 0.8 + breathe

      // Subtle underline that extends
      const underlineWidth = 50 + holdProgress * 30

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
          {/* Manifesto word number */}
          <div
            style={{
              fontFamily: "'Helvetica Neue', 'Inter', sans-serif",
              fontSize: 'clamp(8px, 1.5vw, 12px)',
              fontWeight: 300,
              letterSpacing: '0.5em',
              color,
              opacity: 0.2,
              marginBottom: 16,
            }}
          >
            {String(index + 1).padStart(2, '0')}
          </div>
          {/* The word */}
          <div
            style={{
              fontFamily: "'Helvetica Neue', 'Inter', 'Arial', sans-serif",
              fontSize: 'clamp(28px, 7vw, 90px)',
              fontWeight: 200,
              textTransform: 'uppercase',
              letterSpacing: `${spacing}em`,
              color,
              whiteSpace: 'nowrap',
              lineHeight: 1,
            }}
          >
            {word}
          </div>
          {/* Thin centered line */}
          <div
            style={{
              width: underlineWidth,
              height: 0.5,
              background: color,
              opacity: 0.2,
              margin: '18px auto 0',
            }}
          />
        </div>
      )
    }

    // Exit: letters fade out one by one from ends toward center
    const midIndex = (letterCount - 1) / 2
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
          gap: '0.05em',
        }}
      >
        {letters.map((letter, i) => {
          // Letters furthest from center fade first
          const distFromCenter = Math.abs(i - midIndex) / (midIndex || 1)
          const fadeStart = (1 - distFromCenter) * 0.5 // outer letters start fading at 0
          const fadeDuration = 0.5
          const letterOpacity = Math.max(0, 1 - Math.max(0, (exitProgress - fadeStart) / fadeDuration))
          const letterY = (1 - letterOpacity) * -8

          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                fontFamily: "'Helvetica Neue', 'Inter', 'Arial', sans-serif",
                fontSize: 'clamp(28px, 7vw, 90px)',
                fontWeight: 200,
                textTransform: 'uppercase',
                letterSpacing: '0.8em',
                color,
                opacity: letterOpacity,
                transform: `translateY(${letterY}px)`,
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

function KineticBrandManifestoComponent(props: MotionGraphicProps<BrandManifestoConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-brand-manifesto',
  title: 'Brand Manifesto',
  description: 'Luxury brand manifesto with word-by-word letter reveal, extreme letter spacing, breathing animation. Aspirational brand messaging.',
  tags: ['kinetic', 'typography', 'fashion', 'brand', 'manifesto', 'luxury', 'minimal', 'spacing'],
  category: 'captions',
  component: KineticBrandManifestoComponent as any,
  defaultConfig: {
    words: ['BEAUTY', 'TRUTH', 'COURAGE', 'LEGACY'],
    colors: ['#FAFAFA', '#FAFAFA', '#FAFAFA', '#FAFAFA'],
    bgColor: '#080808',
    cycleDuration: 2.5,
  },
  configSchema: [
    { key: 'words', label: 'Manifesto Words', type: 'text-array', defaultValue: ['BEAUTY', 'TRUTH', 'COURAGE', 'LEGACY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FAFAFA', '#FAFAFA', '#FAFAFA', '#FAFAFA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080808', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
