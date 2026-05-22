import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface VogueTitleConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Subtle diagonal shimmer line
    const shimmerAngle = 25
    const shimmerPos = ((time * 40) % (width * 2)) - width * 0.5
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Subtle horizontal rules -- magazine trim marks */}
        <div
          style={{
            position: 'absolute',
            top: '12%',
            left: '10%',
            right: '10%',
            height: 0.5,
            background: 'rgba(255,255,255,0.06)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '12%',
            left: '10%',
            right: '10%',
            height: 0.5,
            background: 'rgba(255,255,255,0.06)',
          }}
        />
        {/* Moving light shimmer */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: shimmerPos,
            width: 120,
            background: `linear-gradient(${shimmerAngle}deg, transparent, rgba(255,255,255,0.02), rgba(255,255,255,0.04), rgba(255,255,255,0.02), transparent)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width }: WordRenderProps) => {
    const letters = word.split('')
    const letterCount = letters.length

    // Ultra-condensed serif, dramatic center-out reveal
    if (phase === 'enter') {
      // Letters reveal from center outward
      const midIndex = (letterCount - 1) / 2
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'baseline',
            fontFamily: "'Didot', 'Bodoni MT', 'Playfair Display', 'Georgia', serif",
            fontSize: 'clamp(48px, 14vw, 200px)',
            fontWeight: 900,
            fontStyle: 'normal',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color,
            whiteSpace: 'nowrap',
            lineHeight: 0.9,
          }}
        >
          {letters.map((letter, i) => {
            // Distance from center determines reveal order
            const distFromCenter = Math.abs(i - midIndex) / (midIndex || 1)
            const letterDelay = distFromCenter * 0.6
            const letterProg = Math.max(0, Math.min(1, (enterProgress - letterDelay) / (1 - letterDelay + 0.01)))
            const scaleY = 0.3 + letterProg * 0.7
            const clipTop = (1 - letterProg) * 50
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  opacity: letterProg > 0.01 ? 1 : 0,
                  transform: `scaleY(${scaleY})`,
                  transformOrigin: 'center center',
                  clipPath: `inset(${clipTop}% 0 ${clipTop}% 0)`,
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
      // Subtle weight breathing and thin underline
      const breathe = Math.sin(holdProgress * Math.PI * 2) * 0.01
      const underlineWidth = 40 + Math.sin(holdProgress * Math.PI) * 10
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scaleY(${1 + breathe})`,
          }}
        >
          <div
            style={{
              fontFamily: "'Didot', 'Bodoni MT', 'Playfair Display', 'Georgia', serif",
              fontSize: 'clamp(48px, 14vw, 200px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color,
              whiteSpace: 'nowrap',
              lineHeight: 0.9,
            }}
          >
            {word}
          </div>
          {/* Thin editorial underline */}
          <div
            style={{
              margin: '12px auto 0',
              width: underlineWidth,
              height: 1,
              background: color,
              opacity: 0.6,
            }}
          />
        </div>
      )
    }

    // Exit: vertical collapse back to center
    const scaleY = 1 - exitProgress * 0.7
    const clipTop = exitProgress * 50
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scaleY(${scaleY})`,
          opacity: 1 - exitProgress,
          fontFamily: "'Didot', 'Bodoni MT', 'Playfair Display', 'Georgia', serif",
          fontSize: 'clamp(48px, 14vw, 200px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color,
          whiteSpace: 'nowrap',
          lineHeight: 0.9,
          clipPath: `inset(${clipTop}% 0 ${clipTop}% 0)`,
        }}
      >
        {word}
      </div>
    )
  },
}

function KineticVogueTitleComponent(props: MotionGraphicProps<VogueTitleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-vogue-title',
  title: 'Vogue Title',
  description: 'Vogue magazine title card with ultra-condensed serif, dramatic center-out vertical reveal with editorial trim marks.',
  tags: ['kinetic', 'typography', 'fashion', 'vogue', 'magazine', 'serif', 'editorial', 'luxury'],
  category: 'captions',
  component: KineticVogueTitleComponent as any,
  defaultConfig: {
    words: ['VOGUE', 'STYLE', 'ALLURE', 'ICON'],
    colors: ['#FAFAFA', '#FAFAFA', '#FAFAFA', '#FAFAFA'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['VOGUE', 'STYLE', 'ALLURE', 'ICON'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FAFAFA', '#FAFAFA', '#FAFAFA', '#FAFAFA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
  ],
})
