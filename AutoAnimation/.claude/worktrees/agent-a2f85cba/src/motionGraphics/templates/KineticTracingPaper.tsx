import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TracingPaperConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Base layer — what's beneath the tracing paper (printed reference) */}
        <div
          style={{
            position: 'absolute',
            inset: '8%',
            background: '#f5f0e8',
            borderRadius: 2,
            boxShadow: '1px 2px 6px rgba(0,0,0,0.08)',
          }}
        >
          {/* Faint reference grid */}
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={`hg-${i}`}
              style={{
                position: 'absolute',
                top: `${8 + i * 8}%`,
                left: '5%',
                right: '5%',
                height: 1,
                background: 'rgba(180,200,220,0.2)',
              }}
            />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={`vg-${i}`}
              style={{
                position: 'absolute',
                left: `${10 + i * 12}%`,
                top: '5%',
                bottom: '5%',
                width: 1,
                background: 'rgba(180,200,220,0.15)',
              }}
            />
          ))}
          {/* Faint printed text underneath */}
          <div
            style={{
              position: 'absolute',
              top: '15%',
              left: '10%',
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 11,
              color: 'rgba(0,0,0,0.08)',
              lineHeight: 2.2,
              letterSpacing: 0.5,
            }}
          >
            ABCDEFGHIJKLMN<br />
            abcdefghijklmn<br />
            1234567890
          </div>
        </div>

        {/* Tracing paper overlay — translucent vellum */}
        <div
          style={{
            position: 'absolute',
            top: '6%',
            left: '7%',
            right: '9%',
            bottom: '7%',
            background: 'rgba(255, 252, 245, 0.72)',
            borderRadius: 1,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            // Vellum texture — subtle fibrous grain
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(200,195,180,0.04) 2px, rgba(200,195,180,0.04) 4px)',
          }}
        >
          {/* Paper edge shadow for translucency effect */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              border: '1px solid rgba(180,175,165,0.15)',
              borderRadius: 1,
              pointerEvents: 'none',
            }}
          />
          {/* Pencil smudge areas */}
          <div
            style={{
              position: 'absolute',
              top: '30%',
              right: '15%',
              width: 40,
              height: 20,
              background: 'rgba(120,115,105,0.04)',
              borderRadius: '50%',
              transform: 'rotate(-15deg)',
              filter: 'blur(6px)',
            }}
          />
        </div>

        {/* Tape holding tracing paper — top corners */}
        {[{ left: '10%' }, { right: '12%' }].map((pos, i) => (
          <div
            key={`tape-${i}`}
            style={{
              position: 'absolute',
              top: '5%',
              ...pos,
              width: 35,
              height: 14,
              background: 'rgba(255,255,220,0.35)',
              border: '1px solid rgba(200,195,170,0.2)',
              borderRadius: 1,
              transform: `rotate(${i === 0 ? -5 : 5}deg)`,
            }}
          />
        ))}
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
    width,
    height,
    frame,
  }: WordRenderProps) => {
    const f = frame ?? 0

    let opacity = 0
    let strokeProgress = 0
    let pencilPressure = 0

    if (phase === 'enter') {
      // Hand tracing — letters appear stroke by stroke
      strokeProgress = enterProgress
      opacity = Math.min(1, enterProgress * 1.5)
      pencilPressure = 0.4 + enterProgress * 0.6
    } else if (phase === 'hold') {
      strokeProgress = 1
      opacity = 1
      pencilPressure = 1
    } else {
      strokeProgress = 1
      opacity = 1 - exitProgress * 0.7
      pencilPressure = 1 - exitProgress * 0.4
    }

    const charsToShow = Math.ceil(strokeProgress * word.length)
    const displayChars = word.split('').map((ch, ci) => {
      if (ci >= charsToShow) return null
      // Each character has slight graphite variation
      const charPressure = pencilPressure * (0.85 + Math.sin(ci * 1.7) * 0.15)
      const wobbleX = Math.sin(ci * 2.3 + f * 0.01) * 0.8
      const wobbleY = Math.cos(ci * 1.9 + f * 0.01) * 0.6

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            transform: `translate(${wobbleX}px, ${wobbleY}px)`,
            opacity: charPressure,
            color: `rgba(60, 55, 50, ${charPressure * 0.85})`,
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          zIndex: 15,
        }}
      >
        {/* Graphite pencil text */}
        <div
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(26px, 7vw, 78px)',
            fontWeight: 400,
            fontStyle: 'italic',
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            // Pencil graphite sheen
            textShadow: '0 0 2px rgba(80,75,65,0.15)',
          }}
        >
          {displayChars}
        </div>

        {/* Pencil tip indicator during tracing */}
        {phase === 'enter' && charsToShow < word.length && (
          <div
            style={{
              position: 'absolute',
              bottom: -6,
              right: -4,
              width: 4,
              height: 4,
              background: 'rgba(80,75,65,0.3)',
              borderRadius: '50%',
              filter: 'blur(1px)',
            }}
          />
        )}
      </div>
    )
  },
}

function TracingPaperComponent(props: MotionGraphicProps<TracingPaperConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-tracing-paper',
  title: 'Kinetic Tracing Paper',
  description:
    'Translucent tracing vellum overlay with hand-traced pencil letterforms appearing stroke by stroke, graphite pressure variation, and reference grid visible beneath.',
  tags: ['kinetic', 'typography', 'tracing', 'paper', 'pencil', 'vellum', 'handwritten', 'craft'],
  category: 'captions',
  component: TracingPaperComponent as any,
  defaultConfig: {
    words: ['TRACE', 'SKETCH', 'DRAFT', 'FORM'],
    colors: ['#3c3732', '#3c3732', '#3c3732', '#3c3732'],
    bgColor: '#c8c2b6',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TRACE', 'SKETCH', 'DRAFT', 'FORM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#3c3732', '#3c3732', '#3c3732', '#3c3732'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#c8c2b6', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
