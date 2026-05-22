import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RunningHeadConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Faint body text lines to simulate a book page */}
      {Array.from({ length: 16 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${22 + i * 4.5}%`,
            left: '15%',
            right: '15%',
            height: 2,
            background: 'rgba(0,0,0,0.04)',
            borderRadius: 1,
          }}
        />
      ))}
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    // Running head: text between two thin horizontal rules at the top of the page
    let ruleWidthPct = 0
    let textOpacity = 0
    let textLetterSpacing = 0
    let pageNumberOpacity = 0
    let pageFlip = 0

    if (phase === 'enter') {
      // Rules draw inward from edges simultaneously
      const rulePhase = Math.min(1, enterProgress * 2.2)
      const ruleEase = 1 - Math.pow(1 - rulePhase, 3)
      ruleWidthPct = ruleEase * 100

      // Text fades in with expanding letter spacing
      const textPhase = Math.max(0, (enterProgress - 0.3) / 0.7)
      textOpacity = Math.min(1, textPhase * 2)
      textLetterSpacing = (1 - textPhase) * 15

      // Page number counter
      pageNumberOpacity = Math.max(0, (enterProgress - 0.5) / 0.5)
    } else if (phase === 'hold') {
      ruleWidthPct = 100
      textOpacity = 1
      pageNumberOpacity = 1
      // Subtle tracking breathe
      textLetterSpacing = Math.sin(holdProgress * Math.PI * 2) * 0.5
    } else {
      const fade = 1 - exitProgress
      ruleWidthPct = fade * 100
      textOpacity = fade
      pageNumberOpacity = fade
      textLetterSpacing = exitProgress * 8
    }

    const pageNumber = 127 + index * 2

    return (
      <>
        {/* Top rule */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: `${ruleWidthPct * 0.7}%`,
            maxWidth: '70%',
            height: 0.75,
            background: color,
            opacity: 0.5,
          }}
        />

        {/* Running head text, centered */}
        <div
          style={{
            position: 'absolute',
            top: '12.5%',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: `${ruleWidthPct * 0.7}%`,
            maxWidth: '70%',
          }}
        >
          {/* Chapter label */}
          <div
            style={{
              fontFamily: "'Helvetica Neue', 'Inter', sans-serif",
              fontSize: 'clamp(7px, 1.5vw, 11px)',
              fontWeight: 400,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color,
              opacity: textOpacity * 0.4,
              whiteSpace: 'nowrap',
            }}
          >
            Chapter {(index % 12) + 1}
          </div>

          {/* The running head word */}
          <div
            style={{
              fontFamily: "'Georgia', 'Palatino', serif",
              fontSize: 'clamp(14px, 3.5vw, 28px)',
              fontWeight: 400,
              fontVariant: 'small-caps',
              color,
              opacity: textOpacity,
              letterSpacing: `${0.15 + textLetterSpacing * 0.01}em`,
              whiteSpace: 'nowrap',
            }}
          >
            {word}
          </div>

          {/* Page number */}
          <div
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(10px, 2.2vw, 18px)',
              fontWeight: 400,
              color,
              opacity: pageNumberOpacity * 0.5,
              fontVariantNumeric: 'oldstyle-nums',
            }}
          >
            {pageNumber}
          </div>
        </div>

        {/* Bottom rule */}
        <div
          style={{
            position: 'absolute',
            top: '17%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: `${ruleWidthPct * 0.7}%`,
            maxWidth: '70%',
            height: 0.5,
            background: color,
            opacity: 0.3,
          }}
        />

        {/* Large display version of the word in the body area */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Playfair Display', serif",
            fontSize: 'clamp(44px, 12vw, 160px)',
            fontWeight: 400,
            fontStyle: 'italic',
            color,
            opacity: textOpacity * 0.85,
            letterSpacing: `${0.06 + textLetterSpacing * 0.005}em`,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>

        {/* Footer page number mirror */}
        <div
          style={{
            position: 'absolute',
            bottom: '8%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Georgia', serif",
            fontSize: 'clamp(10px, 2.2vw, 16px)',
            color,
            opacity: pageNumberOpacity * 0.3,
            fontVariantNumeric: 'oldstyle-nums',
          }}
        >
          {'\u2014 ' + pageNumber + ' \u2014'}
        </div>
      </>
    )
  },
}

function RunningHeadComponent(props: MotionGraphicProps<RunningHeadConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-running-head',
  title: 'Running Head',
  description: 'Book running header with thin rules above and below, small caps chapter title, page number counter. Classical book typography layout.',
  tags: ['kinetic', 'typography', 'running-head', 'book', 'editorial', 'print', 'header', 'page-number'],
  category: 'captions',
  component: RunningHeadComponent as any,
  defaultConfig: {
    words: ['ORIGINS', 'METHOD', 'RESULTS', 'CODA'],
    colors: ['#2C2C2C', '#2C2C2C', '#2C2C2C', '#2C2C2C'],
    bgColor: '#FAF8F3',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ORIGINS', 'METHOD', 'RESULTS', 'CODA'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2C2C2C', '#2C2C2C', '#2C2C2C', '#2C2C2C'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FAF8F3', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
