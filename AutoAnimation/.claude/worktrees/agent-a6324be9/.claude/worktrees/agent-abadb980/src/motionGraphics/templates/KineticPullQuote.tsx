import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PullQuoteConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Magazine page texture: faint column guides */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          bottom: '10%',
          left: '15%',
          width: 0.5,
          background: 'rgba(180,160,140,0.08)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '10%',
          bottom: '10%',
          right: '15%',
          width: 0.5,
          background: 'rgba(180,160,140,0.08)',
        }}
      />
      {/* Thin horizontal rules framing the quote area */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '18%',
          right: '18%',
          height: 0.5,
          background: 'rgba(180,160,140,0.06)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '30%',
          left: '18%',
          right: '18%',
          height: 0.5,
          background: 'rgba(180,160,140,0.06)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    // Oversized quotation marks that frame the pull quote
    let quoteScale = 0
    let quoteOpacity = 0
    let textScale = 0
    let textOpacity = 0
    let ruleWidth = 0

    if (phase === 'enter') {
      // Quotes scale in first, then text scales up from center
      const quotePhase = Math.min(1, enterProgress * 2.5)
      quoteScale = 0.3 + quotePhase * 0.7
      quoteOpacity = Math.min(1, quotePhase * 1.5)

      const textPhase = Math.max(0, (enterProgress - 0.3) / 0.7)
      textScale = 0.4 + textPhase * 0.6
      textOpacity = Math.min(1, textPhase * 2)
      ruleWidth = textPhase * 100
    } else if (phase === 'hold') {
      quoteScale = 1
      quoteOpacity = 1
      textScale = 1
      textOpacity = 1
      ruleWidth = 100
      // Gentle breathing on quote marks
      quoteScale = 1 + Math.sin(holdProgress * Math.PI * 2) * 0.03
    } else {
      const fadeOut = 1 - exitProgress
      quoteScale = 1 - exitProgress * 0.3
      quoteOpacity = fadeOut
      textScale = 1
      textOpacity = fadeOut
      ruleWidth = fadeOut * 100
    }

    const quoteMarkStyle: React.CSSProperties = {
      fontFamily: "'Georgia', 'Playfair Display', serif",
      fontSize: 'clamp(80px, 22vw, 280px)',
      fontWeight: 700,
      color,
      opacity: quoteOpacity * 0.25,
      lineHeight: 0.6,
      transform: `scale(${quoteScale})`,
      transition: 'none',
    }

    return (
      <>
        {/* Opening quote mark */}
        <div
          style={{
            position: 'absolute',
            top: '18%',
            left: '12%',
            ...quoteMarkStyle,
            transformOrigin: 'top left',
          }}
        >
          {'\u201C'}
        </div>
        {/* Closing quote mark */}
        <div
          style={{
            position: 'absolute',
            bottom: '18%',
            right: '12%',
            ...quoteMarkStyle,
            transformOrigin: 'bottom right',
          }}
        >
          {'\u201D'}
        </div>
        {/* Top decorative rule */}
        <div
          style={{
            position: 'absolute',
            top: '35%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: `${ruleWidth * 0.4}%`,
            maxWidth: '60%',
            height: 1.5,
            background: color,
            opacity: textOpacity * 0.3,
          }}
        />
        {/* The word itself, scaling in from center */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${textScale})`,
            opacity: textOpacity,
            fontFamily: "'Georgia', 'Playfair Display', serif",
            fontSize: 'clamp(38px, 10vw, 140px)',
            fontWeight: 400,
            fontStyle: 'italic',
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.05em',
            lineHeight: 1,
          }}
        >
          {word}
        </div>
        {/* Bottom decorative rule */}
        <div
          style={{
            position: 'absolute',
            bottom: '35%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: `${ruleWidth * 0.4}%`,
            maxWidth: '60%',
            height: 1.5,
            background: color,
            opacity: textOpacity * 0.3,
          }}
        />
        {/* Attribution line */}
        <div
          style={{
            position: 'absolute',
            bottom: '28%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Helvetica Neue', 'Inter', sans-serif",
            fontSize: 'clamp(10px, 2.5vw, 18px)',
            fontWeight: 300,
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
            color,
            opacity: textOpacity * 0.35,
            whiteSpace: 'nowrap',
          }}
        >
          {'\u2014 THE EDITOR'}
        </div>
      </>
    )
  },
}

function PullQuoteComponent(props: MotionGraphicProps<PullQuoteConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pull-quote',
  title: 'Pull Quote',
  description: 'Magazine pull quote with oversized curly quotation marks framing italic serif text that scales in from center. Print editorial layout.',
  tags: ['kinetic', 'typography', 'magazine', 'editorial', 'quote', 'print', 'serif', 'pull-quote'],
  category: 'captions',
  component: PullQuoteComponent as any,
  defaultConfig: {
    words: ['ELEGANCE', 'TIMELESS', 'REFINED', 'PROSE'],
    colors: ['#2C2C2C', '#2C2C2C', '#2C2C2C', '#2C2C2C'],
    bgColor: '#FAF6F0',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ELEGANCE', 'TIMELESS', 'REFINED', 'PROSE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2C2C2C', '#2C2C2C', '#2C2C2C', '#2C2C2C'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FAF6F0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
