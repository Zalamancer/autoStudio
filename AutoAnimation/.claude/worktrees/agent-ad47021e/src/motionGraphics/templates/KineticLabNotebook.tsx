import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LabNotebookConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    const gridSize = 20
    const gridLines: React.ReactNode[] = []

    // Graph paper grid
    for (let x = 0; x < width; x += gridSize) {
      const isMajor = x % (gridSize * 5) === 0
      gridLines.push(
        <line
          key={`v${x}`}
          x1={x} y1={0} x2={x} y2={height}
          stroke={isMajor ? 'rgba(80, 130, 200, 0.18)' : 'rgba(80, 130, 200, 0.07)'}
          strokeWidth={isMajor ? 0.6 : 0.3}
        />
      )
    }
    for (let y = 0; y < height; y += gridSize) {
      const isMajor = y % (gridSize * 5) === 0
      gridLines.push(
        <line
          key={`h${y}`}
          x1={0} y1={y} x2={width} y2={y}
          stroke={isMajor ? 'rgba(80, 130, 200, 0.18)' : 'rgba(80, 130, 200, 0.07)'}
          strokeWidth={isMajor ? 0.6 : 0.3}
        />
      )
    }

    // Left margin line
    const marginX = 50

    // Date stamp and page number
    const dateStr = 'Date: 2026.03.19'
    const pageNum = `p. ${Math.floor((frame * 0.05) % 100) + 1}`

    // Hypothesis/observation labels (faint handwriting)
    const labels = [
      { text: 'HYPOTHESIS:', y: 60 },
      { text: 'OBSERVATION:', y: height * 0.35 },
      { text: 'RESULTS:', y: height * 0.65 },
      { text: 'CONCLUSION:', y: height * 0.85 },
    ]

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {gridLines}
          {/* Red margin line */}
          <line x1={marginX} y1={0} x2={marginX} y2={height} stroke="rgba(200, 60, 60, 0.2)" strokeWidth={1} />
          {/* Hole punches */}
          <circle cx={20} cy={height * 0.2} r={8} fill="none" stroke="rgba(150,150,150,0.15)" strokeWidth={1} />
          <circle cx={20} cy={height * 0.5} r={8} fill="none" stroke="rgba(150,150,150,0.15)" strokeWidth={1} />
          <circle cx={20} cy={height * 0.8} r={8} fill="none" stroke="rgba(150,150,150,0.15)" strokeWidth={1} />
        </svg>

        {/* Date stamp top right */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            right: 20,
            fontFamily: "'Courier New', monospace",
            fontSize: 11,
            color: 'rgba(40, 80, 160, 0.35)',
            letterSpacing: 0.5,
          }}
        >
          {dateStr}
        </div>

        {/* Page number bottom center */}
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 10,
            color: 'rgba(40, 80, 160, 0.25)',
          }}
        >
          {pageNum}
        </div>

        {/* Section labels */}
        {labels.map((label, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: label.y,
              left: marginX + 12,
              fontFamily: "'Georgia', serif",
              fontSize: 10,
              color: 'rgba(40, 80, 160, 0.2)',
              fontStyle: 'italic',
              letterSpacing: 1,
            }}
          >
            {label.text}
          </div>
        ))}

        {/* Paper texture overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 30% 20%, rgba(255,250,230,0.02) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0

    // Handwriting style: letters appear one by one
    const letters = word.split('')

    if (phase === 'enter') {
      // Letters written one by one, left to right with pen stroke effect
      const lettersVisible = Math.ceil(enterProgress * letters.length)
      const lastLetterProgress = (enterProgress * letters.length) % 1

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'baseline',
          }}
        >
          {letters.map((letter, i) => {
            if (i >= lettersVisible) return null
            const isLast = i === lettersVisible - 1
            const letterOpacity = isLast ? Math.min(1, lastLetterProgress * 2) : 1
            // Slight handwriting variation
            const tilt = Math.sin(i * 1.3 + 0.5) * 2
            const yOff = Math.sin(i * 0.9 + 0.3) * 2

            return (
              <span
                key={i}
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: 'clamp(38px, 10vw, 130px)',
                  fontWeight: 400,
                  fontStyle: 'italic',
                  color,
                  opacity: letterOpacity,
                  display: 'inline-block',
                  transform: `rotate(${tilt}deg) translateY(${yOff}px)`,
                  letterSpacing: 4,
                }}
              >
                {letter}
              </span>
            )
          })}
          {/* Pen cursor */}
          {enterProgress < 0.95 && (
            <span
              style={{
                display: 'inline-block',
                width: 2,
                height: 'clamp(30px, 8vw, 100px)',
                background: color,
                marginLeft: 2,
                opacity: 0.6,
                borderRadius: 1,
              }}
            />
          )}
        </div>
      )
    } else if (phase === 'hold') {
      // Underline annotation draws in during hold
      const underlineWidth = holdProgress * 100

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
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'center',
            }}
          >
            {letters.map((letter, i) => {
              const tilt = Math.sin(i * 1.3 + 0.5) * 2
              const yOff = Math.sin(i * 0.9 + 0.3) * 2
              return (
                <span
                  key={i}
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: 'clamp(38px, 10vw, 130px)',
                    fontWeight: 400,
                    fontStyle: 'italic',
                    color,
                    display: 'inline-block',
                    transform: `rotate(${tilt}deg) translateY(${yOff}px)`,
                    letterSpacing: 4,
                  }}
                >
                  {letter}
                </span>
              )
            })}
          </div>
          {/* Underline annotation */}
          <div
            style={{
              width: `${underlineWidth}%`,
              height: 2,
              background: `${color}60`,
              margin: '4px auto 0',
              borderRadius: 1,
              transition: 'none',
            }}
          />
          {/* Small annotation checkmark */}
          {holdProgress > 0.7 && (
            <div
              style={{
                position: 'absolute',
                right: -30,
                top: '50%',
                transform: 'translateY(-50%)',
                fontFamily: "'Georgia', serif",
                fontSize: 20,
                color: 'rgba(40, 160, 80, 0.5)',
                opacity: (holdProgress - 0.7) / 0.3,
              }}
            >
              &#10003;
            </div>
          )}
        </div>
      )
    } else {
      // Cross-out / strikethrough exit
      const strikeWidth = exitProgress * 110
      const opacity = 1 - exitProgress * 0.6

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
              position: 'relative',
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'center',
              opacity,
            }}
          >
            {letters.map((letter, i) => {
              const tilt = Math.sin(i * 1.3 + 0.5) * 2
              const yOff = Math.sin(i * 0.9 + 0.3) * 2
              return (
                <span
                  key={i}
                  style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: 'clamp(38px, 10vw, 130px)',
                    fontWeight: 400,
                    fontStyle: 'italic',
                    color,
                    display: 'inline-block',
                    transform: `rotate(${tilt}deg) translateY(${yOff}px)`,
                    letterSpacing: 4,
                  }}
                >
                  {letter}
                </span>
              )
            })}
            {/* Strikethrough line */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: `${(100 - strikeWidth) / 2}%`,
                width: `${strikeWidth}%`,
                height: 2,
                background: 'rgba(200, 60, 60, 0.4)',
                transform: 'rotate(-2deg)',
                borderRadius: 1,
              }}
            />
          </div>
        </div>
      )
    }
  },
}

function LabNotebookComponent(props: MotionGraphicProps<LabNotebookConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-lab-notebook',
  title: 'Kinetic Lab Notebook',
  description: 'Lab notebook on gridded paper with handwritten italic text, hypothesis/observation labels, date stamp, pen cursor, and annotation underlines',
  tags: ['kinetic', 'typography', 'lab', 'notebook', 'handwritten', 'science', 'research', 'paper'],
  category: 'captions',
  component: LabNotebookComponent as any,
  defaultConfig: {
    words: ['TRIAL', 'DATA', 'PROOF', 'VALID'],
    colors: ['#2855a0', '#3366b8', '#2855a0', '#224488'],
    bgColor: '#f5f0e0',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TRIAL', 'DATA', 'PROOF', 'VALID'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2855a0', '#3366b8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f5f0e0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
