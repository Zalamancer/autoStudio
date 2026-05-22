import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FootnoteConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Simulated academic page body text — blurred lines */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${12 + i * 5}%`,
            left: '15%',
            right: '15%',
            height: 2.5,
            background: 'rgba(0,0,0,0.05)',
            borderRadius: 1,
          }}
        />
      ))}
      {/* Superscript reference number in body text */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          right: '32%',
          fontFamily: "'Georgia', serif",
          fontSize: 'clamp(8px, 2vw, 14px)',
          fontWeight: 700,
          color: 'rgba(0,0,0,0.15)',
          verticalAlign: 'super',
        }}
      >
        {'*'}
      </div>
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width }: WordRenderProps) => {
    // Footnote appears at the bottom, separated by a thin rule
    let ruleWidth = 0
    let superOpacity = 0
    let textOpacity = 0
    let textY = 0

    if (phase === 'enter') {
      // Rule draws from left first
      ruleWidth = Math.min(1, enterProgress * 3)

      // Superscript number fades in
      superOpacity = Math.max(0, (enterProgress - 0.15) / 0.35)
      superOpacity = Math.min(1, superOpacity)

      // Footnote text rises up from below
      const textPhase = Math.max(0, (enterProgress - 0.35) / 0.65)
      const textEase = 1 - Math.pow(1 - textPhase, 2)
      textOpacity = textEase
      textY = (1 - textEase) * 20
    } else if (phase === 'hold') {
      ruleWidth = 1
      superOpacity = 1
      textOpacity = 1
      textY = 0
    } else {
      const fade = 1 - exitProgress
      ruleWidth = fade
      superOpacity = fade
      textOpacity = fade
      textY = exitProgress * 12
    }

    const footnoteNumber = (index % 9) + 1

    return (
      <>
        {/* Superscript reference in the body area */}
        <div
          style={{
            position: 'absolute',
            top: '28%',
            left: '55%',
            fontFamily: "'Georgia', serif",
            fontSize: 'clamp(14px, 3.5vw, 28px)',
            fontWeight: 700,
            color,
            opacity: superOpacity * 0.7,
            lineHeight: 1,
          }}
        >
          <sup>{footnoteNumber}</sup>
        </div>

        {/* Horizontal separator rule */}
        <div
          style={{
            position: 'absolute',
            bottom: '35%',
            left: '12%',
            width: `${ruleWidth * 30}%`,
            height: 0.75,
            background: color,
            opacity: 0.4,
          }}
        />

        {/* Footnote number at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: `${28 - textY * 0.05}%`,
            left: '12%',
            fontFamily: "'Georgia', serif",
            fontSize: 'clamp(11px, 2.5vw, 20px)',
            fontWeight: 700,
            color,
            opacity: superOpacity * 0.6,
            transform: `translateY(${textY}px)`,
          }}
        >
          {footnoteNumber}.
        </div>

        {/* Footnote text — the word itself */}
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            left: '15%',
            right: '15%',
            transform: `translateY(${textY}px)`,
            opacity: textOpacity,
          }}
        >
          <div
            style={{
              fontFamily: "'Georgia', 'Palatino', serif",
              fontSize: 'clamp(32px, 8vw, 110px)',
              fontWeight: 400,
              fontStyle: 'italic',
              color,
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
            }}
          >
            {word}
          </div>
          {/* Secondary line — fake citation */}
          <div
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(8px, 1.8vw, 14px)',
              color,
              opacity: textOpacity * 0.35,
              marginTop: 6,
              fontStyle: 'italic',
            }}
          >
            {'Ibid., vol.\u00A0III, pp.\u00A0127\u2013134.'}
          </div>
        </div>
      </>
    )
  },
}

function FootnoteComponent(props: MotionGraphicProps<FootnoteConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-footnote',
  title: 'Footnote',
  description: 'Academic footnote with superscript reference number, horizontal separator rule, and italic citation text. Scholarly print typography.',
  tags: ['kinetic', 'typography', 'footnote', 'academic', 'editorial', 'print', 'book', 'scholarly'],
  category: 'captions',
  component: FootnoteComponent as any,
  defaultConfig: {
    words: ['ERRATA', 'ADDENDUM', 'SUPRA', 'PASSIM'],
    colors: ['#1A1A1A', '#1A1A1A', '#1A1A1A', '#1A1A1A'],
    bgColor: '#FAFAF5',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ERRATA', 'ADDENDUM', 'SUPRA', 'PASSIM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1A1A1A', '#1A1A1A', '#1A1A1A', '#1A1A1A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FAFAF5', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
