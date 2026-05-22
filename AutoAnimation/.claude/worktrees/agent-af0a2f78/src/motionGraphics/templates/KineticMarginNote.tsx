import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MarginNoteConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Simulated book page body text (blurred placeholder lines) */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${18 + i * 5.2}%`,
            left: '25%',
            right: '25%',
            height: 3,
            background: 'rgba(0,0,0,0.06)',
            borderRadius: 1,
          }}
        />
      ))}
      {/* Margin line */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          bottom: '10%',
          right: '22%',
          width: 0.5,
          background: 'rgba(200,60,60,0.1)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    // Margin annotation slides in from the right edge
    let noteX = 0
    let noteOpacity = 0
    let bracketScale = 0
    let arrowLength = 0

    if (phase === 'enter') {
      // Note slides in from beyond right margin
      const slideEase = 1 - Math.pow(1 - enterProgress, 3)
      noteX = (1 - slideEase) * 80
      noteOpacity = Math.min(1, enterProgress * 3)

      // Bracket draws after note arrives
      bracketScale = Math.max(0, (enterProgress - 0.3) / 0.5)
      bracketScale = Math.min(1, bracketScale)

      // Arrow extends toward center
      arrowLength = Math.max(0, (enterProgress - 0.6) / 0.4)
    } else if (phase === 'hold') {
      noteOpacity = 1
      bracketScale = 1
      arrowLength = 1
      // Gentle bounce on the note
      noteX = Math.sin(holdProgress * Math.PI * 3) * 2
    } else {
      const fade = 1 - exitProgress
      noteX = exitProgress * 60
      noteOpacity = fade
      bracketScale = fade
      arrowLength = fade
    }

    const bracketHeight = Math.min(height * 0.25, 120)

    return (
      <>
        {/* Square bracket in the margin */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            right: '18%',
            transform: `translateY(-50%) scaleY(${bracketScale})`,
            transformOrigin: 'center',
            width: 8,
            height: bracketHeight,
            borderRight: `2px solid ${color}`,
            borderTop: `2px solid ${color}`,
            borderBottom: `2px solid ${color}`,
            opacity: noteOpacity * 0.6,
          }}
        />

        {/* Arrow line pointing from bracket toward center */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            right: `${18 + 2}%`,
            transform: 'translateY(-50%)',
            width: `${arrowLength * 12}%`,
            height: 1,
            background: color,
            opacity: noteOpacity * 0.3,
            transformOrigin: 'right center',
          }}
        />
        {/* Arrow head */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            right: `${18 + 2 + arrowLength * 12}%`,
            transform: 'translateY(-50%)',
            width: 0,
            height: 0,
            borderTop: '4px solid transparent',
            borderBottom: '4px solid transparent',
            borderRight: `6px solid ${color}`,
            opacity: noteOpacity * 0.3 * arrowLength,
          }}
        />

        {/* The annotation text in the right margin */}
        <div
          style={{
            position: 'absolute',
            top: '38%',
            right: '3%',
            width: '13%',
            transform: `translateX(${noteX}px)`,
            opacity: noteOpacity,
          }}
        >
          {/* "NB" or "Ed." label */}
          <div
            style={{
              fontFamily: "'Courier New', 'Consolas', monospace",
              fontSize: 'clamp(8px, 1.8vw, 14px)',
              fontWeight: 700,
              color,
              opacity: 0.5,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              marginBottom: 6,
            }}
          >
            Ed. note
          </div>
          {/* Main annotation word */}
          <div
            style={{
              fontFamily: "'Georgia', 'Palatino', serif",
              fontSize: 'clamp(22px, 5.5vw, 60px)',
              fontWeight: 700,
              fontStyle: 'italic',
              color,
              lineHeight: 1.1,
              wordBreak: 'break-word',
            }}
          >
            {word}
          </div>
          {/* Underline flourish */}
          <div
            style={{
              marginTop: 6,
              width: '80%',
              height: 1,
              background: color,
              opacity: 0.3,
            }}
          />
          {/* Small page reference */}
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(7px, 1.5vw, 11px)',
              color,
              opacity: 0.3,
              marginTop: 4,
            }}
          >
            see p. 42
          </div>
        </div>
      </>
    )
  },
}

function MarginNoteComponent(props: MotionGraphicProps<MarginNoteConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-margin-note',
  title: 'Margin Note',
  description: 'Editorial margin annotation that slides in from the right with a bracket and arrow pointing to the page center. Print manuscript style.',
  tags: ['kinetic', 'typography', 'margin', 'annotation', 'editorial', 'print', 'book', 'manuscript'],
  category: 'captions',
  component: MarginNoteComponent as any,
  defaultConfig: {
    words: ['VERIFY', 'REVISE', 'EXPAND', 'CLARIFY'],
    colors: ['#C0392B', '#C0392B', '#C0392B', '#C0392B'],
    bgColor: '#FAF8F5',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['VERIFY', 'REVISE', 'EXPAND', 'CLARIFY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C0392B', '#C0392B', '#C0392B', '#C0392B'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FAF8F5', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
